import type {
  Activity,
  ActivityCatalogue,
  CheckChoice,
  CheckKind,
  CheckShown,
  GroupId,
  Instruction,
  RandomSource,
} from '@pibbo/api';
import { numberRecording } from '../counting/count-the-toys-content';
import { answerOutcome, type AnswerOutcome } from '../rounds/answer-outcome';
import type { PracticeHistory } from '../storage/stored-values';
import type { CheckContent } from './check-content';
import type { Lesson } from './lessons-content';

/**
 * Where a check round is: the child chooses and checks (`choosing`, also after a hint), until
 * the answer is right or, after the third wrong answer, modelled (L2-026).
 */
export type CheckPhase = 'choosing' | 'right' | 'modelled';

/** One check question about one skill (an activity). Immutable: every rule returns a new value. */
export interface CheckRound {
  readonly skill: string;
  readonly group: GroupId;
  readonly kind: CheckKind;
  readonly ask: Instruction;
  readonly shown: CheckShown;
  readonly choices: readonly CheckChoice[];
  /** The index of the right choice. */
  readonly answer: number;
  /** The hint, shown, then spoken: the hint line, then the sounds or the numbers. */
  readonly hint: { readonly text: string; readonly recordings: readonly string[] };
  /** The modelled answer, shown, then spoken: "This is" ship, "There are" 6. */
  readonly model: { readonly text: string; readonly recordings: readonly string[] };
  readonly chosen: number | null;
  readonly wrong: number;
  readonly phase: CheckPhase;
}

/** A whole check game: its rounds, the one shown, and the skills earned so far. */
export interface CheckGame {
  readonly rounds: readonly CheckRound[];
  readonly at: number;
  readonly earned: readonly string[];
}

function pick(random: RandomSource, below: number): number {
  return Math.min(below - 1, Math.floor(random.next() * below));
}

