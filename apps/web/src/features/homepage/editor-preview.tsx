import { Button } from "@reactive-resume/ui/components/button";
import { Icon } from "@reactive-resume/ui/components/icon";
import { Input } from "@reactive-resume/ui/components/input";
/**
 * A stand-in for the editor, for looking at the shell's design without a database. It uses the real frame, bar and
 * UI components; only the panel's fields and the page are placeholders. Local preview only.
 */
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@reactive-resume/ui/components/tabs";
import { Sheet } from "@/features/homepage/sheet";
import { EditorBarFrame } from "@/features/resume/editor/chrome/bar";
import { EditorFrame, useEditorLayout } from "@/features/resume/editor/chrome/shell";

const modes = [
	{ value: "write", label: "撰写", icon: "pencil-simple" },
	{ value: "design", label: "设计", icon: "palette" },
	{ value: "check", label: "检查", icon: "list-checks" },
	{ value: "share", label: "分享", icon: "globe-hemisphere-west" },
] as const;

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

	return (
		<Tabs value="write" className="contents">
			<EditorFrame
				editorLayout={editorLayout}
				bar={<PreviewBar layout={editorLayout.layout} />}
				mode="write"
				panelLabel="内容"
				panel={<PreviewPanel />}
				page={<PreviewPage />}
				assistant={null}
				mobile={
					<TabsContent value="write" className="overflow-y-auto bg-surface">
						<PreviewPanel />
					</TabsContent>
				}
			>
				{null}
			</EditorFrame>
		</Tabs>
	);
}
