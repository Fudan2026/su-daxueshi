'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const PAGES = [
  'index.html', 'english.html', 'shengping.html', 'mingjia.html', 'zuopin.html',
  'renwu.html', 'shenghuo.html', 'shuhua.html', 'minjian.html', 'jinju.html',
  'gaokao.html', 'rensheng.html', 'search.html',
];

function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

test('every reading page has canonical, description, Open Graph and JSON-LD', () => {
  for (const name of PAGES) {
    const html = read(name);
    assert.match(html, /<title>[^<]+<\/title>/, name);
    assert.match(html, /<meta name="description" content="[^"]+"/, name);
    assert.match(html, new RegExp('rel="canonical" href="https://fudan2026\\.github\\.io/su-daxueshi/' + name + '"'), name);
    assert.match(html, /property="og:title"/, name);
    assert.match(html, /property="og:image"/, name);
    assert.match(html, /application\/ld\+json/, name);
    assert.match(html, /rel="alternate" hreflang="en"/, name);
    assert.match(html, /rel="alternate" hreflang="zh-CN"/, name);
    assert.match(html, /id="content"/, name);
    assert.match(html, /class="skip"/, name);
    assert.match(html, /href="manifest\.webmanifest"|href="\.\.\/\.\.\/manifest\.webmanifest"/, name);
  }
});

test('english page is marked English in JSON-LD and the skip link', () => {
  const html = read('english.html');
  assert.match(html, /"inLanguage":"en"/);
  assert.match(html, /Skip to content/);
});

test('sitemap lists the reading pages and robots points at it', () => {
  const xml = read('sitemap.xml');
  for (const name of PAGES) assert.match(xml, new RegExp(name.replace('.', '\\.')));
  assert.doesNotMatch(xml, /404\.html/);
  assert.match(read('robots.txt'), /sitemap\.xml/);
});

test('internal html links resolve to a file in the repo', () => {
  const files = new Set(fs.readdirSync(ROOT).filter((n) => n.endsWith('.html')));
  for (const name of PAGES) {
    const html = read(name);
    const re = /href="([a-z0-9-]+\.html)/g;
    let m;
    while ((m = re.exec(html))) {
      assert.ok(files.has(m[1]), name + ' links to missing ' + m[1]);
    }
  }
});

test('home portrait offers WebP with dimensions', () => {
  const html = read('index.html');
  assert.match(html, /su-shi\.webp/);
  assert.match(html, /width="750"/);
  assert.match(html, /height="1766"/);
  assert.ok(fs.existsSync(path.join(ROOT, 'assets/img/su-shi.webp')));
});

test('page mirror is fresh and asset paths point one level up', () => {
  const r = spawnSync('python3', ['scripts/mirror-pages.py', '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const mirror = read('assets/pages/zuopin.html');
  assert.match(mirror, /href="\.\.\/css\/style\.css"/);
  assert.match(mirror, /src="\.\.\/js\/main\.js"/);
  assert.doesNotMatch(mirror, /href="assets\//);
  assert.match(mirror, /href="shengping\.html"/);
});

test('pinyin search finds a title from its romanization', () => {
  const context = {
    window: {},
    document: { getElementById: () => null },
    location: { search: '', pathname: '/search.html' },
    URLSearchParams,
    console,
  };
  context.window = context;
  vm.runInNewContext(read('assets/js/search-index.js'), context, { filename: 'search-index.js' });
  vm.runInNewContext(read('assets/js/search.js'), context, { filename: 'search.js' });
  const hit = context.SUDX_SEARCH.basicSearch('dingfengbo');
  assert.ok(hit.some((d) => d.id === 'dingfengbo'), 'pinyin dingfengbo should hit 定风波');
  const fu = context.SUDX_SEARCH.basicSearch('qianchibifu');
  assert.ok(fu.some((d) => d.id === 'chibi'), 'pinyin qianchibifu should hit 前赤壁赋');
});

test('every indexed title carries a pinyin field', () => {
  const context = { window: {} };
  vm.runInNewContext(read('assets/js/search-index.js'), context, { filename: 'search-index.js' });
  const idx = context.window.SUDX_INDEX;
  assert.ok(idx.length >= 60);
  for (const d of idx) {
    assert.ok(d.py && /[a-z]/.test(d.py), 'missing py for ' + d.t);
  }
});

test('embed mode rewrites root links onto the mirrored pages', () => {
  const anchors = [
    { v: 'shengping.html#top', getAttribute() { return this.v; }, setAttribute(k, val) { if (k === 'href') this.v = val; } },
    { v: 'https://example.com/x', getAttribute() { return this.v; }, setAttribute() {} },
    { v: '#here', getAttribute() { return this.v; }, setAttribute() {} },
  ];
  const noopList = { forEach() {} };
  const context = {
    document: {
      body: { classList: { add() {}, toggle() {} } },
      documentElement: { lang: 'zh-CN', scrollHeight: 0 },
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll(sel) { return sel === 'a[href]' ? anchors : noopList; },
    },
    location: { pathname: '/su-daxueshi/app/index.html', hostname: 'supro.si', search: '' },
    navigator: {},
    localStorage: { getItem: () => null, setItem() {} },
    matchMedia: () => ({ matches: false }),
    addEventListener() {},
    scrollY: 0,
    innerHeight: 800,
  };
  context.window = context;
  context.self = context;
  context.top = {};
  vm.runInNewContext(read('assets/js/main.js'), context, { filename: 'main.js' });
  assert.equal(anchors[0].v, 'assets/pages/shengping.html#top');
  assert.equal(anchors[1].v, 'https://example.com/x');
  assert.equal(anchors[2].v, '#here');
});
