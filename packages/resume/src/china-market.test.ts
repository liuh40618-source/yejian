import type { ResumeData } from "@reactive-resume/schema/resume/data";
import { describe, expect, it } from "vite-plus/test";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";
import {
	analyzeChinaMarketJob,
	applyChinaMarketPreset,
	applyChinaMarketScene,
	chinaMarketFileName,
	chinaMarketFillPlan,
	chinaMarketFormFileName,
	chinaMarketFormJson,
	chinaMarketFormPacket,
	chinaMarketFormText,
	chinaMarketIsRisky,
	chinaMarketJobDescription,
	chinaMarketOf,
	mapChinaMarketPlatform,
	setChinaMarketJobDescription,
	setChinaMarketProfile,
	setChinaMarketStyle,
} from "./china-market";

const master = (): ResumeData => {
	const data = structuredClone(defaultResumeData);
	data.basics = {
		name: "陈嘉宁",
		headline: "高级产品设计师",
		email: "chen@example.com",
		phone: "138 0000 0000",
		location: "上海",
		website: { url: "", label: "" },
		customFields: [],
	};
	data.summary.title = "求职意向";
	data.summary.content = "<p>期望岗位：高级产品设计师；期望城市：上海。</p>";
	data.sections.education.items = [
		{
			id: "edu-1",
			hidden: false,
			school: "同济大学",
			degree: "本科",
			area: "工业设计",
			grade: "GPA 3.7 / 4.0",
			location: "上海",
			period: "2013.09 - 2017.06",
			website: { url: "", label: "", inlineLink: false },
			description: "",
		},
	];
	data.sections.experience.items = [
		{
			id: "exp-1",
			hidden: false,
			company: "云图科技",
			position: "产品设计负责人",
			location: "上海",
			period: "2021.06 - 至今",
			website: { url: "", label: "", inlineLink: false },
			description: "<p>搭建设计系统，组件复用率 32% → 78%；主导 12 场用户研究，激活率 31% → 44%。</p>",
			roles: [],
		},
	];
	data.sections.projects.items = [
		{
			id: "proj-1",
			hidden: false,
			name: "商家后台重构",
			period: "2022.01 - 2022.09",
			website: { url: "", label: "", inlineLink: false },
			description: "<p>组织可用性测试，任务完成时长下降 26%。</p>",
		},
	];
	data.sections.skills.items = [
		{
			id: "skill-1",
			hidden: false,
			icon: "",
			iconColor: "",
			name: "Figma",
			proficiency: "",
			level: 0,
			keywords: ["设计系统", "用户研究"],
		},
	];
	return setChinaMarketProfile(data, {
		wechat: "jianiing",
		political: "中共党员",
		gender: "女",
		nativePlace: "江苏南京",
		english: "CET-6 · 580 分",
		major: "设计创意学院 · 工业设计（本科）",
		gpa: "GPA 3.7 / 4.0（专业前 10%）",
		courses: "用户研究、交互设计",
		intentCity: "上海",
		intentSalary: "25–30K / 月",
		arrival: "一个月内",
	});
};

describe("chinaMarketOf", () => {
	it("supplies the ATS defaults without rewriting stored data", () => {
		const data = structuredClone(defaultResumeData);
		// A legacy document saved before chinaMarket existed.
		delete data.metadata.chinaMarket;
		const config = chinaMarketOf(data);
		expect(config.scene).toBe("market");
		expect(config.preset).toBe("ats");
		expect(config.style.photo).toBe(false);
		expect(data.metadata.chinaMarket).toBeUndefined();
	});

	it("ships the master data on new blanks instead of deriving it on read", () => {
		expect(defaultResumeData.metadata.chinaMarket?.scene).toBe("market");
		expect(defaultResumeData.metadata.chinaMarket?.preset).toBe("ats");
	});
});

