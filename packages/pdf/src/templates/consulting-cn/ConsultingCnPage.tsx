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

type ConsultingCnStyles = Omit<TemplateStyleSlots, "page"> & {
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

type ConsultingCnHeaderProps = { styles: ConsultingCnStyles };

/**
 * The consulting page: the name block sits on a colour panel in the corner, and each section is
 * titled in small capitals over a thin rule. Dense enough that a partner reading fifty of these
 * finds the firm names and dates by their position alone.
 */
export function ConsultingCnPage({ page, pageSize, pageMinHeightStyle, showHeader, pageNumber }: TemplatePageProps) {
	const data = useRender();
	const pageNodeKey = semanticNodeKeys.page(pageNumber);
	const { style: semanticPageStyle, size: semanticPageSize, ...semanticPageProps } = useResolvedNode(pageNodeKey);
	const { colors, styles } = useConsultingCnTemplate();
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
				<SemanticRegionView region="main" style={{ rowGap: metrics.gapY(1.5) }}>
					{sections.map((section) => (
						<Section key={section} section={section} placement="main" />
					))}
				</SemanticRegionView>
			</TemplateProvider>
		</Page>
	);
}

function Header({ styles }: ConsultingCnHeaderProps) {
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

function useConsultingCnTemplate() {
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
			// The panel holds the name block; the photo sits outside it at the end of the row.
			header: {
				flexDirection: r.row,
				alignItems: "stretch",
				columnGap: metrics.gapX(1),
				borderBottomWidth: 0.5,
				borderBottomColor: foreground,
				paddingBottom: metrics.gapY(0.625),
			},
			headerIdentity: {
				flex: 1,
				minWidth: 0,
				rowGap: metrics.gapY(0.25),
				backgroundColor: primary,
				paddingHorizontal: metrics.gapX(1),
				paddingVertical: metrics.gapY(0.75),
			},
			headerName: {
				fontSize: metadata.typography.heading.fontSize * 1.75,
				fontWeight: metadata.typography.heading.fontWeights.at(-1) ?? "700",
				lineHeight: headerNameLineHeight,
				letterSpacing: r.rtl ? 0 : headingTracking(1),
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
				rowGap: metrics.gapY(0.0625),
				columnGap: metrics.gapX(0.75),
				marginTop: metrics.gapY(0.125),
			},
			contactItem: {
				flexDirection: r.row,
				alignItems: "center",
				columnGap: metrics.gapX(1 / 6),
			},
			// On the panel, the contacts take the page colour like the name does.
			contactText: { color: background, opacity: 0.9, fontSize: metadata.typography.body.fontSize * 0.875 },
			section: { flexDirection: "column", rowGap: metrics.gapY(0.375) },
			sectionHeading: {
				fontSize: metadata.typography.heading.fontSize * 0.9375,
				fontWeight: metadata.typography.heading.fontWeights.at(-1) ?? "700",
				letterSpacing: r.rtl ? 0 : headingTracking(2, metadata.typography.heading.fontSize * 0.9375),
				color: foreground,
				borderBottomWidth: 0.5,
				borderBottomColor: foreground,
				paddingBottom: metrics.gapY(0.0625),
				textAlign: r.sectionHeadingTextAlign,
			},
			sectionItems: { rowGap: metrics.itemGapY * 0.875 },
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
			} satisfies ConsultingCnStyles,
		};
	}, [metadata, r, primary, metrics, base, foreground, background]);
}
