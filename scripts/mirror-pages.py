#!/usr/bin/env python3
"""Mirror root pages into assets/pages/ for the SuPro iframe.

The upstream sync publishes index.html plus the whole assets/ tree, so a
click on shengping.html inside the iframe 404s. These copies live under
assets/pages/, rewrite asset URLs one level up, and link to each other.
"""
from __future__ import annotations

import filecmp
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "pages"
SKIP = {"404.html", "offline.html"}


def pages() -> list[Path]:
    return sorted(p for p in ROOT.glob("*.html") if p.name not in SKIP)


def rewrite(html: str) -> str:
    html = html.replace('href="assets/', 'href="../')
    html = html.replace('src="assets/', 'src="../')
    html = html.replace('srcset="assets/', 'srcset="../')
    html = html.replace('href="manifest.webmanifest"', 'href="../../manifest.webmanifest"')
    return html


def build(dest: Path) -> None:
    dest.mkdir(parents=True, exist_ok=True)
    for page in pages():
        (dest / page.name).write_text(rewrite(page.read_text(encoding="utf-8")), encoding="utf-8")


def main() -> None:
    check = "--check" in sys.argv
    if not check:
        build(OUT)
        print(f"mirrored {len(list(pages()))} pages -> assets/pages/")
        return
    with tempfile.TemporaryDirectory() as tmp:
        build(Path(tmp))
        missing = []
        for page in pages():
            live = OUT / page.name
            fresh = Path(tmp) / page.name
            if not live.exists() or not filecmp.cmp(live, fresh, shallow=False):
                missing.append(page.name)
        if missing:
            print("mirror stale:", ", ".join(missing))
            sys.exit(1)
    print("mirror fresh")


if __name__ == "__main__":
    main()
