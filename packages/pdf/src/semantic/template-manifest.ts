import type { PrimitiveBinding, SemanticBindingRegistry } from "./binding-inventory";
import type { SemanticNodeKind } from "@reactive-resume/resume/stylesheet/types";
import type { CustomSectionType, EntryHeader } from "@reactive-resume/schema/resume/data";
import type { Template } from "@reactive-resume/schema/templates";
import { asiaStandardSemanticManifest } from "../templates/asia-standard/semantic";
import { bilingualCnSemanticManifest } from "../templates/bilingual-cn/semantic";
import { campusFreshSemanticManifest } from "../templates/campus-fresh/semantic";
import { centerClassicSemanticManifest } from "../templates/center-classic/semantic";
import { cnExecutiveSemanticManifest } from "../templates/cn-executive/semantic";
import { compactDenseSemanticManifest } from "../templates/compact-dense/semantic";
import { consultingCnSemanticManifest } from "../templates/consulting-cn/semantic";
import { creativeGridSemanticManifest } from "../templates/creative-grid/semantic";
import { creativeSideSemanticManifest } from "../templates/creative-side/semantic";
import { editorialSemanticManifest } from "../templates/editorial/semantic";
import { formGridSemanticManifest } from "../templates/form-grid/semantic";
import { generalSingleSemanticManifest } from "../templates/general-single/semantic";
import { govFormalSemanticManifest } from "../templates/gov-formal/semantic";
import { headingAccentSemanticManifest } from "../templates/heading-accent/semantic";
import { minimalPhotoSemanticManifest } from "../templates/minimal-photo/semantic";
import { seniorFormalSemanticManifest } from "../templates/senior-formal/semantic";
import { stateOwnedSemanticManifest } from "../templates/state-owned/semantic";
import { techTimelineSemanticManifest } from "../templates/tech-timeline/semantic";
import { whitespaceCleanSemanticManifest } from "../templates/whitespace-clean/semantic";
import { SHARED_BINDING_REGISTRY } from "./binding-inventory";
import { entryHeaderParts } from "./shared-parts";

export type TemplateSemanticPlacement = "main" | "sidebar";
type TemplateSemanticRegionName = "header" | "main" | "sidebar" | "featured";

export type TemplateSemanticRegion = {
	name: TemplateSemanticRegionName;
	placement: TemplateSemanticPlacement;
	origins: readonly TemplateSemanticPlacement[];
	flow?: "sequential" | "interleaved";
};

type TemplateSemanticSpecialSummary = {
	region: "header" | "featured";
	placement: TemplateSemanticPlacement;
	source: "always" | "main-with-header";
};

type TemplateSemanticPartOwner =
	| { kind: "header"; key: "header" }
	| { kind: "region"; key: TemplateSemanticRegionName }
	| {
			kind: "section";
			key: "section";
			origin?: TemplateSemanticPlacement;
			placement?: TemplateSemanticPlacement;
	  }
	| {
			kind: "section-items";
			key: "section-items";
			placement?: TemplateSemanticPlacement;
			columns?: 1;
	  }
	| {
			kind: "item";
			key: "item";
			placement?: TemplateSemanticPlacement;
			columns?: 1;
			sectionTypes?: readonly CustomSectionType[];
			entryLayout?: EntryHeader["layout"];
	  }
	| {
			kind: "item-header";
			key: "item-header";
			sectionTypes?: readonly CustomSectionType[];
			/** Only while the section's entries are drawn in this layout (see `entryLayoutOf`). */
			entryLayout?: EntryHeader["layout"];
	  }
	| { kind: "contact-list"; key: "contact-list" }
	| { kind: "contact-item"; key: "contact-item"; position?: "last" };

type TemplateSemanticPartBinding =
	| {
			type: "primitive";
			primitive:
				| PrimitiveBinding["primitive"]
				| {
						ownerRole: string;
						present: PrimitiveBinding["primitive"];
						absent: PrimitiveBinding["primitive"];
				  };
			source: "existing";
	  }
	| {
			type: "alias";
			canonicalKind: Exclude<SemanticNodeKind, "template-part">;
			token: string;
	  };

export type TemplateSemanticChildSelector = {
	kind: Exclude<SemanticNodeKind, "resume" | "page">;
	name?: string;
	sectionTypes?: readonly CustomSectionType[];
};

type TemplateSemanticPartRoute = {
	parent: "owner" | string;
	at: "start" | "end" | { before: TemplateSemanticChildSelector } | { after: TemplateSemanticChildSelector };
	take?: "all" | readonly TemplateSemanticChildSelector[];
	takeFrom?: "item-header";
};

