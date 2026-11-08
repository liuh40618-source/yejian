import { fileURLToPath } from "node:url";
// @boundaries-ignore root shared Vitest config
import { createVitestProjectConfig } from "../../vitest.shared.mts";

export default createVitestProjectConfig({
	name: "@reactive-resume/api",
	dirname: fileURLToPath(new URL(".", import.meta.url)),
	// The import/export suites render real PDFs and need the same disk-backed font reader as
	// packages/pdf; otherwise a gstatic reset becomes a flaky "Fonts could not be loaded" failure.
	fontCache: true,
});
