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

type CnExecutiveStyles = Omit<TemplateStyleSlots, "page"> & {
	page: Style;
	header: Style;
	headerIdentity: Style;
	headerName: Style;
	headerHeadline: Style;
	contactList: Style;
	contactItem: Style;
	contactText: Style;
	picture: Style;
};

type CnExecutiveHeaderProps = { styles: CnExecutiveStyles };

/**
 * The executive page (高管/总监): a heavy rule under the header, section titles set in the accent
 * colour over a full-width band, and generous spacing between entries. Room is the message here —
 * a page that is not crowded reads as senior.
 */
export function CnExecutivePage({ page, pageSize, pageMinHeightStyle, showHeader, pageNumber }: TemplatePageProps) {
	const data = useRender();
	const pageNodeKey = semanticNodeKeys.page(pageNumber);
	const { style: semanticPageStyle, size: semanticPageSize, ...semanticPageProps } = useResolvedNode(pageNodeKey);
	const { colors, styles } = useCnExecutiveTemplate();
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
				<SemanticRegionView region="main" style={{ rowGap: metrics.gapY(1.75) }}>
					{sections.map((section) => (
						<Section key={section} section={section} placement="main" />
					))}
				</SemanticRegionView>
			</TemplateProvider>
		</Page>
	);
}

function Header({ styles }: CnExecutiveHeaderProps) {
	const { basics, picture } = useRender();

	return (
		<SemanticHeaderView style={styles.header}>
			<View style={styles.headerIdentity}>
				<Heading style={styles.headerName}>{basics.name}</Heading>
				{basics.headline && <Text style={styles.headerHeadline}>{basics.headline}</Text>}
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
			{hasTemplatePicture(picture) && <SemanticHeaderPicture src={picture.url} style={styles.picture} />}
		</SemanticHeaderView>
	);
}

function useCnExecutiveTemplate() {
	const { metadata, r, foreground, background, primary, metrics, base } = useTemplateBase();

	return useMemo(() => {
		const colors: TemplateColorRoles = { foreground, background, primary };
		const styles = StyleSheet.create({
			...base,
			page: {
				...base.page,
				paddingHorizontal: metrics.page.paddingHorizontal,
				paddingVertical: metrics.page.paddingVertical,
				rowGap: metrics.gapY(1.75),
			},
			header: {
				flexDirection: r.row,
				flexWrap: "wrap",
				alignItems: "flex-end",
				columnGap: metrics.gapX(1),
				rowGap: metrics.gapY(0.375),
				borderBottomWidth: 2.5,
				borderBottomColor: foreground,
				paddingBottom: metrics.gapY(0.625),
			},
			headerIdentity: {
				flex: 1,
				minWidth: 0,
				rowGap: metrics.gapY(0.125),
			},
			headerName: {
				fontSize: metadata.typography.heading.fontSize * 2,
				fontWeight: metadata.typography.heading.fontWeights.at(-1) ?? "700",
				lineHeight: headerNameLineHeight,
				letterSpacing: r.rtl ? 0 : headingTracking(2),
			},
			headerHeadline: {
				fontSize: metadata.typography.body.fontSize * 1.0625,
				letterSpacing: r.rtl ? 0 : headingTracking(0.5),
				opacity: 0.85,
			},
			contactList: {
				flexDirection: r.row,
				flexWrap: "wrap",
				rowGap: metrics.gapY(0.0625),
				columnGap: metrics.gapX(0.75),
				flexBasis: "100%",
			},
			contactItem: {
				flexDirection: r.row,
				alignItems: "center",
				columnGap: metrics.gapX(1 / 6),
			},
			contactText: { fontSize: metadata.typography.body.fontSize * 0.875 },
			section: { flexDirection: "column", rowGap: metrics.gapY(0.5) },
			// A tinted band across the full width behind the title: weight without a border.
			sectionHeadingContainer: {
				backgroundColor: primary,
				paddingHorizontal: metrics.gapX(0.625),
				paddingVertical: metrics.gapY(0.125),
			},
			sectionHeading: {
				color: background,
				fontSize: metadata.typography.heading.fontSize * 1.0625,
				fontWeight: metadata.typography.heading.fontWeights.at(-1) ?? "700",
				letterSpacing: r.rtl ? 0 : headingTracking(2.5, metadata.typography.heading.fontSize * 1.0625),
				textAlign: r.sectionHeadingTextAlign,
			},
			sectionItems: { rowGap: metrics.itemGapY * 1.1 },
			item: { rowGap: metrics.gapY(0.25) },
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
			} satisfies CnExecutiveStyles,
		};
	}, [metadata, r, primary, metrics, base, foreground, background]);
}
