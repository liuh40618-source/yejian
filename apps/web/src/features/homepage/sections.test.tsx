import { cleanup, render, screen, waitFor } from "@testing-library/react";
// @vitest-environment happy-dom
// @vitest-environment-options {"url":"https://localhost:3000"}
import { afterEach, expect, it, vi } from "vite-plus/test";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, createRootRoute, createRouter, RouterContextProvider } from "@tanstack/react-router";
import { supportedLocales } from "@reactive-resume/utils/locale";
import { Closing, Numbers } from "./sections";
import { loadLocale } from "@/libs/locale";

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

async function renderWithProviders(node: React.ReactNode, queriesEnabled = false) {
	const router = createRouter({
		routeTree: createRootRoute(),
		history: createMemoryHistory({ initialEntries: ["/"] }),
	});
	await router.load();
	await loadLocale("zh-CN");
	const queryClient = new QueryClient({ defaultOptions: { queries: { enabled: queriesEnabled, retry: false } } });

	return render(
		<RouterContextProvider router={router}>
			<QueryClientProvider client={queryClient}>
				<I18nProvider i18n={i18n}>{node}</I18nProvider>
			</QueryClientProvider>
		</RouterContextProvider>,
	);
}

it("shows no totals at all when they can't be loaded", async () => {
	// A proof section shows proof or nothing: with no reachable statistics service it renders nothing rather than a
	// row of dashes.
	await renderWithProviders(<Numbers />, true);
	await waitFor(() => expect(document.querySelector("[data-scene]")).toBeNull());
	expect(screen.queryByText("—")).toBeNull();
});

it("closes on a single action, with no app-store or upstream links", async () => {
	await renderWithProviders(<Closing />);

	expect(supportedLocales).toEqual(["zh-CN"]);
	// One call to action, and it is the builder: everything else that used to sit here (Google Play, TestFlight) is
	// either unavailable or irrelevant to a reader in China.
	const actions = screen.getAllByRole("link");
	expect(actions).toHaveLength(1);
	expect(actions[0]?.getAttribute("href")).toBe("/auth/register");
	expect(document.body.textContent).not.toMatch(/Google Play|TestFlight|GitHub/);
});
