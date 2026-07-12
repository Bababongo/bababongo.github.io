/* ============================================================
   Eze Ukabiala — interactions & generative visuals
   ============================================================ */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Ambient molecular network (background canvas) ---------- */
  function initBg() {
    var canvas = document.getElementById("bg-canvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w, h, nodes = [];
    var COUNT;

    function resize() {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      COUNT = Math.round(Math.min(70, Math.max(28, (w * h) / 26000)));
      nodes = [];
      for (var i = 0; i < COUNT; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.18,
          r: Math.random() * 1.6 + 0.6
        });
      }
    }

    var palette = ["92,200,255", "157,124,255", "125,211,168"];
    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }
      // edges
      for (var a = 0; a < nodes.length; a++) {
        for (var b = a + 1; b < nodes.length; b++) {
          var dx = nodes[a].x - nodes[b].x, dy = nodes[a].y - nodes[b].y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < 130) {
            var op = (1 - d / 130) * 0.16;
            ctx.strokeStyle = "rgba(120,160,220," + op + ")";
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(nodes[a].x, nodes[a].y);
            ctx.lineTo(nodes[b].x, nodes[b].y);
            ctx.stroke();
          }
        }
      }
      // nodes
      for (var k = 0; k < nodes.length; k++) {
        var c = palette[k % palette.length];
        ctx.fillStyle = "rgba(" + c + ",0.55)";
        ctx.beginPath();
        ctx.arc(nodes[k].x, nodes[k].y, nodes[k].r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduced) requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    if (reduced) { draw(); } else { requestAnimationFrame(draw); }
  }

  /* ---------- Hero generative visual ---------- */
  function initHeroVisual() {
    var svg = document.getElementById("hero-svg");
    if (!svg) return;
    var NS = "http://www.w3.org/2000/svg";
    var W = 500, H = 500, cx = 250, cy = 250;

    function el(tag, attrs) {
      var e = document.createElementNS(NS, tag);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      return e;
    }

    // defs: gradients
    var defs = el("defs", {});
    defs.innerHTML =
      '<linearGradient id="ribbon" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#5CC8FF"/>' +
      '<stop offset="55%" stop-color="#9D7CFF"/>' +
      '<stop offset="100%" stop-color="#7DD3A8"/></linearGradient>' +
      '<radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0%" stop-color="rgba(92,200,255,0.35)"/>' +
      '<stop offset="100%" stop-color="rgba(92,200,255,0)"/></radialGradient>';
    svg.appendChild(defs);

    // soft concentric rings
    [210, 160, 110].forEach(function (r, i) {
      svg.appendChild(el("circle", {
        cx: cx, cy: cy, r: r, fill: "none",
        stroke: "rgba(255,255,255,0.06)", "stroke-width": 1,
        "stroke-dasharray": i === 1 ? "3 7" : "none"
      }));
    });

    // core glow
    svg.appendChild(el("circle", { cx: cx, cy: cy, r: 120, fill: "url(#coreGlow)" }));

    // ---- Model-to-bench loop: 4 directional arcs (Design / Build / Test / Learn) ----
    var loopR = 212;
    var loopCols = ["#5CC8FF", "#9D7CFF", "#7DD3A8", "#9D7CFF"];
    var stageNames = ["MODEL", "VARIANT", "ASSAY", "DATA"];
    function polar(r, a) { return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
    // arrow marker def
    var mk = document.createElementNS(NS, "marker");
    mk.setAttribute("id", "loopArrow");
    mk.setAttribute("viewBox", "0 0 10 10");
    mk.setAttribute("refX", "5"); mk.setAttribute("refY", "5");
    mk.setAttribute("markerWidth", "5"); mk.setAttribute("markerHeight", "5");
    mk.setAttribute("orient", "auto-start-reverse");
    mk.innerHTML = '<path d="M0 0 L10 5 L0 10 z" fill="#A7B0C0"/>';
    defs.appendChild(mk);

    var gap = 0.28; // radians gap between arcs
    for (var s = 0; s < 4; s++) {
      var a0 = (s / 4) * Math.PI * 2 - Math.PI / 2 + gap / 2;
      var a1 = ((s + 1) / 4) * Math.PI * 2 - Math.PI / 2 - gap / 2;
      var p0 = polar(loopR, a0), p1 = polar(loopR, a1);
      var arc = el("path", {
        d: "M " + p0[0] + " " + p0[1] + " A " + loopR + " " + loopR + " 0 0 1 " + p1[0] + " " + p1[1],
        fill: "none", stroke: loopCols[s], "stroke-width": 2.5,
        "stroke-linecap": "round", opacity: 0.7,
        "marker-end": "url(#loopArrow)"
      });
      svg.appendChild(arc);
      // stage label at arc midpoint
      var am = (a0 + a1) / 2;
      var lp = polar(loopR + 22, am);
      var label = el("text", {
        x: lp[0], y: lp[1], fill: "#A7B0C0",
        "font-family": "'IBM Plex Mono', monospace", "font-size": "11",
        "letter-spacing": "1.5", "text-anchor": "middle", "dominant-baseline": "middle"
      });
      label.textContent = stageNames[s];
      svg.appendChild(label);
    }

    // protein backbone ribbon — a smooth winding bezier
    var ribbon = el("path", {
      d: "M 70 320 C 150 250, 130 150, 230 160 S 380 240, 340 320 S 200 410, 270 430 C 330 446, 410 400, 430 330",
      fill: "none", stroke: "url(#ribbon)", "stroke-width": 3.5,
      "stroke-linecap": "round", opacity: 0.95,
      "stroke-dasharray": 1200, "stroke-dashoffset": 1200
    });
    svg.appendChild(ribbon);
    // animate ribbon draw
    if (!reduced) {
      ribbon.style.transition = "stroke-dashoffset 3.2s cubic-bezier(0.22,1,0.36,1)";
      setTimeout(function () { ribbon.setAttribute("stroke-dashoffset", "0"); }, 250);
    } else { ribbon.setAttribute("stroke-dashoffset", "0"); }

    // helical node cluster around a circle
    var hnodes = [];
    var N = 13;
    for (var i = 0; i < N; i++) {
      var ang = (i / N) * Math.PI * 2;
      var rad = 150 + Math.sin(i * 1.7) * 22;
      var x = cx + Math.cos(ang) * rad;
      var y = cy + Math.sin(ang) * rad;
      hnodes.push({ x: x, y: y });
    }
    // connect ring nodes
    for (var j = 0; j < hnodes.length; j++) {
      var nx = hnodes[(j + 1) % hnodes.length];
      svg.appendChild(el("line", {
        x1: hnodes[j].x, y1: hnodes[j].y, x2: nx.x, y2: nx.y,
        stroke: "rgba(157,124,255,0.25)", "stroke-width": 1
      }));
    }
    var cols = ["#5CC8FF", "#9D7CFF", "#7DD3A8"];
    hnodes.forEach(function (n, idx) {
      var g = el("circle", {
        cx: n.x, cy: n.y, r: 4.5, fill: cols[idx % 3],
        opacity: 0.9
      });
      if (!reduced) {
        var an = el("animate", {
          attributeName: "r", values: "4.5;6.5;4.5",
          dur: (2.4 + (idx % 4) * 0.4) + "s", repeatCount: "indefinite"
        });
        g.appendChild(an);
      }
      svg.appendChild(g);
    });

    // central sequence grid (small squares)
    var grid = el("g", { opacity: 0.85 });
    var gx = cx - 36, gy = cy - 36, cell = 14, gap = 4;
    for (var r = 0; r < 5; r++) {
      for (var cc = 0; cc < 5; cc++) {
        var lit = Math.random() > 0.62;
        grid.appendChild(el("rect", {
          x: gx + cc * (cell + gap), y: gy + r * (cell + gap),
          width: cell, height: cell, rx: 3,
          fill: lit ? cols[(r + cc) % 3] : "rgba(255,255,255,0.06)",
          opacity: lit ? 0.85 : 1
        }));
      }
    }
    svg.appendChild(grid);

    // slow rotation of the whole node ring group is faked by animating dashoffsets; keep static for crispness
  }

  /* ---------- Nav: scroll state, scrollspy, mobile ---------- */
  function initNav() {
    var nav = document.querySelector(".nav");
    var links = Array.prototype.slice.call(document.querySelectorAll(".nav-links a"));
    var sections = links.map(function (l) {
      return document.querySelector(l.getAttribute("href"));
    });

    function onScroll() {
      if (window.scrollY > 24) nav.classList.add("scrolled");
      else nav.classList.remove("scrolled");

      var pos = window.scrollY + 140;
      var current = -1;
      for (var i = 0; i < sections.length; i++) {
        if (sections[i] && sections[i].offsetTop <= pos) current = i;
      }
      links.forEach(function (l, i) { l.classList.toggle("active", i === current); });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // mobile menu
    var toggle = document.querySelector(".nav-toggle");
    var menu = document.querySelector(".mobile-menu");
    var backdrop = document.querySelector(".mobile-backdrop");
    function setMenu(open) {
      toggle.classList.toggle("open", open);
      menu.classList.toggle("open", open);
      backdrop.classList.toggle("show", open);
      document.body.style.overflow = open ? "hidden" : "";
    }
    toggle.addEventListener("click", function () { setMenu(!menu.classList.contains("open")); });
    backdrop.addEventListener("click", function () { setMenu(false); });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealIO = null;
  function setupReveal() {
    var els = document.querySelectorAll(".reveal");
    if (reduced) {
      els.forEach(function (e) { e.classList.add("in"); });
      return;
    }

    // Manual viewport check — primary mechanism in case IntersectionObserver
    // misfires (e.g. elements were laid out 0×0 behind a splash/loader overlay
    // during initial setup).
    function manualCheck() {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      els.forEach(function (e) {
        if (e.classList.contains("in")) return;
        var r = e.getBoundingClientRect();
        if (r.bottom > 0 && r.top < vh * 0.92) {
          e.classList.add("in");
          if (revealIO) { try { revealIO.unobserve(e); } catch (_) {} }
        }
      });
    }

    if ("IntersectionObserver" in window) {
      revealIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("in"); revealIO.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
      els.forEach(function (e) { revealIO.observe(e); });
    }

    manualCheck();
    requestAnimationFrame(manualCheck);
    setTimeout(manualCheck, 200);
    setTimeout(manualCheck, 800);

    window.addEventListener("load", function () {
      manualCheck();
      setTimeout(manualCheck, 120);
      setTimeout(manualCheck, 600);
    });
    // Listen on multiple scroll roots — depending on page wrapping, the
    // scroll container can be window, html, or body.
    var onScroll = function () { manualCheck(); };
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", manualCheck);
    window.addEventListener("wheel", onScroll, { passive: true });
    window.addEventListener("touchmove", onScroll, { passive: true });
  }
  function initReveal() { setupReveal(); }

  /* ---------- Project tag filtering ---------- */
  function initFilters() {
    var chips = document.querySelectorAll(".chip-filter");
    var projects = document.querySelectorAll(".project");
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active");
        var f = chip.getAttribute("data-filter");
        projects.forEach(function (p) {
          var tags = (p.getAttribute("data-tags") || "").split(",");
          var show = f === "all" || tags.indexOf(f) !== -1;
          p.classList.toggle("hide", !show);
        });
      });
    });
  }

  /* ---------- Card pointer glow ---------- */
  function initCardGlow() {
    document.querySelectorAll(".card").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - rect.left) + "px");
        card.style.setProperty("--my", (e.clientY - rect.top) + "px");
      });
    });
  }

  function boot() {
    initBg();
    initHeroVisual();
    initNav();
    initReveal();
    initFilters();
    initCardGlow();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
