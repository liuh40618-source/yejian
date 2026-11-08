import type { CSSProperties } from "react";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@reactive-resume/utils/style";
import { SCENE, useLanding } from "./scroll";
import { CtaLink, labelClass } from "./ui";
import { RollingNumber } from "@/components/ui/rolling-number";
import { orpc } from "@/libs/orpc/client";

// The statistics service caches the totals for six hours.
const statisticsStaleTime = 6 * 60 * 60 * 1000;
// A fresh install has a handful of users; a total that small reads as a joke, so it isn't shown.
const smallestTotalShown = 100;

/**
 * 08 Numbers: the live totals, side by side, each figure over what it counts. Upstream also counts GitHub stars here;
 * that number means nothing to a Chinese reader, and it advertises the repository rather than the product, so it is
 * not shown.
 */
export function Numbers() {
	const inView = useLanding((state) => state.numbersInView);
	const totals = useQuery(orpc.statistics.getTotals.queryOptions({ staleTime: statisticsStaleTime }));
	const { data } = totals;
	// A proof section shows proof or nothing: a total that failed to load is dropped, not left as a dash.
	const rows = [
		{
			label: t`People using it`,
			detail: t`writing, tailoring and sending`,
			value: data?.users,
			failed: totals.isError,
		},
		{ label: t`Resumes created`, detail: t`and counting`, value: data?.resumes, failed: totals.isError },
	].filter((row) => !row.failed && (row.value == null || row.value >= smallestTotalShown));
	// One number alone isn't company: show none.
	if (rows.length < 2) return null;

	return (
		<section
			data-scene={SCENE.numbers}
			aria-labelledby="numbers-title"
			className="relative mx-auto max-w-[1440px] px-(--gutter) pt-[20vh] pb-[14vh]"
		>
			<h2 id="numbers-title" className={cn(labelClass, "text-ink-3")}>
				{t`In good company`}
			</h2>
			<dl
				className="@container mt-8 grid border-t border-line min-[900px]:grid-cols-(--columns)"
				style={{ "--columns": `repeat(${rows.length}, minmax(0, 1fr))`, "--count": rows.length } as CSSProperties}
			>
				{rows.map((row, index) => (
					<div
						key={row.label}
						className="flex flex-col-reverse justify-end gap-7 border-b border-line py-[6vh] min-[900px]:border-e min-[900px]:border-b-0 min-[900px]:pe-8 min-[900px]:not-first:ps-8 min-[900px]:last:border-e-0 min-[1200px]:pe-12 min-[1200px]:not-first:ps-12"
					>
						<dt className="flex flex-col gap-2">
							<span className={cn(labelClass, "text-ink-3")}>{row.label}</span>
							<span className="font-display text-[clamp(18px,1.6vw,24px)] leading-[1.3] text-ink-2 italic">
								{row.detail}
							</span>
						</dt>
						<dd className="font-anybody text-[clamp(44px,14cqi,80px)] leading-none font-light tracking-[-.03em] text-ink tabular-nums min-[900px]:text-[clamp(40px,calc(15cqi/var(--count)),80px)]">
							{row.value == null ? (
								<span className="text-ink-3">
									<span aria-hidden="true">—</span>
									<span className="sr-only">{t`Loading the total`}</span>
								</span>
							) : (
								<RollingNumber value={row.value} roll={inView} delay={index * 150} duration="2s" stagger={80} />
							)}
						</dd>
					</div>
				))}
			</dl>
			<p className="border-t border-line pt-5 font-ui text-[13px] text-ink-3 max-[900px]:border-t-0">{t`Live totals, refreshed every 6 hours.`}</p>
		</section>
	);
}

/**
 * 09 Closing call to action. The story hands over: the candidate's 青禾科技 card rests at Interview on the board Tailor
 * started, and an empty card waits under Saved for the reader's own.
 */
export function Closing() {
	const stages = [
		{ label: t`Saved`, dot: "bg-stage-saved" },
		{ label: t`Applied`, dot: "bg-stage-applied" },
		{ label: t`Interview`, dot: "bg-stage-interview" },
		{ label: t`Offer`, dot: "bg-stage-offer" },
	];

	return (
		<section
			aria-labelledby="closing-title"
			className="relative mx-auto flex max-w-[1440px] flex-col items-center gap-7 border-t border-line px-(--gutter) pt-[16vh] pb-[18vh] text-center"
		>
			<div
				aria-hidden="true"
				className="mb-4 w-[min(100%,560px)] rounded-lg border border-dashed border-line-2 px-3.5 py-3"
			>
				<div className="font-martian grid grid-cols-4 gap-2 text-xs leading-none font-medium text-ink-3">
					{stages.map((stage) => (
						<span key={stage.label} className="flex min-w-0 items-center gap-[5px]">
							<span className={cn("size-[7px] shrink-0 rounded-sm", stage.dot)} />
							{stage.label}
						</span>
					))}
				</div>
				<div className="mt-2.5 grid grid-cols-4 gap-2 text-start">
					<span className="flex h-11 items-center justify-center rounded-lg border-[1.5px] border-dashed border-accent font-display text-[15px] text-accent-text italic">
						{t`Yours`}
					</span>
					<span className="col-start-3 flex h-11 min-w-0 flex-col justify-center rounded-lg border border-line bg-raised px-2 font-ui text-[11.5px] leading-[1.2] font-semibold text-ink shadow-e2">
						{t`Fieldnote`}
						<span className="truncate text-[10.5px] font-normal text-ink-3">{t`Interview done`}</span>
					</span>
				</div>
			</div>
			<span className={cn(labelClass, "text-ink-3")}>{t`Your turn`}</span>
			<h2
				id="closing-title"
				className="font-anybody text-[clamp(48px,6vw,108px)] leading-none font-light tracking-[-.03em] text-balance text-ink"
			>
				<Trans>
					Put it all on <em className="font-display font-normal text-accent-text italic">one page.</em>
				</Trans>
			</h2>
			<p className="max-w-[28em] font-display text-[clamp(17px,1.4vw,21px)] leading-normal text-pretty text-ink-2">
				{t`Start from scratch or import what you have. It takes a few minutes, and you can come back to it anytime.`}
			</p>
			<CtaLink size="closing" />
		</section>
	);
}
