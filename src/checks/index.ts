import type { Check } from "../core/types.js";
import { authRoutes } from "./auth-routes.js";
import { fileSize } from "./file-size.js";
import { rateLimit } from "./rate-limit.js";
import { secrets } from "./secrets.js";
import { webhookSignature } from "./webhook-signature.js";

// Add a check: create src/checks/<id>.ts exporting a Check, register it here.
export const allChecks: Check[] = [secrets, rateLimit, authRoutes, webhookSignature, fileSize];
