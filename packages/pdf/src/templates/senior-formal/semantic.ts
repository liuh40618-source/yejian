import type { TemplateSemanticManifest } from "../../semantic/template-manifest";
import { baseManifest, itemHeaderRowPart } from "../../semantic/shared-parts";

export const seniorFormalSemanticManifest = baseManifest("senior-formal", [
	itemHeaderRowPart,
]) satisfies TemplateSemanticManifest;
