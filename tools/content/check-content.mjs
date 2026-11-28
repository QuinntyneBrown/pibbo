// Checks the Sound Out content before every build (ADR 0008, 0015): every word has a picture and a
// recording, every sound it uses has a recording, and every file named exists in public/.
// Run from anywhere: node tools/content/check-content.mjs
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const frontend = fileURLToPath(new URL("../../frontend/", import.meta.url));
const contentPath = `${frontend}projects/domain/src/lib/sounds/sound-out-content.json`;
const publicDir = `${frontend}projects/pibbo/public`;

const content = JSON.parse(readFileSync(contentPath, "utf8"));
const problems = [];
const fileExists = (path, what) => {
  if (typeof path !== "string" || !path.startsWith("/"))
    problems.push(`${what}: no path`);
  else if (!existsSync(publicDir + path))
    problems.push(`${what}: ${path} is missing`);
};

for (const word of content.words ?? []) {
  const name = word.word ?? "(a word with no name)";
  fileExists(word.picture, `word "${name}" picture`);
  fileExists(word.recording, `word "${name}" recording`);
  if (!Array.isArray(word.sounds) || word.sounds.length === 0)
    problems.push(`word "${name}": no sounds`);
  for (const sound of word.sounds ?? []) {
    const entry = content.sounds?.[sound];
    if (!entry)
      problems.push(`word "${name}": sound "${sound}" is not in the sounds`);
    else fileExists(entry.recording, `sound "${sound}" recording`);
  }
  const spelled = (word.sounds ?? [])
    .map((s) => content.sounds?.[s]?.letters ?? "")
    .join("");
  if (spelled !== name)
    problems.push(`word "${name}": its sounds spell "${spelled}"`);
}
for (const [key, line] of Object.entries(content.instructions ?? {}))
  fileExists(line.recording, `instruction "${key}" recording`);
for (const key of ["praise", "hint", "model"])
  fileExists(content[key]?.recording, `${key} recording`);
// Letter sounds (ADR 0015): each pair names a recorded sound and a picture.
const letterSounds = content.letterSounds;
if (!letterSounds) problems.push("letterSounds: missing");
else {
  if (!Array.isArray(letterSounds.pairs) || letterSounds.pairs.length < 2)
    problems.push("letterSounds: fewer than 2 pairs");
  const seen = new Set();
  for (const pair of letterSounds.pairs ?? []) {
    const name = pair.asIn ?? "(a pair with no word)";
    const entry = content.sounds?.[pair.sound];
    if (!entry)
      problems.push(`letter sounds pair "${name}": sound "${pair.sound}" is not in the sounds`);
    else fileExists(entry.recording, `sound "${pair.sound}" recording`);
    if (seen.has(pair.sound))
      problems.push(`letter sounds: sound "${pair.sound}" is paired twice`);
    seen.add(pair.sound);
    fileExists(pair.picture, `letter sounds pair "${name}" picture`);
  }
  fileExists(letterSounds.instruction?.recording, "letter sounds instruction recording");
  fileExists(letterSounds.praise?.recording, "letter sounds praise recording");
}
if ((content.words ?? []).length < 3)
  problems.push("fewer than 3 words: a round offers 3 pictures");

if (problems.length) {
  console.error(
    `check-content: ${problems.length} problem(s)\n  ${problems.join("\n  ")}`,
  );
  process.exit(1);
}
console.log(
  `check-content: ${content.words.length} words, all pictures and recordings present.`,
);
