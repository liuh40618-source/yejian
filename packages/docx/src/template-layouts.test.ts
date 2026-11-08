import { describe, expect, it } from "vite-plus/test";
import { templateSchema } from "@reactive-resume/schema/templates";
import { planPageColumns } from "./builder";

describe("planPageColumns", () => {
	const page = { fullWidth: false, main: ["experience"], sidebar: ["skills"] };

	it("never splits the page: every shipped template is one column", () => {
		for (const template of templateSchema.options) {
			expect(planPageColumns(page, template)).toEqual({ kind: "single", sections: ["experience", "skills"] });
		}
	});

	it("prints a one-column template's sidebar after the main sections, as the PDF does", () => {
		expect(planPageColumns(page, "minimal-photo")).toEqual({ kind: "single", sections: ["experience", "skills"] });
	});

	it("prints no sidebar on a full-width page, as the PDF does", () => {
		expect(planPageColumns({ ...page, fullWidth: true }, "general-single")).toEqual({
			kind: "single",
			sections: ["experience"],
		});
		expect(planPageColumns({ ...page, fullWidth: true }, "minimal-photo")).toEqual({
			kind: "single",
			sections: ["experience"],
		});
	});
});
