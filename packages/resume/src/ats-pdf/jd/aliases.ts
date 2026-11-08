/**
 * Surface form -> canonical form.
 *
 * A posting says "K8s", a resume says "Kubernetes", and a keyword comparison that misses that is
 * worse than useless — it tells the candidate to add something they already have. The list is
 * deliberately curated rather than derived: every entry is a pair a recruiter would treat as the
 * same thing, and nothing here guesses.
 */
const ALIASES: Readonly<Record<string, string>> = {
	// Languages and runtimes
	js: "javascript",
	ecmascript: "javascript",
	ts: "typescript",
	"node.js": "node",
	nodejs: "node",
	"c++": "cpp",
	cplusplus: "cpp",
	"c#": "csharp",
	".net": "dotnet",
	"asp.net": "aspnet",
	py: "python",
	python3: "python",
	golang: "go",
	rustlang: "rust",
	objc: "objective-c",
	"objective c": "objective-c",
	php7: "php",
	php8: "php",
	rb: "ruby",
	"ruby on rails": "rails",
	ror: "rails",

	// Front end
	reactjs: "react",
	"react.js": "react",
	"react native": "react-native",
	reactnative: "react-native",
	vuejs: "vue",
	"vue.js": "vue",
	angularjs: "angular",
	nextjs: "next",
	"next.js": "next",
	nuxtjs: "nuxt",
	sveltekit: "svelte",
	css3: "css",
	html5: "html",
	scss: "sass",
	tailwindcss: "tailwind",
	"styled components": "styled-components",
	"material ui": "mui",
	"react testing library": "testing-library",

	// Back end and data
	postgres: "postgresql",
	psql: "postgresql",
	"my sql": "mysql",
	mssql: "sql-server",
	"sql server": "sql-server",
	"ms sql": "sql-server",
	mongo: "mongodb",
	"elastic search": "elasticsearch",
	dynamo: "dynamodb",
	"big query": "bigquery",
	"apache kafka": "kafka",
	"apache spark": "spark",
	"apache airflow": "airflow",
	rabbit: "rabbitmq",
	"rest api": "rest",
	restful: "rest",
	"restful api": "rest",

	// Cloud and platform
	"amazon web services": "aws",
	gcp: "google-cloud",
	"google cloud": "google-cloud",
	"google cloud platform": "google-cloud",
	"microsoft azure": "azure",
	k8s: "kubernetes",
	kube: "kubernetes",
	eks: "kubernetes",
	gke: "kubernetes",
	aks: "kubernetes",
	containerization: "containers",
	containerisation: "containers",
	iac: "infrastructure-as-code",
	"infrastructure as code": "infrastructure-as-code",
	tf: "terraform",
	"ci/cd": "ci-cd",
	cicd: "ci-cd",
	"continuous integration": "ci-cd",
	"continuous delivery": "ci-cd",
	"continuous deployment": "ci-cd",
	"github actions": "github-actions",
	gha: "github-actions",
	"gitlab ci": "gitlab-ci",
	lambda: "aws-lambda",
	"aws lambda": "aws-lambda",
	s3: "aws-s3",
	ec2: "aws-ec2",

	// Practice
	"machine learning": "machine-learning",
	ml: "machine-learning",
	"deep learning": "deep-learning",
	ai: "artificial-intelligence",
	"artificial intelligence": "artificial-intelligence",
	nlp: "natural-language-processing",
	"natural language processing": "natural-language-processing",
	llm: "large-language-models",
	llms: "large-language-models",
	"large language model": "large-language-models",
	"large language models": "large-language-models",
	genai: "generative-ai",
	"gen ai": "generative-ai",
	"generative ai": "generative-ai",
	"computer vision": "computer-vision",
	elt: "etl",
	"data pipeline": "data-pipelines",
	"data pipelines": "data-pipelines",
	"data warehouse": "data-warehousing",
	"data warehousing": "data-warehousing",
	tdd: "test-driven-development",
	"test driven development": "test-driven-development",
	bdd: "behaviour-driven-development",
	ddd: "domain-driven-design",
	"domain driven design": "domain-driven-design",
	oop: "object-oriented-programming",
	"object oriented": "object-oriented-programming",
	soa: "service-oriented-architecture",
	"micro services": "microservices",
	"micro-services": "microservices",
	"event driven": "event-driven",
	"event-driven": "event-driven",

	// Ways of working
	"agile methodology": "agile",
	"agile methodologies": "agile",
	safe: "scaled-agile",
	"scaled agile": "scaled-agile",
	"a/b testing": "ab-testing",
	"ab testing": "ab-testing",
	"user research": "user-research",
	ux: "user-experience",
	"user experience": "user-experience",
	ui: "user-interface",
	"user interface": "user-interface",
	"product management": "product-management",
	"project management": "project-management",
	pmp: "project-management",
	okr: "okrs",
	kpi: "kpis",

	// Security and compliance
	infosec: "information-security",
	"information security": "information-security",
	appsec: "application-security",
	"application security": "application-security",
	soc2: "soc-2",
	"soc 2": "soc-2",
	pci: "pci-dss",
	"pci dss": "pci-dss",
	iso27001: "iso-27001",
	"iso 27001": "iso-27001",
	sso: "single-sign-on",
	"single sign on": "single-sign-on",
	oauth2: "oauth",
	"oauth 2.0": "oauth",
	mfa: "multi-factor-authentication",
	"2fa": "multi-factor-authentication",
	"two factor": "multi-factor-authentication",
	pentest: "penetration-testing",
	"penetration testing": "penetration-testing",

	// Business and finance
	crm: "crm",
	"p&l": "profit-and-loss",
	"profit and loss": "profit-and-loss",
	"fp&a": "financial-planning-and-analysis",
	fpa: "financial-planning-and-analysis",
	roi: "return-on-investment",
	"go to market": "go-to-market",
	gtm: "go-to-market",
	cro: "conversion-rate-optimization",
	"lead generation": "lead-generation",
	"lead gen": "lead-generation",

	// Tools
	vscode: "vs-code",
	"vs code": "vs-code",
	"visual studio code": "vs-code",
	powerbi: "power-bi",
	"power bi": "power-bi",
	"microsoft excel": "excel",
	"google analytics": "google-analytics",
	ga4: "google-analytics",
	unix: "linux",
	shell: "bash",
};

