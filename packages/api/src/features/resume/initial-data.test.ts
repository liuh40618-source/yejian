import { describe, expect, it } from "vite-plus/test";
import { chinaSampleResumeData } from "@reactive-resume/schema/resume/china-sample";
import { sampleResumeData } from "@reactive-resume/schema/resume/sample";
import { createResumeData } from "./initial-data";

describe("createResumeData", () => {
	it("starts a blank resume with the account's name and email", () => {
		const data = createResumeData({ name: "Sam Lee", email: "sam@example.test" });
		expect(data.basics).toMatchObject({ name: "Sam Lee", email: "sam@example.test" });
	});

	it("keeps a sample's own contact details and person", () => {
		const data = createResumeData({ withSampleData: true, email: "sam@example.test", name: "Guest" });
		expect(data.basics.email).toBe(chinaSampleResumeData.basics.email);
		expect(data.basics.name).toBe(chinaSampleResumeData.basics.name);
	});

	it("starts a blank resume on the Chinese ATS pairing and an offered accent, on Letter paper where that's the norm", () => {
		const us = createResumeData({ locale: "en-US" });
		expect(us.metadata.typography.heading.fontFamily).toBe("Noto Sans SC");
		expect(us.metadata.typography.body.fontFamily).toBe("Noto Serif SC");
		expect(us.metadata.design.colors.primary).toBe("rgba(47, 90, 138, 1)");
		expect(us.metadata.page.format).toBe("letter");
		expect(createResumeData({ locale: "de-DE" }).metadata.page.format).toBe("a4");
	});

	it("starts a locale-less blank resume on the full Chinese ATS-safe policy", () => {
		const data = createResumeData({});
		expect(data.metadata.page.locale).toBe("zh-CN");
		expect(data.metadata.page.format).toBe("a4");
		expect(data.metadata.page.dateFormat).toBe("iso");
		expect(data.metadata.page.hideIcons).toBe(true);
		expect(data.metadata.template).toBe("general-single");
		expect(data.metadata.layout.pages[0]).toMatchObject({ fullWidth: true, sidebar: [] });
		expect(data.picture.hidden).toBe(true);
		expect(data.metadata.chinaMarket?.preset).toBe("ats");
	});

	it("ships the Chinese sample, not the upstream English reference fixture", () => {
		const data = createResumeData({ withSampleData: true });
		expect(data.basics.name).toBe(chinaSampleResumeData.basics.name);
		expect(data.basics.name).not.toBe(sampleResumeData.basics.name);
	});

	it("keeps the shipped Chinese sample's language and master data regardless of the account locale", () => {
		const data = createResumeData({ withSampleData: true, locale: "en-US" });
		expect(data.metadata.page.locale).toBe("zh-CN");
		expect(data.metadata.page.format).toBe("a4");
		expect(data.metadata.chinaMarket?.scene).toBe("market");
		expect(data.metadata.chinaMarket?.profile.wechat).toBe(chinaSampleResumeData.metadata.chinaMarket?.profile.wechat);
		expect(data.metadata.layout.pages[0]?.sidebar).toEqual([]);
		expect(data.picture.hidden).toBe(true);
	});
});
