import type { ReactElement, ReactNode } from "react";
import { useState } from "react";
import { Button } from "@reactive-resume/ui/components/button";
import { Icon } from "@reactive-resume/ui/components/icon";
import { Input } from "@reactive-resume/ui/components/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@reactive-resume/ui/components/tabs";
import { Sheet } from "@/features/homepage/sheet";
import { EditorBarFrame } from "@/features/resume/editor/chrome/bar";
import { EditorFrame, useEditorLayout } from "@/features/resume/editor/chrome/shell";
/**
 * A stand-in for the editor, for looking at the shell's design without a database. It uses the real frame, bar and
 * UI components; only the panel's fields and the page are placeholders. Local preview only.
 *
 * All four modes are wired: the bar's tabs drive a local mode, and each mode brings its own panel (a stand-in for
 * Write, Design, Check and Share). Nothing here reads or writes a resume.
 */

const modes = [
	{ value: "write", label: "撰写", icon: "pencil-simple" },
	{ value: "design", label: "设计", icon: "palette" },
	{ value: "check", label: "检查", icon: "list-checks" },
	{ value: "share", label: "分享", icon: "globe-hemisphere-west" },
] as const;

type Mode = (typeof modes)[number]["value"];

function PreviewModes() {
	return (
		<TabsList variant="line" className="h-full border-b-0" data-mode-switch="">
			{modes.map(({ value, label, icon }) => (
				<TabsTrigger key={value} value={value} className="px-4">
					<Icon name={icon} size={18} />
					{label}
				</TabsTrigger>
			))}
		</TabsList>
	);
}

function PreviewBar({ layout }: { layout: "desktop" | "tablet" | "mobile" }) {
	return (
		<EditorBarFrame
			layout={layout}
			pinnable={false}
			menu={
				<div className="flex min-w-0 flex-col items-start">
					<span className="truncate font-display text-[15px] leading-none tracking-[-.01em] text-ink">
						陈佳宁 · 产品设计师
					</span>
					<span className="font-mono text-[10.5px] tracking-[.06em] text-ink-3">已保存 · 版本 14</span>
				</div>
			}
			modes={<PreviewModes />}
			history={
				<>
					<Button variant="ghost" size="icon" aria-label="撤销">
						<Icon name="arrow-counter-clockwise" />
					</Button>
					<Button variant="ghost" size="icon" aria-label="重做" disabled>
						<Icon name="arrow-clockwise" />
					</Button>
				</>
			}
		>
			<Button className="gap-1.5">
				<Icon name="download-simple" />
				下载 PDF
			</Button>
		</EditorBarFrame>
	);
}

function Field({ label, value, hint }: { label: string; value: string; hint?: string }) {
	return (
		<label className="flex flex-col gap-1.5">
			<span className="font-ui text-[12px] font-medium text-ink-2">{label}</span>
			<Input defaultValue={value} />
			{hint && <span className="text-[11px] text-ink-3">{hint}</span>}
		</label>
	);
}

function PreviewPanel() {
	return (
		<div className="flex flex-col">
			<div className="sticky top-0 z-1 flex items-baseline justify-between border-b border-line-2 bg-bg px-4 py-3">
				<span className="font-display text-[15px] leading-none text-ink">内容</span>
				<span className="font-mono text-[10.5px] tracking-[.1em] text-ink-3">04 段 · 12 条</span>
			</div>
			<div className="flex flex-col gap-6 px-4 py-5">
				<section className="flex flex-col gap-3">
					<span className="border-t border-line-2 pt-3 font-mono text-[11px] tracking-[.12em] text-ink-3">
						基本信息
					</span>
					<Field label="姓名" value="陈佳宁" />
					<Field label="职位" value="资深产品设计师" />
					<Field label="邮箱" value="chenjianing@foxmail.com" />
				</section>
				<section className="flex flex-col gap-3">
					<span className="border-t border-line-2 pt-3 font-mono text-[11px] tracking-[.12em] text-ink-3">
						工作经历
					</span>
					<Field label="公司" value="云图科技" hint="上海 · 2021 年至今" />
					<Field label="职位" value="产品设计负责人" />
				</section>
			</div>
		</div>
	);
}

