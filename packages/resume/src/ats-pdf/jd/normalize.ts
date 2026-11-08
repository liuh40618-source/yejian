/**
 * Folds the cosmetic differences between a pasted job description and a PDF's extracted text:
 * compatibility characters, smart quotes, ligatures, the several dashes that all mean "-", and the
 * full-width punctuation mainland Chinese text is typed with.
 */

// Folded to the ASCII character with the same meaning. A full-width comma then breaks a token in
// the tokenizer exactly as its ASCII twin does, so a posting pasted from a Chinese site behaves
// like one typed on a US keyboard.
const FULL_WIDTH_PUNCTUATION: Readonly<Record<string, string>> = {
	"，": ",",
	"。": ".",
	"、": ",",
	"；": ";",
	"：": ":",
	"！": "!",
	"？": "?",
	"（": "(",
	"）": ")",
	"《": '"',
	"》": '"',
	"“": '"',
	"”": '"',
	"‘": "'",
	"’": "'",
	"【": "[",
	"】": "]",
	"「": '"',
	"」": '"',
	"『": '"',
	"』": '"',
	"　": " ",
};

const FULL_WIDTH_PATTERN = new RegExp(`[${Object.keys(FULL_WIDTH_PUNCTUATION).join("")}]`, "g");

/**
 * Chinese compounds the dictionary segmenter keeps splitting.
 *
 * `Intl.Segmenter("zh")` is good but not technical: it reads "微服务" as 微 / 服务 and "云原生" as
 * 云 / 原生, and neither half is the term a resume and a posting both name. Each entry here is a
 * whole word a recruiter would search on, listed once and merged back after segmentation.
 */
export const CJK_COMPOUNDS: readonly string[] = [
	"微服务",
	"云原生",
	"大数据",
	"链路",
	"并发",
	"缓存",
	"灰度",
	"容灾",
	"限流",
	"熔断",
	"降级",
	"埋点",
	"日志",
	"监控告警",
	"机器学习",
	"深度学习",
	"人工智能",
	"自然语言处理",
	"计算机视觉",
	"大模型",
	"大语言模型",
	"检索增强生成",
	"提示词工程",
	"智能体",
	"向量数据库",
	"知识图谱",
	"推荐系统",
	"搜索引擎",
	"消息队列",
	"负载均衡",
	"容器编排",
	"服务网格",
	"分布式系统",
	"高并发",
	"高可用",
	"性能优化",
	"架构设计",
	"技术架构",
	"数据库设计",
	"数据仓库",
	"数据挖掘",
	"数据分析",
	"数据可视化",
	"持续集成",
	"持续交付",
	"自动化测试",
	"单元测试",
	"接口文档",
	"产品经理",
	"产品设计",
	"用户研究",
	"交互设计",
	"视觉设计",
	"项目管理",
	"敏捷开发",
	"需求分析",
	"业务流程",
	"信息安全",
	"网络安全",
	"渗透测试",
	"运营活动",
	"市场营销",
	"供应链",
	"人力资源",
];

// Longest first, so a greedy merge prefers the more specific term.
const COMPOUNDS_BY_LENGTH = [...CJK_COMPOUNDS].sort((a, b) => b.length - a.length);
/** No compound is longer than this, so a candidate past it can stop growing. */
const LONGEST_COMPOUND = COMPOUNDS_BY_LENGTH.reduce((longest, compound) => Math.max(longest, compound.length), 0);

/**
 * Verbs a dictionary segmenter will happily weld onto the noun before or after them.
 *
 * `Intl.Segmenter` returns "产品经理完成" as one word: it has no idea that 完成 is a verb and 产品经理 its
 * subject. Splitting on these gives a coverage report that asks about 需求分析 rather than about
 * "完成需求分析", which no resume would ever contain.
 */
