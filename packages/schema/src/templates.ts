import z from "zod";

export const templateSchema = z.enum([
	// 通用单栏
	"general-single",
	// 标准简历
	"asia-standard",
	// 简约通用
	"minimal-photo",
	// 中轴经典
	"center-classic",
	// 表格式
	"form-grid",
	// 留白设计
	"whitespace-clean",
	// 主标题
	"heading-accent",
	// 杂志编辑
	"editorial",
	// 资深端方
	"senior-formal",
	// ---- 中国市场模板 ----
	// 校园应届
	"campus-fresh",
	// 技术时间轴
	"tech-timeline",
	// 国企公文
	"gov-formal",
	// 紧凑密排
	"compact-dense",
	// 创意侧栏
	"creative-side",
	// 国企干部
	"state-owned",
	// 创意分栏
	"creative-grid",
	// 中英双语
	"bilingual-cn",
	// 高管中式
	"cn-executive",
	// 咨询中式
	"consulting-cn",
]);

export type Template = z.infer<typeof templateSchema>;

/** How a template lays out the page. The single source for the gallery filters, the Check layout rule and DOCX. */
export type TemplateLayout = {
	/** Two-column templates print the sidebar as a column of its own; one-column templates read top to bottom. */
	columns: 1 | 2;
	/** Where the sidebar column sits by default. Null for one-column templates. */
	sidebarSide: "left" | "right" | null;
	/** Where the header sits: across the page, over the main column only, or in the sidebar. */
	headerPlacement: "full-width" | "main-only" | "sidebar-only";
	/** One reading order and plain text headings, which applicant tracking systems read cleanly. */
	atsSafe: boolean;
};

const oneColumn: TemplateLayout = { columns: 1, sidebarSide: null, headerPlacement: "full-width", atsSafe: true };

export const templateLayouts = {
	// GeneralSingle prints sidebar sections as labelled rows inside one column.
	"general-single": oneColumn,
	"asia-standard": oneColumn,
	"minimal-photo": oneColumn,
	"center-classic": oneColumn,
	"form-grid": oneColumn,
	"whitespace-clean": oneColumn,
	"heading-accent": oneColumn,
	editorial: oneColumn,
	"senior-formal": oneColumn,
	"campus-fresh": oneColumn,
	"tech-timeline": oneColumn,
	"gov-formal": oneColumn,
	"compact-dense": oneColumn,
	"creative-side": oneColumn,
	"state-owned": oneColumn,
	"creative-grid": oneColumn,
	"bilingual-cn": oneColumn,
	"cn-executive": oneColumn,
	"consulting-cn": oneColumn,
} as const satisfies Record<Template, TemplateLayout>;
