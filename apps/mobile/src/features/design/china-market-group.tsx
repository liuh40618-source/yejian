import type { DesignWrite } from "./draft";
import type {
	ChinaMarketPlatform,
	ChinaMarketPreset,
	ChinaMarketProfile,
	ChinaMarketScene,
	ChinaMarketStyle,
} from "@reactive-resume/schema/resume/china-market";
import type { ResumeData } from "@reactive-resume/schema/resume/data";
import { useLingui } from "@lingui/react/macro";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Pressable, View } from "react-native";
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
import { Field, SwitchRow } from "./controls";
import { shareText } from "@/features/workspace/share";
import { Banner, Button, Segmented, Text, TextArea, TextField, showToast, useTheme } from "@/ui";

const SCENES = ["market", "campus", "soe"] as const;
const PRESETS = ["ats", "xhs", "table"] as const;
const PLATFORMS = ["boss", "zhilian", "job51", "soe"] as const;

type ChinaMarketGroupProps = { data: ResumeData; write: DesignWrite; disabled: boolean };

/**
 * The phone counterpart of the web panel, with the same actions in the same order. Both call the pure
 * functions in `@reactive-resume/resume/china-market`; neither re-implements a scene, a preset or a mapping.
 */
export function ChinaMarketGroup({ data, write, disabled }: ChinaMarketGroupProps) {
	const { t } = useLingui();
	const { colors, radius, space } = useTheme();
	const [profileOpen, setProfileOpen] = useState(false);
	const [mappingOpen, setMappingOpen] = useState(false);

	// `structuredClone` cannot clone an immer draft (a Proxy): transform the committed document, then
	// replace the draft's top-level keys in one undoable step.
	const commit = (transform: (current: ResumeData) => ResumeData, discrete = true) => {
		if (disabled) return;
		const next = transform(data);
		write(
			"china-market",
			(draft) => {
				Object.assign(draft, next);
			},
			discrete,
		);
	};

	const config = chinaMarketOf(data);
	const mapped = mapChinaMarketPlatform(data, config.platform);
	// The JD is part of the master, so it survives a reload and travels with the exported packet.
	const jobDescription = chinaMarketJobDescription(data);
	const analysis = analyzeChinaMarketJob(data, jobDescription);
	const risky = chinaMarketIsRisky(data);

	// `shareText` rejects when the system share sheet is unavailable; surface that instead of an
	// unhandled rejection (the workspace packet panel does the same through its `run` wrapper).
	const exportPacket = (extension: "json" | "txt") => {
		const packet = chinaMarketFormPacket(data, config.platform);
		const share =
			extension === "json"
				? shareText(
						chinaMarketFormFileName(data, config.platform, "json"),
						chinaMarketFormJson(packet),
						"application/json",
						"public.json",
					)
				: shareText(
						chinaMarketFormFileName(data, config.platform, "txt"),
						chinaMarketFormText(packet),
						"text/plain",
						"public.plain-text",
					);
		void share.catch(() => showToast({ message: CHINA_MARKET_HANDOFF_COPY.exportFailed }));
	};

	const copyFields = async () => {
		try {
			await Clipboard.setStringAsync(chinaMarketFormText(chinaMarketFormPacket(data, config.platform)));
			showToast({ message: CHINA_MARKET_HANDOFF_COPY.copied });
		} catch {
			showToast({ message: CHINA_MARKET_HANDOFF_COPY.copyFailed });
		}
	};

	const styleRows: { key: keyof ChinaMarketStyle; label: string; description: string }[] = [
		{
			key: "photo",
			label: t`ID photo`,
			description: t`Off for market applications; only state-owned online forms ask for one.`,
		},
		{
			key: "centerName",
			label: t`Centred name`,
			description: t`A centred name still reads top to bottom in one column.`,
		},
		{
			key: "compactIntent",
			label: t`Intent on one line`,
			description: t`City, salary and start date fold into the header line.`,
		},
		{
			key: "softLabels",
			label: t`Soft text labels`,
			description: t`Grey text and a thin rule only, never an icon font.`,
		},
		{
			key: "registrationTable",
			label: t`Registration table (risky)`,
			description: t`Merged cells measurably lower Chinese ATS parsing.`,
		},
	];

	const profileFields: { key: keyof ChinaMarketProfile; label: string }[] = [
		{ key: "wechat", label: t`WeChat ID` },
		{ key: "intentCity", label: t`Preferred city` },
		{ key: "intentSalary", label: t`Expected salary` },
		{ key: "arrival", label: t`Available from` },
		{ key: "english", label: t`English / CET` },
		{ key: "major", label: t`Full major name` },
		{ key: "gpa", label: t`GPA / rank` },
		{ key: "courses", label: t`Core courses` },
		{ key: "political", label: t`Political status` },
		{ key: "gender", label: t`Gender` },
		{ key: "nativePlace", label: t`Native place` },
		{ key: "cadre", label: t`Student cadre` },
	];

	return (
		<View style={{ gap: space.s6 }}>
			<Text variant="caption" color="ink3">
				{t`One structured master, three outputs: the attachment PDF, the platform's online form and a JD keyword report. The online form is the copy a machine reads.`}
			</Text>

			<Field label={t`Application scene`} helper={CHINA_MARKET_SCENES[config.scene].description}>
				<Segmented<ChinaMarketScene>
					label={t`Application scene`}
					value={config.scene}
					options={SCENES.map((scene) => ({ value: scene, label: CHINA_MARKET_SCENES[scene].label }))}
					onChange={(value) => commit((current) => applyChinaMarketScene(current, value as ChinaMarketScene))}
				/>
			</Field>

			<Text variant="caption" color="ink3">
				{t`Suggested file name`}: {chinaMarketFileName(data, config.scene)}
			</Text>

			<Field label={t`PDF visual preset`} helper={CHINA_MARKET_PRESETS[config.preset].description}>
				<Segmented<ChinaMarketPreset | "">
					label={t`PDF visual preset`}
					value={config.preset === "custom" ? "" : config.preset}
					options={PRESETS.map((preset) => ({ value: preset, label: CHINA_MARKET_PRESETS[preset].label }))}
					onChange={(value) => commit((current) => applyChinaMarketPreset(current, value as ChinaMarketPreset))}
				/>
			</Field>

			{config.preset === "custom" ? (
				<Text variant="caption" color="ink3">
					{t`This is a custom combination: once a switch changes, no preset claims to be active.`}
				</Text>
			) : null}

			{risky ? (
				<Banner
					tone="warn"
					message={t`A registration table merges cells and measurably lowers Chinese ATS parsing. Use it only when an online form demands an uploaded form.`}
				/>
			) : null}

			<View>
				{styleRows.map((row) => (
					<SwitchRow
						key={row.key}
						label={row.label}
						description={row.description}
						value={config.style[row.key]}
						disabled={disabled}
						onChange={(checked) => commit((current) => setChinaMarketStyle(current, row.key, checked))}
					/>
				))}
			</View>

			<Field
				label={t`Structured master (form fields)`}
				helper={t`These fields only reach platform forms and the state-owned header. They never become a first-class PDF column.`}
			>
				<Pressable
					accessibilityRole="button"
					accessibilityState={{ expanded: profileOpen }}
					onPress={() => setProfileOpen(!profileOpen)}
				>
					<Text variant="callout" color="accentText">
						{profileOpen ? t`Hide fields` : t`Show 12 fields`}
					</Text>
				</Pressable>
			</Field>

			{profileOpen ? (
				<View style={{ gap: space.s4 }}>
					{profileFields.map((field) => (
						<TextField
							key={field.key}
							label={field.label}
							value={config.profile[field.key]}
							editable={!disabled}
							onChangeText={(text) => commit((current) => setChinaMarketProfile(current, { [field.key]: text }), false)}
						/>
					))}
				</View>
			) : null}

			<Field label={t`Platform form mapping`} helper={mapped.note}>
				<Segmented<ChinaMarketPlatform>
					label={t`Job platform`}
					orientation="vertical"
					value={config.platform}
					options={PLATFORMS.map((platform) => ({ value: platform, label: CHINA_MARKET_PLATFORMS[platform].label }))}
					onChange={(value) => commit((current) => setChinaMarketPlatform(current, value as ChinaMarketPlatform))}
				/>
			</Field>

			<Pressable
				accessibilityRole="button"
				accessibilityState={{ expanded: mappingOpen }}
				onPress={() => setMappingOpen(!mappingOpen)}
			>
				<Text variant="callout" color="accentText">
					{mappingOpen ? t`Hide mapping` : t`Show ${mapped.autoCount} mapped / ${mapped.manualCount} to fill in`}
				</Text>
			</Pressable>

			{mappingOpen ? (
				<View style={{ gap: space.s1 }}>
					{mapped.rows.map((row, index) => (
						// `row.field` is the platform's own form label. `row.label` is the platform name and
						// must never be used as a field name (it would repeat "BOSS直聘" for every row).
						<View
							key={`${row.field}-${index}`}
							style={{
								gap: space.s0,
								paddingVertical: space.s2,
								paddingHorizontal: space.s3,
								borderRadius: radius.rMd,
								backgroundColor: colors.sunken,
							}}
						>
							<Text variant="caption" weight={600}>
								{row.field} · {row.master}
							</Text>
							<Text variant="caption" color="ink2">
								{row.status === "auto" ? row.value : row.note || row.value}
							</Text>
						</View>
					))}
				</View>
			) : null}

			<View style={{ gap: space.s2 }}>
				<Text variant="callout" weight={600}>
					{CHINA_MARKET_HANDOFF_COPY.title}
				</Text>
				<Text variant="caption" color="ink3">
					{CHINA_MARKET_HANDOFF_COPY.disclaimer}
				</Text>
				<Button
					label={CHINA_MARKET_HANDOFF_COPY.downloadJsonLabel}
					variant="secondary"
					disabled={disabled}
					onPress={() => exportPacket("json")}
				/>
				<Button
					label={CHINA_MARKET_HANDOFF_COPY.downloadTextLabel}
					variant="secondary"
					disabled={disabled}
					onPress={() => exportPacket("txt")}
				/>
				<Button
					label={CHINA_MARKET_HANDOFF_COPY.copyLabel}
					variant="secondary"
					disabled={disabled}
					onPress={() => void copyFields()}
				/>
				<Text variant="caption" color="ink3">
					{CHINA_MARKET_HANDOFF_COPY.jsonHint}
				</Text>
				<Text variant="caption" color="ink3">
					{CHINA_MARKET_HANDOFF_COPY.textHint}
				</Text>
			</View>

			<View style={{ gap: space.s2 }}>
				<Text variant="callout" weight={600}>
					{t`JD keyword alignment`}
				</Text>
				<TextArea
					label={t`Job description`}
					placeholder={t`Paste a job description to check the master uses the same words`}
					value={jobDescription}
					editable={!disabled}
					onChangeText={(text) => commit((current) => setChinaMarketJobDescription(current, text), false)}
					minLines={4}
				/>
				<Text variant="caption" color="ink3">
					{CHINA_MARKET_HANDOFF_COPY.jdSavedHint}
				</Text>
				{analysis.hasBaseline ? (
					<View style={{ gap: space.s1 }}>
						<Text variant="caption" color="ink2">
							{t`Matched`} {analysis.hits.length} / {analysis.required.length} · {t`Quantified statements`}{" "}
							{analysis.quantifiedStatements}
						</Text>
						<Text variant="caption" color="ink2">
							{t`Covered`}: {analysis.hits.join("、") || "—"}
						</Text>
						<Text variant="caption" color="ink2">
							{t`Missing`}: {analysis.misses.join("、") || "—"}
						</Text>
						{analysis.suggestions.map(({ keyword, rewrite }) => (
							<Text key={keyword} variant="caption" color="ink3">
								{keyword}: {rewrite}
							</Text>
						))}
					</View>
				) : (
					<Text variant="caption" color="ink3">
						{t`Paste a JD and only the keywords it actually asks for count; a fixed word list never pads the denominator.`}
					</Text>
				)}
			</View>

			<View style={{ gap: space.s1 }}>
				<Text variant="callout" weight={600}>
					{t`Deliberately not done`}
				</Text>
				{CHINA_MARKET_EXCLUSIONS.map(({ title, reason }) => (
					<Text key={title} variant="caption" color="ink3">
						{title} — {reason}
					</Text>
				))}
			</View>
		</View>
	);
}