const CJK_VERBS: readonly string[] = [
	"完成",
	"负责",
	"参与",
	"配合",
	"协助",
	"支持",
	"推动",
	"实现",
	"掌握",
	"具备",
	"具有",
	"熟悉",
	"了解",
	"精通",
	"熟练",
	"使用",
	"具备",
	"提供",
	"包括",
	"涵盖",
	"涉及",
	"需要",
	"要求",
	"能够",
	"可以",
	"善于",
	"乐于",
	"优先",
	"加分",
	"欢迎",
	"期待",
	"加入",
];

// Longest first: "熟悉" must be tried before "熟".
const VERBS_BY_LENGTH = [...new Set(CJK_VERBS)].sort((a, b) => b.length - a.length);

/**
 * Splits a segment the dictionary welded across a verb.
 *
 * Only used where the verb sits *inside* a longer segment — a segment that is exactly a verb is
 * left alone, because the stopword list already removes it.
 */
function splitOnVerb(text: string): string[] {
	if (VERBS_BY_LENGTH.includes(text)) return [text];

	for (const verb of VERBS_BY_LENGTH) {
		const at = text.indexOf(verb);
		if (at <= 0) continue;

		const head = text.slice(0, at);
		const tail = text.slice(at + verb.length);

		// "微服务" contains no verb; "产品经理完成" splits into 产品经理 / 完成 / "".
		return [...splitOnVerb(head), verb, ...(tail ? splitOnVerb(tail) : [])];
	}

	return [text];
}

/**
 * Rejoins dictionary-broken compounds in a run of already-segmented Chinese words.
 *
 * A compound can span more than two dictionary words ("自然语言处理" arrives as 自然 / 语言 / 处理),
 * so each position tries the longest compound that the following words spell out, rather than
 * only looking at the immediate neighbour.
 */
export function mergeCjkCompounds<T extends { text: string; isWordLike: boolean }>(segments: T[]): T[] {
	const merged: T[] = [];
	let index = 0;

	while (index < segments.length) {
		const start = segments[index];
		if (!start?.isWordLike) {
			merged.push(start as T);
			index += 1;
			continue;
		}

		let matched: { length: number; text: string } | null = null;
		let candidate = "";

		for (let span = index; span < segments.length; span += 1) {
			const piece = segments[span];
			if (!piece?.isWordLike) break;
			candidate += piece.text;
			if (candidate.length > LONGEST_COMPOUND) break;
			if (COMPOUNDS_BY_LENGTH.includes(candidate)) {
				matched = { length: span - index + 1, text: candidate };
				break;
			}
		}

		if (matched) {
			merged.push({ ...start, text: matched.text });
			index += matched.length;
			continue;
		}

		merged.push(start);
		index += 1;
	}

	return merged;
}

/**
 * Splits words the dictionary welded across a verb.
 *
 * Runs after {@link mergeCjkCompounds}: the compound pass wants the longest run first ("自然语言处理"),
 * and only then does a leftover "产品经理完成" get taken apart into its subject and its verb.
 */
export function splitCjkVerbs<T extends { text: string; isWordLike: boolean }>(segments: T[]): T[] {
	const result: T[] = [];

	for (const segment of segments) {
		if (!segment.isWordLike || !/^\p{Script=Han}+$/u.test(segment.text)) {
			result.push(segment);
			continue;
		}

		for (const piece of splitOnVerb(segment.text)) {
			result.push({ ...segment, text: piece });
		}
	}

	return result;
}

export function normalizeForMatching(value: string): string {
	let folded = value.normalize("NFKC");

	for (const [fullWidth, ascii] of Object.entries(FULL_WIDTH_PUNCTUATION)) {
		folded = folded.replaceAll(fullWidth, ascii);
	}

	return folded
		.replaceAll("’", "'")
		.replaceAll("‘", "'")
		.replaceAll("“", '"')
		.replaceAll("”", '"')
		.replace(/[\u2010-\u2015\u2212]/g, "-")
		.replace(/[\u00a0\u2007\u202f]/g, " ")
		.toLowerCase();
}

/** Matches full-width punctuation before folding, for callers that need the punctuation shape. */
export function hasFullWidthPunctuation(value: string): boolean {
	return FULL_WIDTH_PATTERN.test(value);
}
