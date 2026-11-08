import type {
	ChinaMarket,
	ChinaMarketFieldKey,
	ChinaMarketPlatform,
	ChinaMarketPlatformRow,
	ChinaMarketPreset,
	ChinaMarketProfile,
	ChinaMarketScene,
	ChinaMarketStyle,
} from "@reactive-resume/schema/resume/china-market";
import type { ResumeData } from "@reactive-resume/schema/resume/data";
import type { Template } from "@reactive-resume/schema/templates";
import {
	CHINA_MARKET_KEYWORDS,
	CHINA_MARKET_PLATFORMS,
	CHINA_MARKET_REWRITES,
	CHINA_MARKET_SCENES,
	defaultChinaMarket,
	resolveChinaMarketStyle,
} from "@reactive-resume/schema/resume/china-market";
import { stripHtml } from "@reactive-resume/utils/string";

/**
 * Pure China-market behaviour. Every function returns a new `ResumeData` (or a plain value) and
 * never mutates its input, so the builder can feed results straight into its undoable draft.
 *
 * One structured master, three outputs:
 *   1. the attachment PDF — template + section order + contact fields, chosen by scene/preset;
 *   2. the platform's online form — `mapChinaMarketPlatform`, machine-read and therefore primary;
 *   3. a JD alignment report — `analyzeChinaMarketJob`, keyword consistency + quantified outcomes.
 */

/** Resumes saved before this shipped have no `chinaMarket`; never rewrite stored data just to add it. */
export const chinaMarketOf = (data: ResumeData): ChinaMarket => data.metadata.chinaMarket ?? defaultChinaMarket;

/**
 * Switches map onto templates that already exist in `packages/pdf`. No new renderer, no CSS class
 * smuggled into business data. Priority is explicit: a comparison table wins over a centred name,
 * which wins over the lighter decorations, which wins over the scene's own safe default.
 */
export const resolveChinaMarketTemplate = (scene: ChinaMarketScene, style: ChinaMarketStyle): Template => {
	if (style.registrationTable) return scene === "soe" ? "state-owned" : "form-grid";
	if (style.centerName) return scene === "soe" ? "cn-executive" : "center-classic";
	if (style.softLabels) return "asia-standard";
	if (style.compactIntent) return "compact-dense";
	return CHINA_MARKET_SCENES[scene].template;
};

/** Labels whose custom fields this module owns. User-authored fields keep their own text. */
const MANAGED_FIELDS = ["微信", "政治面貌", "性别", "籍贯"] as const;

const managedField = (label: string, value: string) => ({
	id: `china-market-${label}`,
	icon: "",
	text: `${label}：${value}`,
	link: "",
});

/**
 * The master keeps scene-only fields out of the default PDF. Only `soe` copies political status,
 * gender and native place into the contact line; switching back removes exactly those rows and
 * leaves anything the author wrote themselves intact.
 */
const syncContactFields = (data: ResumeData): void => {
	const { scene, profile } = chinaMarketOf(data);
	const kept = data.basics.customFields.filter(
		(field) => !MANAGED_FIELDS.some((label) => field.text.startsWith(`${label}：`)),
	);
	const shown: [string, string][] = [];
	if (profile.wechat) shown.push(["微信", profile.wechat]);
	if (scene === "soe") {
		if (profile.political) shown.push(["政治面貌", profile.political]);
		if (profile.gender) shown.push(["性别", profile.gender]);
		if (profile.nativePlace) shown.push(["籍贯", profile.nativePlace]);
	}
	data.basics.customFields = [...kept, ...shown.map(([label, value]) => managedField(label, value))];
};

const applyStyle = (data: ResumeData, scene: ChinaMarketScene, preset: ChinaMarketPreset, style: ChinaMarketStyle) => {
	data.metadata.chinaMarket = { ...chinaMarketOf(data), scene, preset, style };
	data.metadata.template = resolveChinaMarketTemplate(scene, style);
	data.picture.hidden = !style.photo;
	syncContactFields(data);
};

/**
 * Switch scene. Presets are recomputed for the new scene (so `soe` gets its photo), but a custom
 * combination keeps the switches the author set themselves — the prototype's state model.
 */
export const applyChinaMarketScene = (data: ResumeData, scene: ChinaMarketScene): ResumeData => {
	const next = structuredClone(data);
	const current = chinaMarketOf(next);
	const style = current.preset === "custom" ? current.style : resolveChinaMarketStyle(current.preset, scene);

	// One reading column, one page. A Chinese ATS reads top to bottom; a sidebar breaks that order.
	next.metadata.layout.pages = [{ fullWidth: true, main: [...CHINA_MARKET_SCENES[scene].sections], sidebar: [] }];
	applyStyle(next, scene, current.preset, style);
	return next;
};

