// Journey 3 · Count a set. Eight scenes on the 93 BPM grid of Beautiful Boom Bap (a bar is 2.58 s).
// The app pictures are Count the toys opened from Home, from shots.ts: three toys counted at four
// widths, "How many?", a wrong answer and the right one. The "Pibbo plays" cards list the recordings
// the app fetched at each step (shots/heard.js). Every position is a pure function of the scene's
// time (docs/videos/README.md).
const { esc } = Film;
const { at, part, onBeat, onPhone, onBrowser, closeup, pop, fact, heard, terminal, opening, closing, wipeInto, push, zoomOut, zoomIn, bug } = Film.kit;
const { ease, prog } = Film;

const KICKER = 'Journey 3 · Count a set';
const title = (S, kicker, words, accent, x, y, w, size = 'headline--md') => `
  <div style="${at(x, y, w)}">
    <p class="kicker" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
    <h1 class="headline ${size}" style="margin-top:20px">${S.words(S.beat(2), words, { accent })}</h1>
  </div>`;
const prompt = (command) => [`<span class="terminal__prompt">$</span> ${esc(command)}`];
const ok = (text) => `<span class="terminal__ok">${esc(text)}</span>`;
const dim = (text) => `<span class="terminal__dim">${esc(text)}</span>`;

// ── Act 1: counting ──────────────────────────────────────────────────────────────────────────
opening('hook', {
  kicker: KICKER,
  words: 'Touch a toy,',
  accent: 'hear its number.',
  width: 860,
  device: (S) => onBrowser(S, 'three-xl', 990, 300, 870, S.beat(3), { tilt: 3 }),
});

Film.scene('touch', (S) => `
  <div class="fill field--paper">
  ${title(S, 'L2-001', 'One touch,', 'one number.', 110, 170, 840)}
  ${onPhone(S, 'start-xs', 1010, 130, 390, S.beat(2), -2, { show: (t) => t < onBeat(S, part('touch', 0, 0.2)) })}
  ${onPhone(S, 'three-xs', 1010, 130, 390, 0, -2, { show: (t) => t >= onBeat(S, part('touch', 0, 0.2)) })}
  ${heard(S, 'count', onBeat(S, part('touch', 0, 0.35)), at(110, 640, 820))}
  </div>`);

Film.scene('widths', (S) => {
  const shots = [['xs', 390, 780], ['m', 768, 1024], ['l', 1024, 768], ['xl', 1440, 900]].map(([s, width, height]) => ({ src: `shots/three-${s}.png`, width, height }));
  const grown = part('widths', 0, 0.8);
  return `
  <div class="fill field--sun" ${push(S)}>
  <h1 class="headline headline--md" style="position:absolute;left:0;right:0;top:56px;text-align:center">${S.words(S.beat(1), 'More room,', { accent: 'not more things.' })}</h1>
  ${S.grow(shots, (t) => 3 * ease.inOut(prog(t, S.beat(2), Math.max(1, grown - S.beat(2)))), { height: 760, style: 'position:absolute;left:0;right:0;top:240px' })}
  </div>`;
}, { before: 0.4 });

// ── Act 2: how many ──────────────────────────────────────────────────────────────────────────
Film.scene('ask', (S) => `
  <div class="fill field--sky">
  ${title(S, 'L2-001 AC4', 'How many', 'are there?', 110, 220, 760)}
  ${onPhone(S, 'ask-xs', 940, 120, 400, S.beat(2), -2)}
  ${closeup('numerals', `${at(1410, 400, 420)}`, pop(S, onBeat(S, part('ask', 0, 0.55)), { tilt: 2 }))}
  </div>`);

Film.scene('retry', (S) => `
  <div class="fill field--ink">
  ${title(S, 'L2-002 AC2 · L2-026', 'Not yet?', 'Count again.', 110, 150, 820)}
  ${onPhone(S, 'retry-xs', 1370, 120, 400, S.beat(2), 2)}
  ${closeup('retry-bar', `${at(110, 440, 880)}`, pop(S, onBeat(S, part('retry', 0, 0.2)), { tilt: -1 }))}
  ${heard(S, 'retry', onBeat(S, part('retry', 0, 0.45)), at(110, 670, 1200), { every: S.BEAT * 0.4 })}
  </div>`);

Film.scene('yes', (S) => `
  <div class="fill field--leaf" ${zoomOut(S, 480, 560)}>
  ${onPhone(S, 'yes-xs', 150, 120, 400, S.beat(1), -2)}
  ${title(S, 'L2-002 AC1', 'A short yes,', 'then onward.', 760, 150, 1060)}
  ${closeup('yes-bar', `${at(760, 470, 1000)}`, pop(S, onBeat(S, part('yes', 0, 0.25)), { tilt: 1 }))}
  ${heard(S, 'yes', onBeat(S, part('yes', 0, 0.5)), at(760, 720, 1000))}
  </div>`, { after: 0.7 });

Film.scene('proof', (S) => `
  <div class="fill field--paper" ${zoomIn(S)}>
  ${terminal(S, 'checked on this machine', [
    prompt('npx playwright test count-the-toys'),
    [`  ${ok('39 passed')} ${dim('1 skipped')}`],
    prompt('npm test'),
    [`  ${ok('313 passed')}`],
    prompt('npm run build'),
    [`  Initial total  ${ok('244.20 kB')}`],
    [`  ${dim('Count the toys loads when it is chosen')}`],
  ], 0.1, `${at(60, 300, 840)};font-size:28px`, { every: S.BEAT * 0.4 })}
  ${title(S, 'What the tests prove', 'One touch,', 'one number.', 940, 120, 900)}
  <div style="${at(940, 480, 880)}">
    ${fact(S, 1, onBeat(S, part('proof', 0, 0.2)), 'A second touch never counts twice')}
    ${fact(S, 2, onBeat(S, part('proof', 0, 0.45)), 'A wrong answer takes nothing away')}
    ${fact(S, 3, onBeat(S, part('proof', 0, 0.7)), 'Big targets, apart, and no scrolling')}
  </div>
  </div>`, { before: 0.7 });

closing('close', { kicker: KICKER });

wipeInto('ask');
bug();

Film.start();