/** A group heading in the Design panel, matching the real panel's rhythm. */
function Group({ title, hint, children }: { title: string; hint?: string; children?: ReactNode }) {
	return (
		<section className="flex flex-col gap-2.5 border-t border-line-2 pt-4 first:border-t-0 first:pt-0">
			<div className="flex items-baseline justify-between">
				<span className="font-display text-[15px] leading-none text-ink">{title}</span>
				{hint && <span className="font-mono text-[10.5px] tracking-[.06em] text-ink-3">{hint}</span>}
			</div>
			{children}
		</section>
	);
}

/** 19 templates, in the same order the real picker draws them (see `dialogs/resume/template/data`). */
const designTemplates: { name: string; layout: string; active?: boolean }[] = [
	{ name: "通用单栏", layout: "单栏 · ATS 安全", active: true },
	{ name: "标准简历", layout: "单栏 · ATS 安全" },
	{ name: "简约通用", layout: "单栏 · 带头像" },
	{ name: "中轴经典", layout: "单栏 · 姓名居中" },
	{ name: "表格式", layout: "单栏 · 表格线" },
	{ name: "留白设计", layout: "单栏 · 大留白" },
	{ name: "主标题", layout: "单栏 · 强调标题" },
	{ name: "杂志编辑", layout: "单栏 · 编辑感" },
	{ name: "资深端方", layout: "单栏 · 稳重" },
	{ name: "校招应届", layout: "单栏 · 教育优先" },
	{ name: "技术时间线", layout: "单栏 · 时间线" },
	{ name: "体制内正式", layout: "单栏 · 干部履历" },
	{ name: "紧凑密集型", layout: "单栏 · 高密度" },
	{ name: "创意侧栏", layout: "单栏 · 侧栏色块" },
	{ name: "国企风格", layout: "单栏 · 稳重" },
	{ name: "创意网格", layout: "单栏 · 网格" },
	{ name: "中英双语", layout: "单栏 · 双语" },
	{ name: "中文高管", layout: "单栏 · 高信息量" },
	{ name: "咨询风格", layout: "单栏 · 要点式" },
];

const designFilters = ["全部", "校招", "技术", "ATS 安全"] as const;

/**
 * Design: the template grid and the China-market groups, at the same shapes the real panel uses. Cards are
 * drawn as paper, not as the real Forme render — this shell has no resume behind it to render from.
 */
