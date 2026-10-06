import type { Check, Finding } from "../core/types.js";

const PROVIDER = /stripe|razorpay/i;
const VERIFIED = /constructEvent|validateWebhookSignature|verifyWebhookSignature|stripe-signature|x-razorpay-signature/i;
const EMPTY_CATCH = /catch\s*(?:\([^)]*\))?\s*\{\s*\}/;

// ponytail: signature + empty-catch only; idempotency and subscription-state handling not checked.
export const webhookSignature: Check = {
  id: "webhook-signature",
  title: "Payment webhook signature",
  async run(project) {
    const findings: Finding[] = [];
    for (const file of project.files) {
      if (!/\.[cm]?[jt]s$/.test(file)) continue;
      const src = await project.read(file);
      if (!PROVIDER.test(src) || !/webhook/i.test(src)) continue;
      if (!VERIFIED.test(src))
        findings.push({ checkId: "webhook-signature", severity: "fail", message: "Payment webhook handler never verifies the provider signature; anyone can fake a paid event", file });
      if (EMPTY_CATCH.test(src))
        findings.push({ checkId: "webhook-signature", severity: "review", message: "Empty catch in payment code swallows failures silently", file });
    }
    return findings;
  },
};
