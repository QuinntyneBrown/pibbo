# 0013: Add together: a star and a moon, turns ended by Done, and Check

**Status:** Accepted (journey 9)

## Context

The Add together mocks were transcribed from the prototype. They draw two players side by side,
each with + and − buttons and a pond of up to five ducks, a sum `3 + 4 = ?`, three numeral
choices and Check. A wrong total shows "Count all the ducks together, one by one." with Try
again; a right one "3 and 4 make 7! Great teamwork." The prototype named the players "Maya" and
"Dad", let both add at once, and drew its + and − 44 px tall, 8 px apart. `L2-008` shows each
turn by a symbol and colour, never by a name, and `AGENTS.md` asks a child for nothing about
themselves. The design named `AddTogetherPage`, `TurnSetsComponent` (`pb-turnsets`) and
`additionRules`.

## Decision

1. **No names.** The players are a star (the Count colour) and a moon (the reward colour),
   drawn as shapes so colour is not the only carrier. The player whose turn it is has a ring
   (`aria-current="step"`), and the turn is spoken: "Star's turn. Add ducks to the pond."
2. **Turns are taken in order.** The star adds first; only the player whose turn it is has
   + and −, drawn beside the sum (`.turn-controls`), so the other player has nothing to touch
   and a phone keeps both sets side by side without scrolling. Each + adds one duck and speaks the new number of that set (one touch, one
   number); − takes one away. Done passes the turn once the set has at least one duck; a set
   holds at most five. After the moon's Done, "How many altogether?" is spoken and shown, and
   the choices appear. The mocks gained a `moon-turn` state.
3. **The choices** are the total, one less and one more, in an order from the injected
   `RandomSource` (the mock's 6, 7, 8 for 7). A choice is shown in the sum; Check judges it.
4. **A wrong total** counts every duck aloud from 1 to the total, shows the retry line, and
   waits for Try again; the sets stay as they are and the players choose again. There is no
   modelled answer: the counting aloud is the model.
5. **A right total** says and shows "3 and 4 make 7! Great teamwork.": brief praise for both,
   no winner, loser or score. Next starts a new round with empty sets; five rounds make a play.
6. **The + and − are 64 px, 16 px apart** (`.round-btn`), to keep `AGENTS.md`'s 60 px rule.
   The two sets stay side by side at every width, three ducks to a row on a phone held upright
   and one row of five on its side, so the largest round (5 + 5) fits 360 × 640 and 640 × 360.
7. **The round is a pure state machine in `@pibbo/domain/counting`** (`AddRound`: `turn`,
   `choosing`, `retry`, `done`) with `startAddRound`, `addThing`, `takeThing`, `passTurn`,
   `pickTotal`, `checkTotal` and `chooseAgain`.
8. **Names.** The page is `AddTogether` (`pb-add-together`, route `/count/add`) and the
   presentation component is `TurnSets` (`pb-turn-sets`): the players, the sum and the choices.
9. **Recordings are placeholders**, short silences as in ADR 0007: the two turns, "How many
   altogether?", the retry line, "and", "make", "Great teamwork." and the activity's name.

## Consequences

The things are ducks, the mock's cast; which things, like which numbers, is content. Nothing
about the players is kept: the round holds two counts in memory and goes when the round ends.
