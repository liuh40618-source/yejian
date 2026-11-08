// @vitest-environment happy-dom
// @vitest-environment-options {"url":"https://localhost:3000"}

import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import Cookies from "js-cookie";
import { changeLocale, getLocale } from "./locale";

beforeEach(() => {
	Cookies.remove("locale");
	window.history.replaceState(null, "", "/");
	vi.stubGlobal("navigator", { languages: ["zh-CN"] });
	vi.spyOn(window.location, "reload").mockImplementation(() => {});
});

afterEach(() => {
	Cookies.remove("locale");
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe("first-visit language", () => {
	it("follows the browser without persisting an inferred choice", () => {
		vi.stubGlobal("navigator", { languages: ["unsupported", "zh-Hans-CN"] });
		window.history.replaceState({ key: "visit" }, "", "/ats-checker?campaign=first#check");
		const href = window.location.href;
		expect(getLocale()).toBe("zh-CN");
		expect(Cookies.get("locale")).toBeUndefined();
		expect(window.location.href).toBe(href);
		expect(window.history.state).toEqual({ key: "visit" });
		expect(window.location.reload).not.toHaveBeenCalled();
	});

	it("falls back to the shipped language for a browser that has none of it", () => {
		vi.stubGlobal("navigator", { languages: ["de-DE", "fr-FR"] });
		expect(getLocale()).toBe("zh-CN");
	});

	it.each([
		["?locale=zh-CN", undefined, "zh-CN"],
		["?locale=unsupported", "zh-CN", "zh-CN"],
		["", "zh-CN", "zh-CN"],
	])("keeps explicit URL %s and cookie %s ahead of browser language", (search, saved, expected) => {
		vi.stubGlobal("navigator", { languages: ["de-DE"] });
		window.history.replaceState(null, "", `/${search}`);
		if (saved) Cookies.set("locale", saved);
		expect(getLocale()).toBe(expected);
		expect(Cookies.get("locale")).toBe(expected);
	});
});

describe("changeLocale", () => {
	it("replaces a pseudo-locale address with the plain one and persists the choice", () => {
		const state = { key: "current-page" };
		window.history.replaceState(state, "", "/resume-templates?filter=modern&tag=one&tag=two#gallery");

		changeLocale("zh-CN");

		expect(window.location.pathname).toBe("/resume-templates");
		expect(window.location.search).toBe("?filter=modern&tag=one&tag=two");
		expect(window.location.hash).toBe("#gallery");
		expect(window.history.state).toEqual(state);
		expect(window.location.reload).toHaveBeenCalledOnce();
		expect(Cookies.get("locale")).toBe("zh-CN");
		expect(getLocale()).toBe("zh-CN");

		window.history.pushState(null, "", "/dashboard");
		expect(getLocale()).toBe("zh-CN");
	});

	it("reloads even when the selected locale has the same URL", () => {
		window.history.replaceState(null, "", "/resume-templates#gallery");
		Cookies.set("locale", "zh-CN");

		changeLocale("zh-CN");

		expect(window.location.href).toBe("https://localhost:3000/resume-templates#gallery");
		expect(window.location.reload).toHaveBeenCalledOnce();
		expect(getLocale()).toBe("zh-CN");
	});

	it.each([null, "", "invalid", "de-DE"])("ignores invalid selection %s", (value) => {
		window.history.replaceState(null, "", "/resume-templates#gallery");
		Cookies.set("locale", "zh-CN");
		const href = window.location.href;

		changeLocale(value);

		expect(window.location.href).toBe(href);
		expect(Cookies.get("locale")).toBe("zh-CN");
		expect(window.location.reload).not.toHaveBeenCalled();
	});
});
