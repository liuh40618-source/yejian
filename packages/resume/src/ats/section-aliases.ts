import type { CustomSectionType } from "@reactive-resume/schema/resume/data";

/**
 * Conventional English headings the live builder lint accepts without complaint.
 * Kept deliberately narrow: this set decides whether NON_STANDARD_SECTION_TITLE fires.
 */
export const SECTION_TITLE_ALIASES: Partial<Record<CustomSectionType, ReadonlySet<string>>> = {
	summary: new Set([
		"summary",
		"professional summary",
		"profile",
		"about",
		"about me",
		"objective",
		"career objective",
	]),
	experience: new Set([
		"experience",
		"work experience",
		"professional experience",
		"employment",
		"employment history",
		"work history",
		"career history",
	]),
	education: new Set(["education", "academic background", "education & training", "educational background"]),
	projects: new Set(["projects", "personal projects", "selected projects", "side projects"]),
	skills: new Set(["skills", "technical skills", "core competencies", "competencies", "skills & expertise"]),
	languages: new Set(["languages"]),
	interests: new Set(["interests", "hobbies", "hobbies & interests"]),
	awards: new Set(["awards", "honors", "awards & honors", "achievements"]),
	certifications: new Set(["certifications", "certificates", "licenses", "licenses & certifications"]),
	publications: new Set(["publications", "papers", "research"]),
	volunteer: new Set(["volunteer", "volunteering", "volunteer experience", "community involvement"]),
	references: new Set(["references"]),
	profiles: new Set(["profiles", "links", "social profiles"]),
};

/**
 * Additional headings seen in the wild that the PDF checker must still recognise as a section.
 * These are recall-oriented: a resume that writes "Career Summary" has a summary section, even
 * though the builder lint would still nudge the author toward a more conventional title.
 */
const EXTRA_PDF_HEADING_ALIASES: Partial<Record<CustomSectionType, readonly string[]>> = {
	summary: [
		"career objective",
		"career summary",
		"executive summary",
		"personal statement",
		"professional profile",
		"summary of qualifications",
		"qualifications summary",
		"overview",
		"professional overview",
		"who i am",
	],
	experience: [
		"relevant experience",
		"professional background",
		"work history & experience",
		"industry experience",
		"positions held",
		"roles",
		"experience & achievements",
		"work",
		"employment experience",
		"relevant work experience",
	],
	education: [
		"academic qualifications",
		"academics",
		"education and training",
		"qualifications",
		"degrees",
		"academic history",
		"schooling",
	],
	projects: ["key projects", "notable projects", "portfolio", "project experience", "academic projects"],
	skills: [
		"technical proficiencies",
		"areas of expertise",
		"key skills",
		"skills summary",
		"tools & technologies",
		"technologies",
		"tech stack",
		"proficiencies",
		"expertise",
		"strengths",
	],
	languages: ["language skills", "spoken languages", "languages known"],
	interests: ["activities", "personal interests", "outside of work"],
	awards: ["honours", "awards and honors", "recognition", "accomplishments", "achievements & awards"],
	certifications: [
		"certifications & licenses",
		"professional certifications",
		"credentials",
		"licenses and certifications",
		"courses & certifications",
	],
	publications: ["publications & talks", "talks", "presentations", "conference papers", "patents"],
	volunteer: ["volunteer work", "community service", "voluntary experience", "community"],
	references: ["references available upon request", "referees"],
	profiles: ["contact", "contact information", "contact details", "online profiles", "find me online"],
};

/**
 * Chinese headings, the ones a mainland resume actually prints.
 *
 * Same section, different words: a Chinese resume lists 工作经历 where an English one lists "Work
 * Experience". Without these a fully sectioned Chinese resume reads as one undifferentiated block,
 * and every section check fails on a document that has nothing wrong with it.
 */
const CHINESE_SECTION_ALIASES: Partial<Record<CustomSectionType, readonly string[]>> = {
	summary: [
		"个人简介",
		"个人总结",
		"自我评价",
		"自我介绍",
		"个人陈述",
		"求职意向",
		"职业目标",
		"个人优势",
		"关于我",
		"简介",
		"概述",
	],
	experience: [
		"工作经历",
		"工作经验",
		"职业经历",
		"从业经历",
		"工作履历",
		"实习经历",
		"实习经验",
		"项目经历",
		"职业发展",
		"相关经历",
	],
	education: ["教育背景", "教育经历", "学历背景", "学习经历", "教育程度", "在校经历"],
	projects: ["项目经验", "项目展示", "个人项目", "主要项目", "代表项目", "作品集", "项目实践"],
	skills: [
		"专业技能",
		"技能特长",
		"个人技能",
		"技能清单",
		"技术栈",
		"核心能力",
		"专业能力",
		"技能",
		"专长",
		"技术能力",
	],
	languages: ["语言能力", "外语能力", "语言水平", "外语水平"],
	interests: ["兴趣爱好", "个人爱好", "业余爱好", "兴趣"],
	awards: ["获奖情况", "荣誉奖项", "所获荣誉", "获奖经历", "荣誉", "奖项", "在校荣誉"],
	certifications: ["证书资质", "资格证书", "职业资格", "所获证书", "证书", "认证", "执业资格"],
	publications: ["论文发表", "发表论文", "学术成果", "科研成果", "专利", "研究成果"],
	volunteer: ["志愿服务", "公益经历", "社会实践", "志愿活动"],
	references: ["推荐人", "证明人", "推荐信"],
	profiles: ["联系方式", "在线主页", "个人主页", "社交账号", "个人链接"],
};

function buildHeadingLookup(): ReadonlyMap<string, CustomSectionType> {
	const lookup = new Map<string, CustomSectionType>();

	for (const [type, aliases] of Object.entries(SECTION_TITLE_ALIASES)) {
		for (const alias of aliases) lookup.set(alias, type as CustomSectionType);
	}

	for (const [type, aliases] of Object.entries(EXTRA_PDF_HEADING_ALIASES)) {
		for (const alias of aliases) {
			if (!lookup.has(alias)) lookup.set(alias, type as CustomSectionType);
		}
	}

	for (const [type, aliases] of Object.entries(CHINESE_SECTION_ALIASES)) {
		for (const alias of aliases) {
			if (!lookup.has(alias)) lookup.set(alias, type as CustomSectionType);
		}
	}

	return lookup;
}

/**
 * Lowercased heading text -> the resume section it most likely introduces.
 * Callers are expected to normalise (case-fold, collapse whitespace, strip punctuation) first.
 */
export const PDF_SECTION_HEADING_LOOKUP = buildHeadingLookup();
