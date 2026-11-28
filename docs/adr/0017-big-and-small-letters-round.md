# 0017: Big and small letters: a pair match of letter forms

**Status:** Accepted (journey 12)

## Context

The Big and small letters mocks draw a pair match, as Letter sounds does (ADR 0015): four big
letters (A, B, D, G) in one column headed Big, and their four small letters (d, a, g, b) in
another headed Small. A touched big letter is held; a matched pair takes the same colour and no
longer takes a touch; when all four are matched, "Every letter found its partner!" and Next. The
mock's note says Andika draws b, d and g so they cannot be confused. `L2-011` asked for one big
letter with three small choices, and a hint showing B and b side by side after a wrong choice.
The design named `LetterFormsPage`, `LetterPairComponent` (`pb-letterpair`), `FormRound` and
`formRules`. No mock drew a wrong choice.

## Decision

1. **The mock wins.** `L2-011` now describes the four-pair match. A touched letter, big or
   small, says its sound, never its name; a right partner joins the two; a wrong one shakes, the
   held letter stays held and nothing is taken away. Praise comes once, when all four match.
2. **A `miss` state is drawn**, with Letter sounds' `.pair--miss` shake; reduced motion
   removes it. There is no side-by-side hint: the shake and the spoken sound are the feedback,
   as in Letter sounds, and the mock draws nothing else.
3. **The rules are Letter sounds' rules.** `LetterSoundsRound`, `holdLetter` and `matchSound`
   are generic over a `MatchPair` (a pair with a `Sound`), so one pure state machine plays both
   activities; `startLetterFormsRound` and `letterFormsAssets` add only what differs. A
   `FormPair` names its big letter as data (`big: "B"`) beside the small letter's sound; the app
   never upper-cases a letter itself.
4. **The presentation is `Pairs`**, with a `kind` input: `sounds` (Letter sounds) or `forms`,
   which draws a small letter in the second column and the Big and Small heads. On a phone,
   upright or on its side, the heads are hidden (drawn in the mock CSS first): they no longer
   sit over their columns and the game area is too short; the bubble says which is which.
5. **The house letterforms are Andika** (ADR 0003), bundled and self-hosted and already used for
   everything a child reads (`--font-read`). It draws a single-storey a and g and keeps b, d, p,
   q and I, l, 1 distinct.
6. **Content is data** in `letterForms` of `sound-out-content.json`, naming sounds from the same
   table; b, d and g were added there with placeholder recordings, like every sound so far. The
   build-time content check covers the pairs. Five rounds make a play; after the fifth, Next
   returns to Home with Read chosen. Big and small letters is listed in Read after Letter
   sounds; the mock's Next to Letter sounds is the prototype's cast.

## Consequences

Which letters the activity covers and in what order, the real recordings and the consonant
audit stay open. A pair whose big and small forms look alike (C c, S s) teaches little; which
pairs to choose is a content decision, not made here.
