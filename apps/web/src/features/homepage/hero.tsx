import type { CSSProperties } from "react";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useIsClient } from "usehooks-ts";
import { toast } from "@reactive-resume/ui/components/toast";
import { cn } from "@reactive-resume/utils/style";
import { prefersReducedMotion, SCENE } from "./scroll";
import { Sheet } from "./sheet";
import { CtaLink } from "./ui";
import { authClient } from "@/libs/auth/client";
import { sessionQueryKey } from "@/libs/root-context";

/** The four lines of the headline; the footer repeats them. Lines 2 and 4 are highlighted. */
export const getHeadline = () =>
	[
		t({
			message: "A free, open-source",
			comment: "Hero headline, line 1 of 4: A free, open-source / resume builder / and / career manager.",
		}),
		t({
			message: "resume builder",
			comment:
				"Hero headline, line 2 of 4: A free, open-source / resume builder / and / career manager. Lines 2 and 4 are highlighted: keep each a complete phrase.",
		}),
		t({
			message: "and",
			context: "hero headline",
			comment: "Hero headline, line 3 of 4: A free, open-source / resume builder / and / career manager.",
		}),
		t({
			message: "career manager.",
			comment:
				"Hero headline, line 4 of 4: A free, open-source / resume builder / and / career manager. Lines 2 and 4 are highlighted: keep each a complete phrase.",
		}),
	] as const;

/**
 * The seven lines a resume is made of, set in the outer margin the way a proof sheet carries its notes. They land
 * from the right as the page composes, and stay: this margin is the hero's only decoration.
 */
const getMarginNotes = () => [
	{ text: t`Design systems`, y: -20, z: 0.3 },
	{ text: t`Shipped checkout for iOS`, y: -13.2, z: 0.5 },
	{ text: t`+13 pts activation`, y: -6.6, z: 0.4 },
	{ text: t`WCAG 2.1 AA`, y: 0, z: 0.6 },
	{ text: t`Six product teams`, y: 6.6, z: 0.35 },
	{ text: t`40% faster reviews`, y: 13.2, z: 0.5 },
	{ text: t`Promoted to lead, 2021`, y: 19.8, z: 0.45 },
];

type Glyph = { ch: string; accent: boolean };

/** Splits the headline into the characters a composing stick would hold, keeping the space as a blank. */
const toGlyphs = (parts: readonly (readonly [string, boolean])[]): Glyph[] =>
	parts.flatMap(([text, accent]) => [...text].map((ch) => ({ ch, accent })));

/** One line of the headline, set into 字格: a cell per character, the rules standing in for the type body. */
function TypeCase({ glyphs }: { glyphs: Glyph[] }) {
	return (
		<span className="flex border-e border-line">
			{glyphs.map(({ ch, accent }, i) => (
				<span
					// The headline is a fixed string, so position is a stable identity here.
					key={`${i}-${ch}`}
					className={cn(
						"flex h-(--cell) w-(--cell) items-center justify-center border-s border-b border-line [font-size:calc(var(--cell)*.84)] leading-none",
						accent && "text-accent-text",
					)}
				>
					{ch === " " ? null : ch}
				</span>
			))}
		</span>
	);
}

/**
 * 00 Hero, "Everything you've done, on one page." A specimen sheet: the headline set into 字格, the page laid on the
 * grid, and the resume's own lines noted in the margin. Nothing floats, nothing is drawn by hand.
 */
