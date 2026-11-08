// Interface language: the device locale (expo-localization) unless the user picked one in Settings → Preferences.
// Catalogs are apps/mobile/locales/*.po, seeded from the web catalogs by scripts/seed-locales.mjs.
import type { Messages } from "@lingui/core";
import type { Locale } from "@reactive-resume/utils/locale";
import { i18n } from "@lingui/core";
import { getLocales } from "expo-localization";
import Storage from "expo-sqlite/kv-store";
import { I18nManager, Platform, Settings } from "react-native";
import {
	defaultLocale,
	getPreferredLocale,
	isLocale,
	isRTL,
	localeSchema,
	supportedLocales,
} from "@reactive-resume/utils/locale";

const storageKey = "locale";
export const selectableLocales = __DEV__ ? localeSchema.options : supportedLocales;

// Static paths, so Metro can bundle each catalog.
const loaders: Record<Locale, () => Promise<{ messages: Messages }>> = {
	"zh-CN": () => import("../../locales/zh-CN.po"),
	"zu-ZA": () => import("../../locales/zu-ZA.po"),
};

/** The supported locale closest to the device's preferred languages. */
export function getDeviceLocale(): Locale {
	return getPreferredLocale(getLocales().map(({ languageTag }) => languageTag));
}

/** The user's override, or null to follow the device. */
export function getLocalePreference(): Locale | null {
	const stored = Storage.getItemSync(storageKey);
	return isLocale(stored) && selectableLocales.includes(stored) ? stored : null;
}

/**
 * Saves the override (null follows the device) and activates it. Changing between a left-to-right and a
 * right-to-left language only flips the layout after the app restarts: React Native reads the direction at launch.
 * Returns true when a restart is needed.
 */
export function setLocalePreference(value: Locale | null): Promise<boolean> {
	const locale = value && selectableLocales.includes(value) ? value : null;
	if (locale) Storage.setItemSync(storageKey, locale);
	else Storage.removeItemSync(storageKey);
	return activateLocale(locale ?? getDeviceLocale());
}

/** Loads and activates a catalog. Returns true when the layout direction changes on the next launch. */
export async function activateLocale(value: Locale) {
	const locale = selectableLocales.includes(value) ? value : defaultLocale;
	const { messages } = await loaders[locale]().catch(() => loaders[defaultLocale]());
	i18n.loadAndActivate({ locale, messages });

	const rtl = isRTL(locale);
	if (Platform.OS === "ios") {
		// expo-localization resets forceRTL at launch; UIKit's persisted direction survives that reset.
		Settings.set({ AppleTextDirection: rtl, NSForceRightToLeftWritingDirection: rtl });
	}
	if (I18nManager.isRTL === rtl) return false;
	I18nManager.allowRTL(rtl);
	I18nManager.forceRTL(rtl);
	return true;
}

/** Activates the preferred locale at startup. */
export function initI18n() {
	return activateLocale(getLocalePreference() ?? getDeviceLocale());
}

export { i18n };
