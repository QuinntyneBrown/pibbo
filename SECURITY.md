# Security policy

The security of Pibbo and of the people who use it matters. Pibbo is used by young children,
and promises to collect nothing about them and to load nothing from anyone else. We treat every
report seriously.

## Supported versions

Pibbo is under active development and has no released versions yet. Security fixes are made on
the `main` branch only.

| Version | Supported |
|---|---|
| `main` | Yes |
| Anything else | No |

## Reporting a vulnerability

**Do not report a security vulnerability in a public GitHub issue, discussion or pull request.**

Report it privately through GitHub's
[private vulnerability reporting](https://github.com/QuinntyneBrown/pibbo/security/advisories/new)
for this repository. If that is not available to you, contact the repository owner privately
through their [GitHub profile](https://github.com/QuinntyneBrown).

Include as much of the following as you can:

- the kind of issue (for example, anything about a child being collected, kept or sent, a
  request to a third party, a way to lead a child out of the app or show them content that is
  not Pibbo's own, a microphone or camera prompt, a Content-Security-Policy bypass, injection or
  cross-site scripting);
- the affected page or source file, with the branch or commit;
- the steps to reproduce it, and the browser and host it needs;
- a proof of concept, if you have one;
- the impact, and how an attacker could use it.

## What to expect

- We acknowledge a report within **three business days**.
- We confirm or rule out the issue and share an expected timeline within **ten business days**.
- We keep you informed until it is fixed, and credit you in the advisory unless you would rather
  stay anonymous.

Please give us reasonable time to fix an issue before you disclose it publicly.

## Scope

In scope: the code in this repository and the app, and anything that lets someone learn
anything about a child who uses Pibbo, show a child something that is not Pibbo's own, or take
a child out of the app.

Out of scope: denial-of-service testing, social engineering, physical attacks, and findings in
third-party dependencies that are already publicly known (report those to the dependency's
maintainers).

Test only against your own copy of Pibbo, and never with a child.
