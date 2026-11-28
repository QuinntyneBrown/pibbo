// Writes staticwebapp.config.json into the production build, so Azure Static Web Apps does what
// docs/deploy.md asks of the host (ADR 0033): every response carries the headers in
// frontend/deploy/security-headers.json, a path without a file extension answers with index.html,
// a missing file is a 404, and sw.js is sent with Cache-Control: no-cache. Azure serves HTTPS only
// and redirects HTTP itself.
// Run after `npm run build`, from anywhere: node tools/deploy/static-web-app-config.mjs
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const frontend = fileURLToPath(new URL("../../frontend/", import.meta.url));
const browser = join(frontend, "dist/pibbo/browser");
if (!existsSync(join(browser, "index.html"))) {
  console.error(`No build in ${browser}: run npm run build in frontend/ first.`);
  process.exit(1);
}

// The single source of the headers (ADR 0003).
const globalHeaders = JSON.parse(
  readFileSync(join(frontend, "deploy/security-headers.json"), "utf8"),
);

// Every extension the build ships, plus the common ones a stray request asks for, is kept out of
// the index.html fallback: such a path that names no file is a 404, not the app.
const extensions = new Set([
  "css", "html", "ico", "jpg", "js", "json", "map", "mp3", "ogg", "png", "svg", "ttf", "txt",
  "wav", "webp", "woff", "woff2", "xml",
]);
const collect = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) collect(join(dir, entry.name));
    else if (extname(entry.name)) extensions.add(extname(entry.name).slice(1).toLowerCase());
  }
};
collect(browser);

const config = {
  // The service worker is never cached long, so a new version is found on the next visit
  // (ADR 0032, docs/deploy.md).
  routes: [{ route: "/sw.js", headers: { "Cache-Control": "no-cache" } }],
  navigationFallback: {
    rewrite: "/index.html",
    exclude: [`/*.{${[...extensions].sort().join(",")}}`],
  },
  globalHeaders,
};

writeFileSync(join(browser, "staticwebapp.config.json"), `${JSON.stringify(config, null, 2)}\n`);
console.log(`Wrote ${join(browser, "staticwebapp.config.json")}`);
