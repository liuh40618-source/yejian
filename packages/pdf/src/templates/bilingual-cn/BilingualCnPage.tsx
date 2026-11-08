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

type BilingualCnStyles = Omit<TemplateStyleSlots, "page"> & {
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

type BilingualCnHeaderProps = { styles: BilingualCnStyles };

/**
 * For the resume that has to work in two markets: the header stacks a Chinese name over its
 * reading, contacts run in both scripts, and section titles print with a thin secondary line of
 * room beneath them for the applicant to add the English. One column, one reading order.
 */
export function BilingualCnPage({ page, pageSize, pageMinHeightStyle, showHeader, pageNumber }: TemplatePageProps) {
	const data = useRender();
	const pageNodeKey = semanticNodeKeys.page(pageNumber);
	const { style: semanticPageStyle, size: semanticPageSize, ...semanticPageProps } = useResolvedNode(pageNodeKey);
	const { colors, styles } = useBilingualCnTemplate();
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

function Header({ styles }: BilingualCnHeaderProps) {
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

function useBilingualCnTemplate() {
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
			// The header keeps a full-width rule under it: the one element both markets read the same way.
			header: {
				flexDirection: r.row,
				flexWrap: "wrap",
				alignItems: "center",
				columnGap: metrics.gapX(1),
				rowGap: metrics.gapY(0.375),
				borderBottomWidth: 1.5,
				borderBottomColor: foreground,
				paddingBottom: metrics.gapY(0.5),
			},
			headerIdentity: {
				flex: 1,
				minWidth: 0,
				rowGap: metrics.gapY(0.125),
			},
			headerName: {
				fontSize: metadata.typography.heading.fontSize * 1.7,
				fontWeight: metadata.typography.heading.fontWeights.at(-1) ?? "700",
				lineHeight: headerNameLineHeight,
				letterSpacing: r.rtl ? 0 : headingTracking(1),
			},
			headerHeadline: {
				fontSize: metadata.typography.body.fontSize,
				color: primary,
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
			contactText: { fontSize: metadata.typography.body.fontSize * 0.9375 },
			section: { flexDirection: "column", rowGap: metrics.gapY(0.25) },
			// Two-line heading: the Chinese title, then the accent rule under it where the English reads.
			sectionHeading: {
				fontSize: metadata.typography.heading.fontSize,
				fontWeight: metadata.typography.heading.fontWeights.at(-1) ?? "700",
				letterSpacing: r.rtl ? 0 : headingTracking(1, metadata.typography.heading.fontSize),
				color: foreground,
				borderBottomWidth: 0.75,
				borderBottomColor: primary,
				paddingBottom: metrics.gapY(0.125),
				textAlign: r.sectionHeadingTextAlign,
			},
			sectionItems: { rowGap: metrics.itemGapY * 0.875 },
			item: { rowGap: metrics.gapY(0.125) },
			levelContainer: { width: "100%" },
			levelItem: { borderColor: primary },
			levelItemActive: { backgroundColor: primary },
		});

		return { colors, styles } satisfies { colors: TemplateColorRoles; styles: BilingualCnStyles };
	}, [metadata, r, primary, metrics, base, foreground, background]);
}
