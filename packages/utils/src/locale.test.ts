import { describe, expect, it } from "vite-plus/test";
import {
	getLocaleAlternates,
	getPreferredLocale,
	isRTL,
	isLocale,
	localeSchema,
	localizedUrl,
	supportedLocales,
} from "./locale";

it.each([
	[["zh-CN"], "zh-CN"],
	[["zh-Hans-CN"], "zh-CN"],
	[["zh"], "zh-CN"],
	[["zh-TW"], "zh-CN"],
	[["de-DE", "zh-CN"], "zh-CN"],
	[["zu-ZA", "zh-CN"], "zh-CN"],
	[["zu-ZA"], "zh-CN"],
	[["unsupported"], "zh-CN"],
	[[], "zh-CN"],
])("matches ordered language preferences %j to %s", (languages, expected) => {
	expect(getPreferredLocale(languages)).toBe(expected);
});

it("keeps the testing catalog valid without counting it as a supported translation", () => {
	expect(isLocale("zu-ZA")).toBe(true);
	expect(localeSchema.options).toContain("zu-ZA");
	expect(supportedLocales).not.toContain("zu-ZA");
	expect(supportedLocales).toEqual(["zh-CN"]);
	expect(getLocaleAlternates("https://example.cn/")).toHaveLength(supportedLocales.length + 1);
	expect(isLocale("de-DE")).toBe(false);
	expect(isRTL("zh-CN")).toBe(false);
});

describe("locale URLs", () => {
	it("keeps the default locale on the plain address and puts others in the locale parameter", () => {
		expect(localizedUrl("https://example.cn/?locale=zh-CN", "zh-CN")).toBe("https://example.cn/");
		expect(localizedUrl("https://example.cn/", "zu-ZA")).toBe("https://example.cn/?locale=zu-ZA");
	});

	it("lists valid hreflang alternates without the pseudo-locale", () => {
		const alternates = getLocaleAlternates("https://example.cn/");

		expect(alternates).toEqual([
			{ hreflang: "zh-CN", href: "https://example.cn/" },
			{ hreflang: "x-default", href: "https://example.cn/" },
		]);
	});
});
