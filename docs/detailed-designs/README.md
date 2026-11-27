# Detailed designs

Each folder below is one subsystem of Pibbo; each subfolder inside it is one vertically sliced feature with its own `README.md` and rendered diagrams. The table lists the L2 requirements each feature realises, from `docs/specs/L2.md`.

Open point: `docs/specs/L1.md` and `L2-027`–`L2-031`, `L2-038` and `L2-039` describe a .NET content backend, while `AGENTS.md` states that Pibbo has no backend until an ADR adds one. `L2-028` criterion 4 requires that ADR. The backend designs below are written against the specs and remain blocked on that ADR and the repository owner's agreement.

| Subsystem | Feature | L2 requirements |
|-----------|---------|-----------------|
| `home` | [Choose an activity from Home](home/choose-an-activity/README.md) | `L2-024` |
| `count` | [Count a set](count/count-a-set/README.md) | `L2-001`, `L2-002` |
| `count` | [Count to twenty and write the numeral](count/count-to-twenty/README.md) | `L2-003`, `L2-004` |
| `count` | [Compare two numbers](count/compare-two-numbers/README.md) | `L2-005` |
| `count` | [Count backward](count/count-backward/README.md) | `L2-006` |
| `count` | [Skip-count by twos, fives and tens](count/skip-count/README.md) | `L2-007` |
| `count` | [Add two numbers together (pass and play)](count/add-two-numbers/README.md) | `L2-008` |
| `count` | [Count to music](count/count-to-music/README.md) | `L2-009` |
| `sound-out` | [Match letters to sounds](sound-out/match-letters-to-sounds/README.md) | `L2-010` |
| `sound-out` | [Recognise uppercase and lowercase](sound-out/recognise-letter-forms/README.md) | `L2-011` |
| `sound-out` | [Sound out and blend a three-sound word](sound-out/sound-out-and-blend/README.md) | `L2-012` |
| `sound-out` | [Spell a word by sound](sound-out/spell-by-sound/README.md) | `L2-013` |
| `sound-out` | [Letter groups that make one sound](sound-out/letter-groups/README.md) | `L2-014` |
| `sound-out` | [Adjacent consonants](sound-out/adjacent-consonants/README.md) | `L2-015` |
| `sound-out` | [Silent-e words](sound-out/silent-e/README.md) | `L2-016` |
| `sound-out` | [Read longer words by syllable](sound-out/read-by-syllable/README.md) | `L2-017` |
| `sound-out` | [Connect words to pictures](sound-out/connect-words-to-pictures/README.md) | `L2-018` |
| `sound-out` | [Recognise common words](sound-out/recognise-common-words/README.md) | `L2-019` |
| `sound-out` | [Build a short sentence](sound-out/build-a-sentence/README.md) | `L2-020` |
| `sound-out` | [Hear rhymes](sound-out/hear-rhymes/README.md) | `L2-021` |
| `lessons` | [Follow a guided lesson](lessons/guided-lesson/README.md) | `L2-022` |
| `lessons` | [Play the check game](lessons/check-game/README.md) | `L2-023` |
| `rounds` | [Spoken and shown instructions](rounds/spoken-and-shown-instructions/README.md) | `L2-025` |
| `rounds` | [Retry and praise](rounds/retry-and-praise/README.md) | `L2-026` |
| `content-service` | [Serve versioned content](content-service/serve-content/README.md) | `L2-027` |
| `content-service` | [Hold nothing about a child](content-service/hold-nothing-about-a-child/README.md) | `L2-028` |
| `privacy` | [Nothing about a child leaves the device](privacy/device-only-data/README.md) | `L2-029` |
| `security` | [Transport and header hardening](security/transport-and-headers/README.md) | `L2-030` |
| `security` | [Content administration security](security/admin-content-security/README.md) | `L2-031` |
| `performance` | [Load and response performance](performance/fast-load-and-response/README.md) | `L2-032` |
| `performance` | [Offline after first use](performance/offline-after-first-use/README.md) | `L2-033` |
| `layout` | [Responsive breakpoints](layout/responsive-breakpoints/README.md) | `L2-034` |
| `layout` | [Touch robustness](layout/touch-robustness/README.md) | `L2-035` |
| `accessibility` | [WCAG 2.2 AA and keyboard](accessibility/wcag-and-keyboard/README.md) | `L2-036` |
| `grown-up` | [Grown-up gate and area](grown-up/grown-up-gate/README.md) | `L2-037` |
| `operations` | [Health, logs and metrics](operations/health-logs-metrics/README.md) | `L2-038` |
| `operations` | [Build and deployment](operations/build-and-deploy/README.md) | `L2-039` |
