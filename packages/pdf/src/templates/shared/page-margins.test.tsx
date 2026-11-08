import type { Template } from "@reactive-resume/schema/templates";
import type { TextItem } from "pdfjs-dist/types/src/display/api";
import { describe, expect, it } from "vite-plus/test";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { act, createElement } from "react";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";
import { ResumeDocument } from "../../document";
import { renderToBuffer } from "../../forme/testing";
import { rasterizePdf } from "../../semantic/test/rasterize-pdf";

const renderOverflow = async (
	template: Template,
	placement: "main" | "sidebar",
	locale = "en-US",
	explicitPage?: { fullWidth: boolean },
) => {
	const data = structuredClone(defaultResumeData);
	data.basics.name = "Margin Audit";
	data.metadata.stylesheet = { mode: "semantic", source: { languageVersion: 1, text: "@version 1;" } };
	data.metadata.typography.body.fontFamily = "Helvetica";
	data.metadata.typography.heading.fontFamily = "Helvetica";
	data.metadata.page.marginY = 48;
	data.metadata.page.locale = locale;
	data.metadata.page.marginX = 30;
	data.metadata.layout.pages = [
		{
			fullWidth: explicitPage?.fullWidth ?? false,
			main: placement === "main" ? ["experience"] : [],
			sidebar: placement === "sidebar" ? ["experience"] : [],
		},
	];
	if (explicitPage) data.metadata.layout.pages.unshift({ fullWidth: false, main: [], sidebar: [] });
	data.sections.experience.items = [
		{
			id: "experience",
			hidden: false,
			company: "Company",
			position: "Engineer",
			location: "City",
			period: "2020",
			roles: [],
			website: { url: "", label: "", inlineLink: false },
			description: Array.from(
				{ length: explicitPage ? 1 : 60 },
				(_, index) => `<p>Body line ${index} with work details and sample content for page flow.</p>`,
			).join(""),
		},
	];
	const element = createElement(ResumeDocument, { data, template }) as unknown as Parameters<typeof renderToBuffer>[0];
	let bytes: Uint8Array = new Uint8Array();
	await act(async () => {
		bytes = new Uint8Array(await renderToBuffer(element));
	});
	const rasters =
		!explicitPage && placement === "main" && template !== "minimal-photo" ? await rasterizePdf(bytes.slice()) : [];
	const loadingTask = getDocument({ data: bytes, useSystemFonts: true });
	try {
		const document = await loadingTask.promise;
		const pages: { height: number; lines: TextItem[] }[] = [];
		for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
			const page = await document.getPage(pageNumber);
			const text = await page.getTextContent();
			pages.push({
				height: page.getViewport({ scale: 1 }).height,
				lines: text.items.filter((item): item is TextItem => "str" in item && Boolean(item.str.trim())),
			});
		}
		return { pages, rasters };
	} finally {
		await loadingTask.destroy();
	}
};

describe("physical page margins (#3337, #3175)", () => {
	it.each(["general-single", "editorial"] as const)(
		"keeps overflowing main content inside vertical margins (%s)",
		async (template) => {
			const { pages, rasters } = await renderOverflow(template, "main");
			expect(pages.length).toBeGreaterThan(1);
			const firstPage = pages[0];
			if (!firstPage) throw new Error("Missing first PDF page");
			const name = firstPage.lines.find((line) => line.str === "Margin Audit");
			if (!name) throw new Error("Missing first-page header");
			// The header box starts at the 48pt margin; its first baseline sits below that by the
			// template's heading ascent: 47.93 for GeneralSingle, 43.96 for Editorial. The retired
			// ditgar/glalie pair happened to share one exact value, so the old assertion hard-coded it.
			const headerGap = firstPage.height - name.transform[5] - name.height;
			expect(headerGap).toBeGreaterThanOrEqual(43);
			expect(headerGap).toBeLessThanOrEqual(48);
			const corner = (pageIndex: number, right: boolean, bottom: boolean) => {
				const raster = rasters[pageIndex];
				if (!raster) throw new Error("Missing rasterized PDF page");
				const x = right ? raster.width - 4 : 3;
				const y = bottom ? raster.height - 4 : 3;
				// oxlint-disable-next-line unicorn/no-useless-spread -- Convert the Uint8Array pixel to a plain RGB array for assertions.
				return [...raster.data.slice((y * raster.width + x) * 4, (y * raster.width + x) * 4 + 3)];
			};
			const white = [255, 255, 255];
			// ditgar/glalie painted a red / pink sidebar band into the page corners. All China-market
			// replacements are single-column with no edge decoration, so every corner must stay white:
			// no band may bleed into the physical margins on the first page or on any overflow page.
			expect(corner(0, false, false)).toEqual(white);
			for (let index = 0; index < rasters.length; index++) {
				expect(corner(index, false, true)).toEqual(white);
				expect(corner(index, true, true)).toEqual(white);
				if (index > 0) {
					expect(corner(index, false, false)).toEqual(white);
					expect(corner(index, true, false)).toEqual(white);
				}
			}
			const bodyLines = pages.flatMap((page) => page.lines.filter((line) => line.str.startsWith("Body line")));
			expect(bodyLines).toHaveLength(60);
			for (const [index, page] of pages.entries()) {
				for (const line of page.lines) {
					// The repeated name is header furniture, not body flow: Editorial sets it ~4pt higher
					// than GeneralSingle (43.96 vs 47.93), still inside the 48pt margin. Body lines keep
					// the tighter bound; Helvetica glyph bounds extend about 2pt above the line box.
					const top = page.height - line.transform[5] - line.height;
					expect(top, `${template} page ${index + 1}: ${line.str}`).toBeGreaterThanOrEqual(
						line.str === "Margin Audit" ? 43 : 45.8,
					);
					expect(line.transform[5], `${template} page ${index + 1}: ${line.str}`).toBeGreaterThanOrEqual(47);
				}
			}
		},
	);
	it.each(["editorial"] as const)(
		"starts explicit headerless pages at the margin (fullWidth: false, %s)",
		async (template) => {
			const { pages } = await renderOverflow(template, "main", "en-US", { fullWidth: false });
			expect(pages).toHaveLength(2);
			const page = pages[1];
			if (!page) throw new Error("Missing explicit second page");
			expect(page.lines.some((line) => line.str === "Margin Audit")).toBe(false);
			const top = Math.min(...page.lines.map((line) => page.height - line.transform[5] - line.height));
			expect(top).toBeGreaterThanOrEqual(45.8);
			expect(top).toBeLessThanOrEqual(54);
			expect(page.lines.some((line) => line.str.startsWith("Body line 0"))).toBe(true);
		},
	);
});
