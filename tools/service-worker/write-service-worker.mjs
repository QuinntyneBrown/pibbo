// Writes dist/pibbo/browser/sw.js after `ng build` (ADR 0032): the template with the build's
// version, its shell (index.html and what it loads, the fonts the styles name, Home's code) and the list
// of every file Pibbo serves. Run by `npm run build`.
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(
  new URL("../../frontend/dist/pibbo/browser/", import.meta.url),
);
const template = fileURLToPath(new URL("./sw-template.js", import.meta.url));
/** Every file Pibbo serves, with room for the code of each activity, and no more. */
const MAX_ENTRIES = 400;

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else out.push(path);
  }
  return out;
}

const toUrl = (path) => "/" + relative(root, path).split(sep).join("/");
const files = (await walk(root))
  .map(toUrl)
  .filter((url) => url !== "/sw.js" && !url.endsWith(".txt"))
  .sort();
if (files.length > MAX_ENTRIES) {
  throw new Error(
    `Pibbo serves ${files.length} files; raise MAX_ENTRIES with a reason.`,
  );
}

const index = await readFile(join(root, "index.html"), "utf8");
const loaded = [...index.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map((m) => "/" + m[1].replace(/^\//, ""))
  .filter((url) => files.includes(url));
const fonts = [];
for (const css of loaded.filter((url) => url.endsWith(".css"))) {
  const text = await readFile(join(root, css), "utf8");
  for (const m of text.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    const url = new URL(m[1], `http://pibbo${css}`).pathname;
    if (files.includes(url)) fonts.push(url);
  }
}
// Home's code and what it imports: Home is the first screen, so it is needed now, and on a
// first visit it loads before the worker answers the page.
const main = loaded.find((url) => /^\/main-[^/]+\.js$/.test(url));
const homeChunk = (await readFile(join(root, main), "utf8")).match(
  /path:[`'"][`'"],pathMatch:[`'"]full[`'"],loadComponent:\(\)=>import\([`'"]\.\/([^`'"]+)[`'"]\)/,
)?.[1];
if (!homeChunk)
  throw new Error("sw.js: Home's route was not found in the main script.");
const home = [];
const visit = async (url) => {
  if (home.includes(url) || url === main) return;
  home.push(url);
  const text = await readFile(join(root, url), "utf8");
  for (const m of text.matchAll(
    /(?:from|import)\s*["'`]\.\/([^"'`]+\.js)["'`]/g,
  )) {
    await visit("/" + m[1]);
  }
};
await visit("/" + homeChunk);
const shell = [...new Set(["/index.html", ...loaded, ...fonts, ...home])];

const hash = createHash("sha256");
for (const url of files)
  hash.update(url).update(await readFile(join(root, url)));
const version = hash.digest("hex").slice(0, 16);

const head = [
  `const VERSION = ${JSON.stringify(version)};`,
  `const SHELL = ${JSON.stringify(shell)};`,
  `const FILES = ${JSON.stringify(files)};`,
  `const MAX_ENTRIES = ${MAX_ENTRIES};`,
  "",
].join("\n");
await writeFile(join(root, "sw.js"), head + (await readFile(template, "utf8")));
console.log(
  `sw.js: version ${version}, ${shell.length} shell files, ${files.length} in all.`,
);
