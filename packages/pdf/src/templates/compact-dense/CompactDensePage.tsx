import type { TemplatePageProps } from "../../document";
import type { Style } from "../../forme/style-types";
import type { TemplateColorRoles, TemplateStyleContext, TemplateStyleSlots } from "../shared/types";
import { useMemo } from "react";
import { Page, StyleSheet } from "#react-pdf-renderer";
import { useRender } from "../../context";
import { useRenderedSectionIds, useResolvedNode } from "../../semantic/context";
import { semanticNodeKeys } from "../../semantic/node-keys";
import { TemplateProvider } from "../shared/context";
import { filterSections } from "../shared/filtering";
import { getTemplateMetrics } from "../shared/metrics";
import { SemanticRegionView } from "../shared/primitives";
import { Section } from "../shared/sections";
import { composeStyles, headerNameLineHeight, headingTracking } from "../shared/styles";
import { createIconSlot, TemplateHeader, useTemplateBase } from "../shared/template-base";

type CompactDenseStyles = Omit<TemplateStyleSlots, "page"> & {
	page: Style;
	header: Style;
	picture: Style;
	headerTitle: Style;
	headerIdentity: Style;
	headerName: Style;
	contactList: Style;
	contactItem: Style;
};

/**
 * For a long career that still has to be one page: tighter margins than the typography's own,
 * the photo in the corner of the header band, and section titles on a single line with their
 * rule. Everything between entries is squeezed too — one page holds what two usually do.
 */
export function CompactDensePage({ page, pageSize, pageMinHeightStyle, showHeader, pageNumber }: TemplatePageProps) {
	const data = useRender();
	const pageNodeKey = semanticNodeKeys.page(pageNumber);
	const { style: semanticPageStyle, size: semanticPageSize, ...semanticPageProps } = useResolvedNode(pageNodeKey);
	const { colors, styles } = useCompactDenseTemplate();
	const metrics = getTemplateMetrics(data.metadata.page);
	const sections = useRenderedSectionIds(
		pageNodeKey,
		filterSections([...page.main, ...(page.fullWidth ? [] : page.sidebar)], data),
	);

	return (
		<Page
			{...semanticPageProps}
			size={semanticPageSize ?? pageSize}
			style={composeStyles(styles.page, pageMinHeightStyle, semanticPageStyle)}
		>
			<TemplateProvider pageNodeKey={pageNodeKey} styles={styles} colors={colors}>
				{showHeader && (
					<TemplateHeader
						styles={{
							header: styles.header,
							picture: styles.picture,
							title: styles.headerTitle,
							identity: styles.headerIdentity,
							name: styles.headerName,
							contactList: styles.contactList,
							contactItem: styles.contactItem,
						}}
						contactListOutsideTitle
					/>
				)}
				<SemanticRegionView region="main" style={{ rowGap: metrics.gapY(0.875) }}>
					{sections.map((section) => (
						<Section key={section} section={section} placement="main" />
					))}
				</SemanticRegionView>
			</TemplateProvider>
		</Page>
	);
}

function useCompactDenseTemplate() {
	const { metadata, r, foreground, background, primary, metrics, base } = useTemplateBase();

	return useMemo(() => {
		const colors: TemplateColorRoles = { foreground, background, primary };
		// Tighter than the page's own margin: this template trades breathing room for lines.
		const contentMarginX = metrics.page.paddingHorizontal * 0.7;
		const contentMarginY = metrics.page.paddingVertical * 0.6;
		const styles = StyleSheet.create({
			...base,
			page: {
				...base.page,
				paddingHorizontal: contentMarginX,
				paddingVertical: contentMarginY,
				rowGap: metrics.gapY(0.875),
			},
			header: {
				flexDirection: r.row,
				flexWrap: "wrap",
				alignItems: "center",
				columnGap: metrics.gapX(0.75),
				rowGap: metrics.gapY(0.125),
				backgroundColor: background,
				borderBottomWidth: 2,
				borderBottomColor: primary,
				paddingBottom: metrics.gapY(0.375),
			},
			headerTitle: {
				flex: 1,
				minWidth: 0,
				...r.headerIdentity,
				rowGap: metrics.gapY(0.0625),
			},
			headerIdentity: { rowGap: 0 },
			headerName: {
				fontSize: metadata.typography.heading.fontSize * 1.4,
				fontWeight: metadata.typography.heading.fontWeights.at(-1) ?? "700",
				lineHeight: headerNameLineHeight,
				letterSpacing: r.rtl ? 0 : headingTracking(0.5),
			},
			contactList: {
				// Contacts go under the whole header band instead of beside the name: one line, never two.
				flexDirection: r.row,
				flexWrap: "wrap",
				rowGap: 0,
				columnGap: metrics.gapX(0.5),
				flexBasis: "100%",
			},
			contactItem: {
				flexDirection: r.row,
				alignItems: "center",
				columnGap: metrics.gapX(1 / 6),
			},
			section: { flexDirection: "column", rowGap: metrics.gapY(0.125) },
			sectionHeading: {
				fontSize: metadata.typography.heading.fontSize * 0.9375,
				fontWeight: metadata.typography.heading.fontWeights.at(-1) ?? "700",
				color: primary,
				letterSpacing: r.rtl ? 0 : headingTracking(1, metadata.typography.heading.fontSize * 0.9375),
				textAlign: r.sectionHeadingTextAlign,
			},
			sectionItems: { rowGap: metrics.itemGapY * 0.5 },
			item: { rowGap: 0 },
			levelContainer: { width: "100%" },
		});

		const accentFor = ({ colors }: TemplateStyleContext) => colors.primary;

		return {
			colors,
			styles: {
				...styles,
				levelItem: (context) => ({ borderColor: accentFor(context) }),
				levelItemActive: (context) => ({ backgroundColor: accentFor(context) }),
				icon: createIconSlot({ metadata, accentFor }),
			} satisfies CompactDenseStyles,
		};
	}, [metadata, r, primary, metrics, base, foreground, background]);
}
