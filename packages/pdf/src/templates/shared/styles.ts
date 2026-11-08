import type { Style } from "../../forme/style-types";

export type TemplatePlacement = "main" | "sidebar";

export type StyleInput = Style | Style[] | null | undefined;

export const composeStyles = (...styles: StyleInput[]): Style[] => {
	return styles.flatMap((style) => {
		if (!style) return [];
		if (Array.isArray(style)) return style.filter(Boolean);

		return [style];
	});
};

export const mergeStyles = (...styles: StyleInput[]): Style => Object.assign({}, ...composeStyles(...styles));

export const headerNameLineHeight = 1.3;

/**
 * Caps heading tracking so text in the PDF stays one extractable word per word.
 *
 * pdf.js reads a gap between glyphs wider than roughly a tenth of the type size as a word break, and
 * the text layer then comes back as "C h o s e n". Importers see no heading at all, and the extracted
 * resume loses every custom section. The limit scales with the type, so a small heading cannot carry
 * the tracking a large one can: 9.5pt splits at 1, while 14pt holds until 1.25.
 */
const HEADING_TRACKING_RATIO = 0.085;

/** Fallback cap for a caller that does not say how large the text is set. */
export const HEADING_TRACKING_MAX = 1;

export const headingTracking = (value: number, fontSize?: number): number =>
	Math.min(value, fontSize === undefined ? HEADING_TRACKING_MAX : fontSize * HEADING_TRACKING_RATIO);

type ResolvePlacementColorOptions = {
	placement: TemplatePlacement;
	defaultForeground: string;
	sidebarForeground?: string | undefined;
};

export const resolvePlacementColor = ({
	placement,
	defaultForeground,
	sidebarForeground,
}: ResolvePlacementColorOptions) => {
	if (placement === "sidebar" && sidebarForeground) return sidebarForeground;

	return defaultForeground;
};
