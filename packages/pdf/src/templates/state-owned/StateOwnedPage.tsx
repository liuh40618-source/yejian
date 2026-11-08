import type { TemplatePageProps } from "../../document";
import type { Style } from "../../forme/style-types";
import type { TemplateColorRoles, TemplateStyleSlots } from "../shared/types";
import { useMemo } from "react";
import { Page, StyleSheet, View } from "#react-pdf-renderer";
import { useRender } from "../../context";
import { useRenderedSectionIds, useResolvedNode } from "../../semantic/context";
import { semanticNodeKeys } from "../../semantic/node-keys";
import {
	CustomFieldContactItem,
	EmailContactItem,
	LocationContactItem,
	PhoneContactItem,
	WebsiteContactItem,
} from "../shared/contact-item";
import { TemplateProvider } from "../shared/context";
import { filterSections } from "../shared/filtering";
import { getTemplateMetrics } from "../shared/metrics";
import { hasTemplatePicture } from "../shared/picture";
import {
	Heading,
	SemanticContactListView,
	SemanticHeaderPicture,
	SemanticHeaderView,
	SemanticRegionView,
	Text,
} from "../shared/primitives";
import { Section } from "../shared/sections";
import { composeStyles, headerNameLineHeight, headingTracking } from "../shared/styles";
import { useTemplateBase } from "../shared/template-base";

type StateOwnedStyles = Omit<TemplateStyleSlots, "page"> & {
	page: Style;
	header: Style;
	headerBand: Style;
	headerIdentity: Style;
	headerName: Style;
	headerHeadline: Style;
	contactList: Style;
	contactItem: Style;
	contactText: Style;
	picture: Style;
};

type StateOwnedHeaderProps = { styles: StateOwnedStyles };

/**
 * The cadre page (国企/事业单位): name and photo inside a bordered band, every section a numbered
 * heading with a boxed title, and a rule closing the page. Formal by construction — the reader is
 * looking for structure and tenure, not design.
 */
export function StateOwnedPage({ page, pageSize, pageMinHeightStyle, showHeader, pageNumber }: TemplatePageProps) {
	const data = useRender();
	const pageNodeKey = semanticNodeKeys.page(pageNumber);
	const { style: semanticPageStyle, size: semanticPageSize, ...semanticPageProps } = useResolvedNode(pageNodeKey);
	const { colors, styles } = useStateOwnedTemplate();
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
				{showHeader && <Header styles={styles} />}
				<SemanticRegionView region="main" style={{ rowGap: metrics.gapY(1.25) }}>
					{sections.map((section) => (
						<Section key={section} section={section} placement="main" />
					))}
				</SemanticRegionView>
			</TemplateProvider>
		</Page>
	);
}

function Header({ styles }: StateOwnedHeaderProps) {
	const { basics, picture } = useRender();

	return (
		<SemanticHeaderView style={styles.header}>
			<View style={styles.headerBand}>
				{hasTemplatePicture(picture) && <SemanticHeaderPicture src={picture.url} style={styles.picture} />}
				<View style={styles.headerIdentity}>
					<Heading style={styles.headerName}>{basics.name}</Heading>
					{basics.headline && <Text style={styles.headerHeadline}>{basics.headline}</Text>}
				</View>
			</View>
			<SemanticContactListView style={styles.contactList}>
				<PhoneContactItem phone={basics.phone} style={styles.contactItem} textStyle={styles.contactText} />
				<EmailContactItem email={basics.email} style={styles.contactItem} textStyle={styles.contactText} />
				<LocationContactItem location={basics.location} style={styles.contactItem} textStyle={styles.contactText} />
				<WebsiteContactItem website={basics.website} style={styles.contactItem} textStyle={styles.contactText} />
				{basics.customFields.map((field) => (
					<CustomFieldContactItem
						key={field.id}
						field={field}
						style={styles.contactItem}
						textStyle={styles.contactText}
					/>
				))}
			</SemanticContactListView>
		</SemanticHeaderView>
	);
}