describe("scenes", () => {
	it("puts every section in one full-width column and keeps the market PDF photo-free", () => {
		const data = applyChinaMarketScene(master(), "market");
		const [page] = data.metadata.layout.pages;
		expect(page?.fullWidth).toBe(true);
		expect(page?.sidebar).toEqual([]);
		expect(page?.main[0]).toBe("summary");
		expect(page?.main).toContain("certifications");
		expect(page?.main).not.toContain("references");
		expect(data.metadata.template).toBe("general-single");
		expect(data.picture.hidden).toBe(true);
		expect(data.basics.customFields.map((field) => field.text)).toEqual(["微信：jianiing"]);
	});

	it("moves education first for campus, and exposes only the SOE contact fields for soe", () => {
		const campus = applyChinaMarketScene(master(), "campus");
		expect(campus.metadata.layout.pages[0]?.main.slice(0, 2)).toEqual(["summary", "education"]);
		expect(campus.metadata.template).toBe("campus-fresh");
		expect(campus.picture.hidden).toBe(true);

		const soe = applyChinaMarketScene(master(), "soe");
		expect(soe.metadata.template).toBe("gov-formal");
		expect(soe.picture.hidden).toBe(false);
		expect(soe.basics.customFields.map((field) => field.text)).toEqual([
			"微信：jianiing",
			"政治面貌：中共党员",
			"性别：女",
			"籍贯：江苏南京",
		]);

		const back = applyChinaMarketScene(soe, "market");
		expect(back.basics.customFields.map((field) => field.text)).toEqual(["微信：jianiing"]);
	});

	it("keeps the author's own custom fields when switching scenes", () => {
		const source = master();
		source.basics.customFields.push({ id: "mine", icon: "", text: "个人主页：example.com", link: "" });
		const data = applyChinaMarketScene(source, "soe");
		expect(data.basics.customFields.some((field) => field.id === "mine")).toBe(true);
	});
});

describe("presets and switches", () => {
	it("maps each preset onto a real template, with the table preset flagged as risky", () => {
		const ats = applyChinaMarketPreset(applyChinaMarketScene(master(), "market"), "ats");
		expect(ats.metadata.template).toBe("general-single");
		expect(chinaMarketIsRisky(ats)).toBe(false);

		const xhs = applyChinaMarketPreset(master(), "xhs");
		expect(xhs.metadata.chinaMarket?.style).toMatchObject({ centerName: true, softLabels: true });
		expect(xhs.metadata.template).toBe("center-classic");
		expect(xhs.picture.hidden).toBe(false);

		const table = applyChinaMarketPreset(master(), "table");
		expect(table.metadata.template).toBe("form-grid");
		expect(chinaMarketIsRisky(table)).toBe(true);
	});

	it("drops to custom on a single switch and keeps those switches across a scene change", () => {
		const custom = setChinaMarketStyle(master(), "centerName", true);
		expect(custom.metadata.chinaMarket?.preset).toBe("custom");
		expect(custom.metadata.chinaMarket?.style.photo).toBe(false);
		expect(custom.metadata.template).toBe("center-classic");

		const moved = applyChinaMarketScene(custom, "soe");
		expect(moved.metadata.chinaMarket?.preset).toBe("custom");
		expect(moved.metadata.chinaMarket?.style.centerName).toBe(true);
		expect(moved.metadata.chinaMarket?.style.photo).toBe(false);
		expect(moved.metadata.template).toBe("cn-executive");
	});

	it("never mutates the input document", () => {
		const source = master();
		const snapshot = JSON.stringify(source);
		applyChinaMarketScene(source, "soe");
		applyChinaMarketPreset(source, "table");
		setChinaMarketStyle(source, "photo", true);
		expect(JSON.stringify(source)).toBe(snapshot);
	});
});

describe("platform form mapping", () => {
	it("resolves master fields and separates automatic rows from manual ones", () => {
		const data = applyChinaMarketScene(master(), "soe");
		const boss = mapChinaMarketPlatform(data, "boss", new Date("2026-01-01T00:00:00Z"));
		const name = boss.rows.find((row) => row.master === "姓名");
		expect(name?.value).toBe("陈嘉宁");
		expect(boss.autoCount).toBeGreaterThan(10);
		expect(boss.rows.find((row) => row.master === "出生年月")?.status).toBe("manual");
		expect(boss.rows.find((row) => row.master === "微信")?.status).toBe("na");

		const soe = mapChinaMarketPlatform(data, "soe");
		expect(soe.rows.find((row) => row.master === "政治面貌")?.value).toBe("中共党员");
		expect(soe.rows.find((row) => row.master === "教育背景")?.value).toBe("设计创意学院 · 工业设计（本科）");
		expect(soe.rows.find((row) => row.master === "身份证号")?.status).toBe("manual");
	});
});

