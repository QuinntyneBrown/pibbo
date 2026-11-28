// Checks the Sound Out content before every build (ADR 0008, 0015, 0017, 0019, 0020, 0021, 0022, 0023, 0024, 0025, 0026): every word has a picture and a
// Checks the Sound Out content before every build (ADR 0008, 0015, 0017, 0019, 0020, 0021, 0022, 0023, 0024, 0026): every word has a picture and a
// Checks the Sound Out content before every build (ADR 0008, 0015, 0017, 0019, 0020, 0021, 0022, 0023, 0024, 0027): every word has a picture and a
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
// Build a sentence (ADR 0031): its own data file. Every word and line has a recording; each
// sentence has a picture and its text, a recording of the whole sentence, 3 to 5 distinct
// tiles that start with a capital and end with a full stop, and an extra word not among them.
const sentences = JSON.parse(
  readFileSync(
    `${frontend}projects/domain/src/lib/sounds/sentences-content.json`,
    "utf8",
  ),
);
const sentenceKey = (text) => text.toLowerCase().replace(/[.!?]$/, "");
for (const [name, recording] of Object.entries(sentences.words ?? {}))
  fileExists(recording, `sentence word "${name}" recording`);
for (const line of ["ask", "praise", "hint", "listen"]) {
  if (!sentences[line]?.text) problems.push(`sentences ${line}: no text`);
  fileExists(sentences[line]?.recording, `sentences ${line} recording`);
}
if (!(sentences.roundsPerPlay > 0))
  problems.push("sentences: no rounds per play");
if (!sentences.sentences?.length) problems.push("sentences: no sentences");
for (const s of sentences.sentences ?? []) {
  const words = s.words ?? [];
  const label = `sentence "${words.join(" ")}"`;
  if (words.length < 3 || words.length > 5)
    problems.push(`${label}: ${words.length} words, not 3 to 5`);
  if (!/^[A-Z]/.test(words[0] ?? ""))
    problems.push(`${label}: no capital letter`);
  if (!/\.$/.test(words.at(-1) ?? "")) problems.push(`${label}: no full stop`);
  const tiles = [...words, s.extra];
  if (new Set(tiles).size !== tiles.length)
    problems.push(`${label}: tiles not distinct`);
  if (!s.extra || words.map(sentenceKey).includes(sentenceKey(s.extra)))
    problems.push(`${label}: no extra word that does not belong`);
  for (const tile of tiles)
    if (!sentences.words?.[sentenceKey(tile ?? "")])
      problems.push(`${label}: "${tile}" is not in the words`);
  if (!s.alt) problems.push(`${label}: no text alternative`);
  fileExists(s.picture, `${label} picture`);
  fileExists(s.recording, `${label} recording`);
}
if ((content.words ?? []).length < 3)
  problems.push("fewer than 3 words: a round offers 3 pictures");

// Guided lessons (L2-022, ADR 0026): 3 to 6 activities each, every line recorded. An activity
// a lesson names that does not exist yet is allowed: the lesson leaves it off its path.
const lessonPath = `${frontend}projects/domain/src/lib/lessons/lesson-content.json`;
const lessonContent = JSON.parse(readFileSync(lessonPath, "utf8"));
for (const lesson of lessonContent.lessons ?? []) {
  const n = lesson.activities?.length ?? 0;
  if (n < 3 || n > 6)
    problems.push(`lesson "${lesson.id}": ${n} activities, not 3 to 6`);
  if (!lesson.title) problems.push(`lesson "${lesson.id}": no title`);
  fileExists(lesson.recording, `lesson "${lesson.id}" recording`);
}
for (const line of ["upNext", "done", "picture"]) {
  if (!lessonContent.lines?.[line]?.text)
    problems.push(`lesson ${line}: no text`);
  fileExists(
    lessonContent.lines?.[line]?.recording,
    `lesson ${line} recording`,
  );
}
// The check game (ADR 0026): 5 to 8 questions, a first lesson of 3 to 6 activities, and every
// The check game (ADR 0027): 5 to 8 questions, a first lesson of 3 to 6 activities, and every
// line shown and recorded.
const checkPath = `${frontend}projects/domain/src/lib/rounds/check-game-content.json`;
const check = JSON.parse(readFileSync(checkPath, "utf8"));
if (!(check.rounds?.fewest === 5 && check.rounds?.most === 8))
  problems.push("check game: not 5 to 8 rounds");
if (!(check.firstLesson?.length >= 3 && check.firstLesson.length <= 6))
  problems.push("check game: the first lesson is not 3 to 6 activities");
const checkLines = (node, name) => {
  if (node === null || typeof node !== "object" || Array.isArray(node)) return;
  if (!("recording" in node)) {
    for (const [key, child] of Object.entries(node))
      checkLines(child, `${name} ${key}`);
    return;
  }
  if (typeof node.text !== "string" || node.text.length === 0)
    problems.push(`${name}: no text`);
  fileExists(node.recording, `${name} recording`);
};
checkLines(check, "check game");

if (problems.length) {
  console.error(
    `check-content: ${problems.length} problem(s)\n  ${problems.join("\n  ")}`,
  );
  process.exit(1);
}
console.log(
  `check-content: ${content.words.length} words, all pictures and recordings present.`,
);