function DesignPanel() {
	const [filter, setFilter] = useState<string>("全部");
	const shown = designTemplates;

	return (
		<div className="flex flex-col gap-5 px-4 py-5">
			<Group title="模板" hint={`${shown.length} / ${designTemplates.length}`}>
				<div className="flex flex-wrap gap-1.5">
					{designFilters.map((option) => (
						<button
							key={option}
							type="button"
							onClick={() => setFilter(option)}
							className={
								option === filter
									? "flex h-7 items-center rounded-sm border border-accent bg-accent-soft px-3 text-[13px] font-medium text-accent-text"
									: "flex h-7 items-center rounded-sm border border-line-2 px-3 text-[13px] text-ink-2 hover:bg-hover"
							}
						>
							{option}
						</button>
					))}
				</div>
				<div className="grid grid-cols-2 gap-3">
					{shown.map((template) => (
						<div key={template.name} className="grid gap-1.5">
							<span
								className={
									template.active
										? "relative grid aspect-page place-items-center overflow-hidden rounded-md border border-line bg-white shadow-e1 ring-2 ring-accent ring-offset-2 ring-offset-surface"
										: "relative grid aspect-page place-items-center overflow-hidden rounded-md border border-line bg-white shadow-e1"
								}
							>
								<span className="absolute inset-x-3 top-3 h-1.5 rounded-full bg-line-2" />
								<span className="absolute inset-x-3 top-6 h-1 rounded-full bg-line-2" />
								<span className="absolute inset-x-3 top-9 h-1 rounded-full bg-line-2 opacity-60" />
								<span className="absolute inset-x-3 top-14 h-1 rounded-full bg-line-2 opacity-40" />
								<span className="absolute inset-x-3 top-16 h-1 rounded-full bg-line-2 opacity-40" />
								{template.active && (
									<span className="absolute end-1.5 top-1.5 grid size-5 place-items-center rounded-sm bg-accent text-on-accent">
										<Icon name="check" size={14} />
									</span>
								)}
							</span>
							<span className="text-sm leading-4 font-medium text-ink">{template.name}</span>
							<span className="text-xs leading-4 text-ink-3">{template.layout}</span>
						</div>
					))}
				</div>
				<p className="text-xs leading-4 text-ink-3">
					零数据预览：卡片是纸张示意图，真实卡片会用 Forme 从你的简历渲染首屏。
				</p>
			</Group>

			<Group title="投递场景" hint="市场 / 校招 / 国企">
				<div className="grid grid-cols-3 gap-1 rounded-lg bg-sunken p-[3px]">
					{["市场投递", "校招", "国企央企"].map((scene, index) => (
						<span
							key={scene}
							className={
								index === 0
									? "flex h-8 items-center justify-center rounded-sm bg-raised text-[13px] font-medium text-ink shadow-e1"
									: "flex h-8 items-center justify-center rounded-sm text-[13px] text-ink-2"
							}
						>
							{scene}
						</span>
					))}
				</div>
				<p className="text-[13px] leading-5 text-ink-3">
					岗位投递看能力与产出；校招看教育背景与实习；国企央企看政治面貌与干部经历。
				</p>
			</Group>

			<Group title="PDF 视觉预设" hint="ATS / 小红书 / 表格">
				<div className="grid grid-cols-3 gap-1 rounded-lg bg-sunken p-[3px]">
					{["ATS 净化", "小红书", "表格化"].map((preset, index) => (
						<span
							key={preset}
							className={
								index === 0
									? "flex h-8 items-center justify-center rounded-sm bg-raised text-[13px] font-medium text-ink shadow-e1"
									: "flex h-8 items-center justify-center rounded-sm text-[13px] text-ink-2"
							}
						>
							{preset}
						</span>
					))}
				</div>
				<p className="text-[13px] leading-5 text-ink-3">无图标、无底色、单栏、时间右对齐，先过机器读取。</p>
			</Group>

			<Group title="结构化主档" hint="12 个字段">
				<p className="text-[13px] leading-5 text-ink-3">
					微信、意向城市、期望薪资、到岗时间、英语等级、专业全称、绩点排名、主修课程、政治面貌、性别、籍贯、学生干部。这些只进平台表单，不占
					PDF 列位。
				</p>
			</Group>

			<Group title="平台表单映射" hint="BOSS / 智联 / 前程 / 国企">
				<div className="flex flex-col gap-1">
					{[
						["姓名", "陈佳宁", true],
						["最高学历", "本科 · 视觉传达设计", true],
						["期望薪资", "25–35K", true],
						["到岗时间", "一个月内", true],
						["作品集链接", "需手动补充", false],
					].map(([field, value, auto]) => (
						<div key={field as string} className="grid gap-0.5 rounded-sm bg-hover px-2 py-1.5">
							<span className="text-[12px] font-medium text-ink">{field}</span>
							<span className={auto ? "text-[12px] text-ink-2" : "text-[12px] text-ink-3"}>{value}</span>
						</div>
					))}
				</div>
			</Group>

			<Group title="JD 关键词对齐">
				<p className="text-[13px] leading-5 text-ink-3">
					粘贴岗位描述，只统计它真正要求的词；固定词表不会充数。匹配 9 / 12 · 量化陈述 6 条。
				</p>
			</Group>
		</div>
	);
}

/** Check: the readiness list, at the shape the real Check panel uses. */
function CheckPanel() {
	const checks = [
		{ label: "联系方式完整", state: "pass", note: "邮箱、电话、城市都有" },
		{ label: "每段经历有量化结果", state: "warn", note: "第二段经历缺数字" },
		{ label: "时间格式统一", state: "warn", note: "「2021.3」与「2021 年 3 月」混用" },
		{ label: "ATS 可解析", state: "pass", note: "单栏、无表格、无图标字体" },
		{ label: "篇幅控制", state: "pass", note: "1 页，边距正常" },
	] as const;

	return (
		<div className="flex flex-col gap-5 px-4 py-5">
			<div className="flex items-baseline justify-between border-b border-line-2 pb-3">
				<span className="font-display text-[15px] leading-none text-ink">检查</span>
				<span className="font-mono text-[10.5px] tracking-[.1em] text-ink-3">3 通过 · 2 待改</span>
			</div>
			<div className="flex flex-col divide-y divide-line">
				{checks.map((check) => (
					<div key={check.label} className="flex gap-2.5 py-3">
						<Icon
							name={check.state === "pass" ? "check-circle" : "warning-circle"}
							size={18}
							className={check.state === "pass" ? "text-ink-3" : "text-warn-text"}
						/>
						<div className="flex min-w-0 flex-col gap-0.5">
							<span className="text-[13px] font-medium text-ink">{check.label}</span>
							<span className="text-[12px] leading-5 text-ink-3">{check.note}</span>
						</div>
					</div>
				))}
			</div>
			<p className="text-xs leading-4 text-ink-3">检查只看内容，不改排版；改完直接回到「撰写」。</p>
		</div>
	);
}

