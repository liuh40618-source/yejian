import { describe, expect, it, vi } from "vite-plus/test";

vi.mock("@reactive-resume/env/server", () => ({ env: { APP_URL: "https://rxresu.me/" } }));
vi.mock("@reactive-resume/api/features/resume/web-page", () => ({
	listIndexableResumes: async () => [
		{ username: "tess", slug: "game-dev", isPrimary: true, updatedAt: new Date("2026-10-01T00:00:00Z") },
		{ username: "tess", slug: "level-design", isPrimary: false, updatedAt: new Date("2026-10-02T00:00:00Z") },
	],
}));

const { handlePagesSitemap, handleResumesSitemap, handleLlms, handleRobots } = await import("./seo");

it("lists each indexed resume at its canonical address: the primary at /<username>", async () => {
	const xml = await (await handleResumesSitemap(1)).text();
	expect([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])).toEqual([
		"https://rxresu.me/tess",
		"https://rxresu.me/tess/level-design",
	]);
});

it("publishes Context7 Ask after the llms title and summary", async () => {
	const text = await handleLlms().text();
	expect(text).toMatch(
		/^# 页见\n\n> [^\n]+\n\n## Search\n\nThis site has a search endpoint: https:\/\/context7.com\/api\/v2\/ask\?siteKey=ask_b3fd9335a63f1b21b1a814ac&query=<URL-encoded question>\./,
	);
	expect(text).toContain(
		"It returns documentation that answers the question, with a source link for each part. No API key is needed. If nothing matches, it says so.\n\n## Product",
	);
});

it("describes this product, not the upstream project, in llms.txt", async () => {
	const text = await handleLlms().text();
	// The upstream project's community and documentation links all point off-site; this build has none.
	for (const gone of ["docs.rxresu.me", "github.com/reactive-resume", "discord.gg", "reddit.com", "crowdin.com"]) {
		expect(text).not.toContain(gone);
	}
	expect(text).toContain("Simplified Chinese");
});

it("keeps crawlers out of the account area and points them at the sitemap index", async () => {
	const text = await handleRobots().text();
	expect(text).toContain("User-agent: *");
	expect(text).toContain("Disallow: /api/");
	expect(text).toContain("Sitemap: https://rxresu.me/sitemap.xml");
	expect(text).not.toContain("## ");
});

describe("localized sitemap", () => {
	it("gives every public page one entry, with alternates that point back at it", async () => {
		const response = handlePagesSitemap();
		const xml = await response.text();
		const entries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => ({
			loc: match[1]?.match(/<loc>(.*?)<\/loc>/)?.[1],
			alternates: [...(match[1] ?? "").matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map((link) => ({
				language: link[1],
				href: link[2],
			})),
		}));
		const locations = entries.map((entry) => entry.loc);

		expect(response.headers.get("Content-Type")).toBe("application/xml; charset=UTF-8");
		// Three public pages, one interface language: the default locale's address is the plain one, so `x-default`
		// shares it and no entry carries a `?locale=`.
		expect(entries).toHaveLength(3);
		expect(new Set(locations).size).toBe(entries.length);
		for (const path of ["/", "/ats-checker", "/resume-templates"]) {
			const base = `https://rxresu.me${path}`;
			const entry = entries.find((candidate) => candidate.loc === base);
			if (!entry) throw new Error(`${base} is missing from the sitemap.`);
			expect(entry.alternates).toEqual([
				{ language: "zh-CN", href: base },
				{ language: "x-default", href: base },
			]);
			for (const alternate of entry.alternates) expect(locations).toContain(alternate.href);
		}
		expect(xml).not.toContain("?locale=");
		expect(xml).not.toContain("zu-ZA");
		expect(xml).not.toContain("/dashboard");
	});
});
