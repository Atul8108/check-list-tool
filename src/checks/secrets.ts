import type { Check, Finding } from "../core/types.js";

const PATTERNS: [name: string, re: RegExp][] = [
  ["Stripe secret key", /sk_(?:live|test)_[0-9a-zA-Z]{16,}/],
  ["AWS access key", /AKIA[0-9A-Z]{16}/],
  ["Private key block", /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/],
  ["Hardcoded secret", /(?:jwt[_-]?secret|api[_-]?key|secret)\s*[:=]\s*["'][^"']{8,}["']/i],
  ["Secret in NEXT_PUBLIC_/VITE_ var", /(?:NEXT_PUBLIC|VITE|REACT_APP)_\w*(?:SECRET|PRIVATE|SERVICE_ROLE)\w*/],
];

// Template env files hold placeholders, not real secrets.
const TEMPLATE_ENV = /\.env\.(?:example|sample|template|dist)$/;

export const secrets: Check = {
  id: "secrets",
  title: "Hardcoded secrets",
  async run(project) {
    const findings: Finding[] = [];
    for (const file of project.files) {
      if (TEMPLATE_ENV.test(file)) continue;
      const lines = (await project.read(file)).split("\n");
      lines.forEach((text, i) => {
        for (const [name, re] of PATTERNS)
          if (re.test(text))
            findings.push({ checkId: "secrets", severity: "fail", message: name, file, line: i + 1 });
      });
    }
    return findings;
  },
};