function useStateOwnedTemplate() {
	const { metadata, r, foreground, background, primary, metrics, base } = useTemplateBase();

	return useMemo(() => {
		const colors: TemplateColorRoles = { foreground, background, primary };
		const ruleColor = "#BFBFBF";
		const styles = StyleSheet.create({
			...base,
			page: {
				...base.page,
				paddingHorizontal: metrics.page.paddingHorizontal,
				paddingVertical: metrics.page.paddingVertical,
				rowGap: metrics.gapY(1),
			},
			header: {
				flexDirection: "column",
				rowGap: metrics.gapY(0.375),
			},
			// The band frames the name and photo together, the way a personnel form prints the head.
			headerBand: {
				flexDirection: r.row,
				alignItems: "center",
				columnGap: metrics.gapX(1),
				borderWidth: 1,
				borderColor: foreground,
				paddingHorizontal: metrics.gapX(0.75),
				paddingVertical: metrics.gapY(0.5),
			},
			headerIdentity: {
				flex: 1,
				minWidth: 0,
				...r.headerIdentity,
				rowGap: metrics.gapY(0.125),
			},
			headerName: {
				fontSize: metadata.typography.heading.fontSize * 1.6,
				fontWeight: metadata.typography.heading.fontWeights.at(-1) ?? "700",
				lineHeight: headerNameLineHeight,
				letterSpacing: r.rtl ? 0 : headingTracking(1),
			},
			headerHeadline: {
				fontSize: metadata.typography.body.fontSize * 0.9375,
				opacity: 0.85,
			},
			// Contact row centres under the band. Flush left would put it on the same x as the section titles below,
			// and an importer reads a block of rows that share a left edge as one contact block — the first title
			// would be swallowed into it and the section it opens lost. The trailing space does the same job on the
			// vertical axis: the band closes the header, and the next title has to clear it by more than its own type
			// size before it reads as a separate block.
			contactList: {
				flexDirection: r.row,
				flexWrap: "wrap",
				justifyContent: "center",
				rowGap: metrics.gapY(0.0625),
				columnGap: metrics.gapX(1),
				paddingBottom: metrics.gapY(1),
			},
			contactItem: {
				flexDirection: r.row,
				alignItems: "center",
				columnGap: metrics.gapX(0.2),
				maxWidth: "100%",
			},
			contactText: { fontSize: metadata.typography.body.fontSize * 0.875, flexShrink: 1 },
			section: { flexDirection: "column", rowGap: metrics.gapY(0.25) },
			// Title inside a filled box: the numbered-heading look of an institutional document. The box keeps no
			// horizontal inset, so the title's text starts on the same left edge as the body below it — an indented
			// label gives column detection a false split, and the imported section is then filed as a sidebar.
			sectionHeadingContainer: {
				backgroundColor: primary,
				paddingVertical: metrics.gapY(0.0625),
			},
			sectionHeading: {
				color: background,
				// Never below body size: a heading smaller than its own content stops reading as a heading,
				// and importers that only have geometry to go on lose the section entirely.
				fontSize: Math.max(metadata.typography.heading.fontSize * 0.9375, metadata.typography.body.fontSize),
				fontWeight: metadata.typography.heading.fontWeights.at(-1) ?? "700",
				letterSpacing: r.rtl
					? 0
					: headingTracking(
							0.5,
							Math.max(metadata.typography.heading.fontSize * 0.9375, metadata.typography.body.fontSize),
						),
				textAlign: r.sectionHeadingTextAlign,
			},
			sectionItems: {
				rowGap: metrics.itemGapY * 0.75,
				borderBottomWidth: 0.5,
				borderBottomColor: ruleColor,
				paddingBottom: metrics.gapY(0.25),
			},
			item: { rowGap: metrics.gapY(0.125) },
			levelContainer: { width: "100%" },
			levelItem: { borderColor: primary },
			levelItemActive: { backgroundColor: primary },
			// Icons would read as decoration on an institutional form.
			icon: { display: "none" },
			sectionHeadingIcon: { display: "none" },
		});

		return { colors, styles } satisfies { colors: TemplateColorRoles; styles: StateOwnedStyles };
	}, [metadata, r, foreground, background, primary, metrics, base]);
}
