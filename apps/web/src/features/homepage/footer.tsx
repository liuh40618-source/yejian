import type { ReactNode } from "react";
import { t } from "@lingui/core/macro";
import { Link } from "@tanstack/react-router";
import { cn } from "@reactive-resume/utils/style";
import { getHeadline } from "./hero";
import { SCENE } from "./scroll";
import { labelClass } from "./ui";

// Every link here resolves inside this app: the marketing page's own scenes, or a real route. Upstream points this
// footer at GitHub, Discord, Reddit, Crowdin and its docs site; none of those are reachable or relevant to a reader
// here, and they send the fork's traffic back to the project it was forked from.
// On touch, each link is a 44px row; the column gap closes so the columns don't grow.
const linkClass =
	"text-ink transition-colors hover:text-accent-text pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center";

type FooterLink =
	| { label: string; href: string }
	| { label: string; to: "/ats-checker" | "/auth/login" | "/auth/register" | "/resume-templates" };

const getColumns = (): { id: string; title: string; links: FooterLink[] }[] => [
	{
		id: "product",
		title: t`Product`,
		links: [
			{ label: t`Templates`, to: "/resume-templates" },
			{ label: t`ATS checker`, to: "/ats-checker" },
			{ label: t`Get started`, to: "/auth/register" },
			{ label: t`Sign in`, to: "/auth/login" },
		],
	},
	{
		id: "story",
		title: t`How it works`,
		links: [
			{ label: t`Write`, href: "#write" },
			{ label: t`Design`, href: "#design" },
			{ label: t`Check`, href: "#check" },
			{ label: t`Tailor`, href: "#tailor" },
			{ label: t`Share`, href: "#share" },
		],
	},
	{
		id: "search",
		title: t`Job search`,
		links: [
			{ label: t`Prepare`, href: "#prepare" },
			{ label: t`Remember`, href: "#remember" },
			{ label: t`Questions`, href: "#faq" },
		],
	},
];

function FooterLinkItem({ link }: { link: FooterLink }): ReactNode {
	if ("to" in link) {
		return (
			<Link to={link.to} className={linkClass}>
				{link.label}
			</Link>
		);
	}
	return (
		<a href={link.href} className={linkClass}>
			{link.label}
		</a>
	);
}

/**
 * 13 Footer: the promise once more, the links, then the type case the page was set from. Upstream ended on a
 * watercolour desk whose objects each led back into the story and whose lamp switched the theme; the same seven
 * scenes are named in the columns above, so the case below is free to be what it looks like — the raw material.
 */
export function LandingFooter() {
	const headline = getHeadline();

	return (
		<footer data-scene={SCENE.footer} className="relative overflow-hidden border-t border-line">
			<div className="relative z-1 mx-auto grid max-w-[1440px] gap-x-12 gap-y-14 px-(--gutter) pt-20 min-[1000px]:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
				<div className="flex min-w-0 flex-col items-start gap-5">
					<img
						loading="lazy"
						src="/logo/light.svg"
						alt="页见"
						width={140}
						height={140}
						className="-ms-[18px] -mt-[22px] -mb-[22px] size-[140px] dark:hidden"
					/>
					<img
						loading="lazy"
						src="/logo/dark.svg"
						alt="页见"
						width={140}
						height={140}
						className="-ms-[18px] -mt-[22px] -mb-[22px] hidden size-[140px] dark:block"
					/>
					<p className="font-display text-[clamp(30px,3vw,46px)] leading-[1.06] tracking-[-.01em] text-balance text-ink">
						<span className="block">{headline[0]}</span>
						<em className="block text-accent-text">{headline[1]}</em>
						<span className="block">
							{headline[2]} <em className="text-accent-text">{headline[3]}</em>
						</span>
					</p>
				</div>

				<div className="grid grid-cols-2 gap-x-8 gap-y-10 min-[640px]:grid-cols-4">
					{getColumns().map((column) => (
						<nav
							key={column.id}
							aria-labelledby={`footer-${column.id}`}
							className="flex min-w-0 flex-col gap-2.5 font-ui text-sm"
						>
							<h2 id={`footer-${column.id}`} className={cn(labelClass, "mb-1 text-ink-3")}>
								{column.title}
							</h2>
							<ul className="flex flex-col gap-2.5 pointer-coarse:gap-0">
								{column.links.map((link) => (
									<li key={link.label}>
										<FooterLinkItem link={link} />
									</li>
								))}
							</ul>
						</nav>
					))}
				</div>
			</div>

			<div className="relative z-1 mx-auto mt-16 flex max-w-[1440px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-(--gutter) font-ui text-[13px] leading-normal text-ink-3">
				{/* Narrow enough to wrap into two balanced lines in any language, without splitting the translation. */}
				<p className="max-w-[24ch] text-balance">{t`The resume is yours, not the platform's.`}</p>
				<p className="flex flex-wrap items-center gap-x-4 gap-y-1">
					<span>{t`Built on the MIT-licensed Reactive Resume`}</span>
					<span className="font-mono text-xs">v{__APP_VERSION__}</span>
				</p>
			</div>

			<TypeCase />
		</footer>
	);
}

/*
 * The last band of the page: a printer's type case, the single characters a resume is set from, held in a tray of
 * sorts. It replaces the Tuscan desk upstream drew here — a watercolour window, wax-sealed letters and a brass lamp,
 * which read as somebody else's office and fought the grid the rest of the page is built on.
 *
 * The seven scene names are buried in the case in accent ink: 撰 写 设 计 检 查 定 制 分 享 准 备 记 住. Nothing points
 * at them; they are there for whoever looks, which is the whole idea of a case of loose type.
 */
const sorts =
	"简历投递面试复盘定制排版机筛一页纸岗位作品集薪资入职背调内推秋招春招试用期离职空窗职级汇报学历经历项目技能证书语言评价意向到岗姓名电话邮箱城市撰写设计检查分享准备记住求职自荐信推荐理由";

const sceneChars = new Set("撰写设计检查定制分享准备记住");

/** Enough cells to run past the fold at any width; the tray clips whatever falls below it. */
const cellCount = 168;

function TypeCase() {
	return (
		<div className="footer-case" aria-hidden="true">
			<div className="grid grid-cols-[repeat(auto-fill,minmax(clamp(28px,2.3vw,44px),1fr))]">
				{Array.from({ length: cellCount }, (_, index) => {
					// A case always has gaps: every eleventh slot is a sort already set.
					const empty = index % 11 === 3;
					const character = sorts[index % sorts.length] ?? "";
					return (
						<span
							key={index}
							className={cn(
								"grid aspect-square place-items-center border-e border-b border-line font-display text-[clamp(12px,1.15vw,19px)] leading-none select-none",
								empty && "bg-sunken",
								!empty && (sceneChars.has(character) ? "text-accent-text" : "text-ink-3"),
							)}
						>
							{empty ? null : character}
						</span>
					);
				})}
			</div>
		</div>
	);
}