/** Share: the link, the visibility switches and the download buttons. */
function SharePanel() {
	return (
		<div className="flex flex-col gap-5 px-4 py-5">
			<div className="flex items-baseline justify-between border-b border-line-2 pb-3">
				<span className="font-display text-[15px] leading-none text-ink">分享</span>
				<span className="font-mono text-[10.5px] tracking-[.1em] text-ink-3">未公开</span>
			</div>
			<section className="flex flex-col gap-2">
				<span className="font-ui text-[12px] font-medium text-ink-2">公开链接</span>
				<div className="flex gap-2">
					<Input defaultValue="yejian.app/r/chenjianing" readOnly />
					<Button variant="secondary" size="sm">
						复制
					</Button>
				</div>
				<span className="text-[11px] text-ink-3">打开后任何人都能看；关掉就只你自己能打开。</span>
			</section>
			<div className="flex flex-col divide-y divide-line">
				{[
					["公开访问", "任何人拿到链接都能看", true],
					["搜索引擎收录", "允许百度、Google 抓到", false],
					["隐藏联系方式", "公开页只留姓名与经历", false],
				].map(([label, hint, on]) => (
					<div key={label as string} className="flex items-start justify-between gap-3 py-3">
						<div className="flex min-w-0 flex-col gap-0.5">
							<span className="text-[13px] font-medium text-ink">{label}</span>
							<span className="text-[12px] leading-5 text-ink-3">{hint}</span>
						</div>
						<span
							className={
								on ? "mt-0.5 h-5 w-9 shrink-0 rounded-full bg-accent" : "mt-0.5 h-5 w-9 shrink-0 rounded-full bg-line-2"
							}
						/>
					</div>
				))}
			</div>
			<div className="flex flex-wrap gap-2">
				<Button size="sm">
					<Icon name="download-simple" />
					下载 PDF
				</Button>
				<Button variant="secondary" size="sm">
					<Icon name="file-text" />
					下载 Markdown
				</Button>
			</div>
		</div>
	);
}

const panels: Record<Mode, () => ReactElement> = {
	write: PreviewPanel,
	design: DesignPanel,
	check: CheckPanel,
	share: SharePanel,
};

const panelLabels: Record<Mode, string> = { write: "内容", design: "设计", check: "检查", share: "分享" };

function PreviewPage() {
	return (
		<div className="grid h-full place-items-center overflow-hidden bg-sunken p-8">
			<div className="relative aspect-[612/792] h-full max-h-[calc(100vh-160px)] rounded-none shadow-page outline-1 outline-line before:pointer-events-none before:absolute before:-inset-2 before:border before:border-line-2 before:content-['']">
				<Sheet />
			</div>
		</div>
	);
}

export function EditorPreview() {
	const editorLayout = useEditorLayout();
	// The real editor keeps its mode in the URL and the editor store; here a local state is enough, and the
	// `Tabs` value, the frame's mode and the panel all follow it, so every tab can actually be opened.
	const [mode, setMode] = useState<Mode>("write");
	const Panel = panels[mode];

	return (
		<Tabs value={mode} onValueChange={(value) => setMode(value as Mode)} className="contents">
			<EditorFrame
				editorLayout={editorLayout}
				bar={<PreviewBar layout={editorLayout.layout} />}
				mode={mode}
				panelLabel={panelLabels[mode]}
				panel={<Panel />}
				page={<PreviewPage />}
				assistant={null}
				mobile={
					<TabsContent value={mode} className="overflow-y-auto bg-surface">
						<Panel />
					</TabsContent>
				}
			>
				{null}
			</EditorFrame>
		</Tabs>
	);
}
