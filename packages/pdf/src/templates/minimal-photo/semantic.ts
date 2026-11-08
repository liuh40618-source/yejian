import type { TemplateSemanticManifest } from "../../semantic/template-manifest";
import { baseManifest, itemHeaderRowPart } from "../../semantic/shared-parts";

export const minimalPhotoSemanticManifest = baseManifest("minimal-photo", [
	itemHeaderRowPart,
]) satisfies TemplateSemanticManifest;
