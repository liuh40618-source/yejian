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
import { useState } from "react";
import { Pressable, View } from "react-native";
import {
	analyzeChinaMarketJob,
	applyChinaMarketPreset,
	applyChinaMarketScene,
	chinaMarketFileName,
	chinaMarketIsRisky,
	chinaMarketOf,
	mapChinaMarketPlatform,
	setChinaMarketPlatform,
	setChinaMarketProfile,
	setChinaMarketStyle,
} from "@reactive-resume/resume/china-market";
import {
	CHINA_MARKET_EXCLUSIONS,
	CHINA_MARKET_PLATFORMS,
	CHINA_MARKET_PRESETS,
	CHINA_MARKET_SCENES,
} from "@reactive-resume/schema/resume/china-market";
import { Field, SwitchRow } from "./controls";
import { Banner, Segmented, Text, TextArea, TextField, useTheme } from "@/ui";

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
	const [jobDescription, setJobDescription] = useState("");
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
	const analysis = analyzeChinaMarketJob(data, jobDescription);
	const risky = chinaMarketIsRisky(data);

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
						<View
							key={`${row.label}-${index}`}
							style={{
								gap: space.s0,
								paddingVertical: space.s2,
								paddingHorizontal: space.s3,
								borderRadius: radius.rMd,
								backgroundColor: colors.sunken,
							}}
						>
							<Text variant="caption" weight={600}>
								{row.label}
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
					{t`JD keyword alignment`}
				</Text>
				<TextArea
					label={t`Job description`}
					placeholder={t`Paste a job description to check the master uses the same words`}
					value={jobDescription}
					onChangeText={setJobDescription}
					minLines={4}
				/>
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
