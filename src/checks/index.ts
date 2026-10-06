import type { Check } from "../core/types.js";
import { fileSize } from "./file-size.js";
import { secrets } from "./secrets.js";

// Add a check: create src/checks/<id>.ts exporting a Check, register it here.
export const allChecks: Check[] = [secrets, fileSize];
