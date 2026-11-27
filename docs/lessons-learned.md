# Lessons learned

One entry per journey, newest last. Before a journey, read these and apply the ones that fit.

## Journey 1: Scaffold the workspace

**What slowed it**

- `ng add angular-eslint` installed the packages but wrote no config in a workspace with no
  default project; `ng g angular-eslint:add-eslint-to-project <project>` per project did.
- In a multi-project workspace `ng build` with no project name builds every library; the scripts
  name `pibbo` explicitly.
- `ng test <library>` fails when the library has no spec files, so `tools/verify/unit-tests.mjs`
  runs only the projects that have specs.
- A long multi-file heredoc in Git Bash failed to parse as a whole and wrote nothing; separate
  writes are safer.

**New lessons**

1. Fake browser APIs (`HTMLMediaElement.play`, `Math.random`, `page.clock`) in the e2e fixture
   rather than swapping Angular bindings: the production bundle stays free of test hooks and the
   real bindings are exercised (ADR 0004).
2. Run e2e against the production build with the deployed headers. It caught nothing yet, but it
   is the only way a CSP regression (an inline script, a third-party font) shows up in a spec.
3. Keep the security headers in one JSON file read by both the e2e server and the deploy docs.
4. Turn off Angular's font inlining and critical-CSS inlining: the first calls Google Fonts at
   build time, the second needs an inline script the CSP forbids.
5. `components` imports `@pibbo/api` for types only: `@typescript-eslint/no-restricted-imports`
   with `allowTypeImports` enforces exactly that.

**Earlier lessons applied:** none; this is the first journey.
