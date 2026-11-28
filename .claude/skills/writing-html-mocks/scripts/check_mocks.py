#!/usr/bin/env python3
"""Validate a docs/mocks tree: coverage, HTML hygiene, accessibility basics, links.

Checks performed:
  * manifest.json lists every screen; every listed state file exists, every
    HTML file on disk is listed (no orphans), and every required state for the
    screen's kind is either present or explicitly marked not applicable.
  * each mock has a doctype, <html lang>, <title>, viewport meta, exactly one
    <h1>, a <main> landmark, mock:* meta tags that match its path, the shared
    tokens stylesheet, and no placeholder text (lorem ipsum, TODO, TBD).
  * images have alt text, form controls have labels, buttons and links have an
    accessible name, and every relative link, image, script and stylesheet
    resolves (including #fragments).
  * with --write, the coverage matrix in README.md (between the coverage
    markers) and the gallery index.html are regenerated from the manifest.

Usage:
    python check_mocks.py                 # checks docs/mocks
    python check_mocks.py docs/mocks --write
    python check_mocks.py docs/mocks --json

Exit status is 1 when any error is found. Only the standard library is used.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

KIND_FOLDERS = {"page": "pages", "dialog": "dialogs", "notification": "notifications"}
DEFAULT_REQUIRED = {
    "page": ["default", "loading", "empty", "error"],
    "dialog": ["default", "busy", "invalid"],
    "notification": ["info", "success", "warning", "danger"],
}
PLACEHOLDER_RE = re.compile(r"lorem ipsum|\bTODO\b|\bTBD\b|\bFIXME\b|placeholder text|\[insert\b", re.I)
COVERAGE_START = "<!-- coverage:start -->"
COVERAGE_END = "<!-- coverage:end -->"
LABELLED_INPUT_TYPES_EXEMPT = {"hidden", "submit", "button", "reset", "image"}


class MockInspector(HTMLParser):
    """Gather the facts the checks need from one HTML document."""

    def __init__(self) -> None:
        super().__init__()
        self.doctype = False
        self.lang = None
        self.title = ""
        self.in_title = False
        self.viewport = False
        self.h1_count = 0
        self.main = False
        self.metas: dict[str, str] = {}
        self.stylesheets: list[str] = []
        self.refs: list[tuple[str, str, int]] = []  # (kind, target, line)
        self.ids: set[str] = set()
        self.label_for: set[str] = set()
        self.wrapping_label_depth = 0
        self.unlabelled_controls: list[tuple[str, int]] = []
        self.images_without_alt: list[int] = []
        self.unnamed_buttons: list[int] = []
        self.unnamed_links: list[int] = []
        self.text_chunks: list[str] = []
        self.mock_bar = False
        self.skip_link = False
        self._open_name_elements: list[dict] = []  # buttons/links awaiting text
        self.in_script_or_style = 0

    def handle_decl(self, decl):
        if decl.lower().startswith("doctype"):
            self.doctype = True

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        line = self.getpos()[0]
        if tag in {"script", "style"}:
            self.in_script_or_style += 1
        if attrs.get("id"):
            self.ids.add(attrs["id"])
        if tag == "html":
            self.lang = attrs.get("lang")
        elif tag == "title":
            self.in_title = True
        elif tag == "meta":
            name = (attrs.get("name") or "").lower()
            if name == "viewport":
                self.viewport = True
            if name:
                self.metas[name] = attrs.get("content", "")
        elif tag == "h1":
            self.h1_count += 1
        elif tag == "main":
            self.main = True
        elif tag == "link":
            rel = (attrs.get("rel") or "").lower()
            href = attrs.get("href", "")
            if "stylesheet" in rel:
                self.stylesheets.append(href)
            if href and "icon" not in rel:
                self.refs.append(("link", href, line))
        elif tag == "a":
            href = attrs.get("href")
            if href:
                self.refs.append(("a", href, line))
            if "skip" in (attrs.get("class") or "") or (href or "").startswith("#main"):
                self.skip_link = True
            self._open_name_elements.append({"tag": tag, "line": line, "named": bool(attrs.get("aria-label") or attrs.get("aria-labelledby") or attrs.get("title")), "text": ""})
        elif tag in {"img", "script", "iframe", "source", "video", "audio"}:
            src = attrs.get("src")
            if src:
                self.refs.append((tag, src, line))
            if tag == "img" and "alt" not in attrs:
                self.images_without_alt.append(line)
            if tag == "img" and attrs.get("alt"):
                for el in self._open_name_elements:
                    el["named"] = True
        elif tag == "button":
            self._open_name_elements.append({"tag": tag, "line": line, "named": bool(attrs.get("aria-label") or attrs.get("aria-labelledby") or attrs.get("title")), "text": ""})
        elif tag == "label":
            if attrs.get("for"):
                self.label_for.add(attrs["for"])
            self.wrapping_label_depth += 1
        elif tag in {"input", "select", "textarea"}:
            kind = (attrs.get("type") or "text").lower()
            if tag == "input" and kind in LABELLED_INPUT_TYPES_EXEMPT:
                pass
            else:
                labelled = bool(attrs.get("aria-label") or attrs.get("aria-labelledby") or self.wrapping_label_depth)
                if not labelled:
                    self.unlabelled_controls.append((attrs.get("id") or f"<{tag}>", line))
        if tag in {"nav", "aside", "div", "header"} and "mock-bar" in (attrs.get("class") or ""):
            self.mock_bar = True
        if attrs.get("aria-label") or attrs.get("title"):
            for el in self._open_name_elements:
                if el["tag"] == tag:
                    el["named"] = True
        if tag in {"svg", "span", "i"} and self._open_name_elements and attrs.get("aria-label"):
            self._open_name_elements[-1]["named"] = True

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag in {"script", "style"}:
            self.in_script_or_style -= 1

    def handle_endtag(self, tag):
        if tag in {"script", "style"}:
            self.in_script_or_style = max(0, self.in_script_or_style - 1)
        if tag == "title":
            self.in_title = False
        elif tag == "label":
            self.wrapping_label_depth = max(0, self.wrapping_label_depth - 1)
        elif tag in {"button", "a"}:
            for index in range(len(self._open_name_elements) - 1, -1, -1):
                el = self._open_name_elements[index]
                if el["tag"] == tag:
                    del self._open_name_elements[index]
                    if not el["named"] and not el["text"].strip():
                        (self.unnamed_buttons if tag == "button" else self.unnamed_links).append(el["line"])
                    break

    def handle_data(self, data):
        if self.in_title:
            self.title += data
        if self.in_script_or_style:
            return
        self.text_chunks.append(data)
        for el in self._open_name_elements:
            el["text"] += data

    def resolve_pending_labels(self) -> None:
        self.unlabelled_controls = [(ident, line) for ident, line in self.unlabelled_controls if ident not in self.label_for]


def inspect(path: Path) -> MockInspector:
    parser = MockInspector()
    parser.feed(path.read_text(encoding="utf-8", errors="replace"))
    parser.close()
    parser.resolve_pending_labels()
    return parser


def check_reference(source: Path, root: Path, target: str, ids_cache: dict[Path, set[str]]) -> str | None:
    """Return an error message when a relative reference does not resolve."""
    parts = urlsplit(target)
    if parts.scheme or target.startswith("//") or target.startswith("mailto:") or target.startswith("tel:") or target.startswith("data:") or target.startswith("javascript:"):
        return None
    if not parts.path and not parts.fragment:
        return None
    if parts.path:
        candidate = (source.parent / unquote(parts.path)).resolve()
        if candidate.is_dir():
            candidate = candidate / "index.html"
        if not candidate.exists():
            return f"broken reference '{target}'"
    else:
        candidate = source.resolve()
    if parts.fragment and candidate.suffix.lower() in {".html", ".htm"}:
        if candidate not in ids_cache:
            ids_cache[candidate] = inspect(candidate).ids if candidate.exists() else set()
        if parts.fragment not in ids_cache[candidate] and parts.fragment != "top":
            return f"missing fragment '#{parts.fragment}' in '{target}'"
    return None


def load_manifest(root: Path) -> dict:
    path = root / "manifest.json"
    if not path.is_file():
        raise FileNotFoundError(f"{path} not found. Create it with a 'screens' list (see the skill's references/manifest.md).")
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data.get("screens"), list) or not data["screens"]:
        raise ValueError(f"{path} has no 'screens' list")
    return data


def expected_file(root: Path, screen: dict, state: str) -> Path:
    return root / KIND_FOLDERS[screen["kind"]] / screen["id"] / f"{state}.html"


def run_checks(root: Path) -> tuple[list[str], list[str], dict]:
    errors: list[str] = []
    warnings: list[str] = []
    manifest = load_manifest(root)
    required_by_kind = dict(DEFAULT_REQUIRED)
    required_by_kind.update(manifest.get("required_states", {}))
    listed: set[Path] = set()
    ids_cache: dict[Path, set[str]] = {}
    seen_ids: set[tuple[str, str]] = set()
    coverage: dict[str, list[dict]] = {kind: [] for kind in KIND_FOLDERS}

    for screen in manifest["screens"]:
        sid, kind = screen.get("id"), screen.get("kind")
        if not sid or kind not in KIND_FOLDERS:
            errors.append(f"manifest: screen {screen!r} needs an 'id' and a 'kind' of {sorted(KIND_FOLDERS)}")
            continue
        if (kind, sid) in seen_ids:
            errors.append(f"manifest: duplicate {kind} id '{sid}'")
        seen_ids.add((kind, sid))
        if not screen.get("title"):
            errors.append(f"manifest: screen '{sid}' has no title")
        states = screen.get("states") or []
        if not isinstance(states, list) or not states:
            errors.append(f"manifest: screen '{sid}' lists no states")
        not_applicable = screen.get("not_applicable") or {}
        for state, reason in not_applicable.items():
            if not str(reason).strip():
                errors.append(f"manifest: screen '{sid}' marks state '{state}' not applicable without a reason")
        row = {"id": sid, "kind": kind, "title": screen.get("title", sid), "route": screen.get("route", ""), "requirements": screen.get("requirements", []), "states": {}}
        for state in required_by_kind.get(kind, []):
            if state not in states and state not in not_applicable:
                errors.append(f"coverage: {kind} '{sid}' is missing required state '{state}' (add the mock or explain it under not_applicable)")
        for state in states:
            file = expected_file(root, screen, state)
            listed.add(file.resolve())
            if not file.is_file():
                errors.append(f"coverage: {kind} '{sid}' state '{state}' has no file at {file.relative_to(root).as_posix()}")
                row["states"][state] = {"status": "missing", "path": file.relative_to(root).as_posix()}
                continue
            row["states"][state] = {"status": "ok", "path": file.relative_to(root).as_posix()}
            subject = screen.get("state_subjects", {}).get(state, screen.get("subject"))
            if subject in ("read", "count"):
                row["states"][state]["subject"] = subject
            check_html(file, root, sid, kind, state, screen, errors, warnings, ids_cache)
        for state, reason in not_applicable.items():
            row["states"][state] = {"status": "n/a", "reason": reason}
        coverage[kind].append(row)

    for folder in KIND_FOLDERS.values():
        for file in sorted((root / folder).rglob("*.html")) if (root / folder).is_dir() else []:
            if file.resolve() not in listed:
                errors.append(f"orphan: {file.relative_to(root).as_posix()} is not listed in manifest.json")

    for name in ("index.html", "README.md"):
        if not (root / name).is_file():
            warnings.append(f"{name} is missing; run with --write to generate it")
    index = root / "index.html"
    if index.is_file():
        inspector = inspect(index)
        for kind, target, line in inspector.refs:
            problem = check_reference(index, root, target, ids_cache)
            if problem:
                errors.append(f"index.html:{line}: {problem}")
    return errors, warnings, {"manifest": manifest, "coverage": coverage}


def check_html(file: Path, root: Path, sid: str, kind: str, state: str, screen: dict, errors: list[str], warnings: list[str], ids_cache: dict[Path, set[str]]) -> None:
    rel = file.relative_to(root).as_posix()
    doc = inspect(file)
    if not doc.doctype:
        errors.append(f"{rel}: missing <!doctype html>")
    if not doc.lang:
        errors.append(f"{rel}: <html> has no lang attribute")
    if not doc.title.strip():
        errors.append(f"{rel}: missing <title>")
    if not doc.viewport:
        errors.append(f"{rel}: missing viewport meta")
    if doc.h1_count != 1:
        errors.append(f"{rel}: expected exactly one <h1>, found {doc.h1_count}")
    if not doc.main:
        errors.append(f"{rel}: missing <main> landmark")
    if not doc.skip_link:
        warnings.append(f"{rel}: no skip link to #main")
    if not doc.mock_bar:
        warnings.append(f"{rel}: no .mock-bar chrome (state navigation and theme toggle)")
    for key, expected in (("mock:screen", sid), ("mock:kind", kind), ("mock:state", state)):
        actual = doc.metas.get(key)
        if actual is None:
            errors.append(f"{rel}: missing <meta name=\"{key}\">")
        elif actual != expected:
            errors.append(f"{rel}: <meta name=\"{key}\"> is '{actual}' but the path says '{expected}'")
    declared = set((doc.metas.get("mock:requirements") or "").replace(",", " ").split())
    manifest_reqs = set(screen.get("requirements") or [])
    if manifest_reqs and declared != manifest_reqs:
        warnings.append(f"{rel}: mock:requirements {sorted(declared)} differs from manifest {sorted(manifest_reqs)}")
    if not any(href.endswith("tokens.css") for href in doc.stylesheets):
        errors.append(f"{rel}: does not link a tokens.css stylesheet")
    text = " ".join(doc.text_chunks)
    match = PLACEHOLDER_RE.search(text)
    if match:
        errors.append(f"{rel}: placeholder text '{match.group(0)}' found; write real copy")
    for line in doc.images_without_alt:
        errors.append(f"{rel}:{line}: <img> without alt attribute")
    for ident, line in doc.unlabelled_controls:
        errors.append(f"{rel}:{line}: form control {ident} has no label")
    for line in doc.unnamed_buttons:
        errors.append(f"{rel}:{line}: <button> has no accessible name")
    for line in doc.unnamed_links:
        errors.append(f"{rel}:{line}: <a> has no accessible name")
    for ref_kind, target, line in doc.refs:
        problem = check_reference(file, root, target, ids_cache)
        if problem:
            errors.append(f"{rel}:{line}: {problem}")


def coverage_markdown(coverage: dict, required_by_kind: dict) -> str:
    lines = [COVERAGE_START, "", "Legend: ✅ mock exists · ➖ not applicable (reason in manifest) · ❌ missing", ""]
    for kind, rows in coverage.items():
        if not rows:
            continue
        states: list[str] = list(required_by_kind.get(kind, []))
        for row in rows:
            for state in row["states"]:
                if state not in states:
                    states.append(state)
        lines.append(f"### {KIND_FOLDERS[kind].capitalize()}")
        lines.append("")
        lines.append("| Screen | " + " | ".join(states) + " | Requirements |")
        lines.append("|---|" + "---|" * len(states) + "---|")
        for row in rows:
            cells = []
            for state in states:
                info = row["states"].get(state)
                if not info:
                    cells.append("")
                elif info["status"] == "ok":
                    cells.append(f"[✅]({info['path']})")
                elif info["status"] == "n/a":
                    cells.append("➖")
                else:
                    cells.append("❌")
            reqs = ", ".join(f"`{r}`" for r in row["requirements"]) or ""
            lines.append(f"| {row['title']} (`{row['id']}`) | " + " | ".join(cells) + f" | {reqs} |")
        lines.append("")
    lines.append(COVERAGE_END)
    return "\n".join(lines)


def write_readme(root: Path, coverage: dict, manifest: dict) -> None:
    required_by_kind = dict(DEFAULT_REQUIRED)
    required_by_kind.update(manifest.get("required_states", {}))
    block = coverage_markdown(coverage, required_by_kind)
    readme = root / "README.md"
    if readme.is_file():
        text = readme.read_text(encoding="utf-8")
        if COVERAGE_START in text and COVERAGE_END in text:
            start = text.index(COVERAGE_START)
            end = text.index(COVERAGE_END) + len(COVERAGE_END)
            text = text[:start] + block + text[end:]
        else:
            text = text.rstrip() + "\n\n## Coverage\n\n" + block + "\n"
    else:
        title = manifest.get("project", "Project")
        text = f"# {title} mocks\n\nStatic HTML mocks for every page, dialog and notification, in every state. Open [index.html](index.html) locally to browse them.\n\n## Coverage\n\n{block}\n"
    readme.write_text(text, encoding="utf-8")


def write_index(root: Path, coverage: dict, manifest: dict) -> None:
    title = manifest.get("project", "Project")
    sections = []
    for kind, rows in coverage.items():
        if not rows:
            continue
        cards = []
        for row in rows:
            links = []
            first = next((i["path"] for i in row["states"].values() if i["status"] == "ok"), None)
            for state, info in row["states"].items():
                if info["status"] == "ok":
                    current = ' aria-current="true"' if info["path"] == first else ""
                    state_id = f'state-{row["id"]}-{state}'
                    subject_attr = ' data-subject="read"' if info.get("subject") == "read" else ""
                    # Descending strokes shift the visible centre of a Fredoka label below its line box.
                    ink_class = ' class="descenders"' if re.search(r"[gjpqy]", state) else ""
                    links.append(f'<li><a id="{state_id}"{subject_attr}{ink_class} aria-labelledby="{state_id} title-{row["id"]}" href="{info["path"]}?theme=light"{current}>{state}</a></li>')
                elif info["status"] != "n/a":
                    links.append(f'<li class="missing">{state} <span>missing</span></li>')
            preview = f'<iframe loading="lazy" tabindex="-1" aria-hidden="true" src="{first}?chrome=0&amp;theme=light"></iframe>' if first else '<div class="no-preview">No mock yet</div>'
            open_link = ""
            if first:
                open_link = f'<a class="open-preview" href="{first}?theme=light" aria-labelledby="open-{row["id"]} title-{row["id"]} state-{row["id"]}-{Path(first).stem}" id="open-{row["id"]}">Open mock</a>'
            route = f'<code>{row["route"]}</code>' if row["route"] else ""
            reqs = " ".join(f"<code>{r}</code>" for r in row["requirements"])
            cards.append(
                f'<article class="card"><div class="preview">{preview}</div><div class="body">'
                f'<div class="card-heading"><h3 id="title-{row["id"]}">{row["title"]}</h3>{open_link}</div><p class="meta">{route} {reqs}</p><ul class="states">{"".join(links)}</ul></div></article>'
            )
        sections.append(f'<section><h2 id="{KIND_FOLDERS[kind]}">{KIND_FOLDERS[kind].capitalize()}</h2><div class="grid">{"".join(cards)}</div></section>')
    change_log = '<a href="alignment-log.md">Change log</a>' if (root / "alignment-log.md").is_file() else ""
    appearance_script = '<script src="assets/appearance.js"></script>' if (root / "assets/appearance.js").is_file() else ""
    html = f"""<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} mocks</title>
{appearance_script}
<link rel="stylesheet" href="assets/tokens.css">
<style>
  body {{ margin: 0; font: var(--text-body); color: var(--color-fg-default); background: var(--color-bg-canvas); }}
  header {{ padding: var(--space-6) var(--layout-margin); border-bottom: 1px solid var(--color-border-default); display: flex; gap: var(--space-4); align-items: center; flex-wrap: wrap; }}
  header h1 {{ font: var(--text-h2); margin: 0; flex: 1; }}
  header nav a {{ margin-right: var(--space-4); color: var(--color-fg-link); }}
  main {{ padding: var(--space-6) var(--layout-margin); max-width: var(--layout-container-max); margin-inline: auto; }}
  h2 {{ font: var(--text-h3); margin: var(--space-8) 0 var(--space-4); }}
  .grid {{ display: grid; gap: var(--layout-gutter); grid-template-columns: repeat(auto-fill, minmax(min(18rem, 100%), 1fr)); }}
  .card {{ background: var(--color-bg-surface); border: 1px solid var(--color-border-default); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-1); display: flex; flex-direction: column; }}
  .preview {{ container-type: inline-size; aspect-ratio: 4 / 3; background: var(--color-bg-surface-sunken); overflow: hidden; position: relative; }}
  .open-preview {{ flex: none; display: none; align-items: center; padding-inline: var(--space-3); min-height: var(--target-min); border-radius: var(--radius-full); background: var(--color-fg-default); color: var(--color-bg-canvas); font: var(--text-label); }}
  body:has(.preview-mode input:checked) .open-preview {{ display: inline-flex; }}
  .preview-mode {{ display: inline-flex; align-items: center; gap: var(--space-2); min-height: var(--target-min); cursor: pointer; font: var(--text-label); }}
  .preview iframe {{ display: block; width: 1024px; height: 768px; transform: scale(calc(100cqw / 1024px)); transform-origin: top left; border: 0; pointer-events: none; }}
  @media (orientation: portrait) and (max-width: 64rem) {{
    .preview {{ container-type: size; aspect-ratio: calc(100vw / 100svh); max-height: 45svh; }}
    .preview iframe {{ position: absolute; left: 50%; width: 100vw; height: 100svh; transform: translateX(-50%) scale(min(calc(100cqw / 100vw), calc(100cqh / 100svh))); transform-origin: top center; }}
  }}
  @media (orientation: landscape) and (max-height: 30rem) and (max-width: 60rem) {{
    .preview {{ aspect-ratio: calc(100vw / 100svh); max-height: none; }}
    .preview iframe {{ position: absolute; inset: 0; width: 100vw; height: 100svh; transform: scale(calc(100cqw / 100vw)); transform-origin: top left; }}
  }}
  .no-preview {{ display: grid; place-items: center; height: 100%; color: var(--color-fg-subtle); }}
  .body {{ padding: var(--space-4); }}
  @media (max-width: 32rem) {{
    body {{ container: gallery / inline-size; }}
  }}
  @container gallery (max-width: 14rem) {{
    main, header {{ padding-inline: var(--space-2); }}
    .card .body {{ padding: var(--space-2); }}
    .card :is(h3, .meta, .states li) {{ overflow-wrap: anywhere; }}
    .states li, .states a {{ max-width: 100%; }}
    header nav {{ display: flex; flex-wrap: wrap; gap: var(--space-2); }}
    header nav a {{ margin: 0; }}
  }}
  .card-heading {{ display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-2); }}
  .body h3 {{ margin: 0 0 var(--space-1); font: var(--text-h4); }}
  .meta {{ margin: 0 0 var(--space-3); color: var(--color-fg-muted); font: var(--text-body-sm); }}
  .meta code {{ font: var(--text-code); background: var(--color-bg-subtle); padding: 0 var(--space-1); border-radius: var(--radius-sm); }}
  .states {{ list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: var(--space-2); }}
  .states li {{ font: var(--text-label); }}
  .states a, .states .missing {{
    box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center;
    gap: var(--space-1); min-height: var(--target-min); padding: var(--space-1) var(--space-3); border-radius: var(--radius-full);
  }}
  .states a.descenders {{ --label-lift: 0.115em; }}
  .states a {{
    --label-lift: 0.5px;
    padding-block: calc(var(--space-1) - var(--label-lift)) calc(var(--space-1) + var(--label-lift));
  }}
  .states a {{ scroll-margin-block-start: min(60vh, 27rem); background: var(--color-accent-subtle); color: var(--color-fg-accent); text-decoration: none; }}
  .states a[aria-current="true"] {{ background: var(--color-count-strong); color: var(--color-fg-on-strong); text-decoration: underline; text-underline-offset: 0.2em; }}
  .states a[data-subject="read"][aria-current="true"] {{ background: var(--color-read-strong); }}
  .states a:not([aria-current]):hover {{ background: var(--color-accent-subtle-hover); color: var(--color-fg-link-hover); text-decoration: underline; text-underline-offset: 0.2em; }}
  :focus-visible {{ outline: var(--focus-ring-width) solid var(--color-focus-ring); outline-offset: var(--focus-ring-offset); }}
  .states .missing {{ background: var(--color-danger-bg); color: var(--color-danger-fg); }}
  .states span {{ font: var(--text-caption); }}
  button.theme {{ font: var(--text-label); padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--color-border-strong); background: var(--color-bg-surface); color: var(--color-fg-default); cursor: pointer; min-height: var(--target-min); }}