export type TemplateSemanticPrimitivePart = {
	name: string;
	key: string;
	owner: TemplateSemanticPartOwner;
	binding: Extract<TemplateSemanticPartBinding, { type: "primitive" }>;
	route: TemplateSemanticPartRoute;
};

type TemplateSemanticAliasPart = {
	name: string;
	key: string;
	owner: TemplateSemanticPartOwner;
	binding: Extract<TemplateSemanticPartBinding, { type: "alias" }>;
	route?: never;
};

export type TemplateSemanticPart = TemplateSemanticPrimitivePart | TemplateSemanticAliasPart;

type TemplateSemanticCanonicalBinding = {
	kind: Exclude<SemanticNodeKind, "template-part">;
	binding: PrimitiveBinding;
};

export type TemplateSemanticManifest = {
	template: Template;
	skillLevelAfterName?: boolean;
	regions: readonly TemplateSemanticRegion[];
	header: {
		region: "header";
		placement: TemplateSemanticPlacement;
	};
	specialSummary: TemplateSemanticSpecialSummary | null;
	parts: readonly TemplateSemanticPart[];
	canonicalBindings?: readonly TemplateSemanticCanonicalBinding[];
};

const TEMPLATE_SEMANTIC_MANIFESTS = {
	"asia-standard": asiaStandardSemanticManifest,
	"bilingual-cn": bilingualCnSemanticManifest,
	"campus-fresh": campusFreshSemanticManifest,
	"center-classic": centerClassicSemanticManifest,
	"cn-executive": cnExecutiveSemanticManifest,
	"compact-dense": compactDenseSemanticManifest,
	"consulting-cn": consultingCnSemanticManifest,
	"creative-grid": creativeGridSemanticManifest,
	"creative-side": creativeSideSemanticManifest,
	editorial: editorialSemanticManifest,
	"form-grid": formGridSemanticManifest,
	"general-single": generalSingleSemanticManifest,
	"gov-formal": govFormalSemanticManifest,
	"heading-accent": headingAccentSemanticManifest,
	"minimal-photo": minimalPhotoSemanticManifest,
	"senior-formal": seniorFormalSemanticManifest,
	"state-owned": stateOwnedSemanticManifest,
	"tech-timeline": techTimelineSemanticManifest,
	"whitespace-clean": whitespaceCleanSemanticManifest,
} as const satisfies Readonly<Record<Template, TemplateSemanticManifest>>;

// Every template's entries can be drawn on one line, so the parts of that header belong to all of them.
const MANIFESTS = Object.fromEntries(
	Object.entries(TEMPLATE_SEMANTIC_MANIFESTS).map(([template, manifest]): [string, TemplateSemanticManifest] => [
		template,
		{ ...manifest, parts: [...manifest.parts, ...entryHeaderParts] },
	]),
) as Readonly<Record<Template, TemplateSemanticManifest>>;

export function getTemplateSemanticManifest(template: Template): TemplateSemanticManifest {
	return MANIFESTS[template];
}

export function getTemplateSemanticBindingRegistry(template: Template): SemanticBindingRegistry {
	const manifest = getTemplateSemanticManifest(template);
	const canonicalBindings = Object.fromEntries(
		(manifest.canonicalBindings ?? []).map(({ kind, binding }) => [kind, binding]),
	) as SemanticBindingRegistry;

	return {
		...SHARED_BINDING_REGISTRY,
		...canonicalBindings,
		link: (node, context) => {
			if (context.parent?.kind === "template-part") {
				const part = manifest.parts.find((candidate) => candidate.name === context.parent?.attributes.name);
				if (
					part?.binding.type === "primitive" &&
					(part.binding.primitive === "Link" ||
						(typeof part.binding.primitive === "object" && part.binding.primitive.present === "Link"))
				) {
					return {
						type: "alias",
						canonicalKind: "template-part",
						canonicalNodeKey: context.parent.key,
						token: "structured-link",
					};
				}
			}

			const shared = SHARED_BINDING_REGISTRY.link;
			return typeof shared === "function" ? shared(node, context) : shared;
		},
		"template-part": (node, { parent }) => {
			const part = manifest.parts.find((candidate) => candidate.name === node.attributes.name);
			if (part?.binding.type !== "primitive") return undefined;
			if (typeof part.binding.primitive === "string") return part.binding as PrimitiveBinding;

			return {
				type: "primitive",
				primitive: parent?.roles.includes(part.binding.primitive.ownerRole)
					? part.binding.primitive.present
					: part.binding.primitive.absent,
				source: "existing",
			};
		},
	};
}
