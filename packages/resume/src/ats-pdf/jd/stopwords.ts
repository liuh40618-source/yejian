/**
 * Words that carry no signal in a keyword-coverage comparison.
 *
 * Two groups: ordinary English function words, and the boilerplate every posting shares —
 * "equal opportunity employer", "competitive salary", "fast-paced environment". A resume gains
 * nothing by matching the parts of a posting that are identical across every posting.
 */
const FUNCTION_WORDS =
	"a about above across after again against all almost along already also although always am among an and another " +
	"any anyone anything are around as at back be became because become been before began begin behind being below " +
	"beside besides best better between both but by came can cannot come could did do does doing done down during " +
	"each either else enough etc even ever every everything few for from further get give go going good got had half " +
	"has have having he her here hers herself him himself his how however i if in inside instead into is it its " +
	"itself just keep kind know large last later least left less let like likely little long made make many may me " +
	"might mine more most much must my myself near need never new next no nor not now of off often on once one only " +
	"onto or other others our ours out outside over own per perhaps please plus rather really right same say see " +
	"seem set several shall she should since so some something soon still such than that the their theirs them " +
	"themselves then there these they thing think this those though three through throughout thus to together too " +
	"toward towards two under until up upon us use used using very via was way we well went were what when where " +
	"whether which while who whom whose why will with within without would yet you your yours yourself";

const RECRUITING_BOILERPLATE =
	"bonus deep demonstrated detail driven eager excellent exceptional familiar familiarity great hands hands-on " +
	"knowledge expert expertise experienced fluent comfortable strong-plus " +
	"ideally including keen looking love nice offering outstanding package passion plus preferably proven required " +
	"solid strong track understanding well willing " +
	"ability applicant applicants apply application balance benefits candidate candidates career color colour " +
	"company compensation competitive culture disability diverse diversity dynamic employee employer employment " +
	"environment equal ethnicity excellent experience fast fast-paced gender growth identity inclusion inclusive " +
	"individual job join life location marital minimum must national opportunity opportunities orientation " +
	"package paced paid parental passionate pay people plus preferred qualification qualifications qualified race " +
	"regard religion remote required requirement requirements responsibilities responsibility role roles salary " +
	"seeking sex sexual skills status team teams thrive time title veteran welcome work working workplace years";

/** Counted words: "five teams" names a size, not a skill. */
const NUMBER_WORDS =
	"zero four five six seven eight nine ten eleven twelve fifteen twenty thirty forty fifty hundred thousand " +
	"million billion dozen dozens multi multiple";

/**
 * Words that describe the work or the job rather than name a skill. A senior reader is told to add "drive",
 * "grow" or "background" to a resume and stops trusting the list.
 *
 * Verbs and qualifiers carry nothing on their own or at the head of a phrase: "drive hiring", "senior engineers",
 * "improve deployment". Nouns carry nothing on their own but do name a skill with the word before them or after
 * them: "big data", "hybrid cloud", "partner management", "technical lead", "engineering managers".
 */
const LEADING_GENERIC_WORDS =
	"drive driving grow growing partnering lead leading own owning building help helping improve " +
	"improving deliver delivering create creating define defining ensure ensuring shape " +
	"shaping scale scaling run running bring bringing take taking coach collaborate collaborating managing " +
	"various several varied nice-to-have must-have bonus-points " +
	"multi-year year-round day-to-day day days week weeks month months year yearly annual annually quarterly " +
	"daily weekly onsite on-site full-time part-time senior junior " +
	"mid-level large small modern complex world-class impactful successful " +
	"great top early current future overall ideal ideally thing things stuff ways asap values-driven " +
	"evolve evolving analyze analyzing analyse analysing hire hiring support supporting values aa aaa";

const SOLO_GENERIC_WORDS =
	"partner build head chief ceo cto cfo coo founder founders director directors manager managers " +
	"changes background backgrounds hybrid big global impact frameworks domain domains area areas space spaces " +
	"part parts level levels mission missions vision values record group groups report staff product products";

