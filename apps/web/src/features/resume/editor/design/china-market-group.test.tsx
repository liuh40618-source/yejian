import { beforeEach, expect, it, vi } from "vite-plus/test";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { renderToStaticMarkup } from "react-dom/server";
import { ChinaMarketGroup } from "./china-market-group";

const { update } = vi.hoisted(() => ({ update: vi.fn() }));

// The panel only reads the committed document and hands a recipe to the store; mocking the two
// hooks keeps the store, the router and autosave out of a render test.
vi.mock("@/features/resume/builder/draft", async () => {
	const { chinaSampleResumeData } = await import("@reactive-resume/schema/resume/china-sample");
	return { useResumeData: () => chinaSampleResumeData, useUpdateResumeData: () => update };
});

beforeEach(() => {
	// zh-CN is the shipped locale; an empty catalog falls back to the English msgid, which is exactly
	// what this test asserts the panel asks Lingui for.
	i18n.loadAndActivate({ locale: "zh-CN", messages: {} });
	update.mockClear();
});

const render = () =>
	renderToStaticMarkup(
		<I18nProvider i18n={i18n}>
			<ChinaMarketGroup />
		</I18nProvider>,
	);

it("offers the three scenes, the three presets and every visual switch", () => {
	const html = render();

	for (const scene of ["社招 / 市场化", "校招 / 应届", "央国企网申"]) expect(html).toContain(scene);
	for (const preset of ["ATS 极简单栏", "小红书轻装饰", "表格式登记 · 风险对照"]) expect(html).toContain(preset);
	for (const label of [
		"ID photo",
		"Centred name",
		"Intent on one line",
		"Soft text labels",
		"Registration table (risky)",
	]) {
		expect(html).toContain(label);
	}
});

it("shows the platform mapping and the JD report the master feeds", () => {
	const html = render();

	expect(html).toContain("Suggested file name");
	expect(html).toContain("Platform form mapping");
	expect(html).toContain("JD keyword alignment");
	expect(html).toContain("Deliberately not done");
	// The "deliberately not done" list is domain copy from the shared constants, not UI chrome.
	expect(html).toContain("不把「自我评价」做成一等字段");
});
