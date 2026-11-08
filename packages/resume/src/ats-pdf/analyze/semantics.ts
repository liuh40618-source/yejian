import type { ExtractedDocument, RawExtraction, ResumeSemantics, TextLine } from "../types";
import { analyzeContact } from "./contact";
import { analyzeDates } from "./dates";
import { detectHeadings, sectionTypesOf } from "./sections";
import { analyzeTextQuality } from "./text-quality";

const BULLET_PREFIX = /^\s*(?:[•▪◦‣·∙●○■□▶▸*+]|[-–—]\s|[\u{E000}-\u{F8FF}])\s*/u;
const LONG_BULLET_CHARS = 220;
/** Chinese text carries more meaning per character: 220 of them is a paragraph, not a bullet. */
const LONG_BULLET_CHARS_CJK = 110;
const FIRST_PERSON = /\b(?:I|I'm|I've|my|me|myself)\b/g;
/** The same self-reference in Chinese, which no word-boundary pattern can find. */
const FIRST_PERSON_CJK = /我们|我|本人|自己/g;

/** Share of a page's height that counts as the running-head zone at either end. */
const RUNNING_HEAD_BAND = 0.08;
const MIN_REPEATED_OPENING = 3;
/** Chinese bullets open on this many characters before the phrasing counts as repeated. */
const REPEATED_OPENING_CJK_CHARS = 4;

/** "某某科技有限公司 · 高级前端工程师" / "高级前端工程师 | 上海" — the Chinese role-line separator. */
const CJK_ROLE_SEPARATOR = /\p{Script=Han}[^\S\n]*(?:[·|｜/、]|—{1,2})[^\S\n]*\p{Script=Han}/u;
/** "前端开发工程师 2020.03 - 2024.06": a Chinese title followed by its dates on the same line. */
const CJK_ROLE_WITH_DATES =
	/\p{Script=Han}{2,}.*?(?:(?:19|20)\d{2}\s*[.\-/年]\s*\d{1,2}|\d{4}\s*[-–—~至]\s*(?:\d{4}|至今|现在))/u;

const ACTION_VERBS = new Set(
	(
		"achieved acquired adapted administered advised analyzed architected authored automated built centralized " +
		"championed coached collaborated completed conceived conducted configured consolidated constructed converted " +
		"coordinated created cut decreased defined delivered deployed designed developed devised diagnosed directed " +
		"documented doubled drove earned edited eliminated enabled engineered enhanced established evaluated executed " +
		"expanded expedited facilitated forecast formalized founded generated grew guided halved headed identified " +
		"implemented improved increased influenced initiated instituted integrated introduced launched led maintained " +
		"managed mentored migrated modernized negotiated onboarded operated optimized orchestrated organized overhauled " +
		"oversaw partnered performed pioneered piloted planned prepared presented prioritized produced programmed " +
		"proposed prototyped published rearchitected rebuilt reduced refactored released remediated reorganized " +
		"replaced researched resolved restructured revamped reviewed scaled scoped secured shipped simplified solved " +
		"spearheaded standardized streamlined strengthened supervised supported surveyed sustained taught tested " +
		"trained transformed translated tripled troubleshot unified upgraded validated wrote"
	).split(" "),
);

const isBullet = (line: TextLine) => BULLET_PREFIX.test(line.text);

const bulletBody = (line: TextLine) => line.text.replace(BULLET_PREFIX, "").trim();

/**
 * Chinese bullets open on the achievement verb the way English ones do — 主导 / 搭建 / 优化 rather
 * than "Led" / "Built" / "Optimized". Matched as a prefix, because Chinese has no word delimiter
 * and the verb can run straight into its object (搭建了订单系统).
 */
