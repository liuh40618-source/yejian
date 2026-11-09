import type { Template } from "../templates";
import z from "zod";

/**
 * China's hiring market has two deliverables, not one: the structured online resume a platform
 * sifts first, and the attachment PDF a recruiter opens after contact. The online form is the
 * machine-read one; a decorated PDF does not get parsed by a keyword engine. So the resume keeps
 * one structured master and derives scene-specific outputs from it. See `.agents/docs/` for the
 * research behind this split.
 *
 * This module is data and Zod only. Nothing here imports `ResumeData`, and nothing here renders.
 * `packages/resume/china-market` owns the pure behaviour; the builder owns the UI.
 */

export const chinaMarketSceneSchema = z.enum(["market", "campus", "soe"]);
export type ChinaMarketScene = z.infer<typeof chinaMarketSceneSchema>;

export const chinaMarketPresetSchema = z.enum(["ats", "xhs", "table", "custom"]);
export type ChinaMarketPreset = z.infer<typeof chinaMarketPresetSchema>;

export const chinaMarketPlatformSchema = z.enum(["boss", "zhilian", "job51", "soe"]);
export type ChinaMarketPlatform = z.infer<typeof chinaMarketPlatformSchema>;

/** The four visual switches from the approved prototype, plus the registration-table comparison. */
export const chinaMarketStyleSchema = z.object({
	photo: z.boolean().catch(false),
	centerName: z.boolean().catch(false),
	compactIntent: z.boolean().catch(false),
	softLabels: z.boolean().catch(false),
	registrationTable: z.boolean().catch(false),
});
export type ChinaMarketStyle = z.infer<typeof chinaMarketStyleSchema>;

/**
 * Fields that belong to the structured master but must NOT become first-class PDF fields.
 * Political status, ethnicity, gender and student-cadre history are online-application fields for
 * state-owned enterprises / civil service, not universal resume columns. They stay here and are
 * mapped into platform forms; only the `soe` scene copies a few of them into the PDF header.
 */
export const chinaMarketProfileSchema = z.object({
	wechat: z.string().catch(""),
	gender: z.string().catch(""),
	political: z.string().catch(""),
	nativePlace: z.string().catch(""),
	english: z.string().catch(""),
	cadre: z.string().catch(""),
	major: z.string().catch(""),
	gpa: z.string().catch(""),
	courses: z.string().catch(""),
	intentCity: z.string().catch(""),
	intentSalary: z.string().catch(""),
	arrival: z.string().catch(""),
});
export type ChinaMarketProfile = z.infer<typeof chinaMarketProfileSchema>;

export const chinaMarketSchema = z.object({
	scene: chinaMarketSceneSchema.catch("market"),
	/** A preset is a one-shot write into `style`; `style` itself is the only source of truth. */
	preset: chinaMarketPresetSchema.catch("ats"),
	platform: chinaMarketPlatformSchema.catch("boss"),
	style: chinaMarketStyleSchema,
	profile: chinaMarketProfileSchema,
	/**
	 * The JD this master is being tailored for. It is part of the master, not a transient panel state:
	 * the keyword report and the exported form packet both read it back after a reload. Optional so
	 * resumes saved before this shipped parse unchanged and need no migration.
	 */
	jobDescription: z.string().catch("").optional(),
});
export type ChinaMarket = z.infer<typeof chinaMarketSchema>;

const emptyProfile: ChinaMarketProfile = chinaMarketProfileSchema.parse({});

export const defaultChinaMarket: ChinaMarket = {
	scene: "market",
	preset: "ats",
	platform: "boss",
	style: {
		photo: false,
		centerName: false,
		compactIntent: false,
		softLabels: false,
		registrationTable: false,
	},
	profile: emptyProfile,
};

/**
 * Scenes reorder the SAME master. They never add a self-evaluation section and never make a
 * Western section (references, interests, volunteer work) a default. Education first is a campus
 * convention; state-owned applications keep the attachment single-column even though their form
 * asks for dozens of fields.
 */
