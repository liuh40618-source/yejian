import { defineConfig } from "@lingui/cli";
import { formatter } from "@lingui/format-po";
import { localeSchema } from "@reactive-resume/utils/locale";

export default defineConfig({
	// msgids stay English: they are stable keys, not copy. zh-CN is the shipped language and the runtime default, so
	// every key needs a translation in its catalog; an untranslated one falls back to English rather than crashing.
	sourceLocale: "en-US",
	pseudoLocale: "zu-ZA",
	locales: [...localeSchema.options],
	fallbackLocales: {
		"zu-ZA": "zh-CN",
		default: "zh-CN",
	},
	format: formatter({
		lineNumbers: false,
	}),
	catalogs: [
		{
			path: "<rootDir>/locales/{locale}",
			include: ["src"],
		},
	],
});
