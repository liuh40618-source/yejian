import type { ResumeData } from "./data";
import { defaultChinaMarket } from "./china-market";
import { sectionDefaults } from "./default";

/**
 * The sample "Try a sample" actually ships to users. It is deliberately not a translation of an
 * English CV: contact fields are Chinese-market ones (手机号 / 微信 / 邮箱 / 现居城市), the
 * experience bullets are quantified outcomes rather than adjectives, and Western sections
 * (references, interests, volunteer work) are hidden instead of shown by default.
 *
 * Dates keep Chinese display text in `dates.raw` alongside a machine-readable `start`/`end`, so
 * the ATS linter and platform form mapping can read them without rewriting what gets printed.
 */
const website = (url = "", label = "") => ({ url, label, inlineLink: false });

const period = (raw: string, start: string, end: string | null = null, present = false) => ({
	period: raw,
	dates: { start, end, present, raw },
});

const date = (raw: string, start: string) => ({ date: raw, dates: { start, end: null, present: false, raw } });

/** One page's worth of reading order: single column, no sidebar, no photo. */
const CHINA_MARKET_MAIN = [
	"summary",
	"experience",
	"019becaf-0b87-769d-98a6-46ccf558c0e8",
	"projects",
	"education",
	"skills",
	"certifications",
	"awards",
	"languages",
] as const;

