import { t } from "@lingui/core/macro";
import { cn } from "@reactive-resume/utils/style";
import { goToScene, SCENE, useLanding } from "./scroll";
import { CtaLink } from "./ui";
import { useTheme } from "@/features/theme/provider";

const getStoryScenes = () => [
	{ scene: SCENE.write, label: t`Write` },
	{ scene: SCENE.design, label: t`Design` },
	{ scene: SCENE.check, label: t`Check` },
	{ scene: SCENE.tailor, label: t`Tailor` },
	{ scene: SCENE.share, label: t`Share` },
	{ scene: SCENE.prepare, label: t`Prepare` },
	{ scene: SCENE.remember, label: t`Remember` },
];

export function LandingHeader() {
	const scrolled = useLanding((state) => state.scrolled);
	const night = useLanding((state) => state.night);
	const activeScene = useLanding((state) => state.activeScene);

	return (
		<header
			className={cn(
				// The ink fades to light with Share's sky (--nt), so it never jumps against a half-dark background.
				"night-ink fixed inset-x-0 top-0 z-70 flex h-16 items-center gap-7 ps-(--gutter) pe-[calc(var(--gutter)+30px)] whitespace-nowrap",
			)}
		>
			<div
				aria-hidden="true"
				className={cn(
					"header-taper pointer-events-none absolute inset-x-0 top-0 -z-1 h-28 transition-opacity duration-[.4s]",
					scrolled ? "opacity-[calc(1-var(--nt,0))]" : "opacity-0",
				)}
			/>

			<a href="#top" className="flex items-center gap-2.5 rounded-md">
				<img
					src="/icon/light.svg"
					alt=""
					width={30}
					height={30}
					className={cn("size-[30px] dark:hidden", night && "hidden")}
				/>
				<img
					src="/icon/dark.svg"
					alt=""
					width={30}
					height={30}
					className={cn("hidden size-[30px] dark:block", night && "block")}
				/>
				{/* A name nobody has seen before has to be readable, not just announced: serif Chinese, at the mark's optical size. */}
				<span className="font-display text-[21px] leading-none tracking-[.01em]">页见</span>
			</a>

			<nav aria-label={t`Story`} className="mx-auto hidden items-center gap-0.5 min-[1240px]:flex">
				{getStoryScenes().map(({ scene, label }) => {
					const active = activeScene === scene;
					return (
						<button
							key={scene}
							type="button"
							aria-current={active ? "step" : undefined}
							onClick={() => goToScene(scene, 0.04)}
							className={cn(
								"font-martian relative flex h-[34px] items-center gap-[7px] rounded-sm px-[11px] text-xs leading-none font-medium font-stretch-[87.5%] transition-opacity duration-300",
								!active && "opacity-65 hover:opacity-100",
							)}
						>
							<span
								aria-hidden="true"
								className={cn("size-1.5 rounded-sm transition-colors duration-300", active && "bg-accent")}
							/>
							{label}
							{/* How much of the current scene is left: a line that fills with its scroll progress (--sp). */}
							{active && (
								<span
									aria-hidden="true"
									className="absolute inset-x-[11px] bottom-[3px] h-0.5 origin-left rounded-full bg-accent rtl:origin-right"
									style={{ transform: "scaleX(var(--sp, 0))" }}
								/>
							)}
						</button>
					);
				})}
			</nav>

			<div className="ms-auto flex items-center gap-2">
				<CtaLink size="header" />
			</div>
		</header>
	);
}

/**
 * The theme switch, as a printer's swatch: one square of ink on the paper. Light mode leaves it as the sheet — an
 * outline; dark mode floods it. It replaces the hanging bulb the page used to carry, which was the last hand-drawn
 * object on a page that is now set, not sketched.
 */
export function ThemeCord() {
	const { resolvedTheme, toggleTheme } = useTheme();
	const dark = resolvedTheme === "dark";
	const label = dark ? t`Switch to light mode` : t`Switch to dark mode`;

	return (
		<button
			type="button"
			onClick={() => toggleTheme()}
			aria-label={label}
			aria-pressed={dark}
			title={label}
			className="night-ink fixed end-[clamp(6px,1vw,14px)] top-0 z-72 grid h-16 w-[30px] place-items-center"
		>
			<span
				aria-hidden="true"
				className={cn(
					"size-[21px] border-[1.5px] border-current transition-colors duration-300 hover:opacity-65",
					// The chip shows the ink you'll get, not the one you're on: filled means "this goes dark".
					dark ? "bg-transparent" : "bg-current",
				)}
			/>
		</button>
	);
}
