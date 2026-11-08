/**
 * Regenerates the gallery previews in apps/web/public/templates/{pdf,jpg}.
 *
 * Two passes, so a flaky font CDN does not cost a full re-render: the PDF is rendered through the
 * same pipeline the app exports with, then page one is rasterised for the card thumbnails. Run from
 * the repository root:
 *
 *   ./node_modules/.bin/tsx scripts/generate-template-previews.ts           # render + rasterise
 *   ./node_modules/.bin/tsx scripts/generate-template-previews.ts --images  # rasterise only
 *
 * A template the renderer throws on is reported and skipped, so one bad page does not hide the rest.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pdfDir = join(root, "apps/web/public/templates/pdf");
const jpgDir = join(root, "apps/web/public/templates/jpg");

/** Thumbnail width in device pixels: twice the card's CSS width, so it stays sharp on a 2x screen. */
const THUMBNAIL_WIDTH = 720;

/**
 * Page one of a PDF as a JPEG.
 *
 * pdfjs expects a DOM canvas, so Node supplies a factory. Text is drawn from the PDF's own embedded
 * fonts (`disableFontFace`), which is why the outlines come out as the file shows them instead of
 * as missing-glyph boxes.
 */
const rasteriseFirstPage = async (
	canvas: typeof import("@napi-rs/canvas"),
	pdfjs: typeof import("pdfjs-dist/legacy/build/pdf.mjs"),
	pdfBytes: Uint8Array,
) => {
	const CanvasFactory = class {
		create(width: number, height: number) {
			const surface = canvas.createCanvas(width, height);
			return { canvas: surface, context: surface.getContext("2d") };
		}

		reset(pooled: { canvas: { width: number; height: number } }, width: number, height: number) {
			pooled.canvas.width = width;
			pooled.canvas.height = height;
		}

		destroy(pooled: { canvas: { width: number; height: number } }) {
			pooled.canvas.width = 0;
			pooled.canvas.height = 0;
		}
	};

	const loadingTask = pdfjs.getDocument({
		data: pdfBytes,
		useSystemFonts: true,
		disableFontFace: true,
		CanvasFactory,
	} as Parameters<typeof pdfjs.getDocument>[0]);
	const doc = await loadingTask.promise;

	try {
		const page = await doc.getPage(1);
		const viewport = page.getViewport({ scale: THUMBNAIL_WIDTH / page.getViewport({ scale: 1 }).width });
		const surface = canvas.createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));

		await page.render({
			canvasContext: surface.getContext("2d") as never,
			viewport,
			canvas: surface as never,
		}).promise;

		return surface.encode("jpeg", 88);
	} finally {
		await loadingTask.destroy();
	}
};

const main = async () => {
	const { templateSchema } = await import("@reactive-resume/schema/templates");
	const canvas = await import("@napi-rs/canvas");
	const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
	const imagesOnly = process.argv.includes("--images");

	await mkdir(pdfDir, { recursive: true });
	await mkdir(jpgDir, { recursive: true });

	let createResumePdfFile: typeof import("@reactive-resume/pdf/server").createResumePdfFile | undefined;
	let sampleResumeData: typeof import("@reactive-resume/schema/resume/sample").sampleResumeData | undefined;
	if (!imagesOnly) {
		({ createResumePdfFile } = await import("@reactive-resume/pdf/server"));
		({ sampleResumeData } = await import("@reactive-resume/schema/resume/sample"));
	}

	const failed: string[] = [];

	for (const template of templateSchema.options) {
		try {
			const pdfPath = join(pdfDir, `${template}.pdf`);
			if (createResumePdfFile && sampleResumeData) {
				const file = await createResumePdfFile({
					data: { ...sampleResumeData, metadata: { ...sampleResumeData.metadata, template } },
					filename: `${template}.pdf`,
					template,
				});
				await writeFile(pdfPath, new Uint8Array(await file.arrayBuffer()));
			}

			const bytes = new Uint8Array(await readFile(pdfPath));
			await writeFile(join(jpgDir, `${template}.jpg`), await rasteriseFirstPage(canvas, pdfjs, bytes));
			process.stdout.write(`ok   ${template}\n`);
		} catch (error) {
			failed.push(template);
			process.stdout.write(`FAIL ${template}: ${(error as Error)?.message ?? error}\n`);
		}
	}

	if (failed.length > 0) {
		process.stdout.write(`\n${failed.length} template(s) failed: ${failed.join(", ")}\n`);
		process.exitCode = 1;
	}
};

void main();
