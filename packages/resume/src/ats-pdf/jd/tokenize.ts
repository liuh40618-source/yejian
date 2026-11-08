/**
 * Word segmentation that keeps technical surface forms intact.
 *
 * `Intl.Segmenter` is the right tool for finding word boundaries across scripts, but it splits
 * "C++" into three pieces and "Node.js" into three more — and those are exactly the terms a
 * candidate is searched on. So segmentation runs first, then a merge pass glues the connector
 * characters that carry meaning back onto their words.
 */

import { mergeCjkCompounds, splitCjkVerbs } from "./normalize.ts";

/** Connectors that only join when a word follows immediately: `ci/cd`, `node.js`, `back-end`. */
const JOINING_CONNECTORS = new Set([".", "/", "-", "_"]);
/** Connectors that are meaningful on their own end of a token: `c++`, `c#`, `f#`. */
const TRAILING_CONNECTORS = new Set(["+", "#"]);

type Segment = { text: string; isWordLike: boolean };

/** CJK ideographs, the scripts a mainland posting is mostly written in. */
const CJK = /\p{Script=Han}/u;

// Built once: constructing a segmenter costs more than segmenting a short run of text.
const segmenter =
	typeof Intl !== "undefined" && typeof Intl.Segmenter === "function"
		? new Intl.Segmenter("en", { granularity: "word" })
		: null;

// Chinese dictionary segmentation. One segmenter serves every CJK run: `Intl.Segmenter` with the
// `zh` locale applies the same dictionary to Japanese kana-bearing text, which the callers never
// hit, and mixing locales per run would add a construction cost to every sentence.
const cjkSegmenter =
	typeof Intl !== "undefined" && typeof Intl.Segmenter === "function"
		? new Intl.Segmenter("zh", { granularity: "word" })
		: null;

function segment(text: string): Segment[] {
	if (segmenter) {
		return [...segmenter.segment(text)].map((entry) => ({
			text: entry.segment,
			isWordLike: entry.isWordLike ?? false,
		}));
	}

	// Older runtimes: fall back to a plain letter/number split. Same tokens for Latin text.
	return (text.match(/[\p{L}\p{N}]+|[^\p{L}\p{N}]/gu) ?? []).map((piece) => ({
		text: piece,
		isWordLike: /[\p{L}\p{N}]/u.test(piece),
	}));
}

/**
 * Splits Chinese text into dictionary words.
 *
 * The `en` segmenter used elsewhere hands back a whole run of ideographs as one word, which makes
 * every Chinese phrase a single multi-character token no posting ever repeats. A `zh` segmenter
 * finds the ordinary word boundaries ("负责支付链路的性能优化" -> 负责 / 支付 / 链路 / 性能 / 优化), which is
 * what a resume and a posting actually share. Punctuation that a run of Latin text would keep
 * inside a token ("node.js") becomes a separate piece here, so those keep their existing handling.
 */
function segmentCjk(text: string): Segment[] {
	const pieces = cjkSegmenter
		? [...cjkSegmenter.segment(text)]
		: [...text].map((character) => ({
				segment: character,
				isWordLike: /[\p{L}\p{N}]/u.test(character),
			}));

	return pieces.map((entry) => ({
		text: entry.segment,
		isWordLike: entry.isWordLike ?? false,
	}));
}

/** Dictionary segmentation, the domain compounds it splits rejoined, then the verbs it welds split apart. */
function segmentCjkRun(text: string): Segment[] {
	return splitCjkVerbs(mergeCjkCompounds(segmentCjk(text)));
}

/**
 * Runs of Chinese and runs of everything else, so each is segmented by the rule it needs.
 *
 * A run starts at a Chinese character and may only end on an ASCII character, so "熟悉React" is one
 * run and the Chinese segmenter splits the Latin word out of it, while "React、Vue" stays on the
 * ASCII side where the `.`/`/` connector rules still apply and punctuation is never glued on.
 */
function segmentText(text: string): Segment[] {
	const result: Segment[] = [];
	const pattern =
		/[\p{Script=Han}]+(?:[A-Za-z0-9+#._/-]+[\p{Script=Han}]*)|[\p{Script=Han}]+|[A-Za-z0-9+#._/-]+|\P{Script=Han}+/gu;

	for (const match of text.matchAll(pattern)) {
		const run = match[0];
		result.push(...(CJK.test(run) ? segmentCjkRun(run) : segment(run)));
	}

	return result;
}

export function tokenize(text: string): string[] {
	const segments = segmentText(text);
	const tokens: string[] = [];

	let current = "";

	const flush = () => {
		const trimmed = current.replace(/^[._/-]+/, (prefix) => (prefix === "." ? "." : "")).replace(/[._/-]+$/, "");
		if (trimmed.length > 0 && /[\p{L}\p{N}]/u.test(trimmed)) tokens.push(trimmed);
		current = "";
	};

	for (let index = 0; index < segments.length; index += 1) {
		const piece = segments[index];
		if (!piece) continue;

		const next = segments[index + 1];

		if (piece.isWordLike) {
			// Chinese words arrive already split by the dictionary. Gluing them back together would
			// rebuild the run of ideographs the segmentation just broke up, so each one flushes on
			// its own — unless a connector belongs to it (`、` never does).
			if (CJK.test(piece.text)) {
				flush();
				current = piece.text;
				flush();
				continue;
			}

			current += piece.text;
			continue;
		}

		if (JOINING_CONNECTORS.has(piece.text)) {
			// ".net" opens a token; "node.js" continues one. A sentence-ending "." does neither,
			// because nothing word-like follows it immediately.
			if (next?.isWordLike) {
				current += piece.text;
				continue;
			}
		}

		if (TRAILING_CONNECTORS.has(piece.text) && current.length > 0) {
			current += piece.text;
			continue;
		}

		flush();
	}

	flush();

	return tokens;
}

/**
 * Splits text into the runs that n-grams may span. A phrase never crosses a sentence, a bullet,
 * or a line — "React. Node" is not the phrase "react node".
 */
export function splitIntoRuns(text: string): string[] {
	return text
		.split(/[\n\r]+|(?<=[.!?;:])\s+|[•▪◦‣·|,()[\]{}]/)
		.map((run) => run.trim())
		.filter(Boolean);
}
