import z from "zod";

// Trimmed to the one market this build ships for. The upstream project carries 55 catalogs; keeping only the
// interface language and the Lingui pseudo-locale removes the maintenance load of the rest.
export const localeSchema = z.enum(["zh-CN", "zu-ZA"]);

export type Locale = z.infer<typeof localeSchema>;

export const defaultLocale: Locale = "zh-CN";

export function isLocale(value: unknown): value is Locale {
	return localeSchema.safeParse(value).success;
}

/**
 * A page's address in a locale: the `locale` search parameter picks the language, and the default locale's address
 * is the plain one. The server and the app both read the parameter, so each language has a URL search engines can
 * index.
 */
export function localizedUrl(pageUrl: string, locale?: Locale) {
	const url = new URL(pageUrl);
	if (locale && locale !== defaultLocale) url.searchParams.set("locale", locale);
	else url.searchParams.delete("locale");
	return url.href;
}

// Lingui's pseudo-locale (lingui.config.ts): accented, stretched English for testing layouts, not a translation.
const pseudoLocale: Locale = "zu-ZA";

export const supportedLocales: readonly Locale[] = localeSchema.options.filter((locale) => locale !== pseudoLocale);

/** Follow ordered device/browser preferences without ever selecting the development pseudo-locale. */
export function getPreferredLocale(languages: readonly string[]): Locale {
	for (const language of languages) {
		const tag = language.toLowerCase();
		const exact = supportedLocales.find((locale) => locale.toLowerCase() === tag);
		if (exact) return exact;
		const sameLanguage = supportedLocales.find((locale) => locale.split("-")[0] === tag.split("-")[0]);
		if (sameLanguage) return sameLanguage;
	}
	return defaultLocale;
}

/**
 * A locale as a BCP 47 language tag for hreflang and `inLanguage`. Every locale this build ships is already a valid
 * tag; the seam stays so a future one whose region is not (upstream's `sr-SP` was not) has somewhere to be corrected.
 */
export const languageTag = (locale: Locale) => locale;

/** hreflang alternates for a page: every real locale plus x-default. */
export function getLocaleAlternates(pageUrl: string) {
	const alternates = supportedLocales.map((locale) => ({
		hreflang: languageTag(locale),
		href: localizedUrl(pageUrl, locale),
	}));
	return [...alternates, { hreflang: "x-default", href: localizedUrl(pageUrl) }];
}

// A writing system that needs a dedicated fallback font in the PDF renderer,
// because react-pdf (unlike a browser) has no automatic system-font fallback:
// a glyph only renders if a registered font contains it. We pick the matching
// Noto font per script so e.g. Hangul → Noto KR, Arabic → Noto Arabic, instead
// of falling back to a Latin/Han-only font and producing tofu. "emoji" is
// content-detected only (never locale-derived) and resolves to Noto Emoji so
// pictographs and regional indicators render instead of mojibake (#3321).
// "symbols" is content-detected too and resolves to Noto Sans Symbols 2 for
// text symbols such as ★ that neither Latin fonts nor Noto Emoji cover (#3581).
export type Script =
	| "hangul"
	| "kana"
	| "han-traditional"
	| "han-simplified"
	| "arabic"
	| "hebrew"
	| "thai"
	| "devanagari"
	| "bengali"
	| "gurmukhi"
	| "gujarati"
	| "oriya"
	| "tamil"
	| "telugu"
	| "kannada"
	| "malayalam"
	| "sinhala"
	| "ethiopic"
	| "khmer"
	| "emoji"
	| "arrows"
	| "symbols";

// The CJK subset of `Script`. CJK needs extra per-character line breaking that
// must NOT be applied to Arabic (cursive, joined letters) or Thai (combining
// marks), so callers gate line-breaking on this rather than on `Script`.
const cjkScripts: readonly Script[] = ["hangul", "kana", "han-traditional", "han-simplified"];

export function isCjkScript(script: Script): boolean {
	return cjkScripts.includes(script);
}

// The script a locale primarily uses, used to order the fallback stack so the
// dominant language renders with its native font. Persian (fa-IR) uses the
// Arabic script; Marathi and Nepali use Devanagari, like Hindi.
//
// The UI ships only zh-CN, but this function is deliberately NOT typed to `Locale`:
// a resume is user-authored content and can be written in any language regardless
// of the interface language. Narrowing it to the shipped catalogs made PDF font
// fallback silently drop every non-Latin script. Keep the full mapping so a
// Chinese-language account exporting an Arabic/Hebrew/Indic resume still gets
// the right Noto face. The renderer's content-detected scripts are a second,
// independent path and cover mixed-script text.
export function getLocaleScript(locale?: string): Script | null {
	switch (locale) {
		case "ko-KR":
			return "hangul";
		case "ja-JP":
			return "kana";
		case "zh-TW":
			return "han-traditional";
		case "zh-CN":
			return "han-simplified";
		case "ar-SA":
		case "fa-IR":
			return "arabic";
		case "he-IL":
			return "hebrew";
		case "th-TH":
			return "thai";
		case "hi-IN":
		case "mr-IN":
		case "ne-NP":
			return "devanagari";
		case "bn-BD":
			return "bengali";
		case "or-IN":
			return "oriya";
		case "ta-IN":
			return "tamil";
		case "te-IN":
			return "telugu";
		case "kn-IN":
			return "kannada";
		case "ml-IN":
			return "malayalam";
		case "am-ET":
			return "ethiopic";
		case "km-KH":
			return "khmer";
		default:
			return null;
	}
}

// No shipped locale is right-to-left any more, but user-authored resume content can still be: the PDF renderer keeps
// reading it from the content itself, so the check stays.
const RTL_LANGUAGES = new Set([
	"ar", // Arabic
	"ckb", // Kurdish (Sorani)
	"dv", // Dhivehi
	"fa", // CenterClassic
	"he", // Hebrew
	"ps", // Pashto
	"sd", // Sindhi
	"ug", // Uyghur
	"ur", // Urdu
	"yi", // Yiddish
]);

export function isRTL(locale: string): boolean {
	const language = locale.split("-")[0]?.toLowerCase() ?? "";
	return RTL_LANGUAGES.has(language);
}

/** "a, b and c" in the locale's words. Hermes may ship without Intl.ListFormat; a comma list reads fine there. */
export function formatList(locale: string, items: readonly string[]): string {
	return typeof Intl.ListFormat === "function"
		? new Intl.ListFormat(locale, { type: "conjunction" }).format(items)
		: items.join(", ");
}
