import type {
	ChinaMarket,
	ChinaMarketFieldKey,
	ChinaMarketPlatform,
	ChinaMarketPlatformRow,
	ChinaMarketPreset,
	ChinaMarketProfile,
	ChinaMarketRowStatus,
	ChinaMarketScene,
	ChinaMarketStyle,
} from "@reactive-resume/schema/resume/china-market";
import type { ResumeData } from "@reactive-resume/schema/resume/data";
import type { Template } from "@reactive-resume/schema/templates";
import type { FileNameTarget } from "@reactive-resume/utils/file-name";
import type { FormFillPlan } from "@reactive-resume/utils/form-fill";
import {
	CHINA_MARKET_HANDOFF_COPY,
	CHINA_MARKET_KEYWORDS,
	CHINA_MARKET_PLATFORMS,
	CHINA_MARKET_REWRITES,
	CHINA_MARKET_SCENES,
	defaultChinaMarket,
	resolveChinaMarketStyle,
} from "@reactive-resume/schema/resume/china-market";
import { getDefaultFileName, sanitizeFileName } from "@reactive-resume/utils/file-name";
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
 * The JD lives in the master, not in a panel's `useState`. Legacy documents simply read as empty, so
 * no migration is needed; typing writes through `setChinaMarketJobDescription` and is undoable like
 * every other master edit.
 */
export const chinaMarketJobDescription = (data: ResumeData): string => chinaMarketOf(data).jobDescription ?? "";

export const setChinaMarketJobDescription = (data: ResumeData, jobDescription: string): ResumeData => {
	const next = structuredClone(data);
	next.metadata.chinaMarket = { ...chinaMarketOf(next), jobDescription };
	return next;
};

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

/**
 * Everything a keyword engine could see, including the 12 scene-only master fields. Those used to
 * be invisible here, so a JD asking for CET-6 or 政治面貌 could never score a hit even when the
 * author had filled them in. The JD itself is deliberately excluded — it would match itself.
 */
export const chinaMarketPlainText = (data: ResumeData): string =>
	collectText({
		basics: data.basics,
		summary: data.summary,
		sections: data.sections,
		customSections: data.customSections,
		profile: chinaMarketOf(data).profile,
	})
		.join(" ")
		.replace(/\s+/g, " ");

export type ChinaMarketJobAnalysis = {
	/** Keywords the JD actually asks for: dictionary terms plus Latin-script skill tokens. */
	required: readonly string[];
	hits: readonly string[];
	misses: readonly string[];
	/** How many number/percentage expressions the resume contains — a proxy for quantified outcomes. */
	quantifiedStatements: number;
	suggestions: readonly { keyword: string; rewrite: string }[];
	/** A JD was pasted, so the report renders even when zero keywords were recognised. */
	hasBaseline: boolean;
	/** A non-empty JD produced no keyword at all; the UI says so instead of hiding the block. */
	unrecognized: boolean;
};

