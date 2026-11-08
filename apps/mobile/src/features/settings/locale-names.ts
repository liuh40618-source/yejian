import type { MessageDescriptor } from "@lingui/core";
import type { Locale } from "@reactive-resume/utils/locale";
import { msg } from "@lingui/core/macro";

export const localeMap = {
	"zh-CN": msg`简体中文`,
	"zu-ZA": msg`Pseudo-locale`,
} satisfies Record<Locale, MessageDescriptor>;
