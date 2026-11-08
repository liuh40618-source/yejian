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

type TechTimelineStyles = Omit<TemplateStyleSlots, "page"> & {
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
 * The engineering page: a ruled header, then every section as a timeline down the start edge so
 * each entry's span lines up for a reader scanning for overlap and gaps. Projects and experience
 * share one indent, which is where a technical reviewer looks first.
 */
export function TechTimelinePage({ page, pageSize, pageMinHeightStyle, showHeader, pageNumber }: TemplatePageProps) {
	const data = useRender();
	const pageNodeKey = semanticNodeKeys.page(pageNumber);
	const { style: semanticPageStyle, size: semanticPageSize, ...semanticPageProps } = useResolvedNode(pageNodeKey);
	const { colors, styles, featureStyles, features } = useTechTimelineTemplate();
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
			<TemplateProvider
				pageNodeKey={pageNodeKey}
				styles={styles}
				colors={colors}
				featureStyles={featureStyles}
				features={features}
			>
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
					/>
				)}
				<SemanticRegionView region="main" style={{ rowGap: metrics.gapY(1.5) }}>
					{sections.map((section) => (
						<Section key={section} section={section} placement="main" />
					))}
				</SemanticRegionView>
			</TemplateProvider>
		</Page>
	);
}

function useTechTimelineTemplate() {
	const { metadata, r, foreground, background, primary, metrics, base } = useTemplateBase();

	return useMemo(() => {
		const colors: TemplateColorRoles = { foreground, background, primary };
		const styles = StyleSheet.create({
			...base,
			page: {
				...base.page,
				paddingHorizontal: metrics.page.paddingHorizontal,
				paddingVertical: metrics.page.paddingVertical,
				rowGap: metrics.gapY(1.5),
			},
			header: {
				flexDirection: r.row,
				alignItems: "flex-start",
				columnGap: metrics.gapX(1.25),
				borderBottomWidth: 1,
				borderBottomColor: foreground,
				paddingBottom: metrics.gapY(0.75),
			},
			headerTitle: { flex: 1, rowGap: metrics.gapY(0.5) },
			headerIdentity: {
				flex: 1,
				minWidth: 0,
				...r.headerIdentity,
				rowGap: metrics.gapY(0.125),
			},
			headerName: {
				fontSize: metadata.typography.heading.fontSize * 1.5,
				fontWeight: metadata.typography.heading.fontWeights.at(-1) ?? "700",
				lineHeight: headerNameLineHeight,
			},
			contactList: {
				flexDirection: r.row,
				flexWrap: "wrap",
				rowGap: metrics.gapY(0.125),
				columnGap: metrics.gapX(0.75),
			},
			contactItem: {
				flexDirection: r.row,
				alignItems: "center",
				columnGap: metrics.gapX(1 / 6),
			},
			// The rail the entries hang off: a hairline down the section's start edge, from the heading
			// to the last entry. A border on the section needs no template part to render, so it survives
			// pagination and the semantic pass alike.
			section: {
				flexDirection: "column",
				rowGap: metrics.gapY(0.375),
				...(r.rtl
					? { borderRightWidth: 0.75, borderRightColor: primary, paddingRight: metrics.gapX(0.75) }
					: { borderLeftWidth: 0.75, borderLeftColor: primary, paddingLeft: metrics.gapX(0.75) }),
			},
			sectionHeading: {
				fontSize: metadata.typography.heading.fontSize,
				letterSpacing: r.rtl ? 0 : headingTracking(2, metadata.typography.heading.fontSize),
				color: primary,
				paddingBottom: metrics.gapY(0.0625),
				borderBottomWidth: 0.5,
				borderBottomColor: primary,
				textAlign: r.sectionHeadingTextAlign,
			},
			sectionItems: {
				rowGap: metrics.itemGapY,
			},
			item: {
				rowGap: metrics.gapY(0.125),
			},
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
			} satisfies TechTimelineStyles,
			// The rail is a border on the section, not a timeline template part. A timeline part wraps
			// every item in a row flex box, which shrinks the header row until right-aligned fields
			// (degree, location, period) no longer clear the importer's field-gap threshold and
			// Education records collapse into prose. A border survives pagination without that cost.
			featureStyles: {},
			features: {},
		};
	}, [metadata, r, primary, metrics, base, foreground, background]);
}