function shuffle<T>(random: RandomSource, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = pick(random, i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** The first lesson's activities that exist, in order; an unknown one is skipped (L2-022 #4). */
export function firstLessonSkills(
  lessons: readonly Lesson[],
  catalogue: ActivityCatalogue,
): string[] {
  const known = new Set(catalogue.activities.map((a) => a.id));
  return (lessons[0]?.activities ?? []).filter((id) => known.has(id));
}

/**
 * The skills the game asks about, one a round (L2-023): what the child has practised that is
 * still in the catalogue, or with no history the first lesson's activities (#4), or failing
 * both the whole catalogue. As many rounds as skills, at least `minRounds` and at most
 * `maxRounds`; the skills are shuffled and taken in turn, so two skills alternate.
 */
export function checkSkills(
  history: PracticeHistory | null,
  catalogue: ActivityCatalogue,
  lessons: readonly Lesson[],
  random: RandomSource,
  content: Pick<CheckContent, 'minRounds' | 'maxRounds'>,
): string[] {
  const known = new Set(catalogue.activities.map((a) => a.id));
  let skills = (history?.practised ?? []).filter((id) => known.has(id));
  if (skills.length === 0) skills = firstLessonSkills(lessons, catalogue);
  if (skills.length === 0) skills = catalogue.activities.map((a) => a.id);
  if (skills.length === 0) return [];
  const order = shuffle(random, skills).slice(0, content.maxRounds);
  const rounds = Math.max(content.minRounds, order.length);
  return Array.from({ length: rounds }, (_, i) => order[i % order.length]!);
}

function countRound(
  activity: Activity,
  content: CheckContent,
  random: RandomSource,
): Omit<CheckRound, 'chosen' | 'wrong' | 'phase'> {
  const thing = content.count.things[pick(random, content.count.things.length)]!;
  const n = content.count.numbers[pick(random, content.count.numbers.length)]!;
  const numbers = shuffle(random, [n - 1, n, n + 1]);
  return {
    skill: activity.id,
    group: activity.group,
    kind: 'count',
    ask: thing.ask,
    shown: {
      picture: thing.picture,
      count: n,
      label: `${n} ${n === 1 ? thing.name : thing.plural}`,
    },
    choices: numbers.map((k) => ({ text: String(k), recording: numberRecording(k) })),
    answer: numbers.indexOf(n),
    hint: {
      text: content.count.hint.text,
      recordings: [
        content.count.hint.recording,
        ...Array.from({ length: n }, (_, i) => numberRecording(i + 1)),
      ],
    },
    model: {
      text: `${content.count.model.text} ${n} ${thing.plural}.`,
      recordings: [content.count.model.recording, numberRecording(n)],
    },
  };
}

function wordRound(
  activity: Activity,
  content: CheckContent,
  random: RandomSource,
): Omit<CheckRound, 'chosen' | 'wrong' | 'phase'> {
  const words = shuffle(random, content.word.words).slice(0, 3);
  const word = words[0]!;
  const choices = shuffle(random, words);
  return {
    skill: activity.id,
    group: activity.group,
    kind: 'word',
    ask: content.word.ask,
    shown: { picture: word.picture, count: 1, label: word.word },
    choices: choices.map((w) => ({ text: w.word, recording: w.recording })),
    answer: choices.indexOf(word),
    hint: {
      text: content.word.hint.text,
      recordings: [content.word.hint.recording, ...word.sounds.map((s) => s.recording)],
    },
    model: {
      text: `${content.word.model.text} “${word.word}”.`,
      recordings: [content.word.model.recording, word.recording],
    },
  };
}

/** One round about `activity`: a counting activity asks how many, a reading one which word. */
export function startCheckRound(
  activity: Activity,
  content: CheckContent,
  random: RandomSource,
): CheckRound {
  const round =
    activity.group === 'count'
      ? countRound(activity, content, random)
      : wordRound(activity, content, random);
  return { ...round, chosen: null, wrong: 0, phase: 'choosing' };
}

/** A new game: a round for each skill, in order; skills not in the catalogue are left out. */
export function startCheck(
  skills: readonly string[],
  catalogue: ActivityCatalogue,
  content: CheckContent,
  random: RandomSource,
): CheckGame {
  const rounds = skills.flatMap((id) => {
    const activity = catalogue.activities.find((a) => a.id === id);
    return activity ? [startCheckRound(activity, content, random)] : [];
  });
  return { rounds, at: 0, earned: [] };
}

/** The round shown. */
export function currentCheckRound(game: CheckGame): CheckRound | null {
  return game.rounds[game.at] ?? null;
}

/** What a touch on a choice did: the round after it, and the recording to play, if any. */
export interface CheckTouch {
  readonly round: CheckRound;
  readonly spoken: string | null;
}

/**
 * The child touches a choice: it is chosen and spoken; any other is no longer chosen. Only
 * while choosing; touching the chosen choice again changes nothing (one touch, one answer).
 */
export function chooseCheckOption(round: CheckRound, index: number): CheckTouch {
  const choice = round.choices[index];
  if (round.phase !== 'choosing' || !choice || round.chosen === index) {
    return { round, spoken: null };
  }
  return { round: { ...round, chosen: index }, spoken: choice.recording };
}

/** What Check did, or null when there was nothing to check. */
export interface CheckJudged {
  readonly round: CheckRound;
  readonly outcome: AnswerOutcome | null;
}

/**
 * Check the chosen answer (L2-023 #2, L2-026): right ends the round; a wrong one gives a hint
 * and keeps the choice, nothing taken away; the third wrong one is modelled.
 */
export function checkCheckAnswer(round: CheckRound): CheckJudged {
  if (round.phase !== 'choosing' || round.chosen === null) return { round, outcome: null };
  const outcome = answerOutcome(round.wrong, round.chosen === round.answer);
  if (outcome === 'right') return { round: { ...round, phase: 'right' }, outcome };
  const wrong = round.wrong + 1;
  if (outcome === 'model') {
    return { round: { ...round, wrong, phase: 'modelled', chosen: null }, outcome };
  }
  return { round: { ...round, wrong }, outcome };
}

/** Puts the round shown back into the game, after a touch or a check. */
export function withCheckRound(game: CheckGame, round: CheckRound): CheckGame {
  return { ...game, rounds: game.rounds.map((r, i) => (i === game.at ? round : r)) };
}

/**
 * On to the next round, once this one is done. A skill is earned when one of its rounds was
 * answered right before it was modelled (L2-023 #1); misses are not counted anywhere.
 */
export function nextCheckRound(game: CheckGame): CheckGame {
  const round = currentCheckRound(game);
  if (!round || (round.phase !== 'right' && round.phase !== 'modelled')) return game;
  const earned =
    round.phase === 'right' && !game.earned.includes(round.skill)
      ? [...game.earned, round.skill]
      : game.earned;
  return { ...game, at: game.at + 1, earned };
}

/** Whether every round has been played. */
export function checkFinished(game: CheckGame): boolean {
  return game.at >= game.rounds.length;
}

/** The earned skills as activities, in the catalogue's order. */
export function earnedSkills(earned: readonly string[], catalogue: ActivityCatalogue): Activity[] {
  return catalogue.activities.filter((a) => earned.includes(a.id));
}

/** Every picture and recording a round can show or play, to fetch before it is shown. */
export function checkAssets(round: CheckRound): string[] {
  return [
    ...new Set([
      round.shown.picture,
      round.ask.recording,
      ...round.choices.map((c) => c.recording),
      ...round.hint.recordings,
      ...round.model.recordings,
    ]),
  ];
}
