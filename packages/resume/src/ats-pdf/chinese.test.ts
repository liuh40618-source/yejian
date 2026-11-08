import type { PdfRuleCode } from "./catalog";
import type { RawExtraction } from "./types";
import { describe, expect, it } from "vite-plus/test";
import { analyzePdfResume, buildExtractedDocument, buildResumeSemantics } from "./index";
import { makeRawExtraction } from "./test-fixtures";

/**
 * The ATS report on a Chinese resume.
 *
 * A mainland resume prints 教育背景 / 工作经历 / 专业技能, opens every bullet on an achievement
 * verb, and carries its name as two unspaced characters. Every one of those breaks an assumption
 * the English report is built on, so these tests pin the Chinese behaviour end to end: the same
 * clean document must not be reported as unreadable, unstructured, or nameless.
 */

const NOW = new Date("2024-06-15T00:00:00Z");

const CHINESE_RESUME = [
	"张三",
	"高级前端工程师 · 上海 · 13800138000 · zhangsan@example.com",
	"个人简介",
	"六年前端开发经验，主导过多个高并发交易系统的前端架构设计。",
	"工作经历",
	"某某科技有限公司 2020.03 - 2024.06",
	"高级前端工程师",
	"• 主导重构核心交易系统的前端架构，采用 React 与 TypeScript，首屏加载时间降低 40%。",
	"• 推动微服务架构在前端的落地，接口响应时间从 800ms 降至 210ms。",
	"• 带领 5 人小组完成设计系统建设，覆盖 32 个业务组件，重复开发量减少 60%。",
	"某互联网公司 2018.07 - 2020.02",
	"前端开发工程师",
	"• 使用 Vue 与 Node.js 开发后台管理系统，支撑日均 20 万订单处理。",
	"• 搭建自动化测试流程，线上缺陷率下降 35%。",
	"教育背景",
	"某某大学 计算机科学与技术 本科 2014.09 - 2018.06",
	"专业技能",
	"• 熟练掌握 TypeScript、React、Vue、Node.js",
	"• 熟悉 Docker、Kubernetes 容器化部署",
	"• 了解微服务架构与云原生技术栈",
];

const chineseResume = () => makeRawExtraction({ lines: CHINESE_RESUME, metadata: { language: "zh-CN" } });

const semanticsOf = (raw: RawExtraction) => buildResumeSemantics(raw, buildExtractedDocument(raw), { now: NOW });

const statusOf = (raw: RawExtraction, code: PdfRuleCode) =>
	analyzePdfResume(raw, { now: NOW }).checks.find((check) => check.code === code);

describe("analyzePdfResume: Chinese", () => {
	it("reads the text as Chinese rather than as English", () => {
		const quality = semanticsOf(chineseResume()).quality;

		expect(quality.isChinese).toBe(true);
		expect(quality.isEnglish).toBe(false);
	});

	it("finds the name, phone, and email", () => {
		const { contact } = semanticsOf(chineseResume());

		expect(contact.nameLine).toBe("张三");
		expect(contact.phones).toContain("13800138000");
		expect(contact.emails).toContain("zhangsan@example.com");
	});

	it("recognises the Chinese section headings", () => {
		const { sectionTypes } = semanticsOf(chineseResume());

		expect(sectionTypes).toContain("summary");
		expect(sectionTypes).toContain("experience");
		expect(sectionTypes).toContain("education");
		expect(sectionTypes).toContain("skills");
	});

	it("counts the Chinese role lines", () => {
		expect(semanticsOf(chineseResume()).roleLikeLineCount).toBeGreaterThanOrEqual(2);
	});

	it("reads printed year-first Chinese ranges and 至今 as an ongoing role", () => {
		const raw = makeRawExtraction({
			lines: [...CHINESE_RESUME, "某科技有限公司 2021.06 - 至今"],
			metadata: { language: "zh-CN" },
		});
		const { dates } = semanticsOf(raw);

		expect(dates.filter((date) => date.parsed).length).toBeGreaterThanOrEqual(3);
		expect(dates.some((date) => date.raw.includes("2018.07"))).toBe(true);
		expect(dates.some((date) => date.kind === "range" && date.parsed && date.ongoing)).toBe(true);
	});

	it("does not report a clean Chinese resume as unstructured or nameless", () => {
		const result = analyzePdfResume(chineseResume(), { now: NOW });
		const failed = result.checks.filter((check) => check.status === "fail").map((check) => check.code);

		expect(failed).not.toContain("NO_TEXT_LAYER");
		expect(failed).not.toContain("NO_EXPERIENCE_SECTION");
		expect(failed).not.toContain("NO_RECOGNIZED_HEADINGS");
		expect(failed).not.toContain("NO_NAME");
		expect(failed).not.toContain("NO_ROLE_LINES");
	});

	it("scores a clean Chinese resume above the midpoint", () => {
		expect(analyzePdfResume(chineseResume(), { now: NOW }).score).toBeGreaterThan(50);
	});

	it("counts a Chinese bullet as starting on an action verb", () => {
		// 主导 / 推动 / 带领 / 使用 / 搭建 all open a bullet in the fixture.
		expect(semanticsOf(chineseResume()).actionVerbBulletCount).toBeGreaterThan(0);
	});

	it("applies the Chinese bullet-length rule instead of the English one", () => {
		// A 120-character Chinese bullet is a paragraph; the English 220-character limit would pass it.
		expect(semanticsOf(chineseResume()).longBulletCount).toBe(0);
	});

	it("skips the all-caps rule, which cannot apply to Chinese", () => {
		const check = statusOf(chineseResume(), "ALL_CAPS_RUNS");

		expect(check?.status).toBe("skip");
		expect(check?.skipReason).toBe("not-applicable");
	});

	it("does not count English first-person pronouns in Chinese text", () => {
		expect(semanticsOf(chineseResume()).firstPersonCount).toBe(0);
	});

	it("counts a Chinese self-reference written in a bullet", () => {
		const raw = makeRawExtraction({
			lines: [...CHINESE_RESUME, "• 我个人负责了整个项目的技术选型。"],
			metadata: { language: "zh-CN" },
		});

		expect(semanticsOf(raw).firstPersonCount).toBeGreaterThan(0);
	});
});
