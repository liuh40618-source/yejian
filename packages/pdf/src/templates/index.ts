import type { TemplatePage } from "../document";
import type { Template } from "@reactive-resume/schema/templates";
import { AsiaStandardPage } from "./asia-standard/AsiaStandardPage";
import { BilingualCnPage } from "./bilingual-cn/BilingualCnPage";
import { CampusFreshPage } from "./campus-fresh/CampusFreshPage";
import { CenterClassicPage } from "./center-classic/CenterClassicPage";
import { CnExecutivePage } from "./cn-executive/CnExecutivePage";
import { CompactDensePage } from "./compact-dense/CompactDensePage";
import { ConsultingCnPage } from "./consulting-cn/ConsultingCnPage";
import { CreativeGridPage } from "./creative-grid/CreativeGridPage";
import { CreativeSidePage } from "./creative-side/CreativeSidePage";
import { EditorialPage } from "./editorial/EditorialPage";
import { FormGridPage } from "./form-grid/FormGridPage";
import { GeneralSinglePage } from "./general-single/GeneralSinglePage";
import { GovFormalPage } from "./gov-formal/GovFormalPage";
import { HeadingAccentPage } from "./heading-accent/HeadingAccentPage";
import { MinimalPhotoPage } from "./minimal-photo/MinimalPhotoPage";
import { SeniorFormalPage } from "./senior-formal/SeniorFormalPage";
import { StateOwnedPage } from "./state-owned/StateOwnedPage";
import { TechTimelinePage } from "./tech-timeline/TechTimelinePage";
import { WhitespaceCleanPage } from "./whitespace-clean/WhitespaceCleanPage";

const templatePages: Partial<Record<Template, TemplatePage>> = {
	"asia-standard": AsiaStandardPage,
	"bilingual-cn": BilingualCnPage,
	"campus-fresh": CampusFreshPage,
	"center-classic": CenterClassicPage,
	"cn-executive": CnExecutivePage,
	"compact-dense": CompactDensePage,
	"consulting-cn": ConsultingCnPage,
	"creative-grid": CreativeGridPage,
	"creative-side": CreativeSidePage,
	editorial: EditorialPage,
	"form-grid": FormGridPage,
	"general-single": GeneralSinglePage,
	"gov-formal": GovFormalPage,
	"heading-accent": HeadingAccentPage,
	"minimal-photo": MinimalPhotoPage,
	"senior-formal": SeniorFormalPage,
	"state-owned": StateOwnedPage,
	"tech-timeline": TechTimelinePage,
	"whitespace-clean": WhitespaceCleanPage,
};

const defaultTemplatePage = GeneralSinglePage;

export const getTemplatePage = (template: Template): TemplatePage => templatePages[template] ?? defaultTemplatePage;