/** Latin-script skill tokens in a Chinese JD: React, Spring Boot, CET-6, ATS, TypeScript… */
const LATIN_TERM = /[A-Za-z][A-Za-z0-9+#./-]{1,}/g;
const GENERIC_LATIN = new Set([
	"jd",
	"hr",
	"cv",
	"etc",
	"and",
	"the",
	"with",
	"for",
	"or",
	"of",
	"in",
	"to",
	"on",
	"at",
	"by",
	"as",
	"is",
	"are",
	"be",
	"we",
	"you",
	"your",
	"it",
	"its",
	"will",
	"can",
	"from",
	"that",
	"this",
	"not",
	"no",
	"an",
	"eg",
	"ie",
	"plus",
]);
const MAX_JD_KEYWORDS = 24;

/** Chinese JDs write "B 端" and "B端" interchangeably; whitespace must not decide a hit. */
const normalizeTerm = (text: string) => text.toLowerCase().replace(/\s+/g, "");
const includesTerm = (text: string, term: string) => normalizeTerm(text).includes(normalizeTerm(term));

/**
 * The denominator comes from the JD, not from the dictionary. A fixed ten-word design list used to
 * make a Java posting report "命中 1 / 1" (only 本科 matched) or hide the report entirely for a
 * state-owned posting. Dictionary hits keep their stable order; Latin tokens follow the JD's order.
 */
export const extractChinaMarketKeywords = (jobDescription: string): string[] => {
	const jd = jobDescription ?? "";
	const dictionary = CHINA_MARKET_KEYWORDS.filter((keyword) => includesTerm(jd, keyword));
	const covered = new Set(dictionary.map((keyword) => keyword.toLowerCase()));
	const latin = [...new Set((jd.match(LATIN_TERM) ?? []).map((token) => token.replace(/[./+-]+$/, "")))]
		.filter((token) => token.length >= 2 && !GENERIC_LATIN.has(token.toLowerCase()))
		// "A/B 测试" already matched the dictionary; its "A/B" fragment is not a second keyword.
		.filter((token) => !covered.has(token.toLowerCase()) && !dictionary.some((word) => includesTerm(word, token)));
	return [...dictionary, ...latin].slice(0, MAX_JD_KEYWORDS);
};

const genericRewrite = (keyword: string) =>
	`在经历或技能里如实写出「${keyword}」，并补一条可核对的量化结果；没有相关经历就不要硬凑。`;

/** One number with a unit — a percentage, a headcount, a duration. */
const QUANTIFIED_EXPRESSION = /\d+(?:\.\d+)?\s*(?:%|％|pp|个|人|场|条|次|万|K|年|月|天|倍)/;

/**
 * A resume restates the same achievement in its summary and again in the role it belongs to, and one
 * bullet can carry three numbers. Counting raw matches showed 50 for a one-page sample whose reader
 * sees a dozen bullets; the sentences that carry a number are what "quantified statements" means.
 */
const countQuantifiedStatements = (text: string) =>
	new Set(
		text
			.split(/[。！？；;\n]+/)
			.map((sentence) => sentence.trim())
			.filter((sentence) => sentence.length > 0 && QUANTIFIED_EXPRESSION.test(sentence)),
	).size;

export const analyzeChinaMarketJob = (data: ResumeData, jobDescription: string): ChinaMarketJobAnalysis => {
	const jd = jobDescription ?? "";
	const text = chinaMarketPlainText(data);
	const required = extractChinaMarketKeywords(jd);
	const hits = required.filter((keyword) => includesTerm(text, keyword));
	const misses = required.filter((keyword) => !includesTerm(text, keyword));
	const quantifiedStatements = countQuantifiedStatements(text);

	return {
		required,
		hits,
		misses,
		quantifiedStatements,
		suggestions: misses.map((keyword) => ({
			keyword,
			rewrite: CHINA_MARKET_REWRITES[keyword] ?? genericRewrite(keyword),
		})),
		hasBaseline: jd.trim().length > 0,
		unrecognized: jd.trim().length > 0 && required.length === 0,
	};
};

const visibleItems = <T extends { hidden: boolean }>(items: readonly T[]): readonly T[] =>
	items.filter((item) => !item.hidden);

const joinNonEmpty = (values: readonly (string | undefined)[], separator = " · ") =>
	values.filter((value): value is string => Boolean(value && value.trim())).join(separator);

/** Rich-text descriptions are HTML; a form field needs the words, not the markup. */
const plain = (html: string | undefined) =>
	stripHtml(html ?? "")
		.replace(/\s+/g, " ")
		.trim();

// Stored documents can predate a section; a file name must never 500 on a legacy record.
const firstEducation = (data: ResumeData) => visibleItems(data.sections?.education?.items ?? [])[0];

const earliestExperienceYear = (data: ResumeData): number | undefined => {
	const years = visibleItems(data.sections?.experience?.items ?? [])
		.flatMap((item) => [...item.period.matchAll(/(?:19|20)\d{2}/g)].map((match) => Number(match[0])))
		.concat(
			visibleItems(data.customSections ?? [])
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
	return year ? `${Math.max(0, now.getFullYear() - year)} 年` : CHINA_MARKET_UNFILLED;
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
			return basics.email;
		/** Combined "phone / email" rows only; a pure email field must never receive a phone number. */
		case "contact":
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
		/**
		 * The form hand-off must carry the actual prose to paste, not a count like "3 段，倒序 + 量化成果".
		 * A platform field asking for work content cannot be filled with a note about how to write it.
		 */
		case "experience":
			return visibleItems(sections.experience.items)
				.map((item) =>
					joinNonEmpty(
						[
							joinNonEmpty([item.company, item.position], " / "),
							item.period,
							plain(item.description),
							...item.roles.map((role) => joinNonEmpty([role.position, role.period, plain(role.description)], "，")),
						],
						"，",
					),
				)
				.filter(Boolean)
				.join("；");
		case "projects":
			return visibleItems(sections.projects.items)
				.map((item) => joinNonEmpty([item.name, item.period, plain(item.description)], "，"))
				.filter(Boolean)
				.join("；");
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

/** A placeholder must never be written into a real form field. */
export const CHINA_MARKET_UNFILLED = "（主档未填）";

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
					? resolveMasterField(data, row.source ?? "name", now) || CHINA_MARKET_UNFILLED
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

/** One row as it leaves the app. `field` is the platform's own form label, never the platform name. */
export type ChinaMarketFormField = {
	field: string;
	master: string;
	status: ChinaMarketRowStatus;
	value: string;
	note: string;
};

/** The alignment conclusion travels with the packet: a receiver must see what the answers target. */
export type ChinaMarketJobReport = {
	required: readonly string[];
	hits: readonly string[];
	misses: readonly string[];
	quantifiedStatements: number;
	unrecognized: boolean;
};

/**
 * The hand-off artifact for the online form — previously only a read-only preview. It carries the
 * persisted JD, its alignment conclusion and a `fillPlanFields` array shaped exactly like the
 * upstream browser helper's `FormFillPlan["fields"]`.
 *
 * It deliberately does NOT pretend to auto-fill: Chinese platforms have no verified helper build yet,
 * and no destination URL is stored here. `chinaMarketFillPlan()` requires a caller-supplied exact URL.
 */
export type ChinaMarketFormPacket = {
	format: "yejian-china-market-form-packet";
	version: 2;
	platform: ChinaMarketPlatform;
	platformLabel: string;
	generatedAt: string;
	jobDescription: string;
	jobReport: ChinaMarketJobReport;
	fields: readonly ChinaMarketFormField[];
	fillPlanFields: FormFillPlan["fields"];
	autoCount: number;
	manualCount: number;
	notCollectedCount: number;
};

export const chinaMarketFormPacket = (
	data: ResumeData,
	platform: ChinaMarketPlatform,
	now: Date = new Date(),
): ChinaMarketFormPacket => {
	const mapped = mapChinaMarketPlatform(data, platform, now);
	const jd = chinaMarketJobDescription(data);
	const analysis = analyzeChinaMarketJob(data, jd);
	const fields: ChinaMarketFormField[] = mapped.rows.map((row) => ({
		field: row.field,
		master: row.master,
		status: row.status,
		value: row.status === "auto" ? row.value : "",
		note: row.note ?? "",
	}));
	// Only real, auto-resolved values may be offered to a fill helper. Placeholders and rows we
	// deliberately do not collect must stay with a human.
	const fillPlanFields: FormFillPlan["fields"] = fields
		.filter((row) => row.status === "auto" && row.value && row.value !== CHINA_MARKET_UNFILLED)
		.map((row) => ({ question: row.field, value: row.value, source: `页见结构化主档/${row.master}` }));

	return {
		format: "yejian-china-market-form-packet",
		version: 2,
		platform,
		platformLabel: mapped.label,
		generatedAt: now.toISOString(),
		jobDescription: jd,
		jobReport: {
			required: analysis.required,
			hits: analysis.hits,
			misses: analysis.misses,
			quantifiedStatements: analysis.quantifiedStatements,
			unrecognized: analysis.unrecognized,
		},
		fields,
		fillPlanFields,
		autoCount: mapped.autoCount,
		manualCount: mapped.manualCount,
		notCollectedCount: fields.filter((row) => row.status === "na").length,
	};
};

/** Paste-ready plain text: one `字段：值` per line, with the human-only rows kept out of the way. */
export const chinaMarketFormText = (packet: ChinaMarketFormPacket): string => {
	const lines = [`${packet.platformLabel} · 平台在线表单字段`, `生成时间：${packet.generatedAt}`];
	if (packet.jobDescription.trim()) lines.push(`目标 JD：${packet.jobDescription.trim()}`);
	lines.push("");
	if (packet.jobReport?.required.length) {
		const { hits, required, misses, quantifiedStatements } = packet.jobReport;
		lines.push(
			`【JD 关键词对齐】命中 ${hits.length} / ${required.length} · 量化表述 ${quantifiedStatements}`,
			`已命中：${hits.join("、") || "—"}`,
			`缺失：${misses.join("、") || "—"}`,
			"",
		);
	} else if (packet.jobReport?.unrecognized) {
		lines.push(`【JD 关键词对齐】${CHINA_MARKET_HANDOFF_COPY.noKeywordsHint}`, "");
	}

	const section = (
		title: string,
		rows: readonly ChinaMarketFormField[],
		render: (row: ChinaMarketFormField) => string,
	) => {
		if (rows.length === 0) return;
		lines.push(`【${title}】`, ...rows.map(render), "");
	};
	section(
		"可从主档直接粘贴",
		packet.fields.filter((row) => row.status === "auto" && row.value !== CHINA_MARKET_UNFILLED),
		(row) => `${row.field}：${row.value}`,
	);
	section(
		"主档未填，需补齐",
		packet.fields.filter((row) => row.status === "auto" && row.value === CHINA_MARKET_UNFILLED),
		(row) => `${row.field}：（未填）`,
	);
	section(
		"需人工填写",
		packet.fields.filter((row) => row.status === "manual"),
		(row) => `${row.field}：${row.note}`,
	);
	section(
		"平台不采集 / 主档刻意不收",
		packet.fields.filter((row) => row.status === "na"),
		(row) => `${row.field}：${row.note}`,
	);
	lines.push("本文件由页见生成，仅用于人工核对与粘贴；页见不会自动填写或提交任何平台表单。");
	return `${lines.join("\n")}\n`;
};

export const chinaMarketFormJson = (packet: ChinaMarketFormPacket): string => `${JSON.stringify(packet, null, 2)}\n`;

/**
 * Bridge into the upstream delivery chain. A real `FormFillPlan` needs the exact destination page URL,
 * which the master cannot know; the caller (a verified helper or adapter) must supply and confirm it.
 * Loopback hosts are allowed only so the existing tests can exercise the contract.
 */
export const chinaMarketFillPlan = (packet: ChinaMarketFormPacket, targetUrl: string): FormFillPlan | null => {
	let url: URL;
	try {
		url = new URL(targetUrl);
	} catch {
		return null;
	}
	if (url.username || url.password || url.hash) return null;
	const loopback = ["localhost", "127.0.0.1", "10.0.2.2"].includes(url.hostname);
	if (url.protocol !== "https:" && !(url.protocol === "http:" && loopback)) return null;
	return { targetUrl, fields: [...packet.fillPlanFields], files: [] };
};

const safe = (value: string) => value.replace(/[\\/:*?"<>|]/g, "-").trim() || "未命名";

/** Drops the segments a resume doesn't have yet instead of naming what they would have held. */
const joinNameParts = (...parts: Array<string | null | undefined>) =>
	parts
		.map((part) => (part ?? "").trim())
		.filter((part) => part.length > 0)
		.map(safe)
		.join("-");

/**
 * China-market export names carry the role, not just the person. Kept extension-free so the same
 * base feeds PDF, DOCX, the download sheet's editable name field and server-side exports alike.
 */
export const chinaMarketFileBaseName = (data: ResumeData, scene: ChinaMarketScene, now?: Date): string => {
	const { basics } = data;
	const profile = chinaMarketOf(data).profile;
	const school = firstEducation(data);
	const name = safe(basics.name || "简历");
	const role = safe(basics.headline || "应聘岗位");
	// A resume with no dated experience has no 工作年限 to state. Writing the words "工作年限" instead
	// put a template placeholder in front of a recruiter — "陈嘉宁-高级产品设计师-工作年限.pdf".
	const years = workYears(data, now);
	const experience = years === CHINA_MARKET_UNFILLED ? null : years;

	if (scene === "campus") return joinNameParts(name, school?.school, school?.area, role);
	if (scene === "soe") return joinNameParts(name, role, profile.political, school?.school);
	return joinNameParts(name, role, experience);
};

export const chinaMarketFileName = (data: ResumeData, scene: ChinaMarketScene, now?: Date): string =>
	`${chinaMarketFileBaseName(data, scene, now)}.pdf`;

/**
 * The fork's actual default export name, used by every export path (builder, download sheet and API).
 * Upstream's "Name-Resume" stays for cover letters, legacy documents and blank resumes with no
 * target role: renaming a document the author never tailored would be surprising. Once a name and a
 * 岗位 are set, a Chinese recruiter's inbox needs "姓名-岗位-工作年限" instead of a generic suffix.
 */
export const chinaMarketDefaultFileName = (
	source: { name: string; slug?: string | null; data: ResumeData },
	target: FileNameTarget = "resume",
	now?: Date,
): string => {
	const upstream = getDefaultFileName(source, target);
	const { data } = source;
	if (
		target === "cover-letter" ||
		!data.metadata?.chinaMarket ||
		!data.basics?.name?.trim() ||
		!data.basics.headline?.trim()
	) {
		return upstream;
	}
	return sanitizeFileName(chinaMarketFileBaseName(data, chinaMarketOf(data).scene, now));
};

/** The form hand-off is a separate deliverable from the PDF, so it gets its own name and extension. */
export const chinaMarketFormFileName = (
	data: ResumeData,
	platform: ChinaMarketPlatform,
	extension: "json" | "txt",
): string => {
	const name = safe(data.basics.name || "简历");
	return `${name}-${safe(CHINA_MARKET_PLATFORMS[platform].label)}-表单字段.${extension}`;
};

/** True when the current preset is the ATS-risky comparison, so the UI can warn before printing. */
export const chinaMarketIsRisky = (data: ResumeData): boolean => chinaMarketOf(data).style.registrationTable;