describe("JD alignment", () => {
	it("counts only keywords the JD asks for and never claims a hit with no baseline", () => {
		const data = applyChinaMarketScene(master(), "market");
		const full = analyzeChinaMarketJob(data, "要求：设计系统、Figma、用户研究、A/B 测试、可用性测试");
		expect(full.required).toHaveLength(5);
		expect(full.hits).toContain("设计系统");
		expect(full.hits).toContain("Figma");
		expect(full.hits).toContain("用户研究");
		expect(full.misses).toContain("A/B 测试");
		expect(full.suggestions.find((item) => item.keyword === "A/B 测试")?.rewrite).toContain("激活率");
		expect(full.quantifiedStatements).toBeGreaterThan(0);
		expect(full.hasBaseline).toBe(true);

		const empty = analyzeChinaMarketJob(data, "岗位描述没有命中词表的关键词");
		expect(empty.required).toEqual([]);
		expect(empty.hits).toEqual([]);
		expect(empty.notRequired).toHaveLength(10);
		expect(empty.hasBaseline).toBe(false);
	});
});

describe("export naming", () => {
	it("encodes the role and scene instead of just the person", () => {
		const now = new Date("2026-01-01T00:00:00Z");
		const market = applyChinaMarketScene(master(), "market");
		expect(chinaMarketFileName(market, "market", now)).toBe("陈嘉宁-高级产品设计师-5 年.pdf");
		expect(chinaMarketFileName(market, "campus", now)).toBe("陈嘉宁-同济大学-工业设计-高级产品设计师.pdf");
		expect(chinaMarketFileName(market, "soe", now)).toBe("陈嘉宁-高级产品设计师-中共党员-同济大学.pdf");
	});

	it("names the form hand-off separately from the PDF", () => {
		expect(chinaMarketFormFileName(master(), "boss", "json")).toBe("陈嘉宁-BOSS直聘-表单字段.json");
		expect(chinaMarketFormFileName(master(), "zhilian", "txt")).toBe("陈嘉宁-智联招聘-表单字段.txt");
	});
});

describe("JD persistence in the master", () => {
	it("reads an empty JD on legacy documents without rewriting stored data", () => {
		const legacy = structuredClone(defaultResumeData);
		delete legacy.metadata.chinaMarket;
		expect(chinaMarketJobDescription(legacy)).toBe("");
		expect(legacy.metadata.chinaMarket).toBeUndefined();
	});

	it("writes the JD into the master without mutating the input or losing other config", () => {
		const source = applyChinaMarketScene(master(), "campus");
		const snapshot = JSON.stringify(source);
		const next = setChinaMarketJobDescription(source, "要求 Figma、设计系统与用户研究");

		expect(chinaMarketJobDescription(next)).toBe("要求 Figma、设计系统与用户研究");
		expect(next.metadata.chinaMarket?.scene).toBe("campus");
		expect(JSON.stringify(source)).toBe(snapshot);
		// A reload reads the same JD back, so the alignment report is reproducible.
		expect(analyzeChinaMarketJob(next, chinaMarketJobDescription(next)).required).toEqual([
			"设计系统",
			"用户研究",
			"Figma",
		]);
	});
});