export const CHINA_MARKET_SCENES = {
	market: {
		label: "社招 / 市场化",
		description: "量化成果优先，一页 A4、单栏、无照片。默认且推荐的投递场景。",
		template: "general-single",
		photo: false,
		sections: ["summary", "experience", "projects", "education", "skills", "certifications", "awards"],
		fileName: "姓名-应聘岗位-工作年限",
	},
	campus: {
		label: "校招 / 应届",
		description: "教育背景、GPA、核心课程与实习前置；工作经历后置。",
		template: "campus-fresh",
		photo: false,
		sections: ["summary", "education", "experience", "projects", "skills", "awards", "certifications"],
		fileName: "姓名-学校-专业-应聘岗位",
	},
	soe: {
		label: "央国企网申",
		description: "证件照、政治面貌、学生干部与 CET 只用于网申表单；附件仍保持单栏便于解析。",
		template: "gov-formal",
		photo: true,
		sections: ["summary", "education", "experience", "projects", "skills", "awards", "certifications"],
		fileName: "姓名-应聘岗位-政治面貌-学校",
	},
} as const satisfies Record<
	ChinaMarketScene,
	{
		label: string;
		description: string;
		template: Template;
		photo: boolean;
		sections: readonly string[];
		fileName: string;
	}
>;

/**
 * Visual presets. ATS is the safe default. The Xiaohongshu-style preferences are kept as switches
 * that can be turned off; the registration table is a risk-marked comparison, never a default.
 * None of them introduce columns, progress bars, icon fonts or an "自我评价" section.
 */
export const CHINA_MARKET_PRESETS = {
	ats: {
		label: "ATS 极简单栏",
		description: "单栏、宋体、左对齐、纯白底，无表格与图标字体。中文 ATS 解析率最高。",
		risk: false,
	},
	xhs: {
		label: "小红书轻装饰",
		description: "居中姓名、意向压成页眉一行、浅灰纯文本标签与细竖条。仍是单栏纯文本，市场化投递建议关掉。",
		risk: false,
	},
	table: {
		label: "表格式登记 · 风险对照",
		description: "合并单元格与深色标题块会显著降低中文 ATS 解析率；仅用于网申明确要求上传登记表的场景。",
		risk: true,
	},
	custom: {
		label: "自定义组合",
		description: "逐项开关已覆盖预设；打印前确认仍是单栏、无图标字体、无合并单元格。",
		risk: false,
	},
} as const satisfies Record<ChinaMarketPreset, { label: string; description: string; risk: boolean }>;

/** Port of the prototype's `presetOptions`: a preset writes switches once, it does not own them. */
export const resolveChinaMarketStyle = (preset: ChinaMarketPreset, scene: ChinaMarketScene): ChinaMarketStyle => {
	if (preset === "xhs")
		return { photo: true, centerName: true, compactIntent: true, softLabels: true, registrationTable: false };
	if (preset === "table")
		return { photo: true, centerName: true, compactIntent: false, softLabels: false, registrationTable: true };
	return {
		photo: CHINA_MARKET_SCENES[scene].photo,
		centerName: false,
		compactIntent: false,
		softLabels: false,
		registrationTable: false,
	};
};

export type ChinaMarketFieldKey =
	| "name"
	| "phone"
	| "email"
	| "wechat"
	| "city"
	| "headline"
	| "intent"
	| "intentCity"
	| "education"
	| "experience"
	| "projects"
	| "skills"
	| "certifications"
	| "awards"
	| "workYears"
	| "gender"
	| "political"
	| "nativePlace"
	| "english"
	| "cadre"
	| "major"
	| "gpa"
	| "courses"
	| "salary"
	| "arrival";

export type ChinaMarketRowStatus = "auto" | "manual" | "na";

export type ChinaMarketPlatformRow = {
	/** The master field this row comes from. */
	master: string;
	/** The label the platform's form uses. */
	field: string;
	/** auto = filled from the master; manual = the form demands a field we deliberately don't store; na = skip. */
	status: ChinaMarketRowStatus;
	/** Which master field resolves the value. Absent for manual/na rows. */
	source?: ChinaMarketFieldKey | undefined;
	/** Why a row needs a human, or why it is skipped. */
	note?: string | undefined;
};

