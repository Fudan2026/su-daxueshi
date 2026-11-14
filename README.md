# 苏大学士 · 每个人心中都有个苏东坡

以苏东坡为叙事的公益文化站点：生平、名家点评、作品精赏、书画民间、高考作文素材库与人生对标。
纯静态站（HTML/CSS/JS 零构建），GitHub Pages 托管。

[Live](https://fudan2026.github.io/su-daxueshi/) · [English portal](https://fudan2026.github.io/su-daxueshi/english.html) · [在 SuPro 中打开](https://supro.si/su-daxueshi)

> A public-interest digital-humanities site narrated through Su Dongpo (Su Shi): life, master commentary, curated works, calligraphy & folklore, gaokao writing kits, and life parallels. Zero-build static site on GitHub Pages.

## 栏目 · Sections

| 页面 | 内容 |
|---|---|
| `index.html` | 首页：苏东坡立像全屏开场 |
| `shengping.html` | 生平 · 年表、贬谪足迹、乌台诗案 |
| `mingjia.html` | 名家谈东坡（引文注明出处） |
| `zuopin.html` | 作品精赏（原文逐字校对，附题解与赏析） |
| `renwu.html` | 东坡人事（亲友、政敌、知己） |
| `shenghuo.html` | 人间东坡 · 生活志 |
| `shuhua.html` | 翰墨丹青 · 书画志 |
| `minjian.html` | 巷陌东坡 · 民间志（含辨伪坊） |
| `jinju.html` | 金句库（主题筛选，注明出处） |
| `gaokao.html` | 高考作文素材库（SOP + 主题卡 + 真题适配） |
| `rensheng.html` | 人生对标（青年学才、中年学旷、老年学淡） |
| `search.html` | 站内检索（含拼音） |
| `english.html` | English visitor portal |

## 本地预览 · Preview

```bash
python3 -m http.server 8000
# http://localhost:8000
```

镜像刷新（供 SuPro iframe 嵌入使用）：

```bash
node scripts/mirror-pages.mjs
node --test tests/
```

## 部署 · Deploy

推送到 `main` 即由 GitHub Pages 发布。上游 [Fudan2026/supro](https://github.com/Fudan2026/supro) 构建时拉取 `index.html` + 整个 `assets/` 目录树嵌入 `/su-daxueshi`。

## 内容来源与可信度 · Sources & trust

- **原作**：苏轼诗词文赋为公有领域；本站原文经逐字校对。
- **题解 / 赏析 / 人物卡 / 素材卡**：本站原创，CC BY 4.0。
- **名家引文**：评论引用，版权归原作者 / 出版方，条目均标注出处。
- **民间故事**：`minjian.html` 辨伪坊逐条标注可信度（正史 / 笔记 / 传说）。
- **画像**：苏轼立像（传赵孟頫绘），公有领域，[Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Su_shi.jpg)。

详见 [LICENSE](LICENSE)。

## 工程要点 · Engineering

- 渐进增强：无 JS 时全部内容可读；动效尊重 `prefers-reduced-motion`。
- PWA：`manifest.webmanifest` + `sw.js`（iframe 嵌入态静默跳过注册）。
- 嵌入修复：根页面镜像至 `assets/pages/`，`main.js` 在父页缺失目标时做客户端路由，修复 SuPro iframe 断链。
- 无障碍：跳转正文、语义地标、夜读模式、对比度审计（目标 WCAG 2.1 AA）。
- 2026-11-14 移动端 Lighthouse（首页）：性能 100、无障碍 100、最佳实践 100、SEO 100。记录见 `docs/lighthouse-mobile-2026-11-14.json`。