/** A preset writes the switches once; it does not become the source of truth. */
export const applyChinaMarketPreset = (data: ResumeData, preset: ChinaMarketPreset): ResumeData => {
	const next = structuredClone(data);
	const current = chinaMarketOf(next);
	const style = resolveChinaMarketStyle(preset, current.scene);
	applyStyle(next, current.scene, preset, style);
	return next;
};

/** Changing any single switch drops the preset into `custom`, exactly like the prototype. */
export const setChinaMarketStyle = (data: ResumeData, key: keyof ChinaMarketStyle, value: boolean): ResumeData => {
	const next = structuredClone(data);
	const current = chinaMarketOf(next);
	const style = { ...current.style, [key]: value };
	applyStyle(next, current.scene, "custom", style);
	return next;
};

export const setChinaMarketPlatform = (data: ResumeData, platform: ChinaMarketPlatform): ResumeData => {
	const next = structuredClone(data);
	next.metadata.chinaMarket = { ...chinaMarketOf(next), platform };
	return next;
};

export const setChinaMarketProfile = (data: ResumeData, patch: Partial<ChinaMarketProfile>): ResumeData => {
	const next = structuredClone(data);
	const current = chinaMarketOf(next);
	next.metadata.chinaMarket = { ...current, profile: { ...current.profile, ...patch } };
	syncContactFields(next);
	return next;
};

/** Keys that carry identity, styling or links rather than words a keyword engine can read. */
const NON_TEXT_KEYS = new Set(["hidden", "id", "icon", "iconColor", "link", "url", "color"]);

/**
 * All the text a keyword engine could see, without HTML or layout markup. Strings are handled
 * before the depth guard: section items sit five levels down, and capping at four silently dropped
 * every experience/project description from JD alignment.
 */
const collectText = (value: unknown, depth = 0): string[] => {
	if (typeof value === "string") return [stripHtml(value)];
	if (depth >= 10) return [];
	if (Array.isArray(value)) return value.flatMap((item) => collectText(item, depth + 1));
	if (value && typeof value === "object") {
		const record = value as Record<string, unknown>;
		// Hidden entries are never printed, so a keyword engine never sees them either.
		if (record.hidden === true) return [];
		return Object.entries(record).flatMap(([key, item]) =>
			NON_TEXT_KEYS.has(key) ? [] : collectText(item, depth + 1),
		);
	}
	return [];
};

export const chinaMarketPlainText = (data: ResumeData): string =>
	collectText({
		basics: data.basics,
		summary: data.summary,
		sections: data.sections,
		customSections: data.customSections,
	})
		.join(" ")
		.replace(/\s+/g, " ");

export type ChinaMarketJobAnalysis = {
	/** Only keywords the JD actually asks for count towards the denominator. */
	required: readonly string[];
	hits: readonly string[];
	misses: readonly string[];
	notRequired: readonly string[];
	/** How many number/percentage expressions the resume contains — a proxy for quantified outcomes. */
	quantifiedStatements: number;
	suggestions: readonly { keyword: string; rewrite: string }[];
	hasBaseline: boolean;
};

export const analyzeChinaMarketJob = (data: ResumeData, jobDescription: string): ChinaMarketJobAnalysis => {
	const jd = jobDescription ?? "";
	const text = chinaMarketPlainText(data);
	// The denominator is the JD's required keywords, never the fixed word list.
	const required = CHINA_MARKET_KEYWORDS.filter((keyword) => jd.includes(keyword));
	const hits = required.filter((keyword) => text.includes(keyword));
	const misses = required.filter((keyword) => !text.includes(keyword));
	const notRequired = CHINA_MARKET_KEYWORDS.filter((keyword) => !jd.includes(keyword));
	const quantifiedStatements = (text.match(/\d+(?:\.\d+)?\s*(?:%|％|pp|个|人|场|条|次|万|K|年|月|天|倍)/g) ?? [])
		.length;

	return {
		required,
		hits,
		misses,
		notRequired,
		quantifiedStatements,
		suggestions: misses.map((keyword) => ({ keyword, rewrite: CHINA_MARKET_REWRITES[keyword] ?? "" })),
		hasBaseline: required.length > 0,
	};
};

const visibleItems = <T extends { hidden: boolean }>(items: readonly T[]): readonly T[] =>
	items.filter((item) => !item.hidden);

const joinNonEmpty = (values: readonly (string | undefined)[], separator = " · ") =>
	values.filter((value): value is string => Boolean(value && value.trim())).join(separator);

const firstEducation = (data: ResumeData) => visibleItems(data.sections.education.items)[0];

const earliestExperienceYear = (data: ResumeData): number | undefined => {
	const years = visibleItems(data.sections.experience.items)
		.flatMap((item) => [...item.period.matchAll(/(?:19|20)\d{2}/g)].map((match) => Number(match[0])))
		.concat(
			visibleItems(data.customSections)
				.filter((section) => section.type === "experience")
				.flatMap((section) =>
					section.items.flatMap((item) =>
						[...String((item as { period?: string }).period ?? "").matchAll(/(?:19|20)\d{2}/g)].map((match) =>
							Number(match[0]),
						),
					),
				),
		);
	return years.length > 0 ? Math.min(...years) : undefined;
};

