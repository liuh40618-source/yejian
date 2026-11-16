import { describe, expect, it } from "vite-plus/test";
import { countWords, LETTER_LENGTH, letterLength } from "./length";

describe("countWords", () => {
	it("counts a Chinese sentence by its characters, not by its spaces", () => {
		// Whitespace alone read this as one word, so a Chinese letter never left "short".
		expect(countWords("我在设计系统与跨团队协作上有七年经验。")).toBe(18);
	});

	it("counts Latin words as runs, and keeps both kinds in mixed text", () => {
		expect(countWords("<p>Seven years of design systems work.</p>")).toBe(6);
		expect(countWords("<p>负责 Design System，覆盖 6 个团队。</p>")).toBe(10);
	});

	it("ignores markup, entities and punctuation between words", () => {
		expect(countWords("<p>你好<br/>世界</p>")).toBe(4);
		expect(countWords("<p>&nbsp;</p>")).toBe(0);
		expect(countWords("")).toBe(0);
		expect(countWords("<p>— · ，</p>")).toBe(0);
	});

	it("places a Chinese letter in the band by its own length", () => {
		const letter = "我是产品设计师。".repeat(30);
		expect(countWords(letter)).toBe(210);
		expect(letterLength(countWords(letter))).toBe("comfortable");
		expect(LETTER_LENGTH.max).toBe(320);
	});
});
