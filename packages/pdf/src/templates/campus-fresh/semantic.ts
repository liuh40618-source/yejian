import type { TemplateSemanticManifest } from "../../semantic/template-manifest";
import { itemHeaderRowPart } from "../../semantic/shared-parts";

/**
 * Main-only regions: campus resumes read top to bottom, so the sidebar's sections print after the
 * main column instead of in a column of their own.
 */
export const campusFreshSemanticManifest = {
	template: "campus-fresh",
	regions: [
		{ name: "header", placement: "main", origins: [] },
		{ name: "main", placement: "main", origins: ["main", "sidebar"] },
	],
	header: { region: "header", placement: "main" },
	specialSummary: null,
	parts: [itemHeaderRowPart],
} as const satisfies TemplateSemanticManifest;
