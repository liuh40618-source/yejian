import { beforeEach, expect, it, vi } from "vite-plus/test";
import { i18n } from "@lingui/core";
import { msg } from "@lingui/core/macro";
import { I18nProvider } from "@lingui/react";
import { renderToStaticMarkup } from "react-dom/server";
import { ACCENTS, FONT_PAIRINGS } from "../editor/design/presets";
import { PdfCanvasPage } from "./pdf-canvas";
import { ResumePreviewLoader } from "./preview.shared";
import { FindingRow } from "@/features/ats-checker/report/finding-row";

vi.mock("./pdfjs", () => ({
	AnnotationMode: {},
	getDocument: vi.fn(),
	getPdfWorker: vi.fn(),
	RenderingCancelledException: Error,
}));
beforeEach(() => {
	i18n.loadAndActivate({ locale: "zu-ZA", messages: {} });
});

it("defers all six pairings and eight accent labels to Lingui", () => {
	const labels = [...FONT_PAIRINGS, ...ACCENTS].map(({ label }) => label);
	expect(labels).toHaveLength(14);
	for (const [index, label] of labels.entries()) {
		expect(label).toHaveProperty("id");
		i18n.load("zu-ZA", { [label.id]: `Übersetzung ${index}` });
		expect(i18n._(label)).toBe(`Übersetzung ${index}`);
	}
});

it("translates loading and rendered page names and fallback captions", () => {
	const pageNumber = 1;
	const pageCount = 3;
	const totalPages = 3;
	i18n.load("zu-ZA", {
		[msg`Page ${pageNumber} of ${pageCount}`.id]: "第 {pageNumber} 页 / 共 {pageCount} 页",
		[msg`Page ${pageNumber} of ${totalPages}`.id]: "第 {pageNumber} 页 / 共 {totalPages} 页",
		[msg`Loading resume page ${pageNumber} of ${pageCount}`.id]: "正在加载简历第 {pageNumber} 页 / 共 {pageCount} 页",
		[msg`Resume page ${pageNumber} of ${totalPages}`.id]: "简历第 {pageNumber} 页 / 共 {totalPages} 页",
	});
	const markup = (node: React.ReactNode) => renderToStaticMarkup(<I18nProvider i18n={i18n}>{node}</I18nProvider>);
	const loading = markup(<ResumePreviewLoader pageCount={3} showPageNumbers />);
	expect(loading).toContain("第 1 页 / 共 3 页");
	expect(loading).toContain('aria-label="正在加载简历第 1 页 / 共 3 页"');
	const rendered = markup(
		<PdfCanvasPage
			document={{} as never}
			onLoadSuccess={() => {}}
			pageNumber={2}
			totalPages={3}
			pageScale={1}
			showPageNumbers
		/>,
	);
	expect(rendered).toContain("第 2 页 / 共 3 页");
	expect(rendered).toContain('aria-label="简历第 2 页 / 共 3 页"');
});

it("translates ATS page badges without changing extracted evidence", () => {
	const page = 7;
	const evidence = { page };
	i18n.load("zu-ZA", { [msg`Page ${evidence.page}`.id]: "第 {0} 页" });
	const finding = {
		code: "NO_TEXT_LAYER",
		severity: "blocker",
		category: "parseability",
		evidence: { page, snippet: "Fictional evidence" },
	} as const;
	const output = renderToStaticMarkup(
		<I18nProvider i18n={i18n}>
			<FindingRow finding={finding} />
		</I18nProvider>,
	);
	expect(output).toContain("第 7 页");
	expect(output).toContain("Fictional evidence");
	expect(finding.evidence.page).toBe(7);
});
