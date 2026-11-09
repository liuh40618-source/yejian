// @vitest-environment happy-dom
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { sampleResumeData } from "@reactive-resume/schema/resume/sample";
import { TemplateGroup } from "./template-group";

const { thumbnail } = vi.hoisted(() => ({ thumbnail: vi.fn() }));

// The grid only needs the resume and the thumbnail hook; mocking them keeps the store, autosave and
// the real Forme render out of a render test. The component calls `useResumeStore` as a hook, so the
// mock must stay callable as well as carrying `getState`.
vi.mock("@/features/resume/builder/draft", () => {
	const store = Object.assign(() => "", { getState: () => ({ resume: undefined }) });
	return { useResumeData: () => sampleResumeData, useResumeStore: store, useUpdateResumeData: () => vi.fn() };
});
vi.mock("./thumbnails", () => ({ useTemplateThumbnail: thumbnail }));

beforeEach(() => {
	i18n.loadAndActivate({ locale: "zh-CN", messages: {} });
});

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

const renderGroup = () =>
	render(
		<I18nProvider i18n={i18n}>
			<TemplateGroup />
		</I18nProvider>,
	);

it("shows a skeleton on cards whose own thumbnail is still queued, never an empty paper", () => {
	// `data: undefined` is what the hook returns while its render waits in the serial queue.
	thumbnail.mockReturnValue({ data: undefined });
	const { container } = renderGroup();

	const skeletons = container.querySelectorAll('[aria-hidden="true"].absolute.inset-0');
	expect(skeletons.length).toBeGreaterThan(1);
});

it("drops the skeleton once the card's own render arrives", () => {
	thumbnail.mockReturnValue({ data: "blob:own-render" });
	const { container } = renderGroup();

	expect(container.querySelectorAll('[aria-hidden="true"].absolute.inset-0').length).toBe(0);
	const images = Array.from(container.querySelectorAll("img"));
	expect(images.some((image) => image.getAttribute("src") === "blob:own-render")).toBe(true);
});
