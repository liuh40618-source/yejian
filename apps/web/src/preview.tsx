/**
 * A local-only entry for looking at the product without a database behind it. It mounts real screens on a memory
 * router whose root context is stubbed, so nothing waits on a session check. Not part of the build: preview.html is
 * the only thing that references it.
 *
 *   /preview.html                 the marketing page
 *   /preview.html?page=register   the sign-up screen "Build your resume" leads to
 *   /preview.html?page=editor     the editor's shell, with placeholder fields and a demo page
 *
 * The theme comes from the same cookie the app writes, and the screens read it back whenever the page's switch fires,
 * so the switch works here exactly as it does in the app.
 */
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	RouterProvider,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { AuthLayout } from "./features/auth/layout";
import { RegisterPage } from "./features/auth/pages/register";
import { EditorPreview } from "./features/homepage/editor-preview";
import { Homepage } from "./features/homepage/page";
import { ThemeProvider } from "./features/theme/provider";
import { getLocaleMessages } from "./libs/locale";
import { getTheme, type Theme } from "./libs/theme";
import "./index.css";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const { locale, messages } = await getLocaleMessages("zh-CN");
i18n.loadAndActivate({ locale, messages });

const flags = {
	disableSignups: false,
	disableEmailAuth: false,
	allowGuestLogin: true,
	smtpEnabled: false,
	careerSchedulingEnabled: false,
	appUrl: "http://localhost:5199",
	aliasUrl: undefined,
	customDomains: false,
	olacvSuggestion: false,
};

const page = new URLSearchParams(window.location.search).get("page");
const context = { theme: getTheme(), locale, session: null, flags, queryClient };

/** The page's own switch writes the theme cookie and re-applies the root class; mirror it back into the prop. */
function useLiveTheme(): Theme {
	const [theme, setTheme] = useState<Theme>(getTheme);

	useEffect(() => {
		const observer = new MutationObserver(() => {
			const next = getTheme();
			setTheme((previous) => (previous === next ? previous : next));
		});
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
		return () => observer.disconnect();
	}, []);

	return theme;
}

/** One theme provider above the outlet, so both screens follow the page's own switch. */
function PreviewRoot() {
	return (
		<ThemeProvider theme={useLiveTheme()}>
			<Outlet />
		</ThemeProvider>
	);
}

const rootRoute = createRootRoute({ beforeLoad: () => context, component: PreviewRoot });

const authRoute = createRoute({ getParentRoute: () => rootRoute, id: "auth", component: AuthLayout });

const registerRoute = createRoute({
	getParentRoute: () => authRoute,
	path: "/auth/register",
	component: () => <RegisterPage disableEmailAuth={false} isGuest={false} />,
});

const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: Homepage });

const editorRoute = createRoute({ getParentRoute: () => rootRoute, path: "/editor", component: EditorPreview });

/*
 * Every screen is always on the tree, and ?page= only picks where it starts. Building the tree from the query string
 * instead left the marketing page with no /auth/register in it, so the call to action fell through to NotFound — and
 * on a memory router the URL never changes, so it read as the page hanging with no way back.
 */
const routeTree = rootRoute.addChildren([homeRoute, authRoute.addChildren([registerRoute]), editorRoute]);

const router = createRouter({
	routeTree,
	history: createMemoryHistory({
		initialEntries: [page === "register" ? "/auth/register" : page === "editor" ? "/editor" : "/"],
	}),
	context,
});

await router.load();

const rootElement = document.getElementById("app");
if (!rootElement) throw new Error("Root element not found");

ReactDOM.createRoot(rootElement).render(
	<QueryClientProvider client={queryClient}>
		<I18nProvider i18n={i18n}>
			<RouterProvider router={router} />
		</I18nProvider>
	</QueryClientProvider>,
);
