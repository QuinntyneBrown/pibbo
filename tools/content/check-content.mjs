// Checks the content before every build (ADR 0008, 0015, 0017, 0019, 0020, 0021, 0022, 0023, 0024, 0027): every word has a picture and a
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
  // A longer word (L2-017, ADR 0022) names its sounds in its syllables, one tile each.
  if (word.syllables) {
    const parts = word.syllables;
    if (parts.length < 2 || parts.length > 4)
      problems.push(
        `word "${name}": ${parts.length} syllables, not two to four`,
      );
    if (parts.map((p) => p.letters).join("") !== name)
      problems.push(`word "${name}": its syllables do not spell it`);
    for (const part of parts) {
      const label = `syllable "${part.letters}"`;
      fileExists(part.recording, `${label} recording`);
      if (!part.shown) problems.push(`${label}: no caption`);
      let letters = "";
      for (const sound of part.sounds ?? []) {
        const entry = content.sounds?.[sound];
        if (!entry)
          problems.push(`${label}: sound "${sound}" is not in the sounds`);
        else fileExists(entry.recording, `sound "${sound}" recording`);
        letters += entry?.letters ?? "";
      }
      if (letters !== part.letters)
        problems.push(`${label}: its sounds spell "${letters}"`);
    }
    continue;
  }
  if (!Array.isArray(word.sounds) || word.sounds.length === 0)
    problems.push(`word "${name}": no sounds`);
  // The mocks draw a word of up to four tiles in one row (L2-015, ADR 0020).
  else if (word.sounds.length > 4)
    problems.push(
      `word "${name}": ${word.sounds.length} sounds, more than four tiles`,
    );
  for (const sound of word.sounds ?? []) {
    const entry = content.sounds?.[sound];
    if (!entry)
      problems.push(`word "${name}": sound "${sound}" is not in the sounds`);
    else {
      fileExists(entry.recording, `sound "${sound}" recording`);
      // A letter group (L2-014, ADR 0019) is two or three letters with one recording of its own.
      const letters = entry.letters ?? "";
      if (letters.length < 1 || letters.length > 3)
        problems.push(
          `sound "${sound}": a tile holds one to three letters, not "${letters}"`,
        );
    }
  }
  const spelled = (word.sounds ?? [])
    .map((s) => content.sounds?.[s]?.letters ?? "")
    .join("");
  // A silent-e word (L2-016, ADR 0021): its sounds spell it but for its quiet e, and the word
  // without the e has its own picture, recording and recorded sounds.
  const without = word.withoutE;
  const quiet = without ? "e" : "";
  if (spelled + quiet !== name)
    problems.push(`word "${name}": its sounds spell "${spelled}${quiet}"`);
  if (without) {
    if (without.word + "e" !== name)
      problems.push(
        `word "${name}": without its e it is not "${without.word}"`,
      );
    fileExists(without.picture, `word "${without.word}" picture`);
    fileExists(without.recording, `word "${without.word}" recording`);
    if ((without.sounds ?? []).length !== (word.sounds ?? []).length)
      problems.push(`word "${name}": not as many sounds as "${without.word}"`);
    const spelledWithout = (without.sounds ?? [])
      .map((s) => content.sounds?.[s]?.letters ?? "")
      .join("");
    if (spelledWithout !== without.word)
      problems.push(
        `word "${without.word}": its sounds spell "${spelledWithout}"`,
      );
    for (const sound of without.sounds ?? []) {
      const entry = content.sounds?.[sound];
      if (!entry)
        problems.push(
          `word "${without.word}": sound "${sound}" is not in the sounds`,
        );
      else fileExists(entry.recording, `sound "${sound}" recording`);
    }
  }
}
// The syllable lines (L2-017, ADR 0022).
if (content.words?.some((w) => w.syllables)) {
  for (const side of ["before", "after"])
    fileExists(
      content.syllables?.ask?.[side]?.recording,
      `syllables ${side} recording`,
    );
  if (!content.syllables?.rule) problems.push("syllables: no rule");
}
// The silent-e lines (L2-016, ADR 0021).
if (content.words?.some((w) => w.withoutE))
  fileExists(
    content.silentE?.instruction?.recording,
    "silent e instruction recording",
  );
for (const [key, line] of Object.entries(content.instructions ?? {}))
  fileExists(line.recording, `instruction "${key}" recording`);
for (const key of ["praise", "hint", "model"])
  fileExists(content[key]?.recording, `${key} recording`);
// The first-two-sounds question (L2-015, ADR 0020): every line it says is recorded.
for (const key of ["instruction", "praise", "listen", "again"])
  fileExists(
    content.firstTwo?.[key]?.recording,
    `first two sounds ${key} recording`,
  );
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
// Words and pictures (ADR 0023): each theme names two to four of Sound it out's words, once each,
// and its instruction and praise are shown and recorded.
const wordPictures = content.wordPictures;
if (!wordPictures) problems.push("wordPictures: missing");
else {
  if (!(wordPictures.roundsPerPlay > 0))
    problems.push("wordPictures: no rounds per play");
  if (!Array.isArray(wordPictures.themes) || wordPictures.themes.length === 0)
    problems.push("wordPictures: no theme");
  for (const theme of wordPictures.themes ?? []) {
    const name = theme.name ?? "(a theme with no name)";
    const words = theme.words ?? [];
    if (words.length < 2 || words.length > 4)
      problems.push(`theme "${name}": ${words.length} words, not two to four`);
    if (new Set(words).size !== words.length)
      problems.push(`theme "${name}": a word is named twice`);
    for (const word of words)
      if (!(content.words ?? []).some((w) => w.word === word))
        problems.push(`theme "${name}": "${word}" is not one of the words`);
    for (const line of ["instruction", "praise"]) {
      if (
        typeof theme[line]?.text !== "string" ||
        theme[line].text.length === 0
      )
        problems.push(`theme "${name}" ${line}: no text`);
      fileExists(theme[line]?.recording, `theme "${name}" ${line} recording`);
    }
  }
}
// Spot the word (ADR 0024): every common word is recorded and is in the story, the number said
// in its praise is recorded, and every line is shown and recorded.
const spotPath = `${frontend}projects/domain/src/lib/sounds/common-words-content.json`;
const spot = JSON.parse(readFileSync(spotPath, "utf8"));
const plain = (shown) =>
  String(shown)
    .toLowerCase()
    .replace(/[.,!?;:]/g, "");