const ACTION_VERB_PREFIXES_CJK = [
	"主导",
	"主推",
	"牵头",
	"负责",
	"带领",
	"组建",
	"搭建",
	"设计",
	"开发",
	"实现",
	"构建",
	"重写",
	"重构",
	"优化",
	"提升",
	"改善",
	"降低",
	"减少",
	"缩短",
	"推动",
	"推进",
	"落地",
	"交付",
	"上线",
	"发布",
	"迁移",
	"整合",
	"统一",
	"沉淀",
	"孵化",
	"制定",
	"规划",
	"管理",
	"协调",
	"组织",
	"培训",
	"指导",
	"支撑",
	"维护",
	"保障",
	"排查",
	"定位",
	"解决",
	"修复",
	"治理",
	"引入",
	"改造",
	"扩展",
	"自动化",
	"标准化",
	"模块化",
	"平台化",
	"输出",
	"编写",
	"撰写",
	"分析",
	"调研",
	"评估",
	"验证",
	"测试",
	"监控",
	"部署",
	"运营",
	"策划",
	"拓展",
	"签约",
	"达成",
	"完成",
];

function isQuantified(text: string): boolean {
	// A bare year is not an achievement metric; a percentage, a currency figure or a real
	// magnitude is. The lookbehinds start each number at its first digit, so a digit run is scanned once.
	if (/(?<!\d)\d+\s*%|[$€£¥]\s*\d|(?<!\d)\d+\s*x\b/i.test(text)) return true;
	return (text.match(/\b\d[\d,.]*\b/g) ?? []).some((value) => {
		const numeric = Number(value.replaceAll(",", ""));
		return Number.isFinite(numeric) && (numeric >= 1000 || (numeric >= 3 && !/^(?:19|20)\d{2}$/.test(value)));
	});
}

function startsWithActionVerb(text: string): boolean {
	const trimmed = text.trim();
	if (ACTION_VERB_PREFIXES_CJK.some((verb) => trimmed.startsWith(verb))) return true;

	const first = trimmed.split(/\s+/)[0];
	if (!first) return false;
	return ACTION_VERBS.has(first.toLowerCase().replace(/[^a-z]/g, ""));
}

function uppercaseHeavy(text: string): boolean {
	const letters = text.match(/\p{L}/gu) ?? [];
	if (letters.length < 12) return false;

	const upper = letters.filter((letter) => letter === letter.toUpperCase() && letter !== letter.toLowerCase()).length;
	return upper / letters.length >= 0.9;
}

/**
 * A role line is the "Senior Engineer — Acme, Berlin" pattern parsers key employment on:
 * two or more proper nouns held together by a separator, on a line of its own.
 */