export const CHINA_MARKET_PLATFORMS = {
	boss: {
		label: "BOSS直聘",
		note: "市场化平台字段最轻，重期望职位、经历量化与技能标签。微信不进表单，出生年月也不采集。",
		rows: [
			{ master: "姓名", field: "姓名", status: "auto", source: "name" },
			{ master: "手机", field: "手机号码", status: "auto", source: "phone" },
			{ master: "邮箱", field: "邮箱", status: "auto", source: "email" },
			{ master: "微信", field: "—", status: "na", note: "平台不收，改用内置沟通" },
			{ master: "现居城市", field: "现居城市", status: "auto", source: "city" },
			{ master: "期望岗位", field: "期望职位", status: "auto", source: "headline" },
			{ master: "期望城市", field: "期望工作地", status: "auto", source: "intentCity" },
			{ master: "期望薪资", field: "期望薪资", status: "auto", source: "salary" },
			{ master: "到岗时间", field: "当前状态 / 到岗", status: "auto", source: "arrival" },
			{ master: "教育背景", field: "最高学历 · 院校 · 专业", status: "auto", source: "education" },
			{ master: "工作经历", field: "工作经历（含工作内容）", status: "auto", source: "experience" },
			{ master: "项目经历", field: "项目经验", status: "auto", source: "projects" },
			{ master: "技能证书", field: "技能标签", status: "auto", source: "skills" },
			{ master: "工作年限", field: "工作年限", status: "auto", source: "workYears" },
			{ master: "出生年月", field: "年龄", status: "manual", note: "主档不采集年龄，按平台要求手填" },
			{ master: "个人优势", field: "个人优势（300 字内）", status: "manual", note: "按 JD 改写，不写自我评价空话" },
		],
	},
	zhilian: {
		label: "智联招聘",
		note: "老牌平台字段最全，仍保留民族、婚姻、户籍与自我评价。主档里存了性别、籍贯、政治面貌，这里可直接填 —— 一份主档多处复用。",
		rows: [
			{ master: "姓名", field: "姓名", status: "auto", source: "name" },
			{ master: "性别", field: "性别", status: "auto", source: "gender" },
			{ master: "籍贯", field: "户籍所在地", status: "auto", source: "nativePlace" },
			{ master: "政治面貌", field: "政治面貌", status: "auto", source: "political" },
			{ master: "手机 / 邮箱", field: "联系电话 · 电子邮箱", status: "auto", source: "email" },
			{ master: "现居城市", field: "现居住地", status: "auto", source: "city" },
			{ master: "教育背景", field: "最高学历 · 毕业院校 · 专业", status: "auto", source: "education" },
			{ master: "英语", field: "语言能力 / 外语等级", status: "auto", source: "english" },
			{ master: "求职意向", field: "求职意向（职位·地点·薪资·到岗）", status: "auto", source: "intent" },
			{ master: "工作经历", field: "工作经历", status: "auto", source: "experience" },
			{ master: "项目经历", field: "项目经验", status: "auto", source: "projects" },
			{ master: "技能证书", field: "专业技能 · 证书", status: "auto", source: "certifications" },
			{ master: "荣誉", field: "在校 / 在职奖励", status: "auto", source: "awards" },
			{ master: "民族", field: "民族", status: "manual", note: "主档刻意不采集，网申时才需要" },
			{ master: "婚姻状况", field: "婚姻状况", status: "manual", note: "主档刻意不采集，平台仍要求" },
			{ master: "自我评价", field: "自我评价", status: "manual", note: "HR 初筛权重低；若必填，贴 3 条量化成果" },
		],
	},
	job51: {
		label: "前程无忧",
		note: "字段与智联接近，多到岗时间、期望薪资与兴趣爱好。兴趣爱好属欧美简历遗留，主档不收，也不建议硬凑。",
		rows: [
			{ master: "姓名", field: "姓名", status: "auto", source: "name" },
			{ master: "手机 / 邮箱", field: "联系电话 · 电子邮箱", status: "auto", source: "email" },
			{ master: "现居城市", field: "现居住地", status: "auto", source: "city" },
			{ master: "求职意向", field: "期望职位 · 工作地点", status: "auto", source: "intent" },
			{ master: "期望薪资", field: "期望月薪", status: "auto", source: "salary" },
			{ master: "到岗时间", field: "到岗时间", status: "auto", source: "arrival" },
			{ master: "教育背景", field: "学历 · 学校 · 专业 · 时间", status: "auto", source: "education" },
			{ master: "英语", field: "外语水平", status: "auto", source: "english" },
			{ master: "工作经历", field: "工作经验", status: "auto", source: "experience" },
			{ master: "项目经历", field: "项目经验", status: "auto", source: "projects" },
			{ master: "技能证书", field: "专业技能 · 职业证书", status: "auto", source: "certifications" },
			{ master: "性别", field: "性别", status: "auto", source: "gender" },
			{ master: "出生日期", field: "出生日期", status: "manual", note: "主档不采集，手填" },
			{ master: "兴趣爱好", field: "兴趣爱好", status: "na", note: "主档不收，且 HR 初筛权重极低" },
		],
	},
	soe: {
		label: "央国企网申",
		note: "网申系统最严：专业全称须与学信网登记一致，否则机筛拦截；党员身份、学生干部、CET 分数是显式筛选项。附件 PDF 只是上传件之一，字段才决定过不过机筛。",
		rows: [
			{ master: "姓名", field: "姓名", status: "auto", source: "name" },
			{ master: "性别", field: "性别", status: "auto", source: "gender" },
			{ master: "籍贯", field: "籍贯 / 生源地", status: "auto", source: "nativePlace" },
			{ master: "政治面貌", field: "政治面貌", status: "auto", source: "political" },
			{ master: "手机 / 邮箱", field: "联系电话 · 电子邮箱", status: "auto", source: "email" },
			{ master: "教育背景", field: "毕业院校 · 所学专业", status: "auto", source: "major" },
			{ master: "成绩", field: "GPA / 专业排名", status: "auto", source: "gpa" },
			{ master: "英语", field: "CET 等级及分数", status: "auto", source: "english" },
			{ master: "核心课程", field: "主修课程", status: "auto", source: "courses" },
			{ master: "学生干部", field: "学生工作 / 社会职务", status: "auto", source: "cadre" },
			{ master: "实习经历", field: "实习实践经历", status: "auto", source: "experience" },
			{ master: "荣誉", field: "奖惩情况", status: "auto", source: "awards" },
			{ master: "附件简历", field: "上传附件", status: "auto", source: "headline" },
			{ master: "民族", field: "民族", status: "manual", note: "网申必填，主档不采集" },
			{ master: "出生年月", field: "出生年月", status: "manual", note: "网申必填，主档不采集" },
			{ master: "身份证号", field: "证件类型 / 证件号码", status: "manual", note: "敏感字段，不进主档，现场手填" },
			{ master: "学位", field: "学历学位", status: "manual", note: "主档只有学历，需补「学士」" },
			{ master: "家庭主要成员", field: "家庭主要成员", status: "manual", note: "部分单位要求，按系统提示手填" },
		],
	},
} as const satisfies Record<
	ChinaMarketPlatform,
	{ label: string; note: string; rows: readonly ChinaMarketPlatformRow[] }
