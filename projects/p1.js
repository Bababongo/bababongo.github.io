/* ============================================================
   P1 · data-efficiency curves - case-study interactions + figures
   Self-contained. Reuses the site's visual identity (../styles.css)
   and the shared case-study layer (p0.css).
   ============================================================ */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg";

  /* ---------- Repository link (single fill-in point) ----------
     P1 lives in its own public repo. This follows the P0 naming
     pattern (github.com/Bababongo/p0-zero-shot-fitness). If the
     real P1 repo slug differs, update P1_REPO below; an empty
     string leaves the two "View repository" buttons inert. */
  var P1_REPO = "https://github.com/Bababongo/p1-data-efficiency";
  function wireRepo() {
    var els = document.querySelectorAll("[data-repo-href]");
    for (var i = 0; i < els.length; i++) {
      var a = els[i];
      if (P1_REPO) {
        a.setAttribute("href", P1_REPO);
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
        a.classList.remove("link-pending");
      } else {
        a.classList.add("link-pending");
        if (a.getAttribute("href") === "#" || a.getAttribute("href") === null) {
          a.addEventListener("click", function (e) { e.preventDefault(); });
        }
      }
    }
  }

  var C = {
    cyan: "#5CC8FF", cyanDim: "#3d8fc0", amber: "#E6A552",
    violet: "#9D7CFF", green: "#7DD3A8", gray: "#6B7689",
    text: "#F5F7FA", text2: "#A7B0C0", text3: "#6B7689"
  };
  function f3(v) { return v.toFixed(3); }
  function sdel(v) { return (v >= 0 ? "+" : "") + v.toFixed(3); }
  function el(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function txt(x, y, s, cls, anchor) {
    var t = el("text", { x: x, y: y, "text-anchor": anchor || "start" });
    if (cls) t.setAttribute("class", cls);
    t.textContent = s;
    return t;
  }
  function wrapLabel(s, max) {
    var words = s.split(" "), lines = [], cur = "";
    words.forEach(function (w) {
      if ((cur + " " + w).trim().length > max) { if (cur) lines.push(cur); cur = w; }
      else cur = (cur + " " + w).trim();
    });
    if (cur) lines.push(cur);
    return lines;
  }
  function makeTip(plot) {
    var tip = document.createElement("div");
    tip.className = "fig-tip";
    plot.appendChild(tip);
    return {
      show: function (html, ev) {
        tip.innerHTML = html;
        var r = plot.getBoundingClientRect();
        var x = ev.clientX - r.left, y = ev.clientY - r.top;
        tip.style.left = Math.max(70, Math.min(r.width - 70, x)) + "px";
        tip.style.top = (y - 14) + "px";
        tip.classList.add("show");
      },
      hide: function () { tip.classList.remove("show"); }
    };
  }

  /* ============================================================
     DATA (exact values from the P1 report)
     ============================================================ */

  // Figure 1 - fixture sanity check (tiny label budgets)
  var FIXTURE = {
    budgets: [4, 8, 16, 24],
    zeroShot: 0.677,
    hybrid: [0.159, 0.497, 0.673, 0.757],
    reads: [
      "Too little data; supervised model unstable.",
      "Learning begins but does not beat zero-shot.",
      "Hybrid catches up.",
      "Hybrid passes zero-shot."
    ]
  };

  // Figure 2 - real P0 inputs at 384 labels (grouped bars: zs / property / true ESM)
  var MAIN384 = [
    { ds: "TEM-1", sel: "random",        zs: 0.559, mech: 0.590, prop: 0.606, esm: 0.622 },
    { ds: "TEM-1", sel: "score_diverse", zs: 0.559, mech: null,  prop: 0.597, esm: 0.612 },
    { ds: "VIM-2", sel: "random",        zs: 0.418, mech: 0.491, prop: 0.510, esm: 0.513 },
    { ds: "VIM-2", sel: "score_diverse", zs: 0.418, mech: null,  prop: 0.513, esm: 0.515 }
  ];

  // Figure 3 Panel B - mechanism-slice result at 384 labels
  var MECHSLICE = [
    { ds: "TEM-1", region: "all",                        sel: "random",             delta: 0.064, val: 0.622 },
    { ds: "TEM-1", region: "active-site neighborhood",   sel: "mechanism_enriched", delta: 0.050, val: 0.738 },
    { ds: "TEM-1", region: "binding pocket",             sel: "mechanism_enriched", delta: 0.153, val: 0.759 },
    { ds: "VIM-2", region: "all",                        sel: "score_diverse",      delta: 0.097, val: 0.515 },
    { ds: "VIM-2", region: "active site",                sel: "mechanism_balanced", delta: 0.154, val: 0.516 },
    { ds: "VIM-2", region: "active-site neighborhood",   sel: "mechanism_enriched", delta: 0.083, val: 0.653 }
  ];

  // Figure 4 - iterative acquisition (ranked, diversity vs naive model-guided)
  var ACQ = [
    { ds: "TEM-1", strat: "random",               s: 0.632, topk: 1.881, kind: "div" },
    { ds: "TEM-1", strat: "score_diverse",        s: 0.627, topk: 1.841, kind: "div" },
    { ds: "TEM-1", strat: "mechanism_balanced",   s: 0.595, topk: 1.806, kind: "mech" },
    { ds: "TEM-1", strat: "model_top",            s: 0.505, topk: 1.786, kind: "naive" },
    { ds: "TEM-1", strat: "mechanism_model_top",  s: 0.490, topk: 1.638, kind: "naive" },
    { ds: "VIM-2", strat: "random",               s: 0.523, topk: 1.714, kind: "div" },
    { ds: "VIM-2", strat: "score_diverse",        s: 0.522, topk: 1.546, kind: "div" },
    { ds: "VIM-2", strat: "mechanism_balanced",   s: 0.469, topk: 1.534, kind: "mech" },
    { ds: "VIM-2", strat: "model_top",            s: 0.364, topk: 1.424, kind: "naive" },
    { ds: "VIM-2", strat: "mechanism_model_top",  s: 0.307, topk: 1.068, kind: "naive" }
  ];
  function acqColor(kind) { return kind === "div" ? C.cyan : (kind === "mech" ? C.amber : C.gray); }

  /* ============================================================
     FIGURE 1 - fixture line chart
     ============================================================ */
  function renderFixture(plot) {
    var tip = makeTip(plot);
    var W = 680, H = 360, mL = 74, mR = 120, mT = 26, mB = 58;
    var pw = W - mL - mR, ph = H - mT - mB;
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H });
    var g = el("g", {}); svg.appendChild(g);
    var yMax = 0.8, yTicks = [0, 0.2, 0.4, 0.6, 0.8];
    var n = FIXTURE.budgets.length;
    function yPix(v) { return mT + ph - (v / yMax) * ph; }
    function xPix(i) { return mL + (n === 1 ? pw / 2 : (i / (n - 1)) * pw); }

    yTicks.forEach(function (t) {
      var y = yPix(t);
      g.appendChild(el("line", { class: "grid-line", x1: mL, y1: y, x2: mL + pw, y2: y }));
      g.appendChild(txt(mL - 12, y + 4, t.toFixed(1), "tick-label tnum", "end"));
    });
    g.appendChild(el("line", { class: "axis-line", x1: mL, y1: mT, x2: mL, y2: mT + ph }));
    g.appendChild(el("line", { class: "axis-line", x1: mL, y1: mT + ph, x2: mL + pw, y2: mT + ph }));

    // x ticks (budgets)
    FIXTURE.budgets.forEach(function (b, i) {
      g.appendChild(txt(xPix(i), mT + ph + 22, String(b), "tick-label tnum", "middle"));
    });
    g.appendChild(txt(mL + pw / 2, H - 8, "Measured label budget", "axis-title", "middle"));
    var yt = txt(0, 0, "Spearman correlation", "axis-title", "middle");
    yt.setAttribute("transform", "translate(18," + (mT + ph / 2) + ") rotate(-90)");
    g.appendChild(yt);

    // zero-shot reference (flat, dashed gray)
    var yZs = yPix(FIXTURE.zeroShot);
    g.appendChild(el("line", { class: "zs-line", x1: mL, y1: yZs, x2: mL + pw, y2: yZs }));
    g.appendChild(txt(mL + pw + 12, yZs + 4, "zero-shot", "delta-label", "start")).setAttribute("fill", C.gray);
    g.appendChild(txt(mL + pw + 12, yZs + 18, f3(FIXTURE.zeroShot), "delta-label", "start")).setAttribute("fill", C.gray);

    // hybrid line
    var d = "";
    FIXTURE.hybrid.forEach(function (v, i) { d += (i ? " L " : "M ") + xPix(i) + " " + yPix(v); });
    g.appendChild(el("path", { class: "hy-line", d: d }));
    // crossover shading note (hybrid passes zero-shot at last point)
    FIXTURE.hybrid.forEach(function (v, i) {
      var cx = xPix(i), cy = yPix(v);
      var row = el("g", { class: "plot-row" });
      row.appendChild(el("circle", { class: "hy-dot", cx: cx, cy: cy, r: 5 }));
      row.appendChild(txt(cx, cy - 12, f3(v), "bar-val", "middle"));
      g.appendChild(row);
      row.style.cursor = "default";
      (function (i) {
        row.addEventListener("mousemove", function (ev) {
          tip.show('<div>budget ' + FIXTURE.budgets[i] + ' labels</div>' +
            '<div><span class="tt-k">hybrid</span> <span class="tt-v">' + f3(FIXTURE.hybrid[i]) + '</span></div>' +
            '<div><span class="tt-k">zero-shot</span> ' + f3(FIXTURE.zeroShot) + '</div>' +
            '<div>' + FIXTURE.reads[i] + '</div>', ev);
        });
      })(i);
      row.addEventListener("mouseleave", function () { tip.hide(); });
    });
    // marker: hybrid label at end
    g.appendChild(txt(mL + pw + 12, yPix(FIXTURE.hybrid[n - 1]) + 4, "hybrid", "delta-label", "start")).setAttribute("fill", C.cyan);
    plot.appendChild(svg);
  }

  /* ============================================================
     FIGURE 2 - grouped bars at 384 labels
     ============================================================ */
  function renderGrouped(plot) {
    var tip = makeTip(plot);
    var W = 680, H = 388, mL = 74, mR = 20, mT = 26, mB = 70;
    var pw = W - mL - mR, ph = H - mT - mB;
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H });
    var g = el("g", {}); svg.appendChild(g);
    var yMax = 0.7, yTicks = [0, 0.2, 0.4, 0.6];
    function yPix(v) { return mT + ph - (v / yMax) * ph; }
    yTicks.forEach(function (t) {
      var y = yPix(t);
      g.appendChild(el("line", { class: "grid-line", x1: mL, y1: y, x2: mL + pw, y2: y }));
      g.appendChild(txt(mL - 12, y + 4, t.toFixed(1), "tick-label tnum", "end"));
    });
    g.appendChild(el("line", { class: "axis-line", x1: mL, y1: mT, x2: mL, y2: mT + ph }));
    g.appendChild(el("line", { class: "axis-line", x1: mL, y1: mT + ph, x2: mL + pw, y2: mT + ph }));
    var yt = txt(0, 0, "Spearman", "axis-title", "middle");
    yt.setAttribute("transform", "translate(18," + (mT + ph / 2) + ") rotate(-90)");
    g.appendChild(yt);

    var series = [
      { k: "zs", name: "zero-shot", color: C.gray },
      { k: "prop", name: "residual + property", color: C.cyanDim },
      { k: "esm", name: "residual + true ESM", color: C.cyan }
    ];
    var nG = MAIN384.length, band = pw / nG, bw = Math.min(26, (band * 0.62) / 3);
    MAIN384.forEach(function (d, gi) {
      var gx = mL + band * (gi + 0.5);
      var start = gx - (bw * 3 + 8) / 2;
      series.forEach(function (s, si) {
        var v = d[s.k]; if (v == null) return;
        var x = start + si * (bw + 4);
        var y = yPix(v), h = mT + ph - y;
        var row = el("g", { class: "plot-row" });
        row.appendChild(el("rect", { class: "bar-rect", x: x, y: y, width: bw, height: Math.max(0, h), rx: 3, fill: s.color }));
        row.appendChild(txt(x + bw / 2, y - 7, f3(v), "bar-val", "middle")).setAttribute("font-size", "10.5");
        g.appendChild(row);
        row.style.cursor = "default";
        row.addEventListener("mousemove", function (ev) {
          tip.show('<div>' + d.ds + ' · ' + d.sel + '</div>' +
            '<div><span class="tt-k">' + s.name + '</span> <span class="tt-v">' + f3(v) + '</span></div>' +
            (d.mech != null ? '<div><span class="tt-k">residual mechanism</span> ' + f3(d.mech) + '</div>' : '') +
            '<div><span class="tt-k">vs zero-shot</span> ' + sdel(v - d.zs) + '</div>', ev);
        });
        row.addEventListener("mouseleave", function () { tip.hide(); });
      });
      // group labels
      g.appendChild(txt(gx, mT + ph + 22, d.ds, "grp-label", "middle"));
      g.appendChild(txt(gx, mT + ph + 38, d.sel, "grp-sub", "middle"));
    });
    g.appendChild(txt(mL + pw / 2, H - 6, "Dataset · label-selection strategy", "axis-title", "middle"));
    plot.appendChild(svg);
  }

  /* ============================================================
     FIGURE 3B - mechanism-slice horizontal bars
     ============================================================ */
  function renderMechSlice(plot) {
    var tip = makeTip(plot);
    var W = 720, mL = 258, mR = 96, mT = 12, mB = 46;
    var rowH = 46, gap = 9;
    var n = MECHSLICE.length, ph = n * rowH, H = mT + ph + mB, pw = W - mL - mR;
    var xMax = 0.8, xticks = [0, 0.2, 0.4, 0.6, 0.8];
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H });
    var g = el("g", {}); svg.appendChild(g);
    function xPix(v) { return mL + (v / xMax) * pw; }
    xticks.forEach(function (t) {
      var x = xPix(t);
      g.appendChild(el("line", { class: "grid-line", x1: x, y1: mT, x2: x, y2: mT + ph }));
      g.appendChild(txt(x, mT + ph + 20, t.toFixed(1), "tick-label tnum", "middle"));
    });
    g.appendChild(el("line", { class: "axis-line", x1: mL, y1: mT, x2: mL, y2: mT + ph }));
    g.appendChild(txt(mL + pw / 2, H - 8, "Mean Spearman correlation (best selection per region)", "axis-title", "middle"));

    MECHSLICE.forEach(function (d, i) {
      var cy = mT + rowH * i + rowH / 2;
      var barH = rowH - gap * 2;
      var color = C.amber;
      var row = el("g", { class: "plot-row" });
      row.appendChild(el("rect", { x: mL, y: cy - barH / 2, width: pw, height: barH, rx: 3, fill: "rgba(255,255,255,0.02)" }));
      row.appendChild(el("rect", { class: "bar-rect", x: mL, y: cy - barH / 2, width: Math.max(1, xPix(d.val) - mL), height: barH, rx: 3, fill: color, "fill-opacity": d.region === "all" ? 0.55 : 0.88 }));
      // labels: dataset + region (left)
      var name = d.ds + " · " + d.region;
      var parts = wrapLabel(name, 30);
      parts.forEach(function (ln, li) {
        row.appendChild(txt(mL - 14, cy + 3 - (parts.length - 1) * 7 + li * 13, ln, "cat-label", "end"));
      });
      row.appendChild(txt(mL - 14, cy + 3 + (parts.length) * 7 + 4, d.sel, "grp-sub", "end"));
      // value + delta (right)
      row.appendChild(txt(W - 8, cy - 2, f3(d.val), "bar-val", "end"));
      row.appendChild(txt(W - 8, cy + 13, sdel(d.delta), "delta-label", "end"));
      g.appendChild(row);
      row.style.cursor = "default";
      row.addEventListener("mousemove", function (ev) {
        tip.show('<div>' + d.ds + ' · ' + d.region + '</div>' +
          '<div><span class="tt-k">mean Spearman</span> <span class="tt-v">' + f3(d.val) + '</span></div>' +
          '<div><span class="tt-k">delta vs zero-shot</span> <span style="color:' + C.green + '">' + sdel(d.delta) + '</span></div>' +
          '<div><span class="tt-k">best selection</span> ' + d.sel + '</div>', ev);
      });
      row.addEventListener("mouseleave", function () { tip.hide(); });
    });
    plot.appendChild(svg);
  }

  /* ============================================================
     FIGURE 4 - iterative acquisition ranked bars (grouped by dataset)
     ============================================================ */
  function renderAcq(plot) {
    var tip = makeTip(plot);
    var W = 720, mL = 214, mR = 108, mT = 26, mB = 46;
    var rowH = 34, groupGap = 30;
    var svg;
    var n = ACQ.length, ph = n * rowH + groupGap, H = mT + ph + mB, pw = W - mL - mR;
    var xMax = 0.7, xticks = [0, 0.2, 0.4, 0.6];
    svg = el("svg", { viewBox: "0 0 " + W + " " + H });
    var g = el("g", {}); svg.appendChild(g);
    function xPix(v) { return mL + (v / xMax) * pw; }
    xticks.forEach(function (t) {
      var x = xPix(t);
      g.appendChild(el("line", { class: "grid-line", x1: x, y1: mT, x2: x, y2: mT + ph }));
      g.appendChild(txt(x, mT + ph + 20, t.toFixed(1), "tick-label tnum", "middle"));
    });
    g.appendChild(el("line", { class: "axis-line", x1: mL, y1: mT, x2: mL, y2: mT + ph }));
    g.appendChild(txt(mL + pw / 2, H - 8, "Spearman correlation on held-out mutations", "axis-title", "middle"));

    var yOff = mT, lastDs = null;
    ACQ.forEach(function (d, i) {
      if (lastDs !== null && d.ds !== lastDs) yOff += groupGap;
      lastDs = d.ds;
      var cy = yOff + rowH / 2;
      var barH = rowH - 12;
      var color = acqColor(d.kind);
      var row = el("g", { class: "plot-row" });
      row.appendChild(el("rect", { x: mL, y: cy - barH / 2, width: pw, height: barH, rx: 3, fill: "rgba(255,255,255,0.02)" }));
      row.appendChild(el("rect", { class: "bar-rect", x: mL, y: cy - barH / 2, width: Math.max(1, xPix(d.s) - mL), height: barH, rx: 3, fill: color, "fill-opacity": d.kind === "naive" ? 0.5 : 0.85 }));
      // dataset tag at group start
      if (i === 0 || ACQ[i - 1].ds !== d.ds) {
        g.appendChild(txt(mL - 14, cy - rowH / 2 - 6, d.ds, "panel-tag", "start")).setAttribute("style", "fill:" + C.text3 + ";font-family:var(--font-mono);font-size:10px;letter-spacing:0.12em;text-transform:uppercase");
      }
      row.appendChild(txt(mL - 14, cy + 4, d.strat, "cat-label", "end"));
      row.appendChild(txt(W - 8, cy - 2, f3(d.s), "bar-val", "end"));
      row.appendChild(txt(W - 8, cy + 12, "top-k " + d.topk.toFixed(3), "n-label", "end"));
      g.appendChild(row);
      row.style.cursor = "default";
      row.addEventListener("mousemove", function (ev) {
        tip.show('<div>' + d.ds + ' · ' + d.strat + '</div>' +
          '<div><span class="tt-k">Spearman</span> <span class="tt-v">' + f3(d.s) + '</span></div>' +
          '<div><span class="tt-k">top-k enrichment</span> ' + d.topk.toFixed(3) + '</div>', ev);
      });
      row.addEventListener("mouseleave", function () { tip.hide(); });
      yOff += rowH;
    });
    plot.appendChild(svg);
  }

  /* ============================================================
     BUILD FIGURES
     ============================================================ */
  function buildFigures() {
    var f;
    if ((f = document.querySelector('[data-fig="fixture"]'))) renderFixture(f);
    if ((f = document.querySelector('[data-fig="main384"]'))) renderGrouped(f);
    if ((f = document.querySelector('[data-fig="mechslice"]'))) renderMechSlice(f);
    if ((f = document.querySelector('[data-fig="acq"]'))) renderAcq(f);
  }

  /* ============================================================
     NAV + RAIL scrollspy
     ============================================================ */
  function initNav() {
    var nav = document.querySelector(".nav");
    var railLinks = Array.prototype.slice.call(document.querySelectorAll(".rail a"));
    var sections = railLinks.map(function (l) { return document.querySelector(l.getAttribute("href")); });
    function onScroll() {
      if (window.scrollY > 24) nav.classList.add("scrolled"); else nav.classList.remove("scrolled");
      var pos = window.scrollY + 200, cur = -1;
      for (var i = 0; i < sections.length; i++) {
        if (sections[i] && sections[i].offsetTop <= pos) cur = i;
      }
      railLinks.forEach(function (l, i) { l.classList.toggle("active", i === cur); });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ============================================================
     REVEAL
     ============================================================ */
  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (reduced) { els.forEach(function (e) { e.classList.add("in"); }); return; }
    function check() {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      els.forEach(function (e) {
        if (e.classList.contains("in")) return;
        var r = e.getBoundingClientRect();
        if (r.bottom > 0 && r.top < vh * 0.92) e.classList.add("in");
      });
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
      }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
      els.forEach(function (e) { io.observe(e); });
    }
    check();
    requestAnimationFrame(check);
    setTimeout(check, 200); setTimeout(check, 700);
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    window.addEventListener("load", check);
  }

  /* ============================================================
     AMBIENT BACKGROUND (molecular network) - shared identity
     ============================================================ */
  function initBg() {
    var canvas = document.getElementById("bg-canvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w, h, nodes = [], COUNT;
    function resize() {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      COUNT = Math.round(Math.min(64, Math.max(26, (w * h) / 28000)));
      nodes = [];
      for (var i = 0; i < COUNT; i++) {
        nodes.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.16, vy: (Math.random() - 0.5) * 0.16, r: Math.random() * 1.5 + 0.6 });
      }
    }
    var palette = ["92,200,255", "157,124,255", "125,211,168"];
    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i]; n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }
      for (var a = 0; a < nodes.length; a++) {
        for (var b = a + 1; b < nodes.length; b++) {
          var dx = nodes[a].x - nodes[b].x, dy = nodes[a].y - nodes[b].y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < 128) {
            ctx.strokeStyle = "rgba(120,160,220," + (1 - d / 128) * 0.15 + ")";
            ctx.lineWidth = 0.6;
            ctx.beginPath(); ctx.moveTo(nodes[a].x, nodes[a].y); ctx.lineTo(nodes[b].x, nodes[b].y); ctx.stroke();
          }
        }
      }
      for (var k = 0; k < nodes.length; k++) {
        ctx.fillStyle = "rgba(" + palette[k % palette.length] + ",0.5)";
        ctx.beginPath(); ctx.arc(nodes[k].x, nodes[k].y, nodes[k].r, 0, Math.PI * 2); ctx.fill();
      }
      if (!reduced) requestAnimationFrame(draw);
    }
    resize();
    window.addEventListener("resize", resize);
    if (reduced) draw(); else requestAnimationFrame(draw);
  }

  function boot() {
    wireRepo();
    initBg();
    buildFigures();
    initNav();
    initReveal();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