function isRoleLike(line: TextLine): boolean {
	const text = line.text.trim();
	if (text.length === 0 || text.length > 110 || isBullet(line)) return false;

	// A Chinese role line carries no capitals to count, so it is recognised by its shape instead:
	// "某某科技有限公司 · 高级前端工程师" or "高级前端工程师 | 上海". A date range on the same line is
	// the commonest form of all ("前端开发工程师 2020.03-2024.06").
	if (CJK_ROLE_SEPARATOR.test(text) || CJK_ROLE_WITH_DATES.test(text)) {
		return /[\p{Script=Han}]{2,}/u.test(text);
	}

	if (!/\s(?:[|·–—]|at)\s|,\s/.test(text)) return false;

	const capitalized = (text.match(/\b\p{Lu}[\p{L}&.'-]*/gu) ?? []).length;
	return capitalized >= 2;
}

function singleCharItemRatio(raw: RawExtraction): number {
	let total = 0;
	let single = 0;

	for (const page of raw.pages) {
		for (const item of page.items) {
			const text = item.str.trim();
			if (text.length === 0) continue;
			total += 1;
			if (text.length === 1) single += 1;
		}
	}

	return total === 0 ? 0 : single / total;
}

function findRepeatedRunningHeads(document: ExtractedDocument): string[] {
	if (document.pages.length < 2) return [];

	const perPage = document.pages.map((page) => {
		const topBand = page.height * RUNNING_HEAD_BAND;
		const bottomBand = page.height * (1 - RUNNING_HEAD_BAND);

		return new Set(
			page.lines
				.filter((line) => line.y <= topBand || line.y + line.height >= bottomBand)
				.map((line) => line.text.trim())
				.filter(Boolean)
				// A page number differs on every page; the surrounding boilerplate does not.
				.map((text) => text.replace(/\d+/g, "#")),
		);
	});

	const [first, ...rest] = perPage;
	if (!first) return [];

	return [...first].filter((candidate) => rest.every((page) => page.has(candidate)));
}

function findRepeatedOpenings(bullets: readonly string[]): string[] {
	const counts = new Map<string, number>();

	for (const bullet of bullets) {
		// Chinese has no spaces, so "the first three words" is meaningless there: the opening is the
		// first few characters instead, long enough to be a phrase and short enough to repeat.
		const normalized = bullet.toLowerCase();
		const opening = /[\p{Script=Han}]/u.test(normalized)
			? [...normalized].slice(0, REPEATED_OPENING_CJK_CHARS).join("")
			: normalized.split(/\s+/).slice(0, 3).join(" ");

		if (/[\p{Script=Han}]/u.test(normalized)) {
			if ([...opening].length < REPEATED_OPENING_CJK_CHARS) continue;
		} else if (opening.split(" ").length < 3) {
			continue;
		}

		counts.set(opening, (counts.get(opening) ?? 0) + 1);
	}

	return [...counts.entries()]
		.filter(([, count]) => count >= MIN_REPEATED_OPENING)
		.map(([opening]) => opening)
		.sort();
}

export type SemanticsOptions = {
	now: Date;
};

/** Reads resume meaning off the extracted geometry. Pure, and deterministic given `now`. */
export function buildResumeSemantics(
	raw: RawExtraction,
	document: ExtractedDocument,
	options: SemanticsOptions,
): ResumeSemantics {
	// Dates parse in the document's own declared language.
	const locale = raw.metadata.language || "en-US";

	const headings = detectHeadings(document);
	const contact = analyzeContact(raw, document);
	const dates = analyzeDates(document, locale, options.now);

	const quality = analyzeTextQuality({
		fullText: document.fullText,
		languageTag: raw.metadata.language,
		singleCharItemRatio: singleCharItemRatio(raw),
	});

	const bulletLines = document.lines.filter(isBullet);
	const bullets = bulletLines.map(bulletBody);

	// A Chinese bullet spends its characters on meaning rather than on articles and spaces, so the
	// same threshold in characters would never fire on a bullet a reader would call a paragraph.
	const bulletCharLimit = quality.isChinese ? LONG_BULLET_CHARS_CJK : LONG_BULLET_CHARS;
	const firstPersonMatches = quality.isChinese
		? (document.fullText.match(FIRST_PERSON_CJK) ?? []).length
		: (document.fullText.match(FIRST_PERSON) ?? []).length;

	return {
		headings,
		sectionTypes: sectionTypesOf(headings),
		contact,
		dates: dates.tokens,
		quality,
		bulletLineCount: bulletLines.length,
		roleLikeLineCount: document.lines.filter(isRoleLike).length,
		allCapsLineCount: document.lines.filter((line) => uppercaseHeavy(line.text)).length,
		quantifiedBulletCount: bullets.filter(isQuantified).length,
		actionVerbBulletCount: bullets.filter(startsWithActionVerb).length,
		firstPersonCount: firstPersonMatches,
		longBulletCount: bullets.filter((bullet) => bullet.length > bulletCharLimit).length,
		unparseableRanges: dates.unparseableRanges,
		ambiguousNumericDates: dates.ambiguousNumericDates,
		employmentGapYears: dates.gaps,
		repeatedBulletOpenings: findRepeatedOpenings(bullets),
		repeatedRunningHeads: findRepeatedRunningHeads(document),
	};
}