export const chinaSampleResumeData: ResumeData = {
	picture: {
		hidden: true,
		fit: "cover",
		url: "/photos/sample-picture.jpg",
		size: 100,
		rotation: 0,
		aspectRatio: 1,
		borderRadius: 0,
		borderColor: "rgba(0, 0, 0, 0.5)",
		borderWidth: 0,
		shadowColor: "rgba(0, 0, 0, 0.5)",
		shadowWidth: 0,
	},
	basics: {
		name: "陈嘉宁",
		headline: "高级产品设计师",
		email: "chen.jianing@example.com",
		phone: "138 0000 0000",
		location: "上海",
		website: website("https://jianing.design", "jianing.design"),
		customFields: [{ id: "china-market-微信", icon: "", text: "微信：jianing_design", link: "" }],
	},
	summary: {
		...sectionDefaults("article"),
		content:
			"<p>求职意向：高级产品设计师 · 上海 · 25–30K / 月 · 一个月内到岗。5 年 B 端产品设计经验，负责 3 条产品线的商家后台与权限体系；搭建被 6 个产品团队共用的设计系统，组件复用率 32% → 78%；主导 12 场用户研究，新用户激活率 31% → 44%。</p>",
	},
	sections: {
		// Social profiles are not a Chinese-market contact convention. The portfolio lives in
		// `basics.website`; this section stays hidden so it never prints on the default attachment.
		profiles: {
			...sectionDefaults("messenger-logo"),
			hidden: true,
			items: [
				{
					id: "019bef5a-93e4-7746-ad39-3d42ddc9b4d8",
					hidden: false,
					icon: "",
					iconColor: "",
					network: "作品集",
					username: "jianing.design",
					website: website("https://jianing.design", "jianing.design"),
				},
			],
		},
		experience: {
			...sectionDefaults("briefcase"),
			items: [
				{
					id: "019bef5a-93e4-7746-ad39-44d8cec98ca4",
					hidden: false,
					company: "云图科技",
					position: "产品设计负责人",
					location: "上海",
					...period("2021.06 - 至今", "2021-06", null, true),
					website: website(),
					roles: [],
					description:
						"<ul><li>搭建被 6 个产品团队共用的设计系统，沉淀 148 个组件与 22 条设计规范，组件复用率 32% → 78%，UI 评审耗时缩短 40%。</li><li>负责 3 条 B 端产品线的商家后台与权限体系重构，与产品、研发、客服跨部门协作推进，客服相关工单减少 18%。</li><li>主导 12 场用户研究与深访，输出结论驱动新用户引导改版，激活率 31% → 44%。</li><li>分 3 组 A/B 测试验证引导路径，激活率再提升 13pp，方案沿用至今。</li><li>带 4 人设计小组交付 3 条产品线，需求按期交付率 96%。</li></ul>",
				},
			],
		},
		education: {
			...sectionDefaults("graduation-cap"),
			items: [
				{
					id: "019bef5a-93e4-7746-ad39-48455f6cef9e",
					hidden: false,
					school: "同济大学",
					degree: "本科",
					area: "工业设计",
					grade: "GPA 3.7 / 4.0",
					location: "上海",
					...period("2013.09 - 2017.06", "2013-09", "2017-06"),
					website: website(),
					description:
						"<p>设计创意学院 · 工业设计（本科），专业全称与学信网登记一致；核心课程：用户研究、交互设计、设计心理学；CET-6 580 分；GPA 3.7 / 4.0（专业前 10%）。</p>",
				},
			],
		},
		projects: {
			...sectionDefaults("code-simple"),
			items: [
				{
					id: "019bef5a-93e4-7746-ad39-4d2603fe2801",
					hidden: false,
					name: "商家后台重构",
					...period("2022.01 - 2022.09", "2022-01", "2022-09"),
					website: website(),
					description:
						"<p>组织 8 场可用性测试，基于 SQL 与行为数据定位漏斗流失点；重构后任务完成时长下降 26%，客服相关工单减少 18%。</p>",
				},
				{
					id: "019bef5a-93e4-7746-ad39-524195dd7eff",
					hidden: false,
					name: "设计系统 2.0",
					...period("2023.03 - 2023.12", "2023-03", "2023-12"),
					website: website(),
					description:
						"<p>以 Figma 建立组件库与规范，覆盖 6 个产品团队、3 条 B 端产品线；组件复用率由 32% 提升至 78%，评审耗时缩短 40%。</p>",
				},
				{
					id: "019bef5a-93e4-7746-ad39-549106273c73",
					hidden: false,
					name: "新用户引导改版",
					...period("2024.02 - 2024.08", "2024-02", "2024-08"),
					website: website(),
					description:
						"<p>主导 12 场用户研究并分 3 组做 A/B 测试，激活率 31% → 44%；方案沿用至今，形成 22 条设计规范。</p>",
				},
			],
		},
		skills: {
			...sectionDefaults("compass-tool"),
			layout: "default",
			keywordLayout: "inline",
			items: [
				{
					id: "019bef5a-93e4-7746-ad39-5a52dcf50ed4",
					hidden: false,
					icon: "",
					iconColor: "",
					name: "设计工具",
					proficiency: "",
					level: 0,
					keywords: ["Figma", "设计系统", "组件库"],
				},
				{
					id: "019bef5a-93e4-7746-ad39-5e8bb7cacbc8",
					hidden: false,
					icon: "",
					iconColor: "",
					name: "研究方法",
					proficiency: "",
					level: 0,
					keywords: ["用户研究", "可用性测试", "A/B 测试"],
				},
				{
					id: "019bef5a-93e4-7746-ad39-622f9d41da55",
					hidden: false,
					icon: "",
					iconColor: "",
					name: "业务与数据",
					proficiency: "",
					level: 0,
					keywords: ["B 端", "数据分析", "SQL"],
				},
				{
					id: "019bef5a-93e4-7746-ad39-6574ab6814bd",
					hidden: false,
					icon: "",
					iconColor: "",
					name: "协作与交付",
					proficiency: "",
					level: 0,
					keywords: ["跨部门协作", "团队管理"],
				},
				{
					id: "019bef5a-93e4-7746-ad39-6a8e22bec684",
					hidden: true,
					icon: "",
					iconColor: "",
					name: "语言",
					proficiency: "",
					level: 0,
					keywords: ["中文（母语）", "英语 CET-6"],
				},
			],
		},
		languages: {
			...sectionDefaults("translate"),
			items: [
				{ id: "019bef5a-93e4-7746-ad39-73807ccc48b5", hidden: false, language: "中文", fluency: "母语", level: 5 },
				{
					id: "019bef5a-93e4-7746-ad39-768670459358",
					hidden: false,
					language: "英语",
					fluency: "CET-6 · 580 分",
					level: 4,
				},
			],
		},
		// Western leftovers. Kept as empty, hidden sections so existing documents still round-trip,
		// but never printed and never offered as a default column.
		interests: { ...sectionDefaults("football"), hidden: true, items: [] },
		awards: {
			...sectionDefaults("trophy"),
			items: [
				{
					id: "019bef5a-93e4-7746-ad39-8a8bb9fbe182",
					hidden: false,
					title: "年度设计贡献奖",
					awarder: "云图科技",
					...date("2023.12", "2023-12"),
					website: website(),
					description: "<p>设计系统覆盖 6 个产品团队，组件复用率提升 46pp。</p>",
				},
				{
					id: "019bef5a-93e4-7746-ad39-8dd81379c7c9",
					hidden: false,
					title: "校级优秀毕业设计",
					awarder: "同济大学",
					...date("2017.06", "2017-06"),
					website: website(),
					description: "<p>《面向 B 端后台的组件化设计方法》，专业前 10%。</p>",
				},
			],
		},
		certifications: {
			...sectionDefaults("certificate"),
			items: [
				{
					id: "019bef5a-93e4-7746-ad39-91fe8a4dfea6",
					hidden: false,
					title: "大学英语六级（CET-6）580 分",
					issuer: "全国大学英语四、六级考试委员会",
					...date("2016.06", "2016-06"),
					website: website(),
					description: "",
				},
				{
					id: "019bef5a-93e4-7746-ad39-961afccc2508",
					hidden: false,
					title: "用户体验设计师（UXD）认证",
					issuer: "中国工业设计协会",
					...date("2022.05", "2022-05"),
					website: website(),
					description: "",
				},
			],
		},
		publications: { ...sectionDefaults("books"), hidden: true, items: [] },
		volunteer: { ...sectionDefaults("hand-heart"), hidden: true, items: [] },
		references: {
			...sectionDefaults("phone"),
			hidden: true,
			items: [
				{
					id: "019bef5a-93e4-7746-ad39-a945c0f42dd5",
					hidden: false,
					name: "",
					position: "",
					website: website(),
					phone: "",
					description: "",
				},
			],
		},
	},
	customSections: [
		{
			...sectionDefaults("briefcase"),
			title: "早期经历",
			id: "019becaf-0b87-769d-98a6-46ccf558c0e8",
			type: "experience",
			items: [
				{
					id: "019bef5a-d1fa-7289-a87c-2677688d9e75",
					hidden: false,
					company: "合川信息",
					position: "产品设计师",
					location: "上海",
					...period("2019.04 - 2021.05", "2019-04", "2021-05"),
					website: website(),
					roles: [],
					description:
						"<ul><li>负责商家后台订单与结算模块设计，联合 3 个部门梳理 42 条业务流程。</li><li>以数据分析定位对账差错来源，重构后人工核对时长下降 35%。</li></ul>",
				},
				{
					id: "019bef5a-db0e-73c6-9b6e-4471703864f1",
					hidden: false,
					company: "微光设计",
					position: "交互设计实习生",
					location: "杭州",
					...period("2017.07 - 2019.03", "2017-07", "2019-03"),
					website: website(),
					roles: [],
					description:
						"<ul><li>参与 2 个 B 端产品的交互设计，完成 30 场可用性测试并输出改版清单。</li><li>整理首版组件库 62 个组件，被 4 个产品团队复用。</li></ul>",
				},
			],
		},
	],
	metadata: {
		template: "general-single",
		layout: {
			sidebarWidth: 30,
			pages: [{ fullWidth: true, main: [...CHINA_MARKET_MAIN], sidebar: [] }],
		},
		page: {
			gapX: 8,
			gapY: 8,
			marginX: 16,
			marginY: 14,
			format: "a4",
			locale: "zh-CN",
			dateFormat: "iso",
			hideLinkUnderline: false,
			hideIcons: true,
			hideSectionIcons: true,
		},
		design: {
			level: { icon: "star", type: "hidden" },
			colors: {
				primary: "rgba(0, 0, 0, 1)",
				text: "rgba(0, 0, 0, 1)",
				background: "rgba(255, 255, 255, 1)",
			},
			entry: { layout: "stacked", lead: "organization", accent: "none" },
		},
		typography: {
			body: { fontFamily: "Noto Serif SC", fontWeights: ["400", "600"], fontSize: 10, lineHeight: 1.5 },
			heading: { fontFamily: "Noto Sans SC", fontWeights: ["600"], fontSize: 12, lineHeight: 1.5 },
		},
		notes: "",
		styleRules: [],
		chinaMarket: {
			...defaultChinaMarket,
			profile: {
				...defaultChinaMarket.profile,
				wechat: "jianing_design",
				english: "CET-6 · 580 分",
				major: "设计创意学院 · 工业设计（本科）",
				gpa: "GPA 3.7 / 4.0（专业前 10%）",
				courses: "用户研究、交互设计、设计心理学",
				intentCity: "上海",
				intentSalary: "25–30K / 月",
				arrival: "一个月内",
			},
		},
	},
};

/**
 * Returns the sample resume, optionally overriding `basics.name` so the seeded
 * content reflects the name the user entered when creating the resume. When no
 * name is given, the default sample persona is returned unchanged.
 */
export const createChinaSampleResumeData = (name?: string): ResumeData => {
	const trimmed = name?.trim();
	if (!trimmed) return chinaSampleResumeData;

	return { ...chinaSampleResumeData, basics: { ...chinaSampleResumeData.basics, name: trimmed } };
};
