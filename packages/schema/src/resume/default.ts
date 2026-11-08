import type { ResumeData } from "./data";
import { defaultChinaMarket } from "./china-market";

/** The shared fields every section starts with, minus its items or content. */
export const sectionDefaults = (icon: string) => ({
	title: "",
	icon,
	columns: 1,
	hidden: false,
	showHeading: true,
	keepTogether: false,
	startOnNewPage: false,
});

const section = (icon: string) => ({ ...sectionDefaults(icon), items: [] as never[] });

/**
 * The neutral, upstream-compatible blank document. Imports (JSON Resume, LinkedIn, plain text),
 * AI sanitising and the DB column default all start from here, and most renderer regression tests
 * use it as a stable fixture. Keep it language- and market-neutral: the Chinese ATS-safe defaults
 * are a *creation policy* applied by `createResumeData()`, not a property of the base document.
 * `chinaMarket` is additive only — it prints nothing and legacy documents simply omit it.
 */
export const defaultResumeData: ResumeData = {
	picture: {
		hidden: false,
		fit: "cover",
		url: "",
		size: 80,
		rotation: 0,
		aspectRatio: 1,
		borderRadius: 0,
		borderColor: "rgba(0, 0, 0, 0.5)",
		borderWidth: 0,
		shadowColor: "rgba(0, 0, 0, 0.5)",
		shadowWidth: 0,
	},
	basics: {
		name: "",
		headline: "",
		email: "",
		phone: "",
		location: "",
		website: { url: "", label: "" },
		customFields: [],
	},
	summary: { ...sectionDefaults("article"), content: "" },
	sections: {
		profiles: section("messenger-logo"),
		experience: section("briefcase"),
		education: section("graduation-cap"),
		projects: section("code-simple"),
		skills: { ...section("compass-tool"), layout: "default", keywordLayout: "inline" },
		languages: section("translate"),
		interests: section("football"),
		awards: section("trophy"),
		certifications: section("certificate"),
		publications: section("books"),
		volunteer: section("hand-heart"),
		references: section("phone"),
	},
	customSections: [],
	metadata: {
		template: "minimal-photo",
		layout: {
			sidebarWidth: 35,
			pages: [
				{
					fullWidth: false,
					main: ["profiles", "summary", "education", "experience", "projects", "volunteer", "references"],
					sidebar: ["skills", "certifications", "awards", "languages", "interests", "publications"],
				},
			],
		},
		page: {
			gapX: 4,
			gapY: 6,
			marginX: 14,
			marginY: 12,
			format: "a4",
			locale: "en-US",
			dateFormat: "short",
			hideLinkUnderline: false,
			hideIcons: false,
			hideSectionIcons: true,
		},
		design: {
			colors: {
				primary: "rgba(220, 38, 38, 1)",
				text: "rgba(0, 0, 0, 1)",
				background: "rgba(255, 255, 255, 1)",
			},
			level: {
				icon: "star",
				type: "circle",
			},
			entry: { layout: "stacked", lead: "organization", accent: "none" },
		},
		typography: {
			body: {
				fontFamily: "IBM Plex Serif",
				fontWeights: ["400", "500"],
				fontSize: 10,
				lineHeight: 1.5,
			},
			heading: {
				fontFamily: "IBM Plex Serif",
				fontWeights: ["600"],
				fontSize: 14,
				lineHeight: 1.5,
			},
		},
		notes: "",
		styleRules: [],
		chinaMarket: defaultChinaMarket,
	},
};
