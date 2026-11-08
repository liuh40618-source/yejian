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

type CreativeSideStyles = Omit<TemplateStyleSlots, "page"> & {
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

type CreativeSideHeaderProps = { styles: CreativeSideStyles };

/**
 * The portfolio page: a colour block behind the name, then each section titled inside a colour bar
 * down its start edge. Designers and content roles send this one; it stays a single column so a
 * printed stack and a parser both read it in the order it was written.
 */
export function CreativeSidePage({ page, pageSize, pageMinHeightStyle, showHeader, pageNumber }: TemplatePageProps) {
	const data = useRender();
	const pageNodeKey = semanticNodeKeys.page(pageNumber);
	const { style: semanticPageStyle, size: semanticPageSize, ...semanticPageProps } = useResolvedNode(pageNodeKey);
	const { colors, styles } = useCreativeSideTemplate();
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

function Header({ styles }: CreativeSideHeaderProps) {
	const { basics, picture } = useRender();

	return (
		<SemanticHeaderView style={styles.header}>
			<View style={styles.headerIdentity}>
				<Heading style={styles.headerName}>{basics.name}</Heading>
				{basics.headline && <Text style={styles.headerHeadline}>{basics.headline}</Text>}
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
			</View>
			{hasTemplatePicture(picture) && <SemanticHeaderPicture src={picture.url} style={styles.picture} />}
		</SemanticHeaderView>
	);
}

function useCreativeSideTemplate() {
	const { metadata, r, foreground, background, primary, metrics, base } = useTemplateBase();

	return useMemo(() => {
		const colors: TemplateColorRoles = { foreground, background, primary };
		const barWidth = metrics.gapX(0.5);

		const styles = StyleSheet.create({
			...base,
			page: {
				...base.page,
				paddingHorizontal: metrics.page.paddingHorizontal,
				paddingVertical: metrics.page.paddingVertical,
				rowGap: metrics.gapY(1.25),
			},
			// A full-bleed band: the page's own margins are cancelled so the colour reaches the trim.
			header: {
				flexDirection: r.row,
				alignItems: "center",
				columnGap: metrics.gapX(1),
				marginHorizontal: -metrics.page.paddingHorizontal,
				marginTop: -metrics.page.paddingVertical,
				paddingHorizontal: metrics.page.paddingHorizontal,
				paddingVertical: metrics.gapY(1.25),
				backgroundColor: primary,
			},
			headerIdentity: {
				flex: 1,
				minWidth: 0,
				rowGap: metrics.gapY(0.25),
			},
			headerName: {
				fontSize: metadata.typography.heading.fontSize * 2,
				fontWeight: metadata.typography.heading.fontWeights.at(-1) ?? "700",
				lineHeight: headerNameLineHeight,
				letterSpacing: r.rtl ? 0 : headingTracking(0.75),
				color: background,
			},
			headerHeadline: {
				fontSize: metadata.typography.body.fontSize,
				color: background,
				opacity: 0.85,
			},
			contactList: {
				flexDirection: r.row,
				flexWrap: "wrap",
				rowGap: metrics.gapY(0.125),
				columnGap: metrics.gapX(0.75),
				marginTop: metrics.gapY(0.125),
			},
			contactItem: {
				flexDirection: r.row,
				alignItems: "center",
				columnGap: metrics.gapX(1 / 6),
			},
			// The band is the accent colour, so its contacts are painted in the page's colour.
			contactText: { color: background, opacity: 0.9 },
			// Each section opens with a colour bar down its start edge, which is the "side" of the name.
			section: {
				flexDirection: "column",
				rowGap: metrics.gapY(0.375),
				...(r.rtl
					? { borderRightWidth: barWidth, borderRightColor: primary }
					: { borderLeftWidth: barWidth, borderLeftColor: primary }),
				...(r.rtl ? { paddingRight: metrics.gapX(0.75) } : { paddingLeft: metrics.gapX(0.75) }),
			},
			sectionHeading: {
				fontSize: metadata.typography.heading.fontSize,
				fontWeight: metadata.typography.heading.fontWeights.at(-1) ?? "700",
				color: primary,
				letterSpacing: r.rtl ? 0 : headingTracking(1.5, metadata.typography.heading.fontSize),
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
			} satisfies CreativeSideStyles,
		};
	}, [metadata, r, primary, metrics, base, foreground, background]);
}
