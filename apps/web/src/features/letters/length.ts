/** Most recruiters read 180 to 320 words; the bar runs to 450. */
export const LETTER_LENGTH = { min: 180, max: 320, scale: 450 } as const;

export type LetterLength = "empty" | "short" | "comfortable" | "long";

/**
 * Characters written without spaces: Han, kana, and hangul, which a reader counts one by one.
 * `\p{Script=Han}` covers the ideographs and the extension blocks in one range.
 */
const UNSPACED = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu;

/**
 * What a reader counts as a word: a run of letters between spaces, and each character of a script that
 * isn't written with spaces. Counting whitespace alone showed "1 字" for a 21-character Chinese sentence,
 * which is the only kind of letter this build writes.
 */
export function countWords(html: string): number {
	const text = html
		.replace(/<[^>]*>/g, " ")
		.replace(/&nbsp;|&#160;/g, " ")
		.trim();
	if (!text) return 0;
	const unspaced = text.match(UNSPACED)?.length ?? 0;
	// Punctuation left between the removed characters must not become a "word".
	const spaced = text
		.replace(UNSPACED, " ")
		.split(/\s+/)
		.filter((run) => /[\p{L}\p{N}]/u.test(run)).length;
	return unspaced + spaced;
}

export function letterLength(words: number): LetterLength {
	if (words === 0) return "empty";
	if (words < LETTER_LENGTH.min) return "short";
	return words <= LETTER_LENGTH.max ? "comfortable" : "long";
}
