/* ============================================================
   P0 · mechanism-sliced model-family evaluation
   Self-contained. Reuses the site's visual identity.
   Figures: model-family comparison (ESM-2 / MSA / ProteinMPNN)
   and the VIM-2 ProteinMPNN centerpiece (mechanism-local slices).
   ============================================================ */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg";

  /* ---------- Repository link (single fill-in point) ----------
     Best-guess public repo slug, following the site's GitHub handle
     (github.com/Bababongo). If the real P0 repo slug differs, update
     P0_REPO; an empty string leaves the "View repository" buttons inert. */
  var P0_REPO = "https://github.com/Bababongo/p0-zero-shot-fitness";
  function wireRepo() {
    var els = document.querySelectorAll("[data-repo-href]");
    for (var i = 0; i < els.length; i++) {
      var a = els[i];
      if (P0_REPO) {
        a.setAttribute("href", P0_REPO);
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

  /* ---------- accents ---------- */
  var C = {
    cyan: "#5CC8FF", cyanDim: "#3d8fc0", amber: "#E6A552",
    violet: "#9D7CFF", green: "#7DD3A8", gray: "#6B7689",
    text: "#F5F7FA", text2: "#A7B0C0", text3: "#6B7689"
  };
  function fmt4(v) { return v.toFixed(4); }
  function commas(n) { return n.toLocaleString("en-US"); }
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

  /* ============================================================
     DATA (exact values from the final P0 model-family comparison)
     ============================================================ */

  // Model-family overall Spearman across the four enzymes.
  // ProteinMPNN was run on the three target-aligned structures
  // (VIM-2, AMIE, beta-glucosidase); TEM-1 has no aligned profile yet.
  var FAMILY = [
    { ds: "TEM-1",            esm: 0.5548, msa: 0.4247, mpnn: null   },
    { ds: "VIM-2",            esm: 0.5280, msa: 0.4931, mpnn: 0.6259 },
    { ds: "AMIE",             esm: 0.4082, msa: 0.4306, mpnn: 0.3457 },
    { ds: "Beta-glucosidase", esm: 0.4481, msa: 0.5615, mpnn: 0.3618 }
  ];

  // Centerpiece: VIM-2 ProteinMPNN, read by biological region.
  // Ordered high to low so the mechanism-local drop is a clean staircase.
  var VIM2 = [
    { label: "Overall",                  value: 0.6259, kind: "measure" },
    { label: "Non-metal background",     value: 0.6197, kind: "bg" },
    { label: "Active-site neighborhood", value: 0.5078, kind: "mech" },
    { label: "Metal-site shell",         value: 0.4495, kind: "mech" },
    { label: "Curated metal site",       value: 0.2583, kind: "mechlow" }
  ];

  /* ============================================================
     TOOLTIP
     ============================================================ */
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
     FIGURE - model-family grouped bars (ESM-2 / MSA / ProteinMPNN)
     ============================================================ */
  function renderFamily(plot) {
    var tip = makeTip(plot);
    var W = 700, H = 404, mL = 62, mR = 18, mT = 28, mB = 78;
    var pw = W - mL - mR, ph = H - mT - mB;
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H });
    var g = el("g", {}); svg.appendChild(g);
    var yMax = 0.7, yTicks = [0, 0.2, 0.4, 0.6];
    function yPix(v) { return mT + ph - (v / yMax) * ph; }

    yTicks.forEach(function (t) {
      var y = yPix(t);
      g.appendChild(el("line", { class: "grid-line", x1: mL, y1: y, x2: mL + pw, y2: y }));
      g.appendChild(txt(mL - 12, y + 4, t === 0 ? "0" : t.toFixed(1), "tick-label tnum", "end"));
    });
    g.appendChild(el("line", { class: "axis-line", x1: mL, y1: mT, x2: mL, y2: mT + ph }));
    g.appendChild(el("line", { class: "axis-line", x1: mL, y1: mT + ph, x2: mL + pw, y2: mT + ph }));
    var yt = txt(0, 0, "Overall Spearman", "axis-title", "middle");
    yt.setAttribute("transform", "translate(18," + (mT + ph / 2) + ") rotate(-90)");
    g.appendChild(yt);

    var series = [
      { k: "esm",  name: "ESM-2 35M",        color: C.cyan },
      { k: "msa",  name: "MSA conservation", color: C.green },
      { k: "mpnn", name: "ProteinMPNN",      color: C.violet }
    ];
    var nG = FAMILY.length, band = pw / nG, bw = Math.min(30, (band * 0.66) / 3), gapb = 6;
    FAMILY.forEach(function (d, gi) {
      var gx = mL + band * (gi + 0.5);
      var groupW = bw * 3 + gapb * 2;
      var start = gx - groupW / 2;
      series.forEach(function (s, si) {
        var v = d[s.k];
        var x = start + si * (bw + gapb);
        if (v == null) {
          var na = txt(x + bw / 2, mT + ph - 8, "n/a", "cat-sub", "middle");
          na.setAttribute("fill", C.text3);
          g.appendChild(na);
          g.appendChild(el("line", { x1: x + 3, y1: mT + ph - 2, x2: x + bw - 3, y2: mT + ph - 2, stroke: "rgba(255,255,255,0.14)", "stroke-width": 1.4, "stroke-dasharray": "2 3" }));
          return;
        }
        var y = yPix(v), h = mT + ph - y;
        var row = el("g", { class: "plot-row" });
        row.appendChild(el("rect", { class: "bar-rect", x: x, y: y, width: bw, height: Math.max(0, h), rx: 3, fill: s.color }));
        var vl = txt(x + bw / 2, y - 7, v.toFixed(3), "bar-val", "middle");
        vl.setAttribute("font-size", "9.5");
        row.appendChild(vl);
        g.appendChild(row);
        row.style.cursor = "default";
        row.addEventListener("mousemove", function (ev) {
          tip.show('<div>' + d.ds + '</div><div><span class="tt-k">' + s.name + '</span> <span class="tt-v">' + fmt4(v) + '</span></div>', ev);
        });
        row.addEventListener("mouseleave", function () { tip.hide(); });
      });
      g.appendChild(txt(gx, mT + ph + 22, d.ds, "cat-label", "middle"));
    });
    g.appendChild(txt(mL + band * 0.5, mT + ph + 38, "ProteinMPNN not run", "cat-sub", "middle"));
    g.appendChild(txt(mL + pw / 2, H - 6, "Enzyme DMS dataset", "axis-title", "middle"));
    plot.appendChild(svg);
  }

  /* ============================================================
     FIGURE - VIM-2 ProteinMPNN centerpiece (horizontal, by region)
     ============================================================ */
  function renderVim2(plot) {
    var tip = makeTip(plot);
    var W = 740, mL = 244, mR = 76, mT = 14, mB = 48;
    var rowH = 54, gap = 13;
    var n = VIM2.length, ph = n * rowH, H = mT + ph + mB, pw = W - mL - mR;
    var xMax = 0.7, xticks = [0, 0.2, 0.4, 0.6];
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H });
    var g = el("g", {}); svg.appendChild(g);
    function xPix(v) { return mL + (v / xMax) * pw; }
    function col(k) { return k === "measure" ? C.cyan : (k === "bg" ? C.gray : C.amber); }

    xticks.forEach(function (t) {
      var x = xPix(t);
      g.appendChild(el("line", { class: "grid-line", x1: x, y1: mT, x2: x, y2: mT + ph }));
      g.appendChild(txt(x, mT + ph + 20, t === 0 ? "0" : t.toFixed(1), "tick-label tnum", "middle"));
    });
    g.appendChild(el("line", { class: "axis-line", x1: mL, y1: mT, x2: mL, y2: mT + ph }));
    g.appendChild(txt(mL + pw / 2, H - 8, "ProteinMPNN Spearman with VIM-2 DMS fitness", "axis-title", "middle"));

    VIM2.forEach(function (d, i) {
      var cy = mT + rowH * i + rowH / 2, barH = rowH - gap * 2;
      var color = col(d.kind);
      var op = d.kind === "bg" ? 0.58 : (d.kind === "mechlow" ? 0.95 : 0.82);
      var row = el("g", { class: "plot-row" });
      row.appendChild(el("rect", { x: mL, y: cy - barH / 2, width: pw, height: barH, rx: 3, fill: "rgba(255,255,255,0.02)" }));
      row.appendChild(el("rect", { class: "bar-rect", x: mL, y: cy - barH / 2, width: Math.max(1, xPix(d.value) - mL), height: barH, rx: 3, fill: color, "fill-opacity": op }));
      var mech = (d.kind === "mech" || d.kind === "mechlow");
      var parts = wrapLabel(d.label, 22);
      var baseY = cy + 4 - (parts.length - 1) * 8 - (mech ? 6 : 0);
      parts.forEach(function (ln, li) {
        row.appendChild(txt(mL - 14, baseY + li * 15, ln, "cat-label", "end"));
      });
      if (mech) row.appendChild(txt(mL - 14, baseY + parts.length * 15 - 2, "mechanism-relevant", "mech-flag", "end"));
      var vv = txt(W - 8, cy + 5, fmt4(d.value), "bar-val", "end");
      vv.setAttribute("font-size", "14");
      row.appendChild(vv);
      g.appendChild(row);
      row.style.cursor = "default";
      row.addEventListener("mousemove", function (ev) {
        tip.show('<div>VIM-2 ProteinMPNN</div><div>' + d.label + '</div>' +
          '<div><span class="tt-k">Spearman</span> <span class="tt-v">' + fmt4(d.value) + '</span></div>', ev);
      });
      row.addEventListener("mouseleave", function () { tip.hide(); });
    });
    plot.appendChild(svg);
  }

  /* ============================================================
     PIPELINE hover explain
     ============================================================ */
  function initPipeline() {
    var pipe = document.querySelector(".pipe");
    if (!pipe) return;
    var explain = document.createElement("div");
    explain.className = "pipe-explain";
    explain.textContent = "Hover a step to read what it does.";
    pipe.parentNode.insertBefore(explain, pipe.nextSibling);
    var nodes = pipe.querySelectorAll(".pipe-node");
    nodes.forEach(function (nd) {
      nd.addEventListener("mouseenter", function () {
        explain.textContent = nd.getAttribute("data-reveal") || "";
        explain.classList.add("on");
      });
      nd.addEventListener("mouseleave", function () {
        explain.classList.remove("on");
        explain.textContent = "Hover a step to read what it does.";
      });
    });
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

  /* ============================================================
     BUILD FIGURES
     ============================================================ */
  function buildFigures() {
    var f;
    if ((f = document.querySelector('[data-fig="family"]'))) renderFamily(f);
    if ((f = document.querySelector('[data-fig="vim2"]'))) renderVim2(f);
  }

  function boot() {
    wireRepo();
    initBg();
    buildFigures();
    initPipeline();
    initNav();
    initReveal();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
