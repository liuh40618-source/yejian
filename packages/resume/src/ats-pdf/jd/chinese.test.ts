import { describe, expect, it } from "vite-plus/test";
import { matchJobDescription } from "./match";
import { CJK_COMPOUNDS, mergeCjkCompounds } from "./normalize";
import { tokenize } from "./tokenize";

/**
 * The Chinese path through the ATS engine.
 *
 * A mainland posting is one unspaced run of characters, so the English assumptions the rest of the
 * engine is built on — word boundaries, spaces between tokens, an ASCII comma — all fail here. Each
 * test below pins one of those assumptions to the Chinese behaviour that replaces it.
 */
describe("tokenize: Chinese", () => {
	it("splits a run of ideographs into dictionary words", () => {
		// 性能优化 survives as one compound: it is the term a posting and a resume both name.
		expect(tokenize("负责支付链路的性能优化")).toEqual(["负责", "支付", "链路", "的", "性能优化"]);
	});

	it("does not glue Chinese words together across a separator", () => {
		expect(tokenize("熟悉React、Vue等主流框架")).toEqual(["熟悉", "React", "Vue", "等", "主流", "框架"]);
	});

	it("keeps a Latin technology name whole inside Chinese text", () => {
		expect(tokenize("熟练使用 Node.js、TypeScript、C++、C#")).toEqual([
			"熟练",
			"使用",
			"Node.js",
			"TypeScript",
			"C++",
			"C#",
		]);
	});

	it("keeps a slashed pair of technologies whole", () => {
		expect(tokenize("有 Kubernetes/K8s 容器编排经验者优先")).toContain("Kubernetes/K8s");
	});

	it("rejoins the domain compounds the dictionary splits", () => {
		expect(tokenize("具备微服务架构与云原生经验")).toEqual(["具备", "微服务", "架构", "与", "云原生", "经验"]);
		expect(tokenize("熟悉自然语言处理与大语言模型微调")).toEqual(["熟悉", "自然语言处理", "与", "大语言模型", "微调"]);
	});

	it("rejoins a compound that spans more than two dictionary words", () => {
		expect(tokenize("掌握向量数据库和检索增强生成")).toEqual(["掌握", "向量数据库", "和", "检索增强生成"]);
	});
});

describe("mergeCjkCompounds", () => {
	it("merges nothing when no compound is spelled by the neighbours", () => {
		const words = [
			{ text: "前端", isWordLike: true },
			{ text: "开发", isWordLike: true },
		];

		// "前端开发" is not in the compound list, so the two words stay separate.
		expect(mergeCjkCompounds(words).map((word) => word.text)).toEqual(["前端", "开发"]);
	});

	it("never merges across a punctuation piece", () => {
		const pieces = [
			{ text: "微", isWordLike: true },
			{ text: "、", isWordLike: false },
			{ text: "服务", isWordLike: true },
		];

		expect(mergeCjkCompounds(pieces).map((piece) => piece.text)).toEqual(["微", "、", "服务"]);
	});

	it("lists every compound once", () => {
		expect(new Set(CJK_COMPOUNDS).size).toBe(CJK_COMPOUNDS.length);
	});
});

describe("matchJobDescription: Chinese", () => {
	const resumeText = [
		"张三",
		"高级前端工程师",
		"工作经历",
		"某科技公司 2020.03 - 2024.06",
		"主导重构核心交易系统的前端架构，采用 React 与 TypeScript，首屏时间降低 40%。",
		"使用 Docker 与 Kubernetes 完成容器化部署。",
		"专业技能",
		"熟悉 TypeScript、React、Node.js，了解微服务架构。",
	].join("\n");

	it("matches a Chinese posting's skill against the same skill in the resume", () => {
		const report = matchJobDescription({
			jobDescription: "岗位职责\n负责公司核心业务系统的前端架构设计与开发\n任职要求\n熟悉 React、Vue 等主流框架",
			resumeText,
		});

		expect(report.matchedTerms).toContain("react");
		expect(report.missingTerms).not.toContain("react");
	});

	it("resolves a Chinese spelling and its English equivalent onto one term", () => {
		const report = matchJobDescription({
			jobDescription: "任职要求\n- 具备容器编排经验\n- 有微服务架构经验",
			resumeText,
		});

		// 容器编排 canonicalizes with "Kubernetes" and 微服务 with "microservices"; the resume has both
		// under their Latin spellings, so neither may be reported missing.
		expect(report.missingTerms).not.toContain("kubernetes");
		expect(report.missingTerms).not.toContain("microservices");
	});

	it("ignores the recruiting boilerplate every Chinese posting carries", () => {
		const report = matchJobDescription({
			jobDescription: [
				"岗位职责：",
				"1. 负责公司相关业务系统的开发工作；",
				"2. 参与团队建设，配合产品经理完成需求分析；",
				"任职要求：",
				"1. 本科及以上学历，计算机相关专业；",
				"2. 3年以上相关工作经验，有较强的沟通能力；",
				"我们提供：五险一金、带薪年假、弹性工作",
			].join("\n"),
			resumeText: "工程师。",
		});

		// Nothing here names a skill, so nothing here should be asked of the candidate.
		expect(report.terms).toEqual([]);
	});

	it("still reports a term the resume genuinely lacks", () => {
		const report = matchJobDescription({
			jobDescription: "任职要求\n- 精通 Rust\n- 熟悉 Golang",
			resumeText,
		});

		expect(report.missingTerms).toContain("rust");
		expect(report.missingTerms).toContain("go");
	});

	it("does not accuse a Chinese resume of keyword stuffing on the terms it repeats", () => {
		const report = matchJobDescription({
			jobDescription: "任职要求\n- 熟悉 React",
			resumeText: `${resumeText}\n${"React React React React React React React React React React React React"}`,
		});

		// The stuffing check is a ratio against the posting; a long Chinese resume is not stuffing.
		expect(report.weightedCoverage).toBeGreaterThan(0);
	});
});