/**
 * Chinese surface form -> the English canonical the rest of this file already uses.
 *
 * A mainland posting names the same skill as its resume almost as often in Chinese ("前端" /
 * "Web 前端", "数据分析师" / "数据分析", "算法" / "机器学习"). Left alone, those two spellings never meet,
 * and the coverage report tells a candidate to add a skill they already put down. Every target here
 * is a canonical already produced by `ALIASES`, so a Chinese match resolves to the same surface set
 * as its English spelling does.
 */
const CHINESE_ALIASES: Readonly<Record<string, string>> = {
	// Roles and disciplines
	前端: "frontend",
	web前端: "frontend",
	前端开发: "frontend",
	前端工程师: "frontend",
	后端: "backend",
	服务端: "backend",
	后端开发: "backend",
	全栈: "full-stack",
	全栈开发: "full-stack",
	算法工程师: "machine-learning",
	机器学习: "machine-learning",
	深度学习: "deep-learning",
	人工智能: "artificial-intelligence",
	大模型: "large-language-model",
	大语言模型: "large-language-model",
	数据分析: "data-analysis",
	数据分析师: "data-analysis",
	数据挖掘: "data-mining",
	数据仓库: "data-warehouse",
	数据可视化: "data-visualization",
	产品经理: "product-management",
	产品设计: "product-design",
	交互设计: "interaction-design",
	视觉设计: "visual-design",
	用户研究: "user-research",
	项目管理: "project-management",
	敏捷开发: "agile",
	软件测试: "testing",
	自动化测试: "test-automation",
	运维: "devops",
	持续集成: "ci",
	持续集成与持续交付: "ci/cd",
	微服务: "microservices",
	分布式系统: "distributed-systems",
	高并发: "high-concurrency",
	性能优化: "performance-optimization",
	架构设计: "architecture",
	技术架构: "architecture",
	数据库设计: "database-design",
	信息安全: "security",
	网络安全: "network-security",
	渗透测试: "penetration-testing",
	运营: "operations",
	市场营销: "marketing",
	增长: "growth",
	销售: "sales",
	人力资源: "human-resources",
	招聘: "recruiting",
	财务: "finance",
	会计: "accounting",
	法务: "legal",
	供应链: "supply-chain",
	物流: "logistics",
	客户服务: "customer-service",
	客户成功: "customer-success",
	ToB: "b2b",
	ToC: "b2c",

	// Languages and frameworks
	javascript: "javascript",
	js: "javascript",
	typescript: "typescript",
	ts: "typescript",
	java开发: "java",
	python开发: "python",
	go语言: "go",
	golang: "go",
	c语言: "c",
	"c++语言": "cpp",
	"c#语言": "csharp",
	网页: "html",
	样式表: "css",
	弹性布局: "css",
	前端框架: "react",
	响应式布局: "responsive-design",
	小程序: "mini-program",
	微信小程序: "mini-program",
	小程序开发: "mini-program",

	// Data and infrastructure
	关系型数据库: "sql",
	结构化查询语言: "sql",
	缓存: "redis",
	消息队列: "message-queue",
	云原生: "cloud-native",
	容器化: "docker",
	容器: "docker",
	容器编排: "kubernetes",
	k8s: "kubernetes",
	对象存储: "object-storage",
	大数据: "big-data",
	流式计算: "stream-processing",
	实时计算: "stream-processing",
	离线计算: "batch-processing",

	// AI
	机器学习框架: "machine-learning",
	自然语言处理: "nlp",
	计算机视觉: "computer-vision",
	语音识别: "speech-recognition",
	推荐系统: "recommender-system",
	搜索: "search",
	知识图谱: "knowledge-graph",
	检索增强生成: "rag",
	提示词工程: "prompt-engineering",
	向量数据库: "vector-database",
	智能体: "ai-agent",
};

/** Canonical form -> every surface form that maps onto it, so a resume matching any of them counts. */
const SURFACES_BY_CANONICAL = (() => {
	const map = new Map<string, Set<string>>();

	for (const [surface, canonical] of [...Object.entries(ALIASES), ...Object.entries(CHINESE_ALIASES)]) {
		const surfaces = map.get(canonical) ?? new Set<string>([canonical]);
		surfaces.add(surface);
		map.set(canonical, surfaces);
	}

	return map;
})();

/**
 * Terms whose surface form *is* the thing being searched for, and which must therefore never be
 * stemmed. "kubernetes" stems to "kubernet", which matches nothing a recruiter would ever type.
 */
export const SKILL_SURFACE_FORMS: ReadonlySet<string> = new Set([
	...Object.keys(ALIASES),
	...Object.keys(CHINESE_ALIASES),
	...SURFACES_BY_CANONICAL.keys(),
]);

export function canonicalize(term: string): string {
	return ALIASES[term] ?? CHINESE_ALIASES[term] ?? term;
}

/** Every spelling that should count as a match for `term`, including `term` itself. */
export function surfaceFormsOf(term: string): readonly string[] {
	const canonical = canonicalize(term);
	const surfaces = SURFACES_BY_CANONICAL.get(canonical);
	return surfaces ? [...surfaces] : [term];
}
