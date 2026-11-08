import type { TemplateSemanticManifest } from "../../semantic/template-manifest";
import { itemHeaderRowPart } from "../../semantic/shared-parts";

/** Main-only: a public-sector resume is one reading column, and section order is fixed by convention. */
export const govFormalSemanticManifest = {
	template: "gov-formal",
	regions: [
		{ name: "header", placement: "main", origins: [] },
		{ name: "main", placement: "main", origins: ["main", "sidebar"] },
	],
	header: { region: "header", placement: "main" },
	specialSummary: null,
	parts: [itemHeaderRowPart],
} as const satisfies TemplateSemanticManifest;
