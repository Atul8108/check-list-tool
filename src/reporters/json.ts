import type { Reporter } from "../core/types.js";

export const jsonReporter: Reporter = (findings) => JSON.stringify(findings, null, 2);
