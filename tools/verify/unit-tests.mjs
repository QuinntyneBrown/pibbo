// Runs the unit tests of every frontend project that has any (*.spec.ts).
import { execSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const frontend = fileURLToPath(new URL("../../frontend/", import.meta.url));
const { projects } = JSON.parse(
  readFileSync(join(frontend, "angular.json"), "utf8"),
);

const hasSpecs = (dir) =>
  readdirSync(dir, { withFileTypes: true }).some((e) =>
    e.isDirectory() ? hasSpecs(join(dir, e.name)) : e.name.endsWith(".spec.ts"),
  );

for (const [name, project] of Object.entries(projects)) {
  if (!hasSpecs(join(frontend, project.root))) continue;
  console.log(`\n> unit tests: ${name}`);
  execSync(`npx ng test ${name} --watch=false`, {
    cwd: frontend,
    stdio: "inherit",
  });
}
