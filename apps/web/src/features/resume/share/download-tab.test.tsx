// @vitest-environment happy-dom
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vite-plus/test";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { DownloadTab } from "./download-tab";

const mocks = vi.hoisted(() => ({ generate: vi.fn(), download: vi.fn(), toast: vi.fn() }));
vi.mock("@/features/resume/builder/draft", () => ({ useCurrentResume: () => ({ id: "resume" }) }));
vi.mock("@/features/resume/editor/check/use-check", () => ({ useOpenIssueCount: () => 0 }));
vi.mock("@tanstack/react-query", () => ({ useQuery: () => ({ data: [] }) }));
vi.mock("@/features/applications/queries", () => ({ applicationsListQueryOptions: () => ({}) }));
vi.mock("@/features/letters/export", () => ({ createLetterFile: vi.fn(), letterFileName: vi.fn() }));
vi.mock("@/libs/orpc/client", () => ({ client: {} }));
vi.mock("@reactive-resume/ui/components/toast", () => ({ toast: { add: mocks.toast } }));
vi.mock("@reactive-resume/utils/file", () => ({ downloadWithAnchor: mocks.download }));
vi.mock("@/features/resume/export/use-resume-export", () => ({
	createExportFile: mocks.generate,
	getDefaultFileName: () => "resume",
	preloadDocumentExport: () => undefined,
	sanitizeFileName: (value: string) => value,
}));

it("confirms the download, keeps no third-party invite, and recovers from a failed format", async () => {
	i18n.load("en", {});
	i18n.activate("en");
	const file = new Blob(["fictional resume"]);
	let finish!: (file: Blob) => void;
	mocks.generate.mockReturnValueOnce(new Promise<Blob>((resolve) => (finish = resolve)));
	render(
		<I18nProvider i18n={i18n}>
			<DownloadTab onReview={() => undefined} />
		</I18nProvider>,
	);

	// Nothing to confirm before a file exists, and no route off to a community or a donation page: this build has
	// neither, and a link to one would be a dead end for a reader in China.
	const confirmation = () => screen.queryByText(/Log the application/);
	const externalLinks = () => screen.queryAllByRole("link");
	expect(confirmation()).toBeNull();
	fireEvent.click(screen.getByRole("button", { name: "Download PDF" }));
	expect(confirmation()).toBeNull();

	finish(file);
	expect(await screen.findByText(/Log the application/)).toBeTruthy();
	expect(mocks.download).toHaveBeenCalledWith(file, "resume.pdf");
	expect(externalLinks()).toHaveLength(0);

	fireEvent.click(screen.getByRole("radio", { name: /Word/ }));
	expect(confirmation()).toBeNull();
	mocks.generate.mockRejectedValueOnce(new Error("Export unavailable"));
	fireEvent.click(screen.getByRole("button", { name: "Download Word" }));
	await screen.findByRole("alert");
	expect(confirmation()).toBeNull();
	expect(mocks.download).toHaveBeenCalledTimes(1);

	// The PDF fallback finishes the job the failed format couldn't.
	mocks.generate.mockResolvedValueOnce(file);
	fireEvent.click(screen.getByRole("button", { name: "Download PDF instead" }));
	expect(await screen.findByText(/Log the application/)).toBeTruthy();
});
