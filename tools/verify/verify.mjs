// Runs every CI check and the unit tests locally, for the frontend and the backend, and every
// backend acceptance test (CI runs only the critical ones). Run it from the repository root
// before pushing: node tools/verify/verify.mjs
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const frontend = fileURLToPath(new URL("../../frontend/", import.meta.url));
const backend = fileURLToPath(new URL("../../backend/", import.meta.url));

const steps = [
  ["format", "npm run format:check", frontend],
  ["lint", "npm run lint", frontend],
  ["build", "npm run build", frontend],
  ["unit tests", "npm test", frontend],
  ["behaviour e2e", "npx playwright test", frontend],
  ["backend format", "dotnet format --verify-no-changes", backend],
  ["backend build", "dotnet build", backend],
  ["backend audit", "bash tools/audit-packages.sh", backend],
  ["backend acceptance tests", "dotnet test --no-build", backend],
];

const started = Date.now();
for (const [name, command, cwd] of steps) {
  console.log(`\n=== ${name}: ${command}`);
  try {
    execSync(command, {
      cwd,
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
