import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { configureFontReader, downloadFont } from "./src/forme/fonts";

// Vitest gives every test file its own module registry, so the in-process font cache in fonts.ts is
// empty at the start of each file. On networks where a parallel burst of gstatic downloads gets reset,
// that makes PDF tests flaky even with maxWorkers=2. Cache the downloaded bytes on disk once and read
// them back, using the documented configureFontReader hook. Production rendering is untouched: this
// file is only loaded as a Vitest setup file, never by the app.
const cacheDir = join(tmpdir(), "reactive-resume-vitest-fonts-v1");
mkdirSync(cacheDir, { recursive: true });

const cacheFile = (src: string) => join(cacheDir, createHash("sha256").update(src).digest("hex"));

// Google serves TTF/OTF/WOFF/WOFF2. Only real fonts are worth caching: fonts.test.ts stubs fetch with
// three-byte payloads, and writing those into the cache would poison a real font URL that shares a key.
const looksLikeFont = (bytes: Uint8Array): boolean => {
	if (bytes.length < 8) return false;
	const tag = String.fromCharCode(...bytes.subarray(0, 4));
	return (
		tag === "OTTO" ||
		tag === "true" ||
		tag === "ttcf" ||
		tag === "wOFF" ||
		tag === "wOF2" ||
		(bytes[0] === 0 && bytes[1] === 1 && bytes[2] === 0 && bytes[3] === 0)
	);
};

configureFontReader(async (src: string) => {
	const file = cacheFile(src);
	try {
		if (existsSync(file)) {
			const cached = new Uint8Array(readFileSync(file));
			if (looksLikeFont(cached)) return cached;
		}
	} catch {
		// A damaged or half-written cache entry just falls through to the network.
	}

	const bytes = await downloadFont(src);
	if (looksLikeFont(bytes)) {
		try {
			// Write to a per-process temp file then rename: a concurrent worker never reads a partial font.
			const temporary = `${file}.${process.pid}.tmp`;
			writeFileSync(temporary, bytes);
			renameSync(temporary, file);
		} catch {
			// Disk failures never invalidate freshly downloaded bytes.
		}
	}
	return bytes;
});
