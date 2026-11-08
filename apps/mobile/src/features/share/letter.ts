import type { Messages } from "@lingui/core";
import type { LetterWords } from "@reactive-resume/resume/cover-letter";
import type { Locale } from "@reactive-resume/utils/locale";
import { setupI18n } from "@lingui/core";
import { t } from "@lingui/core/macro";
import { defaultLocale, isLocale } from "@reactive-resume/utils/locale";

// Static imports keep document language independent of the interface language in Metro.
// This build ships two catalogs: the Chinese interface and Lingui's pseudo-locale. The old
// 55-entry table pointed at .po files that no longer exist, which made Metro fail to bundle the
// share sheet even though isLocale() could only ever resolve to one of these two keys.
const loaders: Record<Locale, () => Promise<{ messages: Messages }>> = {
	"zh-CN": () => import("../../../locales/zh-CN.po"),
	"zu-ZA": () => import("../../../locales/zu-ZA.po"),
};

export async function letterWords(locale: string): Promise<LetterWords> {
	const resolved = isLocale(locale) ? locale : defaultLocale;
	const { messages } = await loaders[resolved]();
	const i18n = setupI18n();
	i18n.loadAndActivate({ locale: resolved, messages });
	return {
		greeting: (name) => t(i18n)`Dear ${name},`,
		teamGreeting: t(i18n)`Dear hiring team,`,
		hiringTeam: t(i18n)`Hiring team`,
		signOff: t(i18n)`Kind regards,`,
		formatDate: (date) =>
			new Date(`${date}T12:00:00Z`).toLocaleDateString(resolved, {
				day: "numeric",
				month: "long",
				year: "numeric",
				timeZone: "UTC",
			}),
	};
}
