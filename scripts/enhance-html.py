#!/usr/bin/env python3
"""Idempotent head/body upgrades for the Su Daxueshi static pages.

Inserts (or refreshes) the SEO block, skip link, night-mode control,
manifest link, and the hero <picture>. Safe to re-run.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://fudan2026.github.io/su-daxueshi/"

# filename -> (breadcrumb label, schema.org type)
PAGES = {
    "index.html": ("首页", "WebSite"),
    "shengping.html": ("生平", "Person"),
    "mingjia.html": ("名家谈东坡", "CollectionPage"),
    "zuopin.html": ("作品精赏", "CollectionPage"),
    "renwu.html": ("人物", "CollectionPage"),
    "shenghuo.html": ("生活", "WebPage"),
    "shuhua.html": ("书画", "WebPage"),
    "minjian.html": ("民间", "WebPage"),
    "jinju.html": ("金句", "CollectionPage"),
    "gaokao.html": ("高考作文", "WebPage"),
    "rensheng.html": ("人生对标", "WebPage"),
    "search.html": ("检索", "SearchResultsPage"),
    "english.html": ("English", "WebPage"),
}


def esc(s: str) -> str:
    return (
        s.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def meta_desc(html: str) -> str:
    m = re.search(r'<meta name="description" content="([^"]*)"', html)
    return m.group(1) if m else "苏大学士 · 每个人心中都有个苏东坡"


def title_of(html: str) -> str:
    m = re.search(r"<title>([^<]*)</title>", html)
    return m.group(1).strip() if m else "苏大学士"


def json_ld(name: str, desc: str, url: str, kind: str, crumb: str, filename: str) -> str:
    import json

    graph = [
        {
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "苏大学士", "item": BASE},
                {"@type": "ListItem", "position": 2, "name": crumb, "item": url},
            ],
        }
    ]
    if kind == "WebSite":
        graph.insert(
            0,
            {
                "@type": "WebSite",
                "name": "苏大学士",
                "alternateName": "Su Daxueshi",
                "url": BASE,
                "description": desc,
                "inLanguage": "zh-CN",
                "potentialAction": {
                    "@type": "SearchAction",
                    "target": BASE + "search.html?q={search_term_string}",
                    "query-input": "required name=search_term_string",
                },
            },
        )
    elif kind == "Person":
        graph.insert(
            0,
            {
                "@type": "Person",
                "name": "苏轼",
                "alternateName": ["苏东坡", "Su Shi", "Su Dongpo"],
                "birthDate": "1037",
                "deathDate": "1101",
                "description": desc,
                "url": url,
                "sameAs": [
                    "https://en.wikipedia.org/wiki/Su_Shi",
                    "https://zh.wikipedia.org/wiki/%E8%8B%8F%E8%BD%BC",
                ],
            },
        )
    else:
        graph.insert(
            0,
            {
                "@type": kind,
                "name": name,
                "description": desc,
                "url": url,
                "inLanguage": "en" if filename == "english.html" else "zh-CN",
                "isPartOf": {"@type": "WebSite", "name": "苏大学士", "url": BASE},
            },
        )
    payload = {"@context": "https://schema.org", "@graph": graph}
    return json.dumps(payload, ensure_ascii=False, separators=(",", ":"))


def seo_block(html: str, filename: str) -> str:
    crumb, kind = PAGES[filename]
    desc = meta_desc(html)
    name = title_of(html)
    url = BASE + filename
    en = BASE + "english.html"
    zh = BASE + ("index.html" if filename == "english.html" else filename)
    return f"""<!-- sudx-meta -->
  <link rel="canonical" href="{url}">
  <link rel="alternate" hreflang="zh-CN" href="{zh}">
  <link rel="alternate" hreflang="en" href="{en}">
  <link rel="alternate" hreflang="x-default" href="{BASE}">
  <meta property="og:title" content="{esc(name)}">
  <meta property="og:description" content="{esc(desc)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{BASE}assets/img/su-shi.jpg">
  <meta property="og:locale" content="{'en_US' if filename == 'english.html' else 'zh_CN'}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{esc(name)}">
  <meta name="twitter:description" content="{esc(desc)}">
  <meta name="twitter:image" content="{BASE}assets/img/su-shi.jpg">
  <meta name="theme-color" content="#f6f1e3">
  <link rel="manifest" href="manifest.webmanifest">
  <link rel="icon" href="assets/img/icon-192.png" type="image/png">
  <script type="application/ld+json">{json_ld(name, desc, url, kind, crumb, filename)}</script>
  <!-- /sudx-meta -->"""


def upsert_meta(html: str, filename: str) -> str:
    block = seo_block(html, filename)
    if "<!-- sudx-meta -->" in html:
        html = re.sub(r"<!-- sudx-meta -->.*?<!-- /sudx-meta -->", block, html, count=1, flags=re.S)
    else:
        html = html.replace("</head>", block + "\n</head>", 1)
    return html


def upsert_body(html: str, filename: str) -> str:
    if 'class="skip"' not in html:
        skip = "Skip to content" if filename == "english.html" else "跳到正文"
        html = html.replace(
            "<body>",
            f'<body>\n  <a class="skip" href="#content">{skip}</a>\n  <div class="progress" id="readProgress" aria-hidden="true"></div>',
            1,
        )
    elif filename == "english.html":
        html = html.replace(">跳到正文</a>", ">Skip to content</a>", 1)
    if 'id="themeToggle"' not in html:
        html = html.replace(
            '<button class="nav-toggle"',
            '<button class="nav-theme" id="themeToggle" type="button" aria-pressed="false" aria-label="切换夜读模式">夜读</button>\n    <button class="nav-toggle"',
            1,
        )
    html = html.replace('<nav class="nav">', '<nav class="nav" aria-label="站点导航">', 1) if 'aria-label="站点导航"' not in html else html
    if 'id="content"' not in html:
        html = html.replace("<main", '<main id="content"', 1)
    if filename != "english.html" and 'href="english.html"' not in html:
        html = html.replace(
            '<p class="fine">',
            '<p class="fine"><a href="english.html">English</a> · ',
            1,
        )
    # hero portrait: picture + dimensions + fetch priority
    old = '<img src="assets/img/su-shi.jpg" alt="苏轼立像（传赵孟頫绘，公有领域）">'
    new = (
        '<picture>'
        '<source srcset="assets/img/su-shi.webp" type="image/webp">'
        '<img src="assets/img/su-shi.jpg" width="750" height="1766" alt="苏轼立像（传赵孟頫绘，公有领域）" fetchpriority="high">'
        "</picture>"
    )
    if old in html:
        html = html.replace(old, new, 1)
    return html


def main() -> None:
    for name in PAGES:
        path = ROOT / name
        if not path.exists():
            print("skip missing", name)
            continue
        html = path.read_text(encoding="utf-8")
        html = upsert_body(html, name)
        html = upsert_meta(html, name)
        path.write_text(html, encoding="utf-8")
        print("enhanced", name)


if __name__ == "__main__":
    main()