describe("platform form hand-off", () => {
	const now = new Date("2026-01-01T00:00:00Z");

	it("exports field labels from the platform form, never the platform name", () => {
		const data = setChinaMarketJobDescription(applyChinaMarketScene(master(), "soe"), "要求 Figma、用户研究");
		const packet = chinaMarketFormPacket(data, "boss", now);

		expect(packet.format).toBe("yejian-china-market-form-packet");
		expect(packet.platformLabel).toBe("BOSS直聘");
		expect(packet.jobDescription).toBe("要求 Figma、用户研究");
		expect(packet.generatedAt).toBe("2026-01-01T00:00:00.000Z");
		expect(packet.fields.find((row) => row.field === "姓名")?.value).toBe("陈嘉宁");
		// The old preview repeated the platform name for every row; exports must use `field`.
		expect(packet.fields.every((row) => row.field !== "BOSS直聘")).toBe(true);
		expect(packet.fillPlanFields.every((field) => field.question !== "BOSS直聘")).toBe(true);
		expect(packet.manualCount).toBeGreaterThan(0);
		expect(packet.notCollectedCount).toBeGreaterThan(0);
	});

	it("only offers real auto values to a fill helper", () => {
		const data = master();
		data.basics.email = "";
		const packet = chinaMarketFormPacket(data, "boss", now);

		expect(packet.fillPlanFields.every((field) => field.value !== "（主档未填）")).toBe(true);
		expect(packet.fillPlanFields.find((field) => field.question === "姓名")?.value).toBe("陈嘉宁");
		expect(packet.fillPlanFields.find((field) => field.question === "个人优势（300 字内）")).toBeUndefined();
		expect(packet.fillPlanFields.find((field) => field.question === "—")).toBeUndefined();
		expect(packet.fillPlanFields.every((field) => field.source.startsWith("页见结构化主档/"))).toBe(true);
	});

	it("renders paste-ready text with human-only rows kept separate", () => {
		const text = chinaMarketFormText(chinaMarketFormPacket(master(), "boss", now));
		expect(text).toContain("姓名：陈嘉宁");
		expect(text).toContain("【需人工填写】");
		expect(text).toContain("【平台不采集 / 主档刻意不收】");
		expect(text).toContain("页见不会自动填写或提交任何平台表单");
	});

	it("carries the persisted JD into every deliverable", () => {
		const data = setChinaMarketJobDescription(master(), "要求 Figma、设计系统");
		const packet = chinaMarketFormPacket(data, "boss", now);

		expect(packet.jobDescription).toBe("要求 Figma、设计系统");
		expect(chinaMarketFormText(packet)).toContain("目标 JD：要求 Figma、设计系统");
		expect(chinaMarketFormJson(packet)).toContain("要求 Figma、设计系统");
		expect(chinaMarketFormText(chinaMarketFormPacket(master(), "boss", now))).not.toContain("目标 JD：");
	});

	it("names exported files with Chinese characters intact", () => {
		// The mobile share sheet used to scrub `[^\w.-]`, turning this into "--BOSS---.json".
		const name = chinaMarketFormFileName(master(), "boss", "json");
		expect(name).toBe("陈嘉宁-BOSS直聘-表单字段.json");
		expect(name.replace(/[^\p{L}\p{N}._-]+/gu, "-")).toBe(name);
		expect(chinaMarketFormFileName(master(), "zhilian", "txt")).toBe("陈嘉宁-智联招聘-表单字段.txt");
	});

	it("serialises to a stable JSON document", () => {
		const packet = chinaMarketFormPacket(master(), "zhilian", now);
		const parsed = JSON.parse(chinaMarketFormJson(packet)) as typeof packet;
		expect(parsed.format).toBe(packet.format);
		expect(parsed.fields).toHaveLength(packet.fields.length);
		expect(parsed.fillPlanFields).toHaveLength(packet.fillPlanFields.length);
	});

	it("bridges into the upstream FormFillPlan only for a caller-supplied exact URL", () => {
		const packet = chinaMarketFormPacket(master(), "boss", now);
		const plan = chinaMarketFillPlan(packet, "https://www.zhipin.com/job_detail/abc.html");

		expect(plan?.targetUrl).toBe("https://www.zhipin.com/job_detail/abc.html");
		expect(plan?.fields).toEqual(packet.fillPlanFields);
		expect(plan?.files).toEqual([]);
		// No fake destination is ever invented by the master itself.
		expect(chinaMarketFillPlan(packet, "")).toBeNull();
		expect(chinaMarketFillPlan(packet, "not a url")).toBeNull();
		expect(chinaMarketFillPlan(packet, "http://example.com/form")).toBeNull();
		expect(chinaMarketFillPlan(packet, "https://user:pw@zhipin.com/form")).toBeNull();
		expect(chinaMarketFillPlan(packet, "https://zhipin.com/form#section")).toBeNull();
		expect(chinaMarketFillPlan(packet, "http://127.0.0.1:3000/form")?.fields).toHaveLength(
			packet.fillPlanFields.length,
		);
	});
});
