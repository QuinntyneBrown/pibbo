// Runs every CI check and the unit tests locally. Run it from the repository root
// before pushing: node tools/verify/verify.mjs
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const frontend = fileURLToPath(new URL("../../frontend/", import.meta.url));

const steps = [
  ["format", "npm run format:check"],
  ["lint", "npm run lint"],
  ["build", "npm run build"],
  ["unit tests", "npm test"],
  ["behaviour e2e", "npx playwright test"],
];

const started = Date.now();
for (const [name, command] of steps) {
  console.log(`\n=== ${name}: ${command}`);
  try {
    execSync(command, {
      cwd: frontend,
      stdio: "inherit",
      env: { ...process.env, CI: process.env.CI ?? "" },
    });
  } catch {
    console.error(`\nverify: ${name} failed.`);
    process.exit(1);
  }
}
console.log(
  `\nverify: all checks passed in ${Math.round((Date.now() - started) / 1000)} s.`,
);
