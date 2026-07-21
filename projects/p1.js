/* ============================================================
   P1 · same-assay data-budget rule - case-study interactions + figures
   Self-contained. Reuses the site's visual identity (../styles.css)
   and the shared case-study layer (p0.css).

   Semantic accents:
     cyan   = measurement, model evaluation, assay truth
     amber  = enzyme chemistry, biological constraint, caution
     violet = campaign logic, human judgment
     gray   = priors, uncertainty, controls, unmeasured claims
     green  = validated / positive same-assay result
   ============================================================ */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg";

  var C = {
    cyan: "#5CC8FF", cyanDim: "#3d8fc0", amber: "#E6A552",
    violet: "#9D7CFF", green: "#7DD3A8", gray: "#6B7689",
    red: "#E0736B",
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
     DATA (exact values from the final P1 report)
     ============================================================ */

  // Centerpiece 2 - donor-breadth curve at a fixed 500-label budget
  var BREADTH = {
    pts: [
      { d: 1,  g: 0.016, lo: -0.005, hi: 0.037 },
      { d: 2,  g: 0.068 },
      { d: 4,  g: 0.115 },
      { d: 8,  g: 0.145 },
      { d: 19, g: 0.152, lo: 0.130, hi: 0.174 }
    ]
  };

  // Centerpiece 4 - combined evidence: absolute mean Spearman
  var COMBINED = [
    { name: "target-only",       v: 0.278, color: C.gray },
    { name: "pooled, 20 donors", v: 0.445, color: C.cyan }
  ];

  // Centerpiece 5 - 33-cell budget map. rows = total donor labels; cols = donor proteins.
  var BUDGET = {
    donors: [1, 4, 8, 20],
    labels: ["100", "500", "1,000"],
    grids: [
      { t: "8 target labels",  rows: [[0.078, 0.091, 0.061, 0.068], [0.062, 0.186, 0.220, 0.231], [null, 0.195, 0.238, 0.254]] },
      { t: "16 target labels", rows: [[0.043, 0.047, 0.029, 0.033], [0.031, 0.131, 0.157, 0.167], [null, 0.140, 0.169, 0.184]], ref: [1, 3] },
      { t: "24 target labels", rows: [[0.028, 0.015, 0.007, 0.000], [0.021, 0.105, 0.119, 0.122], [null, 0.113, 0.130, 0.138]] }
    ]
  };
  function budgetColor(v) {
    if (v < 0.006) return { c: C.red, op: 0.85 };
    if (v < 0.055) return { c: C.amber, op: 0.58 };
    var t = Math.min(1, (v - 0.055) / (0.254 - 0.055));
    return { c: C.green, op: 0.30 + t * 0.52 };
  }

  /* ============================================================
     FIGURE - donor-breadth line chart (fixed 500-label budget)
     ============================================================ */
  function renderBreadth(plot) {
    var tip = makeTip(plot);
    var W = 680, H = 372, mL = 78, mR = 116, mT = 28, mB = 62;
    var pw = W - mL - mR, ph = H - mT - mB;
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H });
    var g = el("g", {}); svg.appendChild(g);
    var yMax = 0.18, yTicks = [0, 0.04, 0.08, 0.12, 0.16];
    var pts = BREADTH.pts, n = pts.length;
    function yPix(v) { return mT + ph - (v / yMax) * ph; }
    function xPix(i) { return mL + (i / (n - 1)) * pw; }

    yTicks.forEach(function (t) {
      var y = yPix(t);
      g.appendChild(el("line", { class: "grid-line", x1: mL, y1: y, x2: mL + pw, y2: y }));
      g.appendChild(txt(mL - 12, y + 4, sdel(t), "tick-label tnum", "end"));
    });
    g.appendChild(el("line", { class: "axis-line", x1: mL, y1: mT, x2: mL, y2: mT + ph }));
    g.appendChild(el("line", { class: "axis-line", x1: mL, y1: mT + ph, x2: mL + pw, y2: mT + ph }));

    pts.forEach(function (p, i) {
      g.appendChild(txt(xPix(i), mT + ph + 22, String(p.d), "tick-label tnum", "middle"));
    });
    g.appendChild(txt(mL + pw / 2, H - 8, "Number of donor proteins (total donor labels fixed at 500)", "axis-title", "middle"));
    var yt = txt(0, 0, "Mean Spearman gain", "axis-title", "middle");
    yt.setAttribute("transform", "translate(20," + (mT + ph / 2) + ") rotate(-90)");
    g.appendChild(yt);

    // plateau shading after 8 donors
    var xPlateau = xPix(3);
    g.appendChild(el("rect", { x: xPlateau, y: mT, width: mL + pw - xPlateau, height: ph, fill: "rgba(125,211,168,0.05)" }));
    g.appendChild(txt(xPlateau + 8, mT + 16, "plateau", "win-note", "start"));

    // line
    var d = "";
    pts.forEach(function (p, i) { d += (i ? " L " : "M ") + xPix(i) + " " + yPix(p.g); });
    g.appendChild(el("path", { class: "hy-line", d: d }));

    // CI whiskers at endpoints
    pts.forEach(function (p, i) {
      if (p.lo == null) return;
      var cx = xPix(i);
      g.appendChild(el("line", { class: "ci-line", x1: cx, y1: yPix(p.lo), x2: cx, y2: yPix(p.hi) }));
      g.appendChild(el("line", { class: "ci-cap", x1: cx - 5, y1: yPix(p.lo), x2: cx + 5, y2: yPix(p.lo) }));
      g.appendChild(el("line", { class: "ci-cap", x1: cx - 5, y1: yPix(p.hi), x2: cx + 5, y2: yPix(p.hi) }));
    });

    // dots + value labels
    pts.forEach(function (p, i) {
      var cx = xPix(i), cy = yPix(p.g);
      var row = el("g", { class: "plot-row" });
      row.appendChild(el("circle", { class: "hy-dot", cx: cx, cy: cy, r: 5 }));
      row.appendChild(txt(cx, cy - 13, sdel(p.g), "bar-val", "middle"));
      g.appendChild(row);
      row.style.cursor = "default";
      (function (p) {
        row.addEventListener("mousemove", function (ev) {
          tip.show('<div>' + p.d + ' donor protein' + (p.d === 1 ? '' : 's') + ' &middot; 500 labels</div>' +
            '<div><span class="tt-k">mean gain</span> <span class="tt-v">' + sdel(p.g) + '</span></div>' +
            (p.lo != null ? '<div><span class="tt-k">95% CI</span> ' + sdel(p.lo) + ' to ' + sdel(p.hi) + '</div>' : ''), ev);
        });
      })(p);
      row.addEventListener("mouseleave", function () { tip.hide(); });
    });
    g.appendChild(txt(mL + pw + 12, yPix(pts[n - 1].g) + 4, "19 donors", "delta-label", "start")).setAttribute("fill", C.cyan);
    plot.appendChild(svg);
  }

  /* ============================================================
     FIGURE - combined evidence: absolute mean Spearman bars
     ============================================================ */
  function renderCombined(plot) {
    var tip = makeTip(plot);
    var W = 680, mL = 168, mR = 70, mT = 20, mB = 52;
    var rowH = 74, gap = 26;
    var n = COMBINED.length, ph = n * rowH + (n - 1) * gap, H = mT + ph + mB, pw = W - mL - mR;
    var xMax = 0.5, xticks = [0, 0.1, 0.2, 0.3, 0.4, 0.5];
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H });
    var g = el("g", {}); svg.appendChild(g);
    function xPix(v) { return mL + (v / xMax) * pw; }
    xticks.forEach(function (t) {
      var x = xPix(t);
      g.appendChild(el("line", { class: "grid-line", x1: x, y1: mT, x2: x, y2: mT + ph }));
      g.appendChild(txt(x, mT + ph + 20, t.toFixed(1), "tick-label tnum", "middle"));
    });
    g.appendChild(el("line", { class: "axis-line", x1: mL, y1: mT, x2: mL, y2: mT + ph }));
    g.appendChild(txt(mL + pw / 2, H - 8, "Absolute mean Spearman on held-out mutations", "axis-title", "middle"));

    COMBINED.forEach(function (d, i) {
      var cy = mT + i * (rowH + gap) + rowH / 2;
      var barH = 40;
      var row = el("g", { class: "plot-row" });
      row.appendChild(el("rect", { x: mL, y: cy - barH / 2, width: pw, height: barH, rx: 4, fill: "rgba(255,255,255,0.02)" }));
      row.appendChild(el("rect", { class: "bar-rect", x: mL, y: cy - barH / 2, width: Math.max(1, xPix(d.v) - mL), height: barH, rx: 4, fill: d.color, "fill-opacity": 0.88 }));
      row.appendChild(txt(mL - 14, cy + 4, d.name, "cat-label", "end"));
      row.appendChild(txt(xPix(d.v) + 12, cy + 5, f3(d.v), "bar-val", "start"));
      g.appendChild(row);
      row.style.cursor = "default";
      row.addEventListener("mousemove", function (ev) {
        tip.show('<div>' + d.name + '</div><div><span class="tt-k">absolute mean Spearman</span> <span class="tt-v">' + f3(d.v) + '</span></div>', ev);
      });
      row.addEventListener("mouseleave", function () { tip.hide(); });
    });

    // delta bracket between the two bars
    var x0 = xPix(COMBINED[0].v), x1 = xPix(COMBINED[1].v);
    var y0 = mT + rowH / 2, y1 = mT + (rowH + gap) + rowH / 2;
    var bx = x1 + 34;
    g.appendChild(el("path", { d: "M " + x0 + " " + y0 + " H " + bx + " V " + y1 + " H " + x1, fill: "none", stroke: C.green, "stroke-width": 1.2, "stroke-dasharray": "3 3", opacity: 0.7 }));
    g.appendChild(txt(bx + 8, (y0 + y1) / 2 + 4, "+0.167", "delta-label", "start")).setAttribute("fill", C.green);
    plot.appendChild(svg);
  }

  /* ============================================================
     FIGURE - 33-cell budget-map heatmap (three target-label blocks)
     ============================================================ */
  function renderBudget(plot) {
    var tip = makeTip(plot);
    var W = 760, mL = 66, mR = 10, mT = 54, mB = 46;
    var gap = 24, nG = BUDGET.grids.length, nC = BUDGET.donors.length, nR = BUDGET.labels.length;
    var innerW = W - mL - mR - (nG - 1) * gap;
    var gridW = innerW / nG, cellW = gridW / nC, cellH = 52;
    var gridH = nR * cellH, H = mT + gridH + mB;
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H });
    var g = el("g", {}); svg.appendChild(g);

    // shared row labels (total donor labels)
    BUDGET.labels.forEach(function (lab, r) {
      var cy = mT + r * cellH + cellH / 2;
      g.appendChild(txt(mL - 12, cy + 4, lab, "col-head", "end"));
    });
    var yt = txt(0, 0, "Total donor labels", "axis-title", "middle");
    yt.setAttribute("transform", "translate(16," + (mT + gridH / 2) + ") rotate(-90)");
    g.appendChild(yt);

    BUDGET.grids.forEach(function (grid, gi) {
      var x0 = mL + gi * (gridW + gap);
      g.appendChild(txt(x0 + gridW / 2, 20, grid.t, "grid-title", "middle"));
      // donor-count column headers
      BUDGET.donors.forEach(function (dn, c) {
        g.appendChild(txt(x0 + c * cellW + cellW / 2, mT - 10, String(dn), "col-head", "middle"));
      });
      grid.rows.forEach(function (rowVals, r) {
        rowVals.forEach(function (v, c) {
          var x = x0 + c * cellW, y = mT + r * cellH;
          var row = el("g", { class: "plot-row" });
          if (v == null) {
            row.appendChild(el("rect", { x: x + 3, y: y + 3, width: cellW - 6, height: cellH - 6, rx: 5, fill: "none", stroke: "rgba(255,255,255,0.08)", "stroke-dasharray": "3 4" }));
            row.appendChild(txt(x + cellW / 2, y + cellH / 2 + 4, "\u2014", "cell-val cell-null", "middle"));
          } else {
            var col = budgetColor(v);
            row.appendChild(el("rect", { class: "bar-rect", x: x + 3, y: y + 3, width: cellW - 6, height: cellH - 6, rx: 5, fill: col.c, "fill-opacity": col.op }));
            var isRef = grid.ref && grid.ref[0] === r && grid.ref[1] === c;
            if (isRef) {
              row.appendChild(el("rect", { x: x + 3, y: y + 3, width: cellW - 6, height: cellH - 6, rx: 5, fill: "none", stroke: C.cyan, "stroke-width": 2 }));
              row.appendChild(txt(x + cellW / 2, y + 15, "REF", "col-head", "middle")).setAttribute("fill", C.cyan);
            }
            row.appendChild(txt(x + cellW / 2, y + cellH / 2 + (isRef ? 8 : 4), sdel(v), "cell-val", "middle"));
          }
          g.appendChild(row);
          row.style.cursor = "default";
          (function (v, grid, r, c) {
            row.addEventListener("mousemove", function (ev) {
              tip.show('<div>' + grid.t + '</div>' +
                '<div><span class="tt-k">' + BUDGET.labels[r] + ' donor labels &middot; ' + BUDGET.donors[c] + ' donor' + (BUDGET.donors[c] === 1 ? '' : 's') + '</span></div>' +
                (v == null ? '<div>not feasible</div>' : '<div><span class="tt-k">pooled &minus; target-only</span> <span class="tt-v">' + sdel(v) + '</span></div>'), ev);
            });
          })(v, grid, r, c);
          row.addEventListener("mouseleave", function () { tip.hide(); });
        });
      });
    });
    g.appendChild(txt(mL + innerW / 2 + (nG - 1) * gap / 2, H - 8, "Donor proteins, per target-label block", "axis-title", "middle"));
    plot.appendChild(svg);
  }

  /* ============================================================
     BUILD FIGURES
     ============================================================ */
  function buildFigures() {
    var f;
    if ((f = document.querySelector('[data-fig="breadth"]'))) renderBreadth(f);
    if ((f = document.querySelector('[data-fig="combined"]'))) renderCombined(f);
    if ((f = document.querySelector('[data-fig="budget"]'))) renderBudget(f);
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
          var dd = Math.sqrt(dx * dx + dy * dy);
          if (dd < 128) {
            ctx.strokeStyle = "rgba(120,160,220," + (1 - dd / 128) * 0.15 + ")";
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
    initBg();
    buildFigures();
    initNav();
    initReveal();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
