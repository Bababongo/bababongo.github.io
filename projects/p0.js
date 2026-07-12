/* ============================================================
   P0 · zero-shot fitness - case-study interactions + figures
   Self-contained. Reuses the site's visual identity.
   ============================================================ */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg";

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

  /* ============================================================
     DATA (exact values from the P0 comparison run)
     ============================================================ */
  var GROUPS = {
    overall:      { name: "Overall", kind: "bg" },
    active:       { name: "UniProt active site", kind: "mech" },
    nonactive:    { name: "Non-active site", kind: "bg" },
    binding:      { name: "UniProt substrate-binding site", kind: "mech" },
    ligand:       { name: "PDB 1M40 ligand contact, 5 A", kind: "mech" },
    neighborhood: { name: "Active-site neighborhood", kind: "mech" },
    outsideNbhd:  { name: "Outside active-site neighborhood", kind: "bg" }
  };

  // Figure 2 / metric strip - overall comparison
  var OVERALL = [
    { scorer: "Placeholder", spearman: 0.0430, active: 0.1231, nonactive: 0.0342, top5: 0.5247, color: C.gray },
    { scorer: "ESM-2 8M",    spearman: 0.4113, active: 0.3023, nonactive: 0.4042, top5: 2.6237, color: C.cyanDim },
    { scorer: "ESM-2 35M",   spearman: 0.5548, active: 0.4596, nonactive: 0.5428, top5: 2.0990, color: C.cyan }
  ];

  // Figure 3 - ESM-2 35M slices with bootstrap 95% CI
  var SLICES = [
    { key: "overall",      value: 0.5548, ci: [0.5340, 0.5757], n: 4783 },
    { key: "active",       value: 0.4596, ci: [0.2268, 0.6418], n: 57 },
    { key: "nonactive",    value: 0.5428, ci: [0.5195, 0.5641], n: 4726 },
    { key: "binding",      value: 0.4965, ci: [0.2318, 0.7061], n: 55 },
    { key: "ligand",       value: 0.7127, ci: [0.6464, 0.7695], n: 277 },
    { key: "neighborhood", value: 0.7027, ci: [0.6508, 0.7503], n: 461 },
    { key: "outsideNbhd",  value: 0.5188, ci: [0.4944, 0.5424], n: 4322 }
  ];

  // Figure 5 - scaling 8M -> 35M
  var SLOPE = [
    { key: "overall",      a: 0.4113, b: 0.5548 },
    { key: "active",       a: 0.3023, b: 0.4596 },
    { key: "nonactive",    a: 0.4042, b: 0.5428 },
    { key: "binding",      a: 0.4383, b: 0.4965 },
    { key: "ligand",       a: 0.6076, b: 0.7127 },
    { key: "neighborhood", a: 0.6453, b: 0.7027 }
  ];

  // Figure 6 - mutation-class breakdown (ESM-2 35M)
  var MUTCLASS = [
    { cls: "charge_preserving",                 n: 277,  spearman: 0.5343, fit: 0.6771, score: -1.7223 },
    { cls: "class_changing",                    n: 3050, spearman: 0.5730, fit: 0.5065, score: -3.0481 },
    { cls: "hydrophobic_or_special_preserving", n: 1179, spearman: 0.4702, fit: 0.4541, score: -2.7983 },
    { cls: "polar_preserving",                  n: 277,  spearman: 0.6319, fit: 0.6127, score: -2.8855 }
  ];

  // Table 1 - residue-slice comparison across scorers (spearman / outside / variants)
  var TABLE = [
    { scorer: "Placeholder", rows: [
      { g: "UniProt active site", s: 0.1231, o: 0.0342, n: 57 },
      { g: "UniProt substrate-binding site", s: -0.0350, o: 0.0368, n: 55 },
      { g: "PDB 1M40 ligand contact, 5 A", s: 0.1777, o: 0.0361, n: 277 },
      { g: "Active-site neighborhood", s: 0.2916, o: 0.0278, n: 461 }
    ]},
    { scorer: "ESM-2 8M", rows: [
      { g: "UniProt active site", s: 0.3023, o: 0.4042, n: 57 },
      { g: "UniProt substrate-binding site", s: 0.4383, o: 0.3992, n: 55 },
      { g: "PDB 1M40 ligand contact, 5 A", s: 0.6076, o: 0.3997, n: 277 },
      { g: "Active-site neighborhood", s: 0.6453, o: 0.3752, n: 461 }
    ]},
    { scorer: "ESM-2 35M", rows: [
      { g: "UniProt active site", s: 0.4596, o: 0.5428, n: 57 },
      { g: "UniProt substrate-binding site", s: 0.4965, o: 0.5453, n: 55 },
      { g: "PDB 1M40 ligand contact, 5 A", s: 0.7127, o: 0.5344, n: 277 },
      { g: "Active-site neighborhood", s: 0.7027, o: 0.5188, n: 461 }
    ]}
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
        var x = ev.clientX - r.left;
        var y = ev.clientY - r.top;
        tip.style.left = Math.max(60, Math.min(r.width - 60, x)) + "px";
        tip.style.top = (y - 14) + "px";
        tip.classList.add("show");
      },
      hide: function () { tip.classList.remove("show"); }
    };
  }

  /* ============================================================
     METRIC STRIP
     ============================================================ */
  function renderMetricStrip() {
    var host = document.getElementById("metric-strip");
    if (!host) return;
    var metrics = [
      { name: "Overall Spearman", sub: "vs experimental fitness", key: "spearman" },
      { name: "Active-site-only", sub: "UniProt catalytic core", key: "active" },
      { name: "Non-active-site", sub: "background residues", key: "nonactive" },
      { name: "Top-5 enrichment", sub: "small top-k metric", key: "top5" }
    ];
    metrics.forEach(function (m) {
      var max = Math.max.apply(null, OVERALL.map(function (d) { return d[m.key]; }));
      var card = document.createElement("div");
      card.className = "metric";
      var rows = OVERALL.map(function (d) {
        var w = Math.max(2, (d[m.key] / max) * 100);
        var cls = d.scorer === "Placeholder" ? "gray" : (d.scorer === "ESM-2 8M" ? "cyan-dim" : "cyan");
        var hi = d.scorer === "ESM-2 35M" ? " hi" : "";
        return '<div class="m-row">' +
          '<span class="m-scorer' + hi + '">' + d.scorer.replace("ESM-2 ", "") + '</span>' +
          '<span class="m-track"><span class="m-fill ' + cls + '" style="width:' + w.toFixed(1) + '%"></span></span>' +
          '<span class="m-val">' + fmt4(d[m.key]) + '</span></div>';
      }).join("");
      card.innerHTML = '<div class="m-name">' + m.name + '</div><div class="m-sub">' + m.sub + '</div>' + rows;
      host.appendChild(card);
    });
  }

  /* ============================================================
     FIGURE 2 / 6 - vertical bar charts
     ============================================================ */
  function renderBars(plot, opts) {
    var W = 620, H = 360, mL = 84, mR = 24, mT = 24, mB = opts.tallLabels ? 74 : 52;
    var pw = W - mL - mR, ph = H - mT - mB;
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H });
    var g = el("g", {});
    svg.appendChild(g);
    var yMax = opts.yMax, ticks = opts.yTicks;
    function yPix(v) { return mT + ph - (v / yMax) * ph; }

    // gridlines + y ticks
    ticks.forEach(function (t) {
      var y = yPix(t);
      g.appendChild(el("line", { class: "grid-line", x1: mL, y1: y, x2: mL + pw, y2: y }));
      g.appendChild(txt(mL - 12, y + 4, opts.yFmt ? opts.yFmt(t) : (t === 0 ? "0" : t.toFixed(1)), "tick-label tnum", "end"));
    });
    // axes
    g.appendChild(el("line", { class: "axis-line", x1: mL, y1: mT, x2: mL, y2: mT + ph }));
    g.appendChild(el("line", { class: "axis-line", x1: mL, y1: mT + ph, x2: mL + pw, y2: mT + ph }));
    // y axis title
    var yt = txt(0, 0, opts.yTitle, "axis-title", "middle");
    yt.setAttribute("transform", "translate(20," + (mT + ph / 2) + ") rotate(-90)");
    g.appendChild(yt);

    var n = opts.data.length;
    var band = pw / n;
    var bw = Math.min(opts.maxBar || 92, band * 0.56);
    opts.data.forEach(function (d, i) {
      var cx = mL + band * (i + 0.5);
      var y = yPix(d.value);
      var h = mT + ph - y;
      var row = el("g", { class: "plot-row" });
      var rect = el("rect", { class: "bar-rect", x: cx - bw / 2, y: y, width: bw, height: Math.max(0, h), rx: 4, fill: d.color });
      row.appendChild(rect);
      // value label above
      row.appendChild(txt(cx, y - 9, fmt4(d.value), "bar-val", "middle"));
      // category label(s) below
      var lines = d.label.split("\n");
      lines.forEach(function (ln, li) {
        row.appendChild(txt(cx, mT + ph + 20 + li * 14, ln, li === 0 ? "cat-label" : "cat-sub", "middle"));
      });
      g.appendChild(row);
      if (opts.tip) {
        row.style.cursor = "default";
        row.addEventListener("mousemove", function (ev) { opts.tip.show(opts.tipHtml(d), ev); });
        row.addEventListener("mouseleave", function () { opts.tip.hide(); });
      }
    });
    // x axis title
    if (opts.xTitle) g.appendChild(txt(mL + pw / 2, H - 6, opts.xTitle, "axis-title", "middle"));
    plot.appendChild(svg);
  }

  /* ============================================================
     FIGURE 3 - horizontal slice bars + CI whiskers
     ============================================================ */
  function renderSlices(plot) {
    var tip = makeTip(plot);
    var W = 720, mL = 208, mR = 66, mT = 10, mB = 46;
    var rowH = 44, gap = 8;
    var n = SLICES.length;
    var ph = n * rowH;
    var H = mT + ph + mB;
    var pw = W - mL - mR;
    var xMax = 0.8, xticks = [0, 0.2, 0.4, 0.6, 0.8];
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H });
    var g = el("g", {});
    svg.appendChild(g);
    function xPix(v) { return mL + (v / xMax) * pw; }

    // vertical gridlines + x ticks
    xticks.forEach(function (t) {
      var x = xPix(t);
      g.appendChild(el("line", { class: "grid-line", x1: x, y1: mT, x2: x, y2: mT + ph }));
      g.appendChild(txt(x, mT + ph + 20, t.toFixed(1), "tick-label tnum", "middle"));
    });
    g.appendChild(el("line", { class: "axis-line", x1: mL, y1: mT, x2: mL, y2: mT + ph }));
    g.appendChild(txt(mL + pw / 2, H - 8, "Spearman correlation with experimental fitness", "axis-title", "middle"));

    SLICES.forEach(function (d, i) {
      var grp = GROUPS[d.key];
      var color = grp.kind === "mech" ? C.amber : C.gray;
      var cy = mT + rowH * i + rowH / 2;
      var barH = rowH - gap * 2;
      var row = el("g", { class: "plot-row" });
      // track
      row.appendChild(el("rect", { x: mL, y: cy - barH / 2, width: pw, height: barH, rx: 3, fill: "rgba(255,255,255,0.02)" }));
      // bar
      row.appendChild(el("rect", { class: "bar-rect", x: mL, y: cy - barH / 2, width: Math.max(1, xPix(d.value) - mL), height: barH, rx: 3, fill: color, "fill-opacity": grp.kind === "mech" ? 0.85 : 0.6 }));
      // CI whisker
      var lo = xPix(d.ci[0]), hi = xPix(d.ci[1]);
      row.appendChild(el("line", { class: "ci-line", x1: lo, y1: cy, x2: hi, y2: cy }));
      row.appendChild(el("line", { class: "ci-cap", x1: lo, y1: cy - 5, x2: lo, y2: cy + 5 }));
      row.appendChild(el("line", { class: "ci-cap", x1: hi, y1: cy - 5, x2: hi, y2: cy + 5 }));
      // value marker dot
      row.appendChild(el("circle", { cx: xPix(d.value), cy: cy, r: 3, fill: C.text }));
      // group label (left)
      var nameParts = wrapLabel(grp.name, 26);
      nameParts.forEach(function (ln, li) {
        row.appendChild(txt(mL - 14, cy + 4 - (nameParts.length - 1) * 7 + li * 14, ln, "cat-label", "end"));
      });
      // value + n (right)
      row.appendChild(txt(W - 8, cy - 2, fmt4(d.value), "bar-val", "end"));
      row.appendChild(txt(W - 8, cy + 12, "n = " + commas(d.n), "n-label", "end"));
      g.appendChild(row);
      row.style.cursor = "default";
      row.addEventListener("mousemove", function (ev) {
        tip.show(
          '<div>' + grp.name + '</div>' +
          '<div><span class="tt-k">Spearman</span> <span class="tt-v">' + fmt4(d.value) + '</span></div>' +
          '<div><span class="tt-k">95% CI</span> ' + fmt4(d.ci[0]) + " to " + fmt4(d.ci[1]) + '</div>' +
          '<div><span class="tt-k">n</span> ' + commas(d.n) + '</div>', ev);
      });
      row.addEventListener("mouseleave", function () { tip.hide(); });
    });
    plot.appendChild(svg);
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
     FIGURE 5 - slope chart
     ============================================================ */
  function renderSlope(plot) {
    var tip = makeTip(plot);
    var W = 720, H = 430, mT = 30, mB = 46;
    var xA = 250, xB = 452;
    var yMin = 0.28, yMax = 0.75;
    var pt = mT, pb = H - mB;
    function yPix(v) { return pb - ((v - yMin) / (yMax - yMin)) * (pb - pt); }
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H });
    var g = el("g", {});
    svg.appendChild(g);

    // y gridlines
    [0.3, 0.4, 0.5, 0.6, 0.7].forEach(function (t) {
      var y = yPix(t);
      g.appendChild(el("line", { class: "grid-line", x1: 60, y1: y, x2: W - 60, y2: y }));
      g.appendChild(txt(48, y + 4, t.toFixed(1), "tick-label tnum", "end"));
    });
    // category axis verticals
    g.appendChild(el("line", { class: "axis-line", x1: xA, y1: pt - 8, x2: xA, y2: pb }));
    g.appendChild(el("line", { class: "axis-line", x1: xB, y1: pt - 8, x2: xB, y2: pb }));
    g.appendChild(txt(xA, pb + 22, "ESM-2 8M", "cat-label", "middle"));
    g.appendChild(txt(xB, pb + 22, "ESM-2 35M", "cat-label", "middle"));
    g.appendChild(txt(xA + (xB - xA) / 2, H - 8, "Model size", "axis-title", "middle"));
    var yt = txt(0, 0, "Spearman correlation", "axis-title", "middle");
    yt.setAttribute("transform", "translate(18," + ((pt + pb) / 2) + ") rotate(-90)");
    g.appendChild(yt);

    // de-collide right labels
    var right = SLOPE.map(function (d) { return { key: d.key, y: yPix(d.b), b: d.b }; }).sort(function (a, b) { return a.y - b.y; });
    declutter(right, 15);
    var left = SLOPE.map(function (d) { return { key: d.key, y: yPix(d.a), a: d.a }; }).sort(function (a, b) { return a.y - b.y; });
    declutter(left, 14);
    var rMap = {}, lMap = {};
    right.forEach(function (r) { rMap[r.key] = r.y; });
    left.forEach(function (l) { lMap[l.key] = l.y; });

    SLOPE.forEach(function (d) {
      var grp = GROUPS[d.key];
      var color = d.key === "overall" ? C.cyan : (grp.kind === "mech" ? C.amber : C.gray);
      var yaR = yPix(d.a), ybR = yPix(d.b);
      var row = el("g", { class: "plot-row" });
      row.appendChild(el("line", { class: "slope-line", x1: xA, y1: yaR, x2: xB, y2: ybR, stroke: color, "stroke-opacity": 0.85 }));
      row.appendChild(el("circle", { class: "slope-dot", cx: xA, cy: yaR, r: 4.5, fill: color }));
      row.appendChild(el("circle", { class: "slope-dot", cx: xB, cy: ybR, r: 4.5, fill: color }));
      // left value
      var lv = txt(xA - 12, lMap[d.key] + 4, fmt4(d.a), "slope-val", "end");
      lv.setAttribute("fill", C.text2);
      g.appendChild(lv);
      // right value + group name
      var rn = txt(xB + 14, rMap[d.key] + 4, fmt4(d.b) + "  " + shortName(grp.name), "slope-val", "start");
      rn.setAttribute("fill", color);
      g.appendChild(rn);
      g.appendChild(row);
      row.style.cursor = "default";
      row.addEventListener("mousemove", function (ev) {
        tip.show('<div>' + grp.name + '</div>' +
          '<div><span class="tt-k">8M</span> ' + fmt4(d.a) + '  <span class="tt-k">35M</span> <span class="tt-v">' + fmt4(d.b) + '</span></div>' +
          '<div><span class="tt-k">delta</span> +' + (d.b - d.a).toFixed(4) + '</div>', ev);
      });
      row.addEventListener("mouseleave", function () { tip.hide(); });
    });
    plot.appendChild(svg);
  }

  function shortName(name) {
    return name
      .replace("UniProt ", "").replace("PDB 1M40 ", "")
      .replace("Active-site neighborhood", "neighborhood")
      .replace("substrate-binding site", "substrate-binding")
      .replace("ligand contact, 5 A", "ligand contact");
  }
  function declutter(items, minGap) {
    for (var i = 1; i < items.length; i++) {
      if (items[i].y - items[i - 1].y < minGap) items[i].y = items[i - 1].y + minGap;
    }
  }

  /* ============================================================
     TABLE 1
     ============================================================ */
  function renderTable() {
    var body = document.getElementById("sci-table-body");
    if (!body) return;
    var html = "";
    TABLE.forEach(function (band) {
      html += '<tr class="scorer-band"><td colspan="4">' + band.scorer + '</td></tr>';
      band.rows.forEach(function (r) {
        var best = band.scorer === "ESM-2 35M" && r.g.indexOf("ligand") !== -1;
        html += '<tr>' +
          '<td class="grp">' + r.g + '</td>' +
          '<td>' + (best ? '<span class="best">' + fmt4(r.s) + '</span>' : fmt4(r.s)) + '</td>' +
          '<td>' + fmt4(r.o) + '</td>' +
          '<td>' + commas(r.n) + '</td></tr>';
      });
    });
    body.innerHTML = html;
  }

  /* ============================================================
     FIGURE 1 - pipeline hover explain
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
    var f2 = document.querySelector('[data-fig="overall"]');
    if (f2) {
      var tip2 = makeTip(f2);
      renderBars(f2, {
        data: OVERALL.map(function (d) { return { label: d.scorer, value: d.spearman, color: d.color }; }),
        yMax: 0.6, yTicks: [0, 0.2, 0.4, 0.6], yTitle: "Spearman", xTitle: "Scorer",
        tip: tip2, tipHtml: function (d) {
          return '<div>' + d.label + '</div><div><span class="tt-k">Spearman</span> <span class="tt-v">' + fmt4(d.value) + '</span></div>';
        }
      });
    }
    var f3 = document.querySelector('[data-fig="slices"]');
    if (f3) renderSlices(f3);
    var f5 = document.querySelector('[data-fig="slope"]');
    if (f5) renderSlope(f5);
    var f6 = document.querySelector('[data-fig="mutclass"]');
    if (f6) {
      var tip6 = makeTip(f6);
      renderBars(f6, {
        data: MUTCLASS.map(function (d) {
          return { label: d.cls.replace(/_/g, " ").replace("hydrophobic or special preserving", "hydrophobic /\nspecial pres."), value: d.spearman, color: C.amber, _d: d };
        }),
        yMax: 0.7, yTicks: [0, 0.2, 0.4, 0.6], yTitle: "Spearman", xTitle: "Mutation class", tallLabels: true, maxBar: 84,
        tip: tip6, tipHtml: function (d) {
          var x = d._d;
          return '<div>' + x.cls + '</div>' +
            '<div><span class="tt-k">Spearman</span> <span class="tt-v">' + fmt4(x.spearman) + '</span></div>' +
            '<div><span class="tt-k">n</span> ' + commas(x.n) + '</div>' +
            '<div><span class="tt-k">mean fitness</span> ' + fmt4(x.fit) + '</div>' +
            '<div><span class="tt-k">mean score</span> ' + fmt4(x.score) + '</div>';
        }
      });
    }
  }

  function boot() {
    initBg();
    renderMetricStrip();
    buildFigures();
    renderTable();
    initPipeline();
    initNav();
    initReveal();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