>;

/** Chinese ATS scores JD keyword consistency and quantified outcomes, not prose adjectives. */
export const CHINA_MARKET_KEYWORDS = [
	"设计系统",
	"用户研究",
	"A/B 测试",
	"数据分析",
	"团队管理",
	"Figma",
	"B 端",
	"本科",
	"跨部门协作",
	"可用性测试",
] as const;

export const CHINA_MARKET_REWRITES: Readonly<Record<string, string>> = {
	设计系统: "搭建被 6 个产品团队共用的设计系统，组件复用率 32% → 78%，UI 评审耗时缩短 40%。",
	用户研究: "主导 12 场用户研究与深访，输出结论驱动新用户引导改版，激活率 31% → 44%。",
	"A/B 测试": "分 3 组 A/B 验证引导路径，激活率 +13pp，方案沿用至今。",
	数据分析: "基于 SQL 与行为数据定位漏斗流失点，重构后任务完成时长下降 26%。",
	团队管理: "带 4 人设计小组交付 3 条 B 端产品线，需求按期交付率 96%。",
	Figma: "以 Figma 建立组件库与规范，沉淀 148 个组件、22 条设计规范。",
	"B 端": "负责 3 条 B 端产品线的商家后台与权限体系设计，覆盖 6 个产品团队。",
	本科: "同济大学 工业设计 本科（2013.09 – 2017.06），GPA 3.7 / 4.0。",
	跨部门协作: "与产品、研发、客服 3 个部门协作推进重构，客服相关工单减少 18%。",
	可用性测试: "组织可用性测试并输出 WCAG 2.1 AA 无障碍规范，覆盖 Web 与移动端。",
};

