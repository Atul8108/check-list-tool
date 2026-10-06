import type { Check } from "../core/types.js";
import { authRoutes } from "./auth-routes.js";
import { cors } from "./cors.js";
import { fileSize } from "./file-size.js";
import { helmet } from "./helmet.js";
import { jwtSecret } from "./jwt-secret.js";
import { mongooseOwnership } from "./mongoose-ownership.js";
import { nosqlInjection } from "./nosql-injection.js";
import { rateLimit } from "./rate-limit.js";
import { secrets } from "./secrets.js";
import { webhookSignature } from "./webhook-signature.js";

// Add a check: create src/checks/<id>.ts exporting a Check, register it here.
export const allChecks: Check[] = [
  secrets, rateLimit, authRoutes, webhookSignature, fileSize,
  helmet, cors, jwtSecret, mongooseOwnership, nosqlInjection,
];
