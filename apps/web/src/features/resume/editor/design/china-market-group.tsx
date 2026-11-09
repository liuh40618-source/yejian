import type { MessageDescriptor } from "@lingui/core";
import type {
	ChinaMarketPlatform,
	ChinaMarketPreset,
	ChinaMarketProfile,
	ChinaMarketScene,
	ChinaMarketStyle,
} from "@reactive-resume/schema/resume/china-market";
import type { ResumeData } from "@reactive-resume/schema/resume/data";
import type { ReactNode } from "react";
import { msg, t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { useState } from "react";
import {
	analyzeChinaMarketJob,
	applyChinaMarketPreset,
	applyChinaMarketScene,
	chinaMarketFileName,
	chinaMarketFormFileName,
	chinaMarketFormJson,
	chinaMarketFormPacket,
	chinaMarketFormText,
	chinaMarketIsRisky,
	chinaMarketJobDescription,
	chinaMarketOf,
	mapChinaMarketPlatform,
	setChinaMarketJobDescription,
	setChinaMarketPlatform,
	setChinaMarketProfile,
	setChinaMarketStyle,
} from "@reactive-resume/resume/china-market";
import {
	CHINA_MARKET_EXCLUSIONS,
	CHINA_MARKET_HANDOFF_COPY,
	CHINA_MARKET_PLATFORMS,
	CHINA_MARKET_PRESETS,
	CHINA_MARKET_SCENES,
} from "@reactive-resume/schema/resume/china-market";
import { Button } from "@reactive-resume/ui/components/button";
import { Input } from "@reactive-resume/ui/components/input";
import { NativeSelect } from "@reactive-resume/ui/components/native-select";
import { SegmentedControl, SegmentedControlItem } from "@reactive-resume/ui/components/segmented-control";
import { SwitchRow } from "@reactive-resume/ui/components/switch";
import { Textarea } from "@reactive-resume/ui/components/textarea";
import { toast } from "@reactive-resume/ui/components/toast";
import { downloadWithAnchor } from "@reactive-resume/utils/file";
import { cn } from "@reactive-resume/utils/style";
import { useResumeData, useUpdateResumeData } from "@/features/resume/builder/draft";

const SCENES = ["market", "campus", "soe"] as const;
const PRESETS = ["ats", "xhs", "table"] as const;
const PLATFORMS = ["boss", "zhilian", "job51", "soe"] as const;

const STYLE_LABELS: Record<keyof ChinaMarketStyle, MessageDescriptor> = {
	photo: msg`ID photo`,
	centerName: msg`Centred name`,
	compactIntent: msg`Intent on one line`,
	softLabels: msg`Soft text labels`,
	registrationTable: msg`Registration table (risky)`,
};

const STYLE_NOTES: Record<keyof ChinaMarketStyle, MessageDescriptor> = {
	photo: msg`Off for market applications; only state-owned online forms ask for one.`,
	centerName: msg`A centred name still reads top to bottom in one column.`,
	compactIntent: msg`City, salary and start date fold into the header line.`,
	softLabels: msg`Grey text and a thin rule only, never an icon font.`,
	registrationTable: msg`Merged cells measurably lower Chinese ATS parsing.`,
};

/** Scene-only master fields. They feed platform forms, not the PDF's own column set. */
const PROFILE_FIELDS: { key: keyof ChinaMarketProfile; label: MessageDescriptor }[] = [
	{ key: "wechat", label: msg`WeChat ID` },
	{ key: "intentCity", label: msg`Preferred city` },
	{ key: "intentSalary", label: msg`Expected salary` },
	{ key: "arrival", label: msg`Available from` },
	{ key: "english", label: msg`English / CET` },
	{ key: "major", label: msg`Full major name` },
	{ key: "gpa", label: msg`GPA / rank` },
	{ key: "courses", label: msg`Core courses` },
	{ key: "political", label: msg`Political status` },
	{ key: "gender", label: msg`Gender` },
	{ key: "nativePlace", label: msg`Native place` },
	{ key: "cadre", label: msg`Student cadre` },
];

function Section({ title, children }: { title: ReactNode; children: ReactNode }) {
	return (
		<div className="grid gap-2">
			<h3 className="text-[13px] font-semibold text-ink-2">{title}</h3>
			{children}
		</div>
	);
}

/**
 * China market: one structured master behind three outputs — the attachment PDF, the platform's
 * machine-read online form and a JD alignment report. Every write goes through the pure functions
 * in `@reactive-resume/resume/china-market`, so the mobile pane can offer exactly the same actions.
 */
export function ChinaMarketGroup() {
	const { i18n } = useLingui();
	const data = useResumeData();
	const updateResumeData = useUpdateResumeData();
	const [profileOpen, setProfileOpen] = useState(false);
	const [mappingOpen, setMappingOpen] = useState(false);

	if (!data) return null;

	// `structuredClone` cannot clone an immer draft (a Proxy). Compute the next document from the
	// committed store value, then replace the draft's top-level keys in one undoable step.
	const commit = (transform: (current: ResumeData) => ResumeData, discrete = true) => {
		const next = transform(data);
		updateResumeData(
			(draft) => {
				Object.assign(draft, next);
			},
			discrete ? { newStep: true } : { coalesceKey: "design.china-market" },
		);
	};

	const config = chinaMarketOf(data);
	const sceneInfo = CHINA_MARKET_SCENES[config.scene];
	const presetInfo = CHINA_MARKET_PRESETS[config.preset];
	const mapped = mapChinaMarketPlatform(data, config.platform);
	// The JD is part of the master, so it survives a reload and travels with the exported packet.
	const jobDescription = chinaMarketJobDescription(data);
	const analysis = analyzeChinaMarketJob(data, jobDescription);
	const risky = chinaMarketIsRisky(data);

	const downloadJson = () => {
		const packet = chinaMarketFormPacket(data, config.platform);
		downloadWithAnchor(
			new Blob([chinaMarketFormJson(packet)], { type: "application/json" }),
			chinaMarketFormFileName(data, config.platform, "json"),
		);
	};

	const downloadText = () => {
		const packet = chinaMarketFormPacket(data, config.platform);
		downloadWithAnchor(
			new Blob([chinaMarketFormText(packet)], { type: "text/plain;charset=utf-8" }),
			chinaMarketFormFileName(data, config.platform, "txt"),
		);
	};

	const copyFields = async () => {
		try {
			await navigator.clipboard.writeText(chinaMarketFormText(chinaMarketFormPacket(data, config.platform)));
			toast.add({ description: CHINA_MARKET_HANDOFF_COPY.copied });
		} catch {
			toast.add({ type: "error", description: CHINA_MARKET_HANDOFF_COPY.copyFailed });
		}
	};

	return (
		<div className="grid gap-5">
			<p className="text-[13px] leading-5 text-ink-2">
				<Trans>
					One structured master, three outputs: the attachment PDF, the platform's online form and a JD keyword report.
					The online form is the copy a machine reads.
				</Trans>
			</p>

			<Section title={<Trans>Application scene</Trans>}>
				<SegmentedControl
					aria-label={t`Application scene`}
					value={config.scene}
					onValueChange={(value) =>
						commit((current) => applyChinaMarketScene(current, value as ChinaMarketScene), true)
					}
					className="w-full"
				>
					{SCENES.map((scene) => (
						<SegmentedControlItem key={scene} value={scene}>
							{CHINA_MARKET_SCENES[scene].label}
						</SegmentedControlItem>
					))}
				</SegmentedControl>
				<p className="text-[13px] leading-5 text-ink-3">{sceneInfo.description}</p>
				<p className="text-[12px] text-ink-3">
					<Trans>Suggested file name</Trans>:{" "}
					<span className="font-mono">{chinaMarketFileName(data, config.scene)}</span>
				</p>
			</Section>

			<Section title={<Trans>PDF visual preset</Trans>}>
				<SegmentedControl
					aria-label={t`PDF visual preset`}
					value={config.preset === "custom" ? "" : config.preset}
					onValueChange={(value) => commit((current) => applyChinaMarketPreset(current, value as ChinaMarketPreset))}
					className="w-full"
				>
					{PRESETS.map((preset) => (
						<SegmentedControlItem key={preset} value={preset}>
							{CHINA_MARKET_PRESETS[preset].label}
						</SegmentedControlItem>
					))}
				</SegmentedControl>
				<p className="text-[13px] leading-5 text-ink-3">{presetInfo.description}</p>
				{config.preset === "custom" && (
					<p className="rounded-sm bg-hover px-2 py-1.5 text-[12px] text-ink-2">
						<Trans>This is a custom combination: once a switch changes, no preset claims to be active.</Trans>
					</p>
				)}
				{risky && (
					<p role="status" className="rounded-sm bg-warn-soft px-2 py-1.5 text-[12px] text-warn-text">
						<Trans>
							A registration table merges cells and measurably lowers Chinese ATS parsing. Use it only when an online
							form demands an uploaded form.
						</Trans>
					</p>
				)}
				<div className="divide-y divide-line">
					{(Object.keys(STYLE_LABELS) as (keyof ChinaMarketStyle)[]).map((key) => (
						<SwitchRow
							key={key}
							label={i18n._(STYLE_LABELS[key])}
							description={i18n._(STYLE_NOTES[key])}
							checked={config.style[key]}
							onCheckedChange={(checked) => commit((current) => setChinaMarketStyle(current, key, checked))}
						/>
					))}
				</div>
				<p className="text-[12px] text-ink-3">
					<Trans>Current template</Trans>: <span className="font-mono">{data.metadata.template}</span>
				</p>
			</Section>

			<Section title={<Trans>Structured master (form fields)</Trans>}>
				<p className="text-[13px] leading-5 text-ink-3">
					<Trans>
						These fields only reach platform forms and the state-owned header. They never become a first-class PDF
						column.
					</Trans>
				</p>
				<button
					type="button"
					onClick={() => setProfileOpen(!profileOpen)}
					className="w-fit text-[13px] text-accent hover:underline"
				>
					{profileOpen ? t`Hide fields` : t`Show 12 fields`}
				</button>
				{profileOpen && (
					<div className="grid gap-2">
						{PROFILE_FIELDS.map(({ key, label }) => (
							<label key={key} className="grid gap-1">
								<span className="text-[12px] text-ink-2">{i18n._(label)}</span>
								<Input
									value={config.profile[key]}
									onChange={(event) =>
										commit((current) => setChinaMarketProfile(current, { [key]: event.target.value }), false)
									}
								/>
							</label>
						))}
					</div>
				)}
			</Section>

			<Section title={<Trans>Platform form mapping</Trans>}>
				<NativeSelect
					aria-label={t`Job platform`}
					value={config.platform}
					onChange={(event) =>
						commit((current) => setChinaMarketPlatform(current, event.target.value as ChinaMarketPlatform))
					}
				>
					{PLATFORMS.map((platform) => (
						<option key={platform} value={platform}>
							{CHINA_MARKET_PLATFORMS[platform].label}
						</option>
					))}
				</NativeSelect>
				<p className="text-[13px] leading-5 text-ink-3">{mapped.note}</p>
				<button
					type="button"
					onClick={() => setMappingOpen(!mappingOpen)}
					className="w-fit text-[13px] text-accent hover:underline"
				>
					{mappingOpen ? t`Hide mapping` : t`Show ${mapped.autoCount} mapped / ${mapped.manualCount} to fill in`}
				</button>
				{mappingOpen && (
					<div className="grid gap-1">
						{mapped.rows.map((row, index) => (
							// `row.field` is the platform's own form label. `row.label` is the platform name and
							// must never be used as a field name (it would repeat "BOSS直聘" for every row).
							<div key={`${row.field}-${index}`} className="grid gap-0.5 rounded-sm bg-hover px-2 py-1.5">
								<span className="text-[12px] font-medium text-ink">
									{row.field}
									<span className="ml-1 font-normal text-ink-3">· {row.master}</span>
								</span>
								<span className={cn("text-[12px]", row.status === "auto" ? "text-ink-2" : "text-ink-3")}>
									{row.status === "auto" ? row.value : row.note || row.value}
								</span>
							</div>
						))}
					</div>
				)}
			</Section>

			<Section title={CHINA_MARKET_HANDOFF_COPY.title}>
				<p className="text-[13px] leading-5 text-ink-3">{CHINA_MARKET_HANDOFF_COPY.disclaimer}</p>
				<div className="flex flex-wrap gap-2">
					<Button variant="secondary" size="sm" onClick={downloadJson}>
						{CHINA_MARKET_HANDOFF_COPY.downloadJsonLabel}
					</Button>
					<Button variant="secondary" size="sm" onClick={downloadText}>
						{CHINA_MARKET_HANDOFF_COPY.downloadTextLabel}
					</Button>
					<Button variant="secondary" size="sm" onClick={() => void copyFields()}>
						{CHINA_MARKET_HANDOFF_COPY.copyLabel}
					</Button>
				</div>
				<p className="text-[12px] leading-5 text-ink-3">{CHINA_MARKET_HANDOFF_COPY.jsonHint}</p>
				<p className="text-[12px] leading-5 text-ink-3">{CHINA_MARKET_HANDOFF_COPY.textHint}</p>
			</Section>

			<Section title={<Trans>JD keyword alignment</Trans>}>
				<Textarea
					aria-label={t`Job description`}
					placeholder={t`Paste a job description to check the master uses the same words`}
					value={jobDescription}
					onChange={(event) => commit((current) => setChinaMarketJobDescription(current, event.target.value), false)}
					rows={4}
				/>
				<p className="text-[12px] text-ink-3">{CHINA_MARKET_HANDOFF_COPY.jdSavedHint}</p>
				{analysis.hasBaseline ? (
					<div className="grid gap-1 text-[13px]">
						<p className="text-ink-2">
							<Trans>Matched</Trans> {analysis.hits.length} / {analysis.required.length} ·{" "}
							<Trans>Quantified statements</Trans> {analysis.quantifiedStatements}
						</p>
						<p className="text-ink-2">
							<Trans>Covered</Trans>: {analysis.hits.join("、") || "—"}
						</p>
						<p className="text-ink-2">
							<Trans>Missing</Trans>: {analysis.misses.join("、") || "—"}
						</p>
						{analysis.suggestions.map(({ keyword, rewrite }) => (
							<p key={keyword} className="text-[12px] text-ink-3">
								{keyword}: {rewrite}
							</p>
						))}
					</div>
				) : (
					<p className="text-[13px] text-ink-3">
						<Trans>
							Paste a JD and only the keywords it actually asks for count; a fixed word list never pads the denominator.
						</Trans>
					</p>
				)}
			</Section>

			<Section title={<Trans>Deliberately not done</Trans>}>
				<ul className="grid gap-1">
					{CHINA_MARKET_EXCLUSIONS.map(({ title, reason }) => (
						<li key={title} className="text-[12px] leading-5 text-ink-3">
							<span className="font-medium text-ink-2">{title}</span> — {reason}
						</li>
					))}
				</ul>
			</Section>
		</div>
	);
}
