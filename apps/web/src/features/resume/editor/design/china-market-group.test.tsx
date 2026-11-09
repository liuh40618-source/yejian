// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { renderToStaticMarkup } from "react-dom/server";
import { CHINA_MARKET_HANDOFF_COPY } from "@reactive-resume/schema/resume/china-market";
import { ChinaMarketGroup } from "./china-market-group";

const { update, sample } = vi.hoisted(() => ({
	update: vi.fn(),
	sample: { current: null as unknown },
}));

// The panel only reads the committed document and hands a recipe to the store; mocking the two
// hooks keeps the store, the router and autosave out of a render test. `sample.current` lets the
// interaction tests supply a master with a persisted JD.
vi.mock("@/features/resume/builder/draft", async () => {
	const { chinaSampleResumeData } = await import("@reactive-resume/schema/resume/china-sample");
	return {
		useResumeData: () => sample.current ?? chinaSampleResumeData,
		useUpdateResumeData: () => update,
	};
});

beforeEach(() => {
	// zh-CN is the shipped locale; an empty catalog falls back to the English msgid, which is exactly
	// what this test asserts the panel asks Lingui for.
	i18n.loadAndActivate({ locale: "zh-CN", messages: {} });
	update.mockClear();
	sample.current = null;
});

afterEach(() => cleanup());

const renderStatic = () =>
	renderToStaticMarkup(
		<I18nProvider i18n={i18n}>
			<ChinaMarketGroup />
		</I18nProvider>,
	);

const mount = () =>
	render(
		<I18nProvider i18n={i18n}>
			<ChinaMarketGroup />
		</I18nProvider>,
	);

it("offers the three scenes, the three presets and every visual switch", () => {
	const html = renderStatic();

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

it("shows the platform mapping, the JD report and the hand-off actions", () => {
	const html = renderStatic();

	expect(html).toContain("Suggested file name");
	expect(html).toContain("Platform form mapping");
	expect(html).toContain("JD keyword alignment");
	expect(html).toContain("Deliberately not done");
	// The "deliberately not done" list is domain copy from the shared constants, not UI chrome.
	expect(html).toContain("不把「自我评价」做成一等字段");

	// The mapping is no longer a read-only preview: it is a real, downloadable/copyable deliverable.
	expect(html).toContain(CHINA_MARKET_HANDOFF_COPY.title);
	for (const label of [
		CHINA_MARKET_HANDOFF_COPY.downloadJsonLabel,
		CHINA_MARKET_HANDOFF_COPY.downloadTextLabel,
		CHINA_MARKET_HANDOFF_COPY.copyLabel,
	]) {
		expect(html).toContain(label);
	}
	expect(html).toContain(CHINA_MARKET_HANDOFF_COPY.disclaimer);
	expect(html).toContain(CHINA_MARKET_HANDOFF_COPY.jdSavedHint);
});

it("reads the JD from the master and writes edits back into the master", async () => {
	const { chinaSampleResumeData } = await import("@reactive-resume/schema/resume/china-sample");
	const { setChinaMarketJobDescription } = await import("@reactive-resume/resume/china-market");
	sample.current = setChinaMarketJobDescription(chinaSampleResumeData, "需要设计系统与用户研究经验");
	mount();

	const textarea = screen.getByLabelText("Job description") as HTMLTextAreaElement;
	// A persisted JD survives a reload: it comes from the document, not a panel-local useState.
	expect(textarea.value).toBe("需要设计系统与用户研究经验");

	fireEvent.change(textarea, { target: { value: "需要 Figma 与数据分析" } });
	expect(update).toHaveBeenCalledTimes(1);

	// Apply the recipe the panel handed to the store and check the JD landed in the master.
	const recipe = update.mock.calls[0]?.[0] as (draft: typeof chinaSampleResumeData) => void;
	const draft = structuredClone(chinaSampleResumeData);
	recipe(draft);
	expect(draft.metadata.chinaMarket?.jobDescription).toBe("需要 Figma 与数据分析");
});

it("labels mapping rows with the platform's field name, not the platform name", () => {
	mount();
	fireEvent.click(screen.getByRole("button", { name: /Show .* mapped/ }));

	// "手机号码" is BOSS直聘's own form label, sourced from 主档/手机. Every row used to be titled
	// with the platform name ("BOSS直聘"), which made the preview useless as a form hand-off.
	expect(screen.getByText("手机号码")).toBeDefined();
	expect(screen.getAllByText("BOSS直聘")).toHaveLength(1); // only the platform selector
});

it("copies a paste-ready field list and downloads a structured packet", async () => {
	const writeText = vi.fn().mockResolvedValue(undefined);
	Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
	const createObjectURL = vi.fn(() => "blob:yejian");
	Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL });
	Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });

	mount();
	await act(async () => {
		fireEvent.click(screen.getByRole("button", { name: CHINA_MARKET_HANDOFF_COPY.copyLabel }));
	});
	await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
	const copied = writeText.mock.calls[0]?.[0] as string;
	expect(copied).toContain("平台在线表单字段");
	expect(copied).toContain("姓名：陈嘉宁");
	expect(copied).toContain("页见不会自动填写或提交任何平台表单");

	const click = HTMLAnchorElement.prototype.click;
	HTMLAnchorElement.prototype.click = vi.fn();
	try {
		fireEvent.click(screen.getByRole("button", { name: CHINA_MARKET_HANDOFF_COPY.downloadJsonLabel }));
		fireEvent.click(screen.getByRole("button", { name: CHINA_MARKET_HANDOFF_COPY.downloadTextLabel }));
		expect(createObjectURL).toHaveBeenCalledTimes(2);
	} finally {
		HTMLAnchorElement.prototype.click = click;
	}
});
