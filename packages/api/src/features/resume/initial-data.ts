import type { ResumeData } from "@reactive-resume/schema/resume/data";
import type { Template } from "@reactive-resume/schema/templates";
import { defaultChinaMarket } from "@reactive-resume/schema/resume/china-market";
import { chinaSampleResumeData } from "@reactive-resume/schema/resume/china-sample";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";
import { EMPTY_SEMANTIC_CSS_SOURCE } from "@reactive-resume/schema/resume/stylesheet";

const LETTER_LOCALES: ReadonlySet<string> = new Set(["en-US", "en-CA", "es-MX", "fr-CA"]);

/** 求职意向 → 经历 → 项目 → 教育 → 技能. One full-width column: a Chinese ATS reads top to bottom. */
const CHINA_ATS_MAIN = [
	"summary",
	"experience",
	"projects",
	"education",
	"skills",
	"certifications",
	"awards",
] as const;

/**
 * The Chinese ATS-safe starting point is a creation policy, not a mutation of `defaultResumeData`.
 * Imports, AI sanitising, the DB column default and dozens of renderer tests all rely on that
 * neutral upstream fixture; only documents this builder creates for a person get these settings.
 */
const applyChinaAtsDefaults = (data: ResumeData): void => {
	data.picture.hidden = true;
	data.metadata.template = "general-single";
	data.metadata.layout = {
		sidebarWidth: 30,
		pages: [{ fullWidth: true, main: [...CHINA_ATS_MAIN], sidebar: [] }],
	};
	data.metadata.page.gapX = 8;
	data.metadata.page.gapY = 8;
	data.metadata.page.marginX = 16;
	data.metadata.page.marginY = 14;
	data.metadata.page.format = "a4";
	data.metadata.page.locale = "zh-CN";
	data.metadata.page.dateFormat = "iso";
	data.metadata.page.hideIcons = true;
	data.metadata.page.hideSectionIcons = true;
	data.metadata.design.colors.primary = "rgba(47, 90, 138, 1)";
	data.metadata.design.level.type = "hidden";
	data.metadata.typography.heading.fontFamily = "Noto Sans SC";
	data.metadata.typography.heading.fontWeights = ["600"];
	data.metadata.typography.body.fontFamily = "Noto Serif SC";
	data.metadata.typography.body.fontWeights = ["400", "600"];
	data.metadata.chinaMarket = structuredClone(defaultChinaMarket);
};

type CreateResumeDataOptions = {
	withSampleData?: boolean;
	/** The person the resume is for, printed as its name: the account holder's name, not the document's. */
	name?: string;
	/** The account's email, for the contact line of a blank resume. */
	email?: string | undefined;
	// A stored account locale, not the UI catalog: accounts created before this build shipped a
	// Chinese-only interface still carry en-US/de-DE, and those keep their Letter paper convention.
	locale?: string;
	template?: Template | undefined;
};

export function createResumeData(options: CreateResumeDataOptions): ResumeData {
	const data = structuredClone(options.withSampleData ? chinaSampleResumeData : defaultResumeData);

	// A sample keeps its fictional person: printing the account's name (or "Guest") on someone else's career misleads.
	const name = options.name?.trim();
	if (name && !options.withSampleData) data.basics.name = name;
	// A sample keeps its own fictional contact details.
	const email = options.email?.trim();
	if (email && !options.withSampleData) data.basics.email = email;

	if (!options.withSampleData) {
		applyChinaAtsDefaults(data);
		// A stored account locale can still be an old BCP-47 tag. It changes paper and date conventions for
		// a blank document, never the shipped Chinese sample's own language.
		if (options.locale) data.metadata.page.locale = options.locale;
		// Where Letter is the paper people print on.
		if (options.locale && LETTER_LOCALES.has(options.locale)) data.metadata.page.format = "letter";
	}

	if (options.template) {
		data.metadata.template = options.template;
		// An explicit template choice supersedes the ATS preset; don't let the panel claim otherwise.
		if (data.metadata.chinaMarket) data.metadata.chinaMarket.preset = "custom";
	}

	// `chinaMarket` ships with both starting documents: one structured master behind the PDF, the
	// platform forms and the JD report. Older stored resumes simply lack it and fall back to defaults.
	data.metadata.stylesheet = {
		mode: "semantic",
		source: { languageVersion: 1, text: EMPTY_SEMANTIC_CSS_SOURCE },
	};

	return data;
}