/** Deliberate non-goals. Kept in code so the UI can show them instead of growing the schema. */
export const CHINA_MARKET_EXCLUSIONS: readonly { title: string; reason: string }[] = [
	{ title: "不把「自我评价」做成一等字段", reason: "HR 初筛权重低，多为形容词空话；改为量化成果与 JD 关键词对齐。" },
	{ title: "不默认展示证明人 / 兴趣爱好 / 志愿服务", reason: "欧美简历遗留章节，中文招聘几乎不读。" },
	{ title: "不默认 LinkedIn / +1 电话", reason: "领英职场已于 2023-08-09 停服；改用手机号、微信、邮箱与现居城市。" },
	{ title: "不全局采集政治面貌 / 民族 / 婚姻", reason: "属于央国企网申与公务员报名的场景字段，只在表单映射时出现。" },
	{
		title: "不把表格式登记表做成通用模板",
		reason: "合并单元格与深色标题块降低中文 ATS 解析率，只作带风险标注的对照预设。",
	},
	{ title: "不引入分栏 / 进度条 / 图标字体", reason: "破坏单栏阅读顺序，关键词引擎易漏读。" },
];

/**
 * Copy for the platform-form hand-off actions. Both the web and mobile panes read these instead of
 * each owning a translation, so the wording — and the boundary it states — can never drift between
 * them: 页见 exports fields, it never fills or submits a platform form.
 */
export const CHINA_MARKET_HANDOFF_COPY = {
	title: "平台表单交接",
	// "导出" works on both clients: web downloads a file, mobile opens the system share sheet.
	downloadJsonLabel: "导出字段 JSON",
	downloadTextLabel: "导出字段文本",
	copyLabel: "复制全部字段",
	jsonHint: "结构化字段包：含平台表单字段名、主档映射值与 fillPlanFields，供人工核对或已验证的辅助工具读取。",
	textHint: "按「可直接粘贴 / 需补齐 / 需人工」分段的纯文本，逐项贴进平台表单。",
	disclaimer: "页见只导出字段，不自动填写、不提交任何平台表单。",
	jdSavedHint: "JD 随简历主档保存，刷新后不会丢失，导出字段包时一并带上。",
	copyFailed: "无法复制到剪贴板，请重试。",
	copied: "字段已复制",
	exportFailed: "无法导出字段文件，请重试。",
} as const;

/** What changed relative to the upstream Western sample. Shown as a comparison in the builder. */
export const CHINA_MARKET_DIFF: readonly [string, string, string][] = [
	["样例人物", "David Kowalski · Seattle, WA", "陈嘉宁 · 上海"],
	["联系方式", "+1 (555) · LinkedIn · itch.io", "手机号 · 微信 · 邮箱 · 现居城市"],
	["教育字段", "University of Washington · 3.6 GPA", "同济大学 · GPA 3.7 · CET-6 · 核心课程"],
	[
		"默认章节",
		"summary → profiles → experience → … → references",
		"求职意向 → 经历 → 项目 → 教育 → 技能（按场景重排）",
	],
	["文档语言", "en-US · IBM Plex Serif · short 日期", "zh-CN · 思源宋体 · 中文日期"],
	["导出命名", "David-Kowalski-简历.pdf", "姓名-应聘岗位-工作年限.pdf"],
	["ATS 检查", "识别中文简历文本", "按 JD 对齐关键词 + 量化成果提示"],
];
