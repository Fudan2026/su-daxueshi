/* 苏大学士 · 站点交互 */
(function () {
  "use strict";

  document.body.classList.add("js");

  // 移动端菜单
  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      links.classList.toggle("open");
    });
  }

  // 滚动渐显
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && items.length) {
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

  // 作文素材卡：主题筛选
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
})();