export function Hero() {
	const ref = useRef<HTMLElement>(null);

	// The rules draw in once, shortly after load; the page settles and the margin notes land on the same beat.
	useEffect(() => {
		const section = ref.current;
		if (!section) return;
		if (prefersReducedMotion()) return void section.style.setProperty("--ld", "1");
		const timer = window.setTimeout(() => section.style.setProperty("--ld", "1"), 120);
		return () => window.clearTimeout(timer);
	}, []);

	const headline = getHeadline();
	const line1 = toGlyphs([
		[headline[0], false],
		[" ", false],
		[headline[1], true],
	]);
	const line2 = toGlyphs([
		[headline[2], false],
		[" ", false],
		[headline[3], false],
	]);

	return (
		<section ref={ref} id="top" data-scene={SCENE.hero} aria-labelledby="hero-title" className="relative h-svh">
			{/* --pt is the page's centre. Below 900px it sits under the stacked headline (128px + three 10vw lines). */}
			<div className="min-[900px]:short:[--pw:min(24vw,36vh)] relative h-svh overflow-clip [--cell:clamp(40px,5.9vw,72px)] [--e2:var(--ld,0)] [--e:var(--ld,0)] [--pt:calc(132px+26vw+var(--pw)*.647)] [--pw:min(58vw,32vh)] motion-reduce:[--ld:1] min-[900px]:[--pt:60%] min-[900px]:[--pw:min(26vw,38vh)]">
				{/* The grid the sheet is laid on: the type area's two margin rules, the sheet's own edges, and the trim
				    marks a print sheet is cut down to. 1px, exact — these lines carry the page's whole structure. */}
				<div aria-hidden="true" className="pointer-events-none absolute inset-0 text-line-2">
					<span className="absolute inset-y-0 left-(--gutter) w-px [transform:scaleY(var(--ld,0))] bg-current opacity-45 [transition:transform_1.4s_var(--ease)]" />
					<span className="absolute inset-y-0 right-(--gutter) w-px [transform:scaleY(var(--ld,0))] bg-current opacity-45 [transition:transform_1.4s_var(--ease)]" />

					<span className="absolute top-[7vh] bottom-[7vh] left-[calc(50%-var(--pw)/2)] w-px [transform:scaleY(var(--ld,0))] bg-current [transition:transform_1.6s_var(--ease)_.2s]" />
					<span className="absolute top-[7vh] bottom-[7vh] left-[calc(50%+var(--pw)/2)] w-px [transform:scaleY(var(--ld,0))] bg-current [transition:transform_1.6s_var(--ease)_.35s]" />
					<span className="absolute inset-x-[3vw] top-[calc(var(--pt)-var(--pw)*.647)] h-px [transform:scaleX(var(--ld,0))] bg-current [transition:transform_1.8s_var(--ease)_.5s]" />
					<span className="absolute inset-x-[3vw] top-[calc(var(--pt)+var(--pw)*.647)] h-px [transform:scaleX(var(--ld,0))] bg-current [transition:transform_1.8s_var(--ease)_.65s]" />

					{/* The sheet's baseline grid: every 24px, faint enough to read as texture and not as content. */}
					<div
						className="absolute left-[calc(50%-var(--pw)/2)] h-[calc(var(--pw)*1.294)] w-(--pw) [background-image:repeating-linear-gradient(to_bottom,currentColor_0_1px,transparent_1px_24px)] opacity-[calc(var(--ld,0)*.3)] [transition:opacity_1.6s_ease_.9s]"
						style={{ top: "calc(var(--pt) - var(--pw) * .647)" }}
					/>

					{/* Trim marks: four corners, two rules each, the way a print sheet is cut down to size. */}
					{(
						[
							[
								"top-[calc(var(--pt)-var(--pw)*.647)]",
								"left-[calc(50%-var(--pw)/2)]",
								"translate-x-[-12px]",
								"translate-y-[-12px]",
							],
							[
								"top-[calc(var(--pt)-var(--pw)*.647)]",
								"left-[calc(50%+var(--pw)/2)]",
								"translate-x-[4px]",
								"translate-y-[-12px]",
							],
							[
								"top-[calc(var(--pt)+var(--pw)*.647)]",
								"left-[calc(50%-var(--pw)/2)]",
								"translate-x-[-12px]",
								"translate-y-[4px]",
							],
							[
								"top-[calc(var(--pt)+var(--pw)*.647)]",
								"left-[calc(50%+var(--pw)/2)]",
								"translate-x-[4px]",
								"translate-y-[4px]",
							],
						] as const
					).map(([top, left, tx, ty]) => (
						<span key={`${top}-${left}`} className={cn("absolute size-2", top, left, tx, ty)}>
							<span className="absolute inset-x-0 top-0 h-px bg-current" />
							<span className="absolute inset-y-0 left-0 w-px bg-current" />
						</span>
					))}
				</div>

				{/* Outside the guide layer: a filter would make the browser count this label as a screen-sized paint. */}
				<span
					aria-hidden="true"
					className="font-martian pointer-events-none absolute top-[calc(var(--pt)+var(--pw)*.647+14px)] left-[calc(50%-var(--pw)/2)] hidden text-[10.5px] leading-none tracking-[.06em] whitespace-nowrap text-ink-3 opacity-[var(--ld,0)] transition-opacity delay-[1.4s] duration-1000 min-[900px]:block"
				>
					A4 · 210 × 297 mm
				</span>

				{/* 竖排: the promise set the way Chinese was set before Latin punctuation arrived — upright, top to
				    bottom, in the margin where a book's running text would run. */}
				<span className="absolute top-[calc(64px+4vh+var(--cell)*2+48px)] left-[calc(var(--gutter)+17px)] hidden font-display text-[14px] leading-none tracking-[.34em] text-ink-3 opacity-[var(--ld,0)] transition-opacity delay-[1.6s] duration-1000 [writing-mode:vertical-rl] min-[900px]:block">
					{t`Everything you've done, set on one page.`}
				</span>

				{/* The margin: the resume's own lines, set right against the outer rule like a proof sheet's notes. */}
				<div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden min-[900px]:block">
					{getMarginNotes().map(({ text, y, z }) => (
						<span
							key={text}
							dir="auto"
							className="hero-fragment flex w-[18vw] items-center justify-end gap-2.5 border-b border-line pb-[9px] text-end"
							style={
								{
									"--x": "44vw",
									"--y": `${y * 1.05}vh`,
									"--tx": "38vw",
									"--ty": `${y}vh`,
									"--r": "0deg",
									"--z": z,
								} as CSSProperties
							}
						>
							<span className="size-[3px] flex-none bg-accent" />
							<span className="font-display text-[15px] leading-none whitespace-nowrap text-ink-2">{text}</span>
						</span>
					))}
				</div>

				<div className="hero-page absolute top-(--pt) left-1/2 aspect-[612/792] w-(--pw) rounded-sm border border-line shadow-paper">
					<Sheet />
				</div>

				<h1 id="hero-title" className="absolute inset-x-(--gutter) top-[calc(64px+4vh)] z-2">
					{/* The page reads as one sentence; the 字格 below is its setting, not a second copy. */}
					<span className="sr-only">
						{headline[0]} {headline[1]} {headline[2]} {headline[3]}
					</span>

					{/* Below 900px there is no room for eleven cells: the headline falls back to two set lines. Balanced,
					    because Chinese has no hyphen to rescue a line and "具。" stranded on its own reads as a mistake. */}
					<span
						aria-hidden="true"
						className="block font-display text-[clamp(28px,8.1vw,52px)] leading-[1.16] font-light tracking-[-.01em] text-balance text-ink min-[900px]:hidden"
					>
						{headline[0]} <em className="text-accent-text not-italic">{headline[1]}</em>
						<br />
						{headline[2]} {headline[3]}
					</span>

					{/* 字格: one cell per character, the rules standing in for the type body. */}
					<span aria-hidden="true" className="hidden w-fit font-display font-light text-ink min-[900px]:block">
						<TypeCase glyphs={line1} />
						<TypeCase glyphs={line2} />
					</span>
				</h1>

				<div className="absolute inset-x-(--gutter) bottom-[clamp(20px,4vh,40px)] z-2 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
					<p className="max-w-full font-display text-base leading-[1.45] text-pretty text-ink-2 min-[900px]:max-w-[min(25em,calc(50vw-var(--pw)/2-5vw))] min-[900px]:text-[clamp(17px,1.3vw,20px)]">
						{t`Build a professional resume, download it as PDF or Word, and manage your job search in one place. Free templates, no ads, no paywall.`}
					</p>
					<div className="flex flex-col items-end gap-2">
						<CtaLink size="hero" />
						<GuestLink />
					</div>
				</div>
			</div>
		</section>
	);
}

/**
 * "Try it without an account", under the hero's call to action, where the server allows guests: a guest session opens
 * Documents, and signing up later keeps the work. The build's prerendered page has no route to read flags from, so
 * the link appears once the live page has loaded.
 */
function GuestLink() {
	return useIsClient() ? <GuestLinkButton /> : null;
}

function GuestLinkButton() {
	const { flags, session } = useRouteContext({ strict: false });
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [pending, setPending] = useState(false);
	if (!flags?.allowGuestLogin || session) return null;

	const failed = (message?: string) => {
		setPending(false);
		toast.add({ type: "error", description: message || t`Couldn't continue as a guest. Try again.` });
	};
	const start = async () => {
		setPending(true);
		try {
			const { error } = await authClient.signIn.anonymous();
			if (error) return failed(error.message);
			await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
			void navigate({ to: "/dashboard" });
		} catch {
			failed();
		}
	};

	return (
		<button
			type="button"
			disabled={pending}
			onClick={() => void start()}
			className="font-ui text-sm text-ink-2 underline underline-offset-3 transition-colors hover:text-ink disabled:opacity-60"
		>
			<Trans>Try it without an account</Trans>
		</button>
	);
}
