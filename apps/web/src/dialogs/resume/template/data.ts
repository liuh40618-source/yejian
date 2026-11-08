import type { MessageDescriptor } from "@lingui/core";
import type { Template } from "@reactive-resume/schema/templates";
import { msg } from "@lingui/core/macro";

export type TemplateMetadata = {
	name: string;
	description: MessageDescriptor;
	imageUrl: string;
	tags: string[];
};

export const templates = {
	"general-single": {
		name: "通用单栏",
		description: msg`One column with labeled section rows and subtle dividers. A compact layout for experience, education and supporting details.`,
		imageUrl: "/templates/jpg/general-single.jpg",
		tags: ["Single-column", "Clean", "Professional", "Corporate", "Finance", "Consulting"],
	},
	"asia-standard": {
		name: "标准简历",
		description: msg`Single-column with uppercase section headings over a rule and the photo beside the name; compact and ATS-friendly, well-suited for Asian resume conventions (CN/JP/KR).`,
		imageUrl: "/templates/jpg/asia-standard.jpg",
		tags: ["Single-column", "ATS friendly", "Ruled headings", "Compact", "Asian style", "CN/JP/KR"],
	},
	"minimal-photo": {
		name: "简约通用",
		description: msg`One column with a photo beside the header and clear section headings. A simple top-to-bottom layout for your experience.`,
		imageUrl: "/templates/jpg/minimal-photo.jpg",
		tags: ["Single-column", "ATS friendly", "Versatile", "Professional", "Technical"],
	},
	"center-classic": {
		name: "中轴经典",
		description: msg`Single-column Wall Street style with a centered header and ruled section headings.`,
		imageUrl: "/templates/jpg/center-classic.jpg",
		tags: ["Single-column", "ATS friendly", "Finance", "Consulting", "Traditional"],
	},
	"form-grid": {
		name: "表格式",
		description: msg`Single-column ruled form inspired by the Japanese rirekisho: a bordered header of field cells and every section as a table with a solid title bar; dense and fast to scan for engineering, operations, or applications in Japan.`,
		imageUrl: "/templates/jpg/form-grid.jpg",
		tags: [
			"Single-column",
			"ATS friendly",
			"Ruled grid",
			"Dense",
			"Structured",
			"Engineering",
			"Operations",
			"Asian style",
		],
	},
	"whitespace-clean": {
		name: "留白设计",
		description: msg`Single-column with a minimal top header and lots of whitespace; clean and modern for designers or content creators.`,
		imageUrl: "/templates/jpg/whitespace-clean.jpg",
		tags: ["Single-column", "ATS friendly", "Minimal", "Clean", "Modern", "Designer", "Content creator", "Whitespace"],
	},
	"heading-accent": {
		name: "主标题",
		description: msg`Single-column with uppercase section headings and a primary-color top rule on every page; polished for executive, consulting, or startup resumes.`,
		imageUrl: "/templates/jpg/heading-accent.jpg",
		tags: ["Single-column", "ATS friendly", "Uppercase headings", "Executive", "Consulting", "Startup"],
	},
	editorial: {
		name: "杂志编辑",
		description: msg`Single-column set like a magazine feature: a large display name under an uppercase kicker and the summary as a larger standfirst; refined for writers, designers, and communications roles.`,
		imageUrl: "/templates/jpg/editorial.jpg",
		tags: ["Single-column", "ATS friendly", "Editorial", "Magazine", "Serif", "Writer", "Designer", "Communications"],
	},
	"senior-formal": {
		name: "资深端方",
		description: msg`Single-column; polished and serious for senior or enterprise-level positions.`,
		imageUrl: "/templates/jpg/senior-formal.jpg",
		tags: ["Single-column", "ATS friendly", "Polished", "Senior", "Enterprise"],
	},
	"campus-fresh": {
		name: "校园应届",
		description: msg`Single-column campus page: the photo sits at the corner of the header and every section opens on a solid title bar. Built for a first job out of school, where education and campus work lead.`,
		imageUrl: "/templates/jpg/campus-fresh.jpg",
		tags: ["Single-column", "ATS friendly", "Campus", "Graduate", "Title bar", "Photo"],
	},
	"tech-timeline": {
		name: "技术时间轴",
		description: msg`Single-column with every entry hung off a rail down the start edge, so spans and gaps line up at a glance. Engineering, product and data roles.`,
		imageUrl: "/templates/jpg/tech-timeline.jpg",
		tags: ["Single-column", "ATS friendly", "Technical", "Timeline", "Engineering", "Data"],
	},
	"gov-formal": {
		name: "国企公文",
		description: msg`Single-column in the official-document register: a centred name over a heavy rule, plain bold section titles, no colour or icons. For public institutions and state-owned enterprises.`,
		imageUrl: "/templates/jpg/gov-formal.jpg",
		tags: ["Single-column", "ATS friendly", "Formal", "Public sector", "State-owned", "Conservative"],
	},
	"compact-dense": {
		name: "紧凑密排",
		description: msg`Single-column with tighter margins and no gaps between entries, so a long career still fits one page. For candidates with a decade or more to fit in.`,
		imageUrl: "/templates/jpg/compact-dense.jpg",
		tags: ["Single-column", "ATS friendly", "Dense", "One page", "Experienced", "Compact"],
	},
	"creative-side": {
		name: "创意侧栏",
		description: msg`Single-column with the name on a full-bleed colour band and a colour bar down the start edge of every section. Designers, content and brand roles.`,
		imageUrl: "/templates/jpg/creative-side.jpg",
		tags: ["Single-column", "ATS friendly", "Creative", "Designer", "Colour band", "Portfolio"],
	},
	"state-owned": {
		name: "国企干部",
		description: msg`Single-column personnel-form layout: name and photo inside a bordered band, section titles in filled boxes, a rule closing every section. For management roles in state-owned enterprises.`,
		imageUrl: "/templates/jpg/state-owned.jpg",
		tags: ["Single-column", "ATS friendly", "Formal", "Management", "State-owned", "Structured"],
	},
	"creative-grid": {
		name: "创意分栏",
		description: msg`Single-column with a two-tone header and each section titled by a filled chip with a rule running from it. Bolder than a plain column, still one reading order.`,
		imageUrl: "/templates/jpg/creative-grid.jpg",
		tags: ["Single-column", "ATS friendly", "Creative", "Chip headings", "Marketing", "Media"],
	},
	"bilingual-cn": {
		name: "中英双语",
		description: msg`Single-column for resumes that travel between two markets: a ruled header with contacts in both scripts and room under each Chinese title for its English.`,
		imageUrl: "/templates/jpg/bilingual-cn.jpg",
		tags: ["Single-column", "ATS friendly", "Bilingual", "Overseas", "Foreign company", "Translation"],
	},
	"cn-executive": {
		name: "高管中式",
		description: msg`Single-column with a heavy rule under the header and generous space between entries. A page that is not crowded reads as senior. Directors and above.`,
		imageUrl: "/templates/jpg/cn-executive.jpg",
		tags: ["Single-column", "ATS friendly", "Executive", "Director", "Senior", "Spacious"],
	},
	"consulting-cn": {
		name: "咨询中式",
		description: msg`Single-column with the name on a colour panel and section titles in small capitals over a thin rule. Dense and scannable, for consulting and corporate strategy.`,
		imageUrl: "/templates/jpg/consulting-cn.jpg",
		tags: ["Single-column", "ATS friendly", "Consulting", "Strategy", "Corporate", "Dense"],
	},
} as const satisfies Record<Template, TemplateMetadata>;
