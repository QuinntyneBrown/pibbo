// Checks the Sound Out content before every build (ADR 0008, 0015, 0017): every word has a picture and a
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
      problems.push(
        `letter sounds pair "${name}": sound "${pair.sound}" is not in the sounds`,
      );
    else fileExists(entry.recording, `sound "${pair.sound}" recording`);
    if (seen.has(pair.sound))
      problems.push(`letter sounds: sound "${pair.sound}" is paired twice`);
    seen.add(pair.sound);
    fileExists(pair.picture, `letter sounds pair "${name}" picture`);
  }
  fileExists(
    letterSounds.instruction?.recording,
    "letter sounds instruction recording",
  );
  fileExists(letterSounds.praise?.recording, "letter sounds praise recording");
}
// Big and small letters (ADR 0017): each pair names a big letter and a recorded small letter.
const letterForms = content.letterForms;
if (!letterForms) problems.push("letterForms: missing");
else {
  if (!Array.isArray(letterForms.pairs) || letterForms.pairs.length < 2)
    problems.push("letterForms: fewer than 2 pairs");
  const seen = new Set();
  for (const pair of letterForms.pairs ?? []) {
    const name = pair.big ?? "(a pair with no big letter)";
    if (typeof pair.big !== "string" || pair.big.length === 0)
      problems.push(`letter forms pair "${name}": no big letter`);
    const entry = content.sounds?.[pair.sound];
    if (!entry)
      problems.push(
        `letter forms pair "${name}": sound "${pair.sound}" is not in the sounds`,
      );
    else fileExists(entry.recording, `sound "${pair.sound}" recording`);
    if (seen.has(pair.sound))
      problems.push(`letter forms: sound "${pair.sound}" is paired twice`);
    seen.add(pair.sound);
  }
  fileExists(
    letterForms.instruction?.recording,
    "letter forms instruction recording",
  );
  fileExists(letterForms.praise?.recording, "letter forms praise recording");
}
// Spell by sound (ADR 0018): Sound it out's words, and its own lines, each shown and recorded.
const spell = content.spell;
if (!spell) problems.push("spell: missing");
else {
  if (!(spell.roundsPerPlay > 0)) problems.push("spell: no rounds per play");
  for (const line of ["listen", "pick", "full", "hint", "praise"]) {
    if (typeof spell[line]?.text !== "string" || spell[line].text.length === 0)
      problems.push(`spell ${line}: no text`);
    fileExists(spell[line]?.recording, `spell ${line} recording`);
  }
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
