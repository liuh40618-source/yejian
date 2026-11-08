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

type GovFormalStyles = Omit<TemplateStyleSlots, "page"> & {
	page: Style;
	header: Style;
	headerIdentity: Style;
	headerName: Style;
	headerHeadline: Style;
	contactList: Style;
	contactItem: Style;
	contactText: Style;
	picture: Style;
	headerRule: Style;
};

type GovFormalHeaderProps = { styles: GovFormalStyles };

/**
 * The public-sector page: centred name over a heavy double rule, contacts on a single grey line,
 * and section titles as plain bold text with no colour or icon. Nothing decorative competes with
 * the content — the format reviewers at institutions and state-owned enterprises expect.
 */
export function GovFormalPage({ page, pageSize, pageMinHeightStyle, showHeader, pageNumber }: TemplatePageProps) {
	const data = useRender();
	const pageNodeKey = semanticNodeKeys.page(pageNumber);
	const { style: semanticPageStyle, size: semanticPageSize, ...semanticPageProps } = useResolvedNode(pageNodeKey);
	const { colors, styles } = useGovFormalTemplate();
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

function Header({ styles }: GovFormalHeaderProps) {
	const { basics, picture } = useRender();

	return (
		<SemanticHeaderView style={styles.header}>
			<View style={styles.headerRule}>
				<View style={styles.headerIdentity}>
					<Heading style={styles.headerName}>{basics.name}</Heading>
					{basics.headline && <Text style={styles.headerHeadline}>{basics.headline}</Text>}
				</View>
				{hasTemplatePicture(picture) && <SemanticHeaderPicture src={picture.url} style={styles.picture} />}
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

function useGovFormalTemplate() {
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
			header: {
				flexDirection: "column",
				rowGap: metrics.gapY(0.5),
				borderBottomWidth: 1,
				borderBottomColor: foreground,
				paddingBottom: metrics.gapY(0.375),
			},
			headerRule: {
				flexDirection: r.row,
				alignItems: "center",
				columnGap: metrics.gapX(1),
			},
			headerIdentity: {
				flex: 1,
				minWidth: 0,
				alignItems: "center",
				rowGap: metrics.gapY(0.125),
			},
			headerName: {
				fontSize: metadata.typography.heading.fontSize * 1.75,
				fontWeight: metadata.typography.heading.fontWeights.at(-1) ?? "700",
				lineHeight: headerNameLineHeight,
				letterSpacing: r.rtl ? 0 : headingTracking(3),
				textAlign: "center",
			},
			headerHeadline: {
				fontSize: metadata.typography.body.fontSize * 0.9375,
				textAlign: "center",
				opacity: 0.8,
			},
			contactList: {
				flexDirection: r.row,
				flexWrap: "wrap",
				justifyContent: "center",
				rowGap: metrics.gapY(0.0625),
				columnGap: metrics.gapX(1),
			},
			contactItem: {
				flexDirection: r.row,
				alignItems: "center",
				columnGap: metrics.gapX(0.2),
				maxWidth: "100%",
			},
			contactText: { fontSize: metadata.typography.body.fontSize * 0.875, flexShrink: 1, opacity: 0.85 },
			section: { flexDirection: "column", rowGap: metrics.gapY(0.25) },
			// Plain bold title with a hairline under it: the least decorated heading any template offers.
			sectionHeading: {
				fontSize: metadata.typography.heading.fontSize,
				fontWeight: metadata.typography.heading.fontWeights.at(-1) ?? "700",
				letterSpacing: r.rtl ? 0 : headingTracking(1, metadata.typography.heading.fontSize),
				color: foreground,
				borderBottomWidth: 0.5,
				borderBottomColor: foreground,
				paddingBottom: metrics.gapY(0.0625),
				textAlign: r.sectionHeadingTextAlign,
			},
			sectionItems: { rowGap: metrics.itemGapY * 0.75 },
			item: { rowGap: metrics.gapY(0.125) },
			levelContainer: { width: "100%" },
			levelItem: { borderColor: foreground },
			levelItemActive: { backgroundColor: foreground },
		});
		const templateStyles = {
			...styles,
			// No icons anywhere: an icon column reads as decoration here, not information.
			icon: { display: "none" },
			sectionHeadingIcon: { display: "none" },
		} satisfies GovFormalStyles;

		return { colors, styles: templateStyles };
	}, [metadata, r, foreground, background, primary, metrics, base]);
}
