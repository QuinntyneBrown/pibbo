// The shared scene kit of a Pibbo film (docs/videos/README.md): the moves every film uses, on
// top of film-runtime.js. slides.html loads it after the runtime and before the film's film.js.
// Every helper returns markup or an S.ref attribute; every position is a pure function of the
// scene's time, as the runtime requires. Nothing here uses a timer, a CSS animation or Math.random.
(() => {
  const { enter, exit, ease, prog, lerp, clamp, phone, browser, tablet, esc } = Film;

  /** Absolute placement in film pixels. */
  const at = (x, y, w) => `position:absolute;left:${x}px;top:${y}px;width:${w}px`;

  const lineOf = (id, n) => {
    const line = Film.timing.lines.filter((l) => l.scene === id)[n];
    // While timing.js holds only the grid (film_audio.py --grid), a line falls back to the scene's start.
    return line ?? { start: Film.at(id) + Film.BAR, end: Film.at(id) + Film.BAR * 2 };
  };
  /** Scene time at which line `n` of scene `id` starts being spoken, so a picture lands on its word. */
  const said = (id, n) => lineOf(id, n).start - Film.at(id);
  /** Scene time at which the fraction `f` of line `n` has been spoken. */
  const part = (id, n, f) => said(id, n) + (lineOf(id, n).end - lineOf(id, n).start) * f;
  /** The same, moved to the beat at or after it: a cut belongs on the grid. */
  const onBeat = (S, t) => Math.ceil(t / S.BEAT - 1e-6) * S.BEAT;

  /** A device that rises into place at `when` and settles at `tilt` degrees; drawn while show(t). */
  const arrive = (S, when, tilt = 0, from = 12, show = () => true) =>
    S.ref((el, t) => {
      const p = enter(t, when, 0.55);
      el.style.visibility = show(t) ? 'visible' : 'hidden';
      el.style.opacity = clamp(p * 4);
      el.style.transform = `translateY(${(1 - p) * 700}px) rotate(${lerp(from, tilt, p)}deg)`;
    });

  /** A phone at (x, y); with `show`, one of several states drawn in the same place. */
  const onPhone = (S, src, x, y, width, when, tilt = 0, { show } = {}) =>
    phone(`shots/${src}.png`, { width, style: at(x, y, width), attrs: arrive(S, when, tilt, tilt + 8, show) });

  /** A browser window at (x, y), arriving at `when`. */
  const onBrowser = (S, src, x, y, width, when, { ratio = 1440 / 900, tilt = 0, show } = {}) =>
    browser(`shots/${src}.png`, { width, ratio, style: at(x, y, width), attrs: arrive(S, when, tilt, tilt + 3, show) });

  /** A tablet at (x, y), arriving at `when`. */
  const onTablet = (S, src, x, y, width, when, tilt = 0, { show } = {}) =>
    tablet(`shots/${src}.png`, { width, style: at(x, y, width), attrs: arrive(S, when, tilt, tilt + 6, show) });

  /** A close-up that pops in at `when` and, if `until` is given, leaves again. */
  const pop = (S, when, { tilt = -2, until = Infinity } = {}) =>
    S.ref((el, t) => {
      const p = enter(t, when, 0.35, ease.back);
      el.style.opacity = t >= until ? 0 : clamp(p * 3);
      el.style.transform = `scale(${lerp(0.6, 1, p)}) rotate(${tilt}deg)`;
    });

  const closeup = (src, style, attrs) => `<img class="closeup" src="shots/${src}.png" alt="" style="${style}" ${attrs}>`;

  /** Words of the film's own on screen from `from` until `until` (scene seconds). */
  const during = (S, from, until = Infinity) => S.ref((el, t) => {
    const p = enter(t, from, 0.3);
    el.style.opacity = t >= until ? 0 : p;
    el.style.transform = `translateY(${(1 - p) * 40}px)`;
  });

  /** A numbered card: one short fact. */
  const fact = (S, n, when, text) =>
    `<div class="card" ${S.rise(when, { y: 50 })}><span class="card__n">${esc(n)}</span><span>${text}</span></div>`;

  /** A big number that changes on a beat: `steps` is [[from, text], …] in scene seconds. */
  const counter = (S, steps, style, cls = 'figure') => `<p class="${cls}" style="${style}" ${S.ref((el, t) => {
    const shown = steps.filter(([from]) => t >= from).at(-1);
    el.style.opacity = shown ? 1 : 0;
    el.textContent = shown ? shown[1] : '';
    const kick = shown ? Math.exp(-(t - shown[0]) * 8) : 0;
    el.style.transform = `scale(${1 + kick * 0.12})`;
  })}></p>`;

  /** Pibbo, as the mocks draw the mascot (docs/mocks/pages/add-together/correct.html). */
  const mark = (size = 150) => `<svg class="pibbo" viewBox="0 0 120 120" width="${size}" height="${size}" aria-hidden="true"><path class="pibbo__stem" d="M60 30 C60 22 60 18 61 13"/><path class="pibbo__leaf" d="M60 18 C52 18 44 13 43 5 C51 4 59 9 60 18 Z"/><path class="pibbo__leaf" d="M61 15 C66 8 75 5 82 8 C79 16 70 19 61 15 Z"/><ellipse class="pibbo__wing" cx="19" cy="52" rx="9" ry="15" transform="rotate(35 19 52)"/><ellipse class="pibbo__wing" cx="101" cy="52" rx="9" ry="15" transform="rotate(-35 101 52)"/><ellipse class="pibbo__foot" cx="49" cy="108" rx="8" ry="5"/><ellipse class="pibbo__foot" cx="71" cy="108" rx="8" ry="5"/><ellipse class="pibbo__body" cx="60" cy="67" rx="43" ry="41"/><ellipse class="pibbo__belly" cx="60" cy="84" rx="25" ry="18"/><path class="pibbo__line" d="M36 60 Q45 49 54 60"/><path class="pibbo__line" d="M66 60 Q75 49 84 60"/><circle class="pibbo__cheek" cx="30" cy="73" r="6"/><circle class="pibbo__cheek" cx="90" cy="73" r="6"/><path class="pibbo__beak-deep" d="M51 69 Q60 66 69 69 Q66 81 60 81 Q54 81 51 69 Z"/></svg>`;

  /** The wordmark of the mocks (.wordmark): the dotted i carries a seed and a leaf. */
  const wordmark = '<span class="wordmark" aria-label="Pibbo">p<span class="wordmark__stem">' +
    '<span class="wordmark__seed"></span><span class="wordmark__leaf"></span></span>bbo</span>';

  /** The lockup: Pibbo beside the wordmark, `size` film pixels tall. */
  const lockup = (size = 150) => `<span class="lockup" style="--s:${size}px">${mark(Math.round(size * 1.15))}${wordmark}</span>`;

  /** Pibbo's purpose, quoted from AGENTS.md word for word, one sentence a line of the close. */
  const PURPOSE = [
    'Pibbo helps young children learn to count and to sound out words.',
    'A child opens it on whatever screen is to hand, picks an activity, and plays: <b>counting</b> the things in front of them, and saying each sound of a word and <b>blending</b> the sounds into the word.',
  ];

  /**
   * The "Pibbo plays" card: the recordings the running app fetched and played for a step, as
   * shots.ts `heard` saved them in shots/heard.js. Each name rises `every` seconds after the one
   * before. The recordings are silent placeholders, which the card says; no app sound is mixed.
   */
  const heard = (S, name, when, style, { every = S.BEAT } = {}) => {
    const files = window.HEARD?.[name];
    if (!files) throw new Error(`shots/heard.js has no "${name}": run tools/video-record`);
    return `<div class="plays" style="${style}" ${S.rise(when, { y: 50 })}>
      <p class="plays__title"><svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path class="plays__wave" d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg>Pibbo plays</p>
      <div class="plays__files">${files.map((f, i) => `<span class="plays__file" ${S.rise(when + (i + 1) * every, { y: 16, dur: 0.2 })}>${esc(f)}</span>`).join('')}</div>
      <p class="plays__note">fetched by the app · placeholder recordings for now</p></div>`;
  };

  /** A terminal of the film's own: `lines` are [html, cls] pairs that rise in one by one from `from`, a beat apart. */
  const terminal = (S, title, lines, from, style, { every = S.BEAT } = {}) => `<div class="terminal" style="${style}">
    <div class="terminal__bar"><i></i><i></i><i></i><span style="margin-left:12px">${esc(title)}</span></div>
    <div class="terminal__body">${lines.map(([html, cls = ''], i) => `<div class="${cls}" ${S.rise(from + i * every, { y: 12, dur: 0.2 })}>${html || '&nbsp;'}</div>`).join('')}</div></div>`;

  /**
   * The opening scene: the aurora over ink, the lockup, the slice's kicker and its headline, and the
   * slice's first screen arriving on a device.
   */
  const opening = (id, { kicker, words, accent, device, width = 1100 }) => Film.scene(id, (S) => `
    <div class="fill field--ink">${S.aurora((t) => enter(t, 0, 1.2) * 0.55)}
    <div style="${at(120, 150, width)}">
      <div ${S.rise(0.2, { y: 30 })}>${lockup(76)}</div>
      <p class="kicker accent" style="margin-top:110px" ${S.rise(S.beat(1))}>${esc(kicker)}</p>
      <h1 class="headline" style="margin-top:28px">${S.words(S.beat(2), words, { accent })}</h1>
    </div>
    ${device(S)}
    </div>`);

  /**
   * The close: the lockup over the aurora and Pibbo's purpose from AGENTS.md, word for word. Each
   * sentence rises as the voice says it: narration.json gives the close one line a sentence.
   */
  const closing = (id, { kicker, after = 0 }) => Film.scene(id, (S) => `
    <div class="fill field--ink">${S.aurora((t) => 0.6 * (1 - exit(t, S.length - 2.5, 2.5) * 0.6))}
    <div style="position:absolute;left:0;right:0;top:150px;text-align:center">
      <div ${S.rise(S.beat(1), { y: 40 })}>${lockup(140)}</div>
      <p class="kicker" style="margin-top:40px" ${S.rise(S.beat(2))}>${esc(kicker)}</p>
      <div class="lede" style="margin:44px auto 0;max-width:1440px;font-size:38px">${PURPOSE.map((sentence, n) =>
        `<p style="margin:0 0 18px" ${S.rise(Math.max(S.beat(2), said(id, n + after) - 0.1), { y: 16 })}>${sentence}</p>`).join('')}</div>
    </div>
    </div>`);

  /** A change of act is a wipe in a brand colour; inside an act the cuts are hard. */
  const wipeInto = (id, color = 'var(--palette-app-sky)') =>
    Film.overlay((S) => S.wipe((T) => prog(T, Film.at(id) - 0.3, 0.6), color));

  /**
   * A push between acts: the scene slides in from the right while the one before slides out to the
   * left. Put `push(S)` on both scenes' root and give them `{ before: dur }` and `{ after: dur }`.
   */
  const push = (S, dur = 0.6) => S.ref((el, t) => {
    const into = t < 0 ? ease.inOut(prog(t, -dur, dur)) : 1;
    const out = t > S.length ? ease.inOut(prog(t, S.length, dur)) : 0;
    el.style.transform = `translateX(${(1 - into) * Film.W - out * Film.W}px)`;
  });

  /**
   * A zoom through a screenshot into the next act: the scene dives into the point (x, y) for `dur`
   * seconds after its end while the next scene, with `zoomIn(S)` on its root and `{ before: dur }`,
   * settles in over it. Give the diving scene `{ after: dur }`.
   */
  const zoomOut = (S, x, y, dur = 0.7) => S.ref((el, t) => {
    const p = t > S.length ? ease.in(prog(t, S.length, dur)) : 0;
    el.style.transformOrigin = `${x}px ${y}px`;
    el.style.transform = `scale(${1 + p * 7})`;
  });
  const zoomIn = (S, dur = 0.7) => S.ref((el, t) => {
    const p = t < 0 ? ease.out(prog(t, -dur * 0.6, dur * 0.6)) : 1;
    el.style.opacity = p;
    el.style.transform = `scale(${lerp(1.25, 1, p)})`;
  });

  /**
   * The brand bug: Pibbo in the top-right corner of every scene but the first and the last,
   * so every frame of the film is a Pibbo frame. A paper disc keeps it apart from any field.
   */
  const bug = (skip = [Film.timing.scenes[0].id, Film.timing.scenes.at(-1).id]) => Film.overlay((S) => {
    const spans = Film.timing.scenes.filter((s) => !skip.includes(s.id)).map((s) => [s.start, s.start + s.length]);
    return `<div class="bug" ${S.ref((el, T) => {
      el.style.opacity = spans.some(([a, b]) => T >= a && T < b) ? 1 : 0;
    })}>${mark(58)}</div>`;
  });

  Film.kit = { at, lineOf, said, part, onBeat, arrive, onPhone, onBrowser, onTablet, pop, closeup, during, fact, counter, mark, lockup, heard, PURPOSE, terminal, opening, closing, wipeInto, push, zoomOut, zoomIn, bug };
})();
