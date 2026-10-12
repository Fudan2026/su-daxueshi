/* 苏大学士 · 站内检索
   普通检索：关键词全文检索（标题/关键词/摘录 加权）
   高级检索：体裁/创作时期/栏目/主题 组合筛选 —— 会员功能（Pro 门控）
   门控说明：PRO_ENABLED 为总开关。后续接入 Supabase 账号体系后，
   改为依用户订阅状态解锁即可，检索逻辑无需改动。                  */
(function () {
  "use strict";

  var PRO_ENABLED = false; // 会员功能总开关：账号系统上线后置 true 或改为按用户判断

  var idx = window.SUDX_INDEX || [];
  var CATS = window.SUDX_CATS || {};
  var TYPES = window.SUDX_TYPES || {};
  var ERAS = window.SUDX_ERAS || {};
  var THEMES = window.SUDX_THEMES || {};

  var form = document.getElementById("searchForm");
  var input = document.getElementById("searchInput");
  var results = document.getElementById("searchResults");
  var advToggle = document.getElementById("advToggle");
  var advPanel = document.getElementById("advPanel");
  var proLock = document.getElementById("proLock");
  if (!form || !input || !results) return;

  function esc(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function highlight(text, terms) {
    var out = esc(text);
    terms.slice().sort(function (a, b) { return b.length - a.length; }).forEach(function (term) {
      if (!term) return;
      var safe = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      out = out.replace(new RegExp(safe, "gi"), function (m) { return "<mark>" + m + "</mark>"; });
    });
    return out;
  }

  function termsOf(q) {
    return q.split(/\s+/).map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function docUrl(d) {
    return d.cat + ".html" + (d.id ? "#" + d.id : "");
  }

  function render(list, terms) {
    if (!list.length) {
      results.innerHTML = '<p class="no-result">未检到相关条目。试试更短的关键词，如「黄州」「赤壁」「烟雨」。</p>';
      return;
    }
    var html = '<p class="result-meta">检到 ' + list.length + ' 条 · 点击条目直达原文</p>';
    list.slice(0, 60).forEach(function (d) {
      var badges = '<span class="b">' + (CATS[d.cat] || d.cat) + "</span>";
      if (TYPES[d.type]) badges += '<span class="b">' + TYPES[d.type] + "</span>";
      if (ERAS[d.era]) badges += '<span class="b">' + ERAS[d.era] + "</span>";
      html += '<a class="result-item" href="' + docUrl(d) + '">' +
        "<h3>" + highlight(d.t, terms) + "</h3>" +
        '<div class="badges">' + badges + "</div>" +
        '<p class="ex">' + highlight(d.ex, terms) + "</p></a>";
    });
    results.innerHTML = html;
  }

  /* 普通检索：AND 语义（每个词都须命中）+ 标题/关键词/摘录加权；
     体裁名、创作时期名亦参与匹配（搜"黄州"可命中全部黄州时期作品） */
  function hayOf(d) {
    return (d.t + " " + (d.kw || "") + " " + (d.ex || "") + " " +
            (TYPES[d.type] || "") + " " + (ERAS[d.era] || "")).toLowerCase();
  }
  function basicSearch(q) {
    var terms = termsOf(q);
    if (!terms.length) return [];
    var scored = [];
    idx.forEach(function (d) {
      var score = 0, hits = 0;
      var hay = hayOf(d);
      terms.forEach(function (term) {
        var lt = term.toLowerCase();
        var inT = d.t.toLowerCase().indexOf(lt) !== -1;
        var inK = (d.kw || "").toLowerCase().indexOf(lt) !== -1;
        var inE = (d.ex || "").toLowerCase().indexOf(lt) !== -1;
        if (inT) score += 10;
        if (inK) score += 6;
        if (inE) score += 3;
        if (!inT && !inK && !inE && hay.indexOf(lt) !== -1) score += 1;
        if (inT || inK || inE || hay.indexOf(lt) !== -1) hits++;
      });
      if (hits === terms.length && score > 0) scored.push({ d: d, s: score });
    });
    scored.sort(function (a, b) { return b.s - a.s; });
    return scored.map(function (x) { return x.d; });
  }

  /* 高级检索：筛选维度 + 可选关键词 */
  function advancedSearch(q, f) {
    var terms = termsOf(q || "");
    return idx.filter(function (d) {
      if (f.type && d.type !== f.type) return false;
      if (f.era && d.era !== f.era) return false;
      if (f.cat && d.cat !== f.cat) return false;
      if (f.theme && (d.themes || []).indexOf(f.theme) === -1) return false;
      if (terms.length) {
        var hay = hayOf(d);
        return terms.every(function (term) { return hay.indexOf(term.toLowerCase()) !== -1; });
      }
      return true;
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var q = input.value.trim();
    var useAdv = advPanel && advPanel.classList.contains("open");
    if (useAdv) {
      if (!PRO_ENABLED) {
        proLock.classList.add("show");
        proLock.scrollIntoView({ behavior: "smooth", block: "nearest" });
        return;
      }
      proLock.classList.remove("show");
      var f = {
        type: document.getElementById("advType").value,
        era: document.getElementById("advEra").value,
        cat: document.getElementById("advCat").value,
        theme: document.getElementById("advTheme").value
      };
      render(advancedSearch(q, f), termsOf(q));
    } else {
      proLock.classList.remove("show");
      if (!q) { results.innerHTML = '<p class="no-result">输入关键词开始检索：词牌、篇名、名句、人物、主题皆可。</p>'; return; }
      render(basicSearch(q), termsOf(q));
    }
  });

  if (advToggle && advPanel) {
    advToggle.addEventListener("click", function () {
      advPanel.classList.toggle("open");
      advToggle.textContent = advPanel.classList.contains("open")
        ? "收起高级检索 ▲" : "高级检索 ▼";
    });
  }

  /* 直达：URL ?q= 参数预检（便于从其他页面带词跳入） */
  var preset = new URLSearchParams(location.search).get("q");
  if (preset) {
    input.value = preset;
    render(basicSearch(preset), termsOf(preset));
  }
})();
