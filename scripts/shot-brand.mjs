import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { chromium } from "playwright";

const ROOT = "D:/Deepseek/reactive-resume-main/apps/web/public";
const PORT = 4173;

const TYPES = {
	".html": "text/html; charset=utf-8",
	".svg": "image/svg+xml",
	".png": "image/png",
	".ico": "image/x-icon",
	".jpg": "image/jpeg",
	".webp": "image/webp",
	".json": "application/json",
	".css": "text/css",
	".woff2": "font/woff2",
};

const server = createServer(async (req, res) => {
	const url = new URL(req.url ?? "/", "http://127.0.0.1");
	const path = join(ROOT, normalize(decodeURIComponent(url.pathname)));
	try {
		const body = await readFile(path);
		res.writeHead(200, { "content-type": TYPES[extname(path)] ?? "application/octet-stream" });
		res.end(body);
	} catch {
		res.writeHead(404).end("not found");
	}
});

await new Promise((resolve) => server.listen(PORT, "127.0.0.1", resolve));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 2 });
page.on("requestfailed", (request) => console.log("failed:", request.url()));
await page.goto(`http://127.0.0.1:${PORT}/brand/preview.html`, { waitUntil: "networkidle" });
await page.screenshot({ path: process.argv[2] ?? "brand-preview.png", fullPage: true });
await browser.close();
server.close();
console.log("done");
