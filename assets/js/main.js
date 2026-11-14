/* 苏大学士 · 站点交互
   渐进增强：无脚本时正文、导航链接与检索表单仍然可用。 */
(function () {
  "use strict";

  document.body.classList.add("js");

  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");
  if (toggle && links) {
    toggle.setAttribute("aria-expanded", "false");
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  document.querySelectorAll(".nav-links a").forEach(function (a) {
    var href = a.getAttribute("href") || "";
    var file = href.split("#")[0].split("/").pop();
    var here = (location.pathname.split("/").pop() || "index.html");
    if (file && file === here) a.setAttribute("aria-current", "page");
  });

  /* 夜读：记住选择；未选择时跟随系统。 */
  var themeBtn = document.getElementById("themeToggle");
  function applyTheme(night) {
    document.body.classList.toggle("night", night);
    if (!themeBtn) return;
    var en = (document.documentElement.lang || "").toLowerCase().indexOf("en") === 0;
    themeBtn.textContent = night ? (en ? "Day" : "日读") : (en ? "Night" : "夜读");
    themeBtn.setAttribute("aria-pressed", night ? "true" : "false");
    themeBtn.setAttribute("aria-label", en ? "Toggle night reading" : "切换夜读模式");
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", night ? "#1a1612" : "#f6f1e3");
  }
  var stored = null;
  try { stored = localStorage.getItem("sudx.theme"); } catch (e) { /* private mode */ }
  var preferDark = window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(stored ? stored === "night" : !!preferDark);
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var on = !document.body.classList.contains("night");
      applyTheme(on);
      try { localStorage.setItem("sudx.theme", on ? "night" : "day"); } catch (e) { /* ignore */ }
    });
  }

  /* 阅读进度 */
  var bar = document.getElementById("readProgress");
  if (bar) {
    var onScroll = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + "%";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* 长页目录 */
  var main = document.getElementById("content");
  if (main && !document.getElementById("searchForm")) {
    var heads = main.querySelectorAll("h2");
    if (heads.length >= 3) {
      var toc = document.createElement("nav");
      toc.className = "toc";
      toc.setAttribute("aria-label", "本页目录");
      var ol = document.createElement("ol");
      heads.forEach(function (h, i) {
        if (!h.id) h.id = "s" + (i + 1);
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = "#" + h.id;
        a.textContent = h.textContent;
        li.appendChild(a);
        ol.appendChild(li);
      });
      var label = document.createElement("h2");
      label.textContent = document.documentElement.lang.indexOf("en") === 0 ? "On this page" : "本页目录";
      toc.appendChild(label);
      toc.appendChild(ol);
      var head = main.querySelector(".page-head");
      if (head && head.nextSibling) main.insertBefore(toc, head.nextSibling);
      else main.insertBefore(toc, main.firstChild);
    }
  }

  /* 金句与词作：一键复制 */
  function copyButton(textOf) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-btn";
    btn.textContent = "复制";
    btn.addEventListener("click", function () {
      var text = textOf();
      var done = function () { btn.textContent = "已复制"; setTimeout(function () { btn.textContent = "复制"; }, 1200); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {});
    });
    return btn;
  }
  document.querySelectorAll(".quote-line").forEach(function (line) {
    var q = line.querySelector(".q");
    if (!q) return;
    line.appendChild(copyButton(function () { return q.innerText; }));
  });
  document.querySelectorAll(".poem").forEach(function (poem) {
    var body = poem.querySelector(".body");
    if (!body) return;
    poem.appendChild(copyButton(function () {
      var title = poem.querySelector(".title");
      return (title ? title.innerText + "\n" : "") + body.innerText;
    }));
  });

  /* 滚动渐显 */
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && items.length && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("visible"); });
  }

  /* 作文素材卡：主题筛选 */
  var tags = document.querySelectorAll(".theme-tag");
  var cards = document.querySelectorAll("[data-cat]");
  if (tags.length && cards.length) {
    tags.forEach(function (tag) {
      tag.addEventListener("click", function () {
        var cat = tag.getAttribute("data-theme");
        tags.forEach(function (t) { t.classList.toggle("on", t === tag); });
        cards.forEach(function (card) {
          var show = cat === "all" || card.getAttribute("data-cat") === cat;
          card.style.display = show ? "" : "none";
        });
      });
    });
  }

  /* 嵌入路由：SuPro 的 iframe 只发布了首页。根页面上的站内链接改指
     assets/pages/ 镜像（该目录随 assets/ 整树同步）。镜像页彼此相邻，可正常跳转。 */
  function inFrame() {
    try { return window.self !== window.top; } catch (e) { return true; }
  }
  if (inFrame() && location.pathname.indexOf("/assets/pages/") === -1) {
    document.querySelectorAll("a[href]").forEach(function (a) {
      var href = a.getAttribute("href");
      if (!href || href.charAt(0) === "#" || /^(https?:|mailto:)/i.test(href)) return;
      var m = href.match(/^([A-Za-z0-9-]+\.html)(.*)$/);
      if (m) a.setAttribute("href", "assets/pages/" + m[1] + m[2]);
    });
  }

  /* PWA：只在独立站点注册。iframe 里 sw.js 不在嵌入路径上。 */
  if ("serviceWorker" in navigator && !inFrame()) {
    var host = location.hostname;
    if (/(^|\.)github\.io$/.test(host) || host === "localhost" || host === "127.0.0.1") {
      var path = location.pathname;
      var cut = path.indexOf("/assets/");
      var base = cut >= 0 ? path.slice(0, cut + 1) : path.replace(/[^/]*$/, "");
      navigator.serviceWorker.register(base + "sw.js").catch(function () {});
    }
  }
})();
