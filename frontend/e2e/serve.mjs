// A static host for the production build, for the e2e specs. It serves
// dist/pibbo/browser with an index.html fallback and sends the response headers that
// a deployed static host must send (docs/deploy.md).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../dist/pibbo/browser', import.meta.url)));
const port = Number(process.argv[2] ?? 4300);

// The single source of the headers: deploy/security-headers.json (see docs/deploy.md).
const securityHeaders = JSON.parse(
  await readFile(
    fileURLToPath(new URL('../deploy/security-headers.json', import.meta.url)),
    'utf8',
  ),
);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
};

async function resolveFile(urlPath) {
  const candidate = normalize(join(root, decodeURIComponent(urlPath)));
  if (candidate.startsWith(root)) {
    try {
      if ((await stat(candidate)).isFile()) return candidate;
    } catch {
      /* fall through */
    }
  }
  // A path with an extension that does not exist is a missing file, not a route.
  return extname(urlPath) ? null : join(root, 'index.html');
}

createServer(async (req, res) => {
  const urlPath = new URL(req.url ?? '/', 'http://localhost').pathname;
  const file = await resolveFile(urlPath);
  if (!file) {
    res.writeHead(404, securityHeaders).end();
    return;
  }
  res.writeHead(200, {
    ...securityHeaders,
    'Content-Type': types[extname(file)] ?? 'application/octet-stream',
  });
  res.end(await readFile(file));
}).listen(port, () => console.log(`Serving ${root} on http://localhost:${port}`));