const workYears = (data: ResumeData, now = new Date()): string => {
	const year = earliestExperienceYear(data);
	return year ? `${Math.max(0, now.getFullYear() - year)} 年` : "（主档未填）";
};

const resolveMasterField = (data: ResumeData, key: ChinaMarketFieldKey, now?: Date): string => {
	const { basics, sections } = data;
	const profile = chinaMarketOf(data).profile;
	const school = firstEducation(data);

	switch (key) {
		case "name":
			return basics.name;
		case "phone":
			return basics.phone;
		case "email":
			return joinNonEmpty([basics.phone, basics.email]);
		case "wechat":
			return profile.wechat;
		case "city":
			return basics.location;
		case "headline":
			return basics.headline;
		case "intent":
			return joinNonEmpty([basics.headline, profile.intentCity, profile.intentSalary, profile.arrival]);
		case "intentCity":
			return profile.intentCity || basics.location;
		case "salary":
			return profile.intentSalary;
		case "arrival":
			return profile.arrival;
		case "gender":
			return profile.gender;
		case "political":
			return profile.political;
		case "nativePlace":
			return profile.nativePlace;
		case "english":
			return profile.english;
		case "cadre":
			return profile.cadre;
		case "major":
			return profile.major || joinNonEmpty([school?.school, school?.area]);
		case "gpa":
			return profile.gpa || school?.grade || "";
		case "courses":
			return profile.courses;
		case "education":
			return joinNonEmpty([school?.degree, school?.school, school?.area, school?.period]);
		case "experience":
			return `${visibleItems(sections.experience.items).length} 段，倒序 + 量化成果`;
		case "projects":
			return `${visibleItems(sections.projects.items).length} 个`;
		case "skills":
			return visibleItems(sections.skills.items)
				.flatMap((item) => [item.name, ...item.keywords])
				.filter(Boolean)
				.slice(0, 8)
				.join(" / ");
		case "certifications":
			return visibleItems(sections.certifications.items)
				.map((item) => item.title)
				.filter(Boolean)
				.join(" / ");
		case "awards":
			return visibleItems(sections.awards.items)
				.map((item) => item.title)
				.filter(Boolean)
				.join(" / ");
		case "workYears":
			return workYears(data, now);
		default:
			return "";
	}
};

export type MappedChinaMarketRow = ChinaMarketPlatformRow & { value: string; label: string };

/** The structured master mapped onto one platform's online form — the machine-read deliverable. */
export const mapChinaMarketPlatform = (
	data: ResumeData,
	platform: ChinaMarketPlatform,
	now?: Date,
): { label: string; note: string; rows: readonly MappedChinaMarketRow[]; autoCount: number; manualCount: number } => {
	const config = CHINA_MARKET_PLATFORMS[platform];
	const rows = config.rows.map((raw) => {
		// Rows are a heterogeneous tuple; widen before reading the optional `source` / `note` keys.
		const row: ChinaMarketPlatformRow = raw;
		return {
			...row,
			label: config.label,
			value:
				row.status === "auto"
					? resolveMasterField(data, row.source ?? "name", now) || "（主档未填）"
					: (row.note ?? ""),
		};
	});
	return {
		label: config.label,
		note: config.note,
		rows,
		autoCount: rows.filter((row) => row.status === "auto").length,
		manualCount: rows.filter((row) => row.status === "manual").length,
	};
};

const safe = (value: string) => value.replace(/[\\/:*?"<>|]/g, "-").trim() || "未命名";

/** China-market export names carry the role, not just the person: 姓名-应聘岗位-工作年限.pdf. */
export const chinaMarketFileName = (data: ResumeData, scene: ChinaMarketScene, now?: Date): string => {
	const { basics } = data;
	const profile = chinaMarketOf(data).profile;
	const school = firstEducation(data);
	const name = safe(basics.name || "简历");
	const role = safe(basics.headline || "应聘岗位");

	if (scene === "campus") {
		return `${name}-${safe(school?.school || "学校")}-${safe(school?.area || "专业")}-${role}.pdf`;
	}
	if (scene === "soe") {
		return `${name}-${role}-${safe(profile.political || "政治面貌")}-${safe(school?.school || "学校")}.pdf`;
	}
	return `${name}-${role}-${safe(workYears(data, now) || "工作年限")}.pdf`;
};

/** True when the current preset is the ATS-risky comparison, so the UI can warn before printing. */
export const chinaMarketIsRisky = (data: ResumeData): boolean => chinaMarketOf(data).style.registrationTable;
