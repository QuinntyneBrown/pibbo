#!/usr/bin/env node
// Save the screenshots of a video: run <folder>/shots.ts in Chromium against the running app.
//
//   node tools/video-record/record.mjs docs/videos/NN-journey-name [--no-build]
//
// Not a test and not a sweep (docs/videos/README.md): it compares nothing. It builds the app (skip
// with --no-build), then serves the production build on :4310 with frontend/e2e/serve.mjs. shots.ts
// imports the shared fixture of frontend/e2e/fixtures/test.ts, as every spec does, with real audio
// playback. Nothing is stubbed: every file the app asks for comes from that server.
import { execSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const folder = path.resolve(process.argv[2] ?? '');
if (!process.argv[2] || !fs.existsSync(path.join(folder, 'shots.ts'))) {
  console.error('usage: node tools/video-record/record.mjs <video folder with a shots.ts> [--no-build]');
  process.exit(2);
}
const frontend = path.join(root, 'frontend');
const modules = path.join(frontend, 'node_modules');
const env = { ...process.env, PB_VIDEO_DIR: folder, NODE_PATH: modules };
if (!process.argv.includes('--no-build')) execSync('npm run build', { cwd: frontend, stdio: 'inherit' });

const shots = path.join(folder, 'shots');
fs.rmSync(shots, { recursive: true, force: true });
const run = spawnSync(
  process.execPath,
  [
    path.join(modules, '@playwright', 'test', 'cli.js'),
    'test',
    '-c',
    path.join(root, 'tools', 'video-record', 'playwright.config.ts'),
    '--trace',
    'off',
  ],
  { cwd: frontend, env, stdio: 'inherit' },
);
if (run.status === 0) {
  const saved = fs.existsSync(shots) ? fs.readdirSync(shots).filter((f) => f.endsWith('.png')) : [];
  console.log(`${saved.length} PNG in ${shots}`);
}
process.exit(run.status ?? 1);
