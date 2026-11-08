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

type CreativeGridStyles = Omit<TemplateStyleSlots, "page"> & {
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

type CreativeGridHeaderProps = { styles: CreativeGridStyles };

/**
 * The applied-arts page: a two-tone header split down the middle, and each section titled by a
 * filled chip with a rule running from it to the margin. Bolder than a plain column, still one
 * reading order — a recruiter's first pass stays linear.
 */
export function CreativeGridPage({ page, pageSize, pageMinHeightStyle, showHeader, pageNumber }: TemplatePageProps) {
	const data = useRender();
	const pageNodeKey = semanticNodeKeys.page(pageNumber);
	const { style: semanticPageStyle, size: semanticPageSize, ...semanticPageProps } = useResolvedNode(pageNodeKey);
	const { colors, styles } = useCreativeGridTemplate();
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

function Header({ styles }: CreativeGridHeaderProps) {
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
				<WebsiteContactItem website={basics.website} style={styles.contactItem} textStyle={styles.contactText} />
				<LocationContactItem location={basics.location} style={styles.contactItem} textStyle={styles.contactText} />
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

function useCreativeGridTemplate() {
	const { metadata, r, foreground, background, primary, metrics, base } = useTemplateBase();

	return useMemo(() => {
		const colors: TemplateColorRoles = { foreground, background, primary };
		const styles = StyleSheet.create({
			...base,
			page: {
				...base.page,
				paddingHorizontal: metrics.page.paddingHorizontal,
				paddingVertical: metrics.page.paddingVertical,
				rowGap: metrics.gapY(1.25),
			},
			// A colour rule down the start edge of the band, not a column: the identity and contacts share
			// the full width beside it.
			header: {
				flexDirection: r.row,
				flexWrap: "wrap",
				alignItems: "center",
				columnGap: metrics.gapX(1),
				rowGap: metrics.gapY(0.25),
				marginHorizontal: -metrics.page.paddingHorizontal,
				marginTop: -metrics.page.paddingVertical,
				paddingHorizontal: metrics.page.paddingHorizontal,
				paddingVertical: metrics.gapY(1.25),
				backgroundColor: background,
				...(r.rtl
					? { borderRightWidth: metrics.gapX(0.375), borderRightColor: primary }
					: { borderLeftWidth: metrics.gapX(0.375), borderLeftColor: primary }),
			},
			headerIdentity: {
				// Full width of the band: the contacts go on the row below rather than squeezing the name.
				flexBasis: "100%",
				minWidth: 0,
				rowGap: metrics.gapY(0.125),
			},
			headerName: {
				fontSize: metadata.typography.heading.fontSize * 1.9,
				fontWeight: metadata.typography.heading.fontWeights.at(-1) ?? "700",
				lineHeight: headerNameLineHeight,
				letterSpacing: r.rtl ? 0 : headingTracking(0.5),
				color: foreground,
			},
			headerHeadline: {
				fontSize: metadata.typography.body.fontSize,
				color: primary,
			},
			contactList: {
				flexDirection: r.row,
				flexWrap: "wrap",
				rowGap: metrics.gapY(0.125),
				columnGap: metrics.gapX(0.75),
				flexBasis: "100%",
				marginTop: metrics.gapY(0.25),
			},
			contactItem: {
				flexDirection: r.row,
				alignItems: "center",
				columnGap: metrics.gapX(1 / 6),
			},
			contactText: { fontSize: metadata.typography.body.fontSize * 0.9375 },
			section: { flexDirection: "column", rowGap: metrics.gapY(0.25) },
			// The title sits in a filled chip; a hairline runs out from it along the rest of the heading row.
			sectionHeadingContainer: {
				flexDirection: r.row,
				alignItems: "center",
				columnGap: metrics.gapX(0.5),
				borderBottomWidth: 0.5,
				borderBottomColor: primary,
				paddingBottom: metrics.gapY(0.125),
			},
			sectionHeading: {
				backgroundColor: primary,
				color: background,
				fontSize: metadata.typography.heading.fontSize * 0.875,
				fontWeight: metadata.typography.heading.fontWeights.at(-1) ?? "700",
				letterSpacing: r.rtl ? 0 : headingTracking(0.5, metadata.typography.heading.fontSize * 0.875),
				paddingHorizontal: metrics.gapX(0.5),
				paddingVertical: metrics.gapY(0.0625),
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
				...styles,
				levelItem: (context) => ({ borderColor: accentFor(context) }),
				levelItemActive: (context) => ({ backgroundColor: accentFor(context) }),
				icon: createIconSlot({ metadata, accentFor }),
			} satisfies CreativeGridStyles,
		};
	}, [metadata, r, primary, metrics, base, foreground, background]);
}