</style>
</head>
<body>
<header>
  <h1>{title} mocks</h1>
  <nav aria-label="Sections">{"".join(f'<a href="#{KIND_FOLDERS[k]}">{KIND_FOLDERS[k].capitalize()}</a>' for k, rows in coverage.items() if rows)}<a href="README.md">Coverage</a>{change_log}</nav>
  <label class="preview-mode"><input type="checkbox" autocomplete="off">Preview states in gallery</label>
  <button class="theme" type="button" aria-pressed="false">Dark theme</button>
</header>
<main id="main">
{"".join(sections)}
</main>
<script>
  const themeControl = document.querySelector('button.theme');
  function replacePreview(frame, url) {{
    const next = frame.cloneNode(false);
    next.src = url.href;
    frame.replaceWith(next);
  }}
  function setGalleryTheme(dark) {{
    const theme = dark ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    themeControl.setAttribute('aria-pressed', String(dark));
    for (const frame of document.querySelectorAll('.preview iframe')) {{
      const url = new URL(frame.src);
      if (url.searchParams.get('theme') === theme) continue;
      url.searchParams.set('theme', theme);
      replacePreview(frame, url);
    }}
    for (const link of document.querySelectorAll('.states a, .open-preview')) {{
      const url = new URL(link.href);
      url.searchParams.set('theme', theme);
      link.href = url.href;
    }}
  }}
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  function syncGalleryTheme() {{
    if (typeof preferredMockTheme === 'function') {{
      setGalleryTheme(preferredMockTheme() === 'dark');
      return;
    }}
    const requested = new URLSearchParams(location.search).get('theme');
    let stored;
    try {{ stored = localStorage.getItem('mock-theme'); }} catch {{ /* unavailable */ }}
    const choice = [requested, stored].find(value => value === 'dark' || value === 'light');
    setGalleryTheme(choice ? choice === 'dark' : systemTheme.matches);
  }}
  syncGalleryTheme();
  systemTheme.addEventListener('change', syncGalleryTheme);
  const previewMode = document.querySelector('.preview-mode input');
  function previewState(link) {{
    const card = link.closest('.card');
    const frame = card.querySelector('iframe');
    const open = card.querySelector('.open-preview');
    open.href = link.href;
    open.setAttribute('aria-labelledby', open.id + ' ' + card.querySelector('h3').id + ' ' + link.id);
    const url = new URL(link.href);
    url.searchParams.set('chrome', '0');
    if (!link.hasAttribute('aria-current')) {{
      const previous = card.querySelector('.states [aria-current]');
      if (previous) previous.removeAttribute('aria-current');
      link.setAttribute('aria-current', 'true');
      const source = new URL(frame.src);
      if (source.pathname !== url.pathname || source.searchParams.get('theme') !== url.searchParams.get('theme')) replacePreview(frame, url);
    }}
  }}
  function showGalleryState(link, fromBookmark) {{
    const card = link.closest('.card');
    if (matchMedia('(max-width: 32rem)').matches) {{
      card.scrollIntoView({{ block: 'start' }});
      link.scrollIntoView({{ block: 'nearest' }});
    }} else if (fromBookmark) link.scrollIntoView({{ block: 'start' }});
    else card.querySelector('.preview').scrollIntoView({{ block: 'nearest' }});
  }}
  document.addEventListener('click', event => {{
    const link = event.target.closest('.states a');
    if (!link || !previewMode.checked ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const hash = '#preview-' + link.id;
    if (location.hash !== hash) history.pushState(null, '', hash);
    previewState(link);
    const card = link.closest('.card');
    showGalleryState(link, false);
    if (event.detail === 0) {{
      const open = card.querySelector('.open-preview');
      open.focus({{ preventScroll: true }});
      const bounds = open.getBoundingClientRect();
      if (bounds.top < 0 || bounds.bottom > window.innerHeight) open.scrollIntoView({{ block: 'nearest' }});
    }}
  }});
  document.addEventListener('focusin', event => {{
    const link = event.target.closest('.states a');
    if (link && !previewMode.checked) previewState(link);
  }});
  document.addEventListener('pointerover', event => {{
    const link = event.target.closest('.states a');
    if (event.pointerType === 'mouse' && link && !previewMode.checked) previewState(link);
  }});
  function returnToState() {{
    const pinned = location.hash.startsWith('#preview-state-');
    const id = location.hash.slice(pinned ? '#preview-'.length : 1);
    const link = document.getElementById(id);
    previewMode.checked = Boolean(pinned && link?.matches('.states a'));
    if (link && link.matches('.states a')) {{
      previewState(link);
      link.focus({{ preventScroll: true }});
      showGalleryState(link, true);
    }}
  }}
  previewMode.addEventListener('change', () => {{
    if (!previewMode.checked && location.hash.startsWith('#preview-state-')) {{
      history.replaceState(null, '', '#' + location.hash.slice('#preview-'.length));
    }}
  }});
  window.addEventListener('hashchange', returnToState);
  returnToState();
  themeControl.addEventListener('click', () => {{
    const dark = document.documentElement.dataset.theme !== 'dark';
    const url = new URL(location.href);
    url.searchParams.set('theme', dark ? 'dark' : 'light');
    history.replaceState(history.state, '', url);
    try {{ localStorage.setItem('mock-theme', dark ? 'dark' : 'light'); }} catch {{ /* unavailable */ }}
    setGalleryTheme(dark);
  }});
</script>
</body>
</html>
"""
    (root / "index.html").write_text(html, encoding="utf-8")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("root", nargs="?", default="docs/mocks", type=Path)
    parser.add_argument("--write", action="store_true", help="Regenerate README.md coverage matrix and index.html from the manifest")
    parser.add_argument("--json", action="store_true", help="Emit results as JSON")
    args = parser.parse_args(argv)
    if not args.root.is_dir():
        print(f"error: {args.root} is not a directory", file=sys.stderr)
        return 2
    try:
        errors, warnings, data = run_checks(args.root)
    except (FileNotFoundError, ValueError, json.JSONDecodeError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2
    if args.write:
        write_readme(args.root, data["coverage"], data["manifest"])
        write_index(args.root, data["coverage"], data["manifest"])
        # Re-run so the freshly written index is link-checked too.
        errors, warnings, data = run_checks(args.root)
    if args.json:
        print(json.dumps({"errors": errors, "warnings": warnings, "coverage": data["coverage"]}, indent=2, ensure_ascii=False))
    else:
        for w in warnings:
            print(f"WARN  {w}")
        for e in errors:
            print(f"ERROR {e}")
        screens = sum(len(rows) for rows in data["coverage"].values())
        mocks = sum(1 for rows in data["coverage"].values() for row in rows for i in row["states"].values() if i["status"] == "ok")
        print(f"\n{screens} screens, {mocks} mocks, {len(errors)} errors, {len(warnings)} warnings")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
