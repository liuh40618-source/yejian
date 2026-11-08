import type { TemplatePageProps } from "../../document";
import type { Style } from "../../forme/style-types";
import type { TemplateColorRoles, TemplateStyleContext, TemplateStyleSlots } from "../shared/types";
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
import { createIconSlot, useTemplateBase } from "../shared/template-base";

type CampusFreshStyles = Omit<TemplateStyleSlots, "page"> & {
	page: Style;
	header: Style;
	headerIdentity: Style;
	headerName: Style;
	headerHeadline: Style;
	contactList: Style;
	contactItem: Style;
	picture: Style;
};

type CampusFreshHeaderProps = { styles: CampusFreshStyles };

/**
 * The campus recruiter's page: a school-register header (photo at the end, contacts under the name),
 * a solid title bar over every section, and the skills listed on one line each. Everything reads top
 * to bottom in one column, so a printed stack of resumes sorts cleanly.
 */
export function CampusFreshPage({ page, pageSize, pageMinHeightStyle, showHeader, pageNumber }: TemplatePageProps) {
	const data = useRender();
	const pageNodeKey = semanticNodeKeys.page(pageNumber);
	const { style: semanticPageStyle, size: semanticPageSize, ...semanticPageProps } = useResolvedNode(pageNodeKey);
	const { colors, styles } = useCampusFreshTemplate();
	const metrics = getTemplateMetrics(data.metadata.page);
	// Main-only regions: the sidebar's sections join the main column, after its own.
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

function Header({ styles }: CampusFreshHeaderProps) {
	const { basics, picture } = useRender();

	return (
		<SemanticHeaderView style={styles.header}>
			<View style={styles.headerIdentity}>
				<Heading style={styles.headerName}>{basics.name}</Heading>
				{basics.headline && <Text style={styles.headerHeadline}>{basics.headline}</Text>}
				<SemanticContactListView style={styles.contactList}>
					<PhoneContactItem phone={basics.phone} style={styles.contactItem} />
					<EmailContactItem email={basics.email} style={styles.contactItem} />
					<LocationContactItem location={basics.location} style={styles.contactItem} />
					<WebsiteContactItem website={basics.website} style={styles.contactItem} />
					{basics.customFields.map((field) => (
						<CustomFieldContactItem key={field.id} field={field} style={styles.contactItem} />
					))}
				</SemanticContactListView>
			</View>
			{hasTemplatePicture(picture) && <SemanticHeaderPicture src={picture.url} style={styles.picture} />}
		</SemanticHeaderView>
	);
}

function useCampusFreshTemplate() {
	const { metadata, r, foreground, background, primary, metrics, base } = useTemplateBase();

	return useMemo(() => {
		const colors: TemplateColorRoles = { foreground, background, primary };
		const baseStyles = StyleSheet.create({
			...base,
			page: {
				...base.page,
				paddingHorizontal: metrics.page.paddingHorizontal,
				paddingVertical: metrics.page.paddingVertical,
				rowGap: metrics.gapY(1.25),
			},
			header: {
				flexDirection: r.row,
				alignItems: "center",
				columnGap: metrics.gapX(1.25),
				borderBottomWidth: 2,
				borderBottomColor: primary,
				paddingBottom: metrics.gapY(0.75),
			},
			headerIdentity: {
				flex: 1,
				minWidth: 0,
				...r.headerIdentity,
				rowGap: metrics.gapY(0.35),
			},
			headerName: {
				fontSize: metadata.typography.heading.fontSize * 1.7,
				fontWeight: metadata.typography.heading.fontWeights.at(-1) ?? "700",
				lineHeight: headerNameLineHeight,
				letterSpacing: r.rtl ? 0 : headingTracking(2),
			},
			headerHeadline: {
				fontSize: metadata.typography.body.fontSize * 0.9375,
				opacity: 0.85,
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
			section: {
				flexDirection: "column",
				rowGap: metrics.gapY(0.375),
			},
			// A solid bar behind the title: the block the campus format is recognised by.
			sectionHeadingContainer: {
				backgroundColor: primary,
				paddingHorizontal: metrics.gapX(0.75),
				paddingVertical: metrics.gapY(0.125),
				borderRadius: 1,
			},
			sectionHeading: {
				color: background,
				fontSize: metadata.typography.heading.fontSize,
				fontWeight: metadata.typography.heading.fontWeights.at(-1) ?? "700",
				letterSpacing: r.rtl ? 0 : headingTracking(2, metadata.typography.heading.fontSize),
				textAlign: r.sectionHeadingTextAlign,
			},
			sectionItems: { rowGap: metrics.itemGapY * 0.75 },
			item: { rowGap: metrics.gapY(0.125) },
			levelContainer: { width: "100%" },
		});

		const accentFor = ({ colors }: TemplateStyleContext) => colors.primary;

		return {
			colors,
			styles: {
				...baseStyles,
				levelItem: (context) => ({ borderColor: accentFor(context) }),
				levelItemActive: (context) => ({ backgroundColor: accentFor(context) }),
				icon: createIconSlot({ metadata, accentFor }),
			} satisfies CampusFreshStyles,
		};
	}, [metadata, r, primary, metrics, base, foreground, background]);
}