if (!(spot.roundsPerPlay > 0)) problems.push("spot: no rounds per play");
if (!Array.isArray(spot.story) || spot.story.length === 0)
  problems.push("spot: no story");
if (!Array.isArray(spot.words) || spot.words.length < 2)
  problems.push("spot: fewer than 2 common words");
for (const w of spot.words ?? []) {
  const name = w.word ?? "(a common word with no name)";
  fileExists(w.recording, `common word "${name}" recording`);
  const times = (spot.story ?? []).filter((s) => plain(s) === name).length;
  if (times === 0) problems.push(`common word "${name}" is not in the story`);
  else
    fileExists(
      `/recordings/numbers/${times}.wav`,
      `spot praise number ${times}`,
    );
}
for (const line of ["find", "inStory", "praise", "times"]) {
  if (typeof spot[line]?.text !== "string" || spot[line].text.length === 0)
    problems.push(`spot ${line}: no text`);
  fileExists(spot[line]?.recording, `spot ${line} recording`);
}
// Rhyme time (ADR 0025): its own data file. Every word has a picture and a recording, every
// line a recording, and each set has a rhyme, another word and a target ending in its ending.
const rhymes = JSON.parse(
  readFileSync(
    `${frontend}projects/domain/src/lib/sounds/rhymes-content.json`,
    "utf8",
  ),
);
for (const [name, word] of Object.entries(rhymes.words ?? {})) {
  fileExists(word.picture, `rhyme word "${name}" picture`);
  fileExists(word.recording, `rhyme word "${name}" recording`);
}
for (const line of [rhymes.ask?.before, rhymes.ask?.after, rhymes.listen])
  fileExists(line?.recording, "rhymes line recording");
if (!(rhymes.roundsPerPlay > 0)) problems.push("rhymes: no rounds per play");
if (!rhymes.sets?.length) problems.push("rhymes: no sets");
for (const set of rhymes.sets ?? []) {
  const label = `rhyme set "${set.target}"`;
  if (!set.rhymes?.length) problems.push(`${label}: no rhyme`);
  if (!set.others?.length) problems.push(`${label}: no other word`);
  for (const word of [set.target, ...(set.rhymes ?? []), ...(set.others ?? [])])
    if (!rhymes.words?.[word])
      problems.push(`${label}: "${word}" is not in the words`);
  for (const word of [set.target, ...(set.rhymes ?? [])])
    if (!word.endsWith(set.end))
      problems.push(`${label}: "${word}" does not end in "${set.end}"`);
  for (const line of ["hint", "allEnd"]) {
    if (!set[line]?.text) problems.push(`${label} ${line}: no text`);
    fileExists(set[line]?.recording, `${label} ${line} recording`);
  }
}
if ((content.words ?? []).length < 3)
  problems.push("fewer than 3 words: a round offers 3 pictures");

// What do I know? (ADR 0027): every line has text and a recording, every thing a picture and its
// question, and the rounds and numbers make sense. Its words are Sound it out's, checked above.
const checkPath = `${frontend}projects/domain/src/lib/lessons/check-content.json`;
const check = JSON.parse(readFileSync(checkPath, "utf8"));
const line = (l, what) => {
  if (typeof l?.text !== "string" || l.text.length === 0)
    problems.push(`${what}: no text`);
  fileExists(l?.recording, `${what} recording`);
};
if (!(check.minRounds >= 5 && check.maxRounds <= 8 && check.minRounds <= check.maxRounds))
  problems.push("check: rounds must be between 5 and 8 (L2-023)");
line(check.name, "check name");
line(check.praise, "check praise");
for (const kind of ["count", "word"]) {
  line(check[kind]?.hint, `check ${kind} hint`);
  line(check[kind]?.model, `check ${kind} model`);
}
line(check.word?.ask, "check word question");
for (const r of ["earned", "none"]) {
  line(check.results?.[r]?.title, `check results ${r} title`);
  line(check.results?.[r]?.next, `check results ${r} line`);
}
if (!Array.isArray(check.count?.things) || check.count.things.length === 0)
  problems.push("check: no things to count");
for (const t of check.count?.things ?? []) {
  fileExists(t.picture, `check thing "${t.name}" picture`);
  line(t.ask, `check thing "${t.name}" question`);
}
for (const n of check.count?.numbers ?? []) {
  if (!Number.isInteger(n) || n < 2 || n > 19)
    problems.push(`check number ${n}: a question offers n - 1, n and n + 1`);
  for (const k of [n - 1, n, n + 1])
    fileExists(`/recordings/numbers/${k}.wav`, `check number ${k}`);
}

if (problems.length) {
  console.error(
    `check-content: ${problems.length} problem(s)\n  ${problems.join("\n  ")}`,
  );
  process.exit(1);
}
console.log(
  `check-content: ${content.words.length} words, all pictures and recordings present.`,
);