/**
 * Chinese words a keyword comparison gains nothing from.
 *
 * The tokenizer hands back dictionary words, so every Chinese sentence arrives as its ordinary
 * parts: "负责支付链路的性能优化" is 负责 / 支付 / 链路 / 性能 / 优化. Half of those report nothing when
 * matched — a resume that "负责" something has not thereby gained a skill the posting asked for —
 * and reporting them as missing keywords is the same noise the English function-word list removes.
 *
 * Two groups, matching the English lists: function words and recruiter phrasing a posting shares
 * with every other posting. Single characters that do name a skill or a field ("云", "链") are
 * deliberately absent; the skill alias list is where a term earns its place.
 */
const CHINESE_FUNCTION_WORDS = [
	"的",
	"了",
	"在",
	"是",
	"和",
	"与",
	"及",
	"或",
	"等",
	"中",
	"对",
	"为",
	"以",
	"于",
	"由",
	"从",
	"到",
	"把",
	"被",
	"将",
	"让",
	"使",
	"给",
	"向",
	"并",
	"并且",
	"而且",
	"以及",
	"同时",
	"此外",
	"另外",
	"因此",
	"所以",
	"但是",
	"然而",
	"如果",
	"若",
	"可以",
	"能够",
	"需要",
	"应该",
	"必须",
	"会",
	"能",
	"要",
	"有",
	"无",
	"之",
	"其",
	"该",
	"这个",
	"这些",
	"那些",
	"每个",
	"各个",
	"相关",
	"以上",
	"以下",
	"以及",
	"我们",
	"你",
	"他们",
	"公司",
	"团队",
	"岗位",
	"职位",
	"工作",
	"方面",
	"情况",
	"能力",
	"水平",
	"程度",
	// Generic nouns that describe the business rather than name a skill. "业务系统" tells a reader
	// nothing a resume can add to; "订单系统" does, and only the unqualified form is listed here.
	"业务",
	"系统",
	"职责",
	"开发",
	"建设",
	"经验",
	"完成",
	"提供",
	"弹性",
	"年假",
	"沟通",
	"计算",
	"相关专业",
	"以上学历",
	"需求分析",
	"产品经理",
	"团队建设",
];

const CHINESE_RECRUITING_BOILERPLATE = [
	// Recruiter phrasing: describes the job, not the candidate's skill.
	"负责",
	"从事",
	"参与",
	"协助",
	"配合",
	"要求",
	"任职",
	"岗位职责",
	"工作职责",
	"职责描述",
	"任职要求",
	"职位描述",
	"岗位要求",
	"我们提供",
	"福利待遇",
	"薪资面议",
	"简历投递",
	"欢迎投递",
	"优先考虑",
	"优先",
	"加分",
	"加分项",
	"具备",
	"具有",
	"掌握",
	"熟悉",
	"了解",
	"精通",
	"熟练",
	"至少",
	"以上学历",
	"本科",
	"硕士",
	"博士",
	"大专",
	"学历",
	"专业",
	"应届",
	"实习",
	"全职",
	"兼职",
	"五年",
	"三年",
	"多年",
	"一定",
	"良好",
	"优秀",
	"较强",
	"较强的",
	"出色的",
	"扎实",
	"工作经验",
	"项目经验",
	"实习经验",
	// Equal-opportunity and company-blurb text, the Chinese equivalent of the English list.
	"企业文化",
	"五险一金",
	"带薪年假",
	"双休",
	"弹性工作",
	"扁平化",
	"氛围",
	"晋升空间",
	"发展空间",
	"培训机会",
	"岗位晋升",
	"欢迎",
	"期待",
	"加入",
	"应聘",
	"面试",
	"录用",
	"入职",
];

/** Never part of a term, wherever they appear. */
export const JD_STOPWORDS: ReadonlySet<string> = new Set(
	[
		...FUNCTION_WORDS.split(" "),
		...RECRUITING_BOILERPLATE.split(" "),
		...NUMBER_WORDS.split(" "),
		...CHINESE_FUNCTION_WORDS,
		...CHINESE_RECRUITING_BOILERPLATE,
	].filter(Boolean),
);

/** Never a term on their own, nor the first word of one. */
export const JD_LEADING_GENERIC_WORDS: ReadonlySet<string> = new Set(LEADING_GENERIC_WORDS.split(" "));

/** Never a term on their own; fine inside a longer one. */
export const JD_SOLO_GENERIC_WORDS: ReadonlySet<string> = new Set(SOLO_GENERIC_WORDS.split(" "));
