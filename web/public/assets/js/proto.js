/* =========================================================================
   ELEGANT NIVASA — homepage: "The corridor test"
   Pins the section; navy walls part and the cream gap grows from a cramped
   6'6" to the full Nivasa width. Non-linear opening (tight → spacious by the
   8 ft logo moment), wall colour ramps to Nivasa navy, logo breaks out at 8 ft.
   Runs alongside site.js.
   ========================================================================= */
(function () {
  "use strict";
  var sec = document.querySelector("[data-corridor]");
  if (!sec) return;

  var track = sec.querySelector("[data-track]");
  var num = sec.querySelector("[data-num]");
  var tag = sec.querySelector("[data-tag]");
  var msg = sec.querySelector("[data-msg]");
  var bar = sec.querySelector("[data-bar]");

  var GMAX = 50;                        // half-gap (vw) at full width: walls gone
  var THEM = 6.5, US = 14;
  var K8 = (8 - THEM) / (US - THEM);    // progress where we cross 8 ft (0.2)
  var C0 = [10, 12, 24], C1 = [22, 32, 74];  // wall ramp: near-black → Nivasa navy
  function lerp(a, b, t) { return Math.round(a + (b - a) * t); }

  // True-to-scale: the visible opening is directly proportional to the live
  // foot count (half-gap = GMAX·ft/US), so widths read accurately — 6'6" is
  // exactly 6.5/8 = 81.25% of the 8 ft opening — and the walls only vanish at
  // the full 14 ft Nivasa width.
  function halfGap(ft) { return GMAX * ft / US; }

  var MSG_T = "Two people pass shoulder-to-shoulder. A shoe rack, and the hallway is blocked.";
  var MSG_U = "Up&nbsp;to <b>14&nbsp;ft</b> — plants, bikes, neighbours stopping to talk, and still room to pass.";
  var TAG_T = "A typical branded-builder corridor";
  var TAG_U = "An Elegant Nivasa corridor";

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ftl(ft) { var w = Math.floor(ft), i = Math.round((ft - w) * 12); if (i === 12) { w++; i = 0; } return w + "′" + i + "″"; }

  var open = -1, tick = false;
  function frame() {
    tick = false;
    var r = track.getBoundingClientRect();
    var total = track.offsetHeight - window.innerHeight;
    var p = total > 0 ? clamp(-r.top / total, 0, 1) : 0;
    var tp = clamp((p - 0.12) / (0.88 - 0.12), 0, 1);
    var ft = THEM + (US - THEM) * tp;

    sec.style.setProperty("--g", halfGap(ft).toFixed(3));
    if (num) num.textContent = ftl(ft);
    if (bar) bar.style.width = (p * 100).toFixed(1) + "%";

    var cp = clamp(tp / K8, 0, 1);
    sec.style.setProperty("--wall-top",
      "rgb(" + lerp(C0[0], C1[0], cp) + "," + lerp(C0[1], C1[1], cp) + "," + lerp(C0[2], C1[2], cp) + ")");

    var no = ft >= 8 ? 1 : 0;
    if (no !== open) { open = no; sec.setAttribute("data-open", no);
      if (msg) msg.innerHTML = no ? MSG_U : MSG_T;
      if (tag) tag.textContent = no ? TAG_U : TAG_T; }
  }
  function ons() { if (!tick) { tick = true; requestAnimationFrame(frame); } }
  addEventListener("scroll", ons, { passive: true });
  addEventListener("resize", ons);

  // Click / drag to advance. The section is scroll-driven, but visitors tap it
  // expecting it to respond (Clarity: this is the homepage's top dead-click
  // cluster). Translate pointer gestures into scroll so the scroll position
  // stays the single source of truth: a mouse-drag scrubs the opening both
  // ways, and a tap (any pointer) advances it ~a third of the run — or exits
  // once it's fully open. Touch scrolling is left to the browser (we only read
  // the gesture to tell a tap from a scroll), so this never fights native pans.
  var stage = sec.querySelector(".ct-stage") || sec;
  function range() { return Math.max(1, track.offsetHeight - window.innerHeight); }
  function progress() { return clamp(-track.getBoundingClientRect().top / range(), 0, 1); }
  var dragging = false, moved = false, startY = 0, startScroll = 0;
  stage.addEventListener("pointerdown", function (e) {
    dragging = true; moved = false; startY = e.clientY; startScroll = window.scrollY || window.pageYOffset;
    if (e.pointerType === "mouse" && stage.setPointerCapture) stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    var dy = startY - e.clientY;              // drag up → advance (scroll down)
    if (Math.abs(dy) > 5) moved = true;
    if (e.pointerType === "mouse") window.scrollTo(0, startScroll + dy);  // touch = native scroll
  });
  function release() {
    if (!dragging) return;
    dragging = false;
    if (moved) return;                        // it was a drag/scroll, not a tap
    var p = progress();
    var nextP = p >= 0.92 ? 1.08 : p + 0.34;  // step ~1/3 of the run, or scroll past when open
    window.scrollTo({ top: (window.scrollY || window.pageYOffset) + (nextP - p) * range(), behavior: "smooth" });
  }
  stage.addEventListener("pointerup", release);
  stage.addEventListener("pointercancel", release);
  stage.style.cursor = "grab";

  frame();
})();

/* =========================================================================
   LOCATION — true positional drive-time map (#location).
   Markers plotted at real bearing & scale from Tellapur via an equirectangular
   projection of OpenStreetMap coordinates. Drive-time figures are the stated
   (Google) minutes; ORR Exit 2 location is indicative.
   Desktop fits all destinations. On phones the map re-fits to the near cluster
   (so labels stay legible at a near-1:1 viewBox) and the far-south airport is
   shown as a labelled edge marker. Re-renders when the breakpoint flips.
   ========================================================================= */
(function () {
  "use strict";
  var svg = document.querySelector("[data-citymap]");
  if (!svg) return;
  var NS = "http://www.w3.org/2000/svg";
  function el(n, a) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); return e; }
  function txt(p, cls, a, s) { var t = el("text", Object.assign({ "class": cls }, a)); t.textContent = s; p.appendChild(t); return t; }
  function label(x, y, anc, t, name) {           // a "<n> min" + place-name pair
    var tt = txt(svg, "cm-time", { x: x, y: y, "text-anchor": anc }, t + " ");
    var ts = el("tspan", {}); ts.textContent = "min"; tt.appendChild(ts);
    txt(svg, "cm-name", { x: x, y: y + 15, "text-anchor": anc }, name);
  }

  var ORIGIN = { lat: 17.4739974, lon: 78.2980574 };       // Tellapur
  var DEST = [
    { t: 2,  name: "ORR Exit 2",           cat: "road", lat: 17.4625,    lon: 78.3060    }, // indicative
    { t: 15, name: "Financial District",   cat: "biz",  lat: 17.4199667, lon: 78.3286906 },
    { t: 15, name: "Neopolis",             cat: "biz",  lat: 17.3948624, lon: 78.3365214 },
    { t: 25, name: "Gachibowli",           cat: "biz",  lat: 17.4436222, lon: 78.3519638 },
    { t: 30, name: "Rajiv Gandhi Airport", cat: "air",  lat: 17.2311636, lon: 78.4317834 }
  ];
  var AIRPORT = DEST[DEST.length - 1];
  var k = Math.cos(ORIGIN.lat * Math.PI / 180);
  function proj(p) { return { x: (p.lon - ORIGIN.lon) * k, y: -(p.lat - ORIGIN.lat) }; } // y+ = south
  var LO = {                                       // label offsets [dx, dy, anchor]
    "ORR Exit 2": [16, -6, "start"], "Financial District": [-14, -2, "end"],
    "Neopolis": [16, 4, "start"], "Gachibowli": [16, -4, "start"], "Rajiv Gandhi Airport": [16, 2, "start"]
  };
  var mq = window.matchMedia("(max-width: 760px)");

  function build() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var mobile = mq.matches;
    var W = mobile ? 430 : 760, H = mobile ? 540 : 600, pad = mobile ? 58 : 92;
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);

    // on mobile, fit only the near cluster (airport handled as an edge marker)
    var shown = mobile ? DEST.filter(function (d) { return d !== AIRPORT; }) : DEST;
    var pj = [{ x: 0, y: 0 }].concat(shown.map(proj));
    var xs = pj.map(function (p) { return p.x; }), ys = pj.map(function (p) { return p.y; });
    var minx = Math.min.apply(0, xs), maxx = Math.max.apply(0, xs), miny = Math.min.apply(0, ys), maxy = Math.max.apply(0, ys);
    // on mobile, reserve a bottom band for the airport edge marker so the
    // southernmost cluster point (Neopolis) never collides with it
    var band = mobile ? 104 : 0, fitH = H - band;
    var s = Math.min((W - 2 * pad) / (maxx - minx), (fitH - 2 * pad) / (maxy - miny));
    var offx = (W - (maxx - minx) * s) / 2 - minx * s, offy = (fitH - (maxy - miny) * s) / 2 - miny * s;
    function S(p) { var q = proj(p); return [q.x * s + offx, q.y * s + offy]; }
    var O = [offx, offy];

    for (var gx = 0; gx <= W; gx += 60) svg.appendChild(el("line", { "class": "cm-grid", x1: gx, y1: 0, x2: gx, y2: H }));
    for (var gy = 0; gy <= H; gy += 60) svg.appendChild(el("line", { "class": "cm-grid", x1: 0, y1: gy, x2: W, y2: gy }));

    // indicative ORR sweeping past the origin (box-relative so it fits both sizes)
    svg.appendChild(el("path", { "class": "cm-orr", d: "M " + (O[0] - 0.2 * W) + " " + (O[1] + 0.42 * H) + " Q " + (O[0] + 0.05 * W) + " " + (O[1] + 0.07 * H) + " " + (O[0] + 0.34 * W) + " " + (O[1] + 0.2 * H) }));
    txt(svg, "cm-orr-lab", { x: O[0] + 0.2 * W, y: O[1] + 0.07 * H }, "ORR");

    shown.forEach(function (d) {
      var p = S(d), lo = LO[d.name] || [14, 0, "start"];
      svg.appendChild(el("line", { "class": "cm-road", x1: O[0], y1: O[1], x2: p[0], y2: p[1] }));
      svg.appendChild(el("circle", { "class": "cm-pin" + (d.cat === "air" ? " air" : ""), cx: p[0], cy: p[1], r: d.cat === "air" ? 7 : 5.5 }));
      label(p[0] + lo[0], p[1] + lo[1], lo[2], d.t, d.name);
    });

    // airport as a labelled edge marker when the map is zoomed to the cluster
    if (mobile) {
      var a = proj(AIRPORT), len = Math.sqrt(a.x * a.x + a.y * a.y), ux = a.x / len, uy = a.y / len;
      var ey = H - 56, tt = (ey - O[1]) / uy, ex = Math.max(pad, Math.min(W - pad - 120, O[0] + ux * tt));
      svg.appendChild(el("line", { "class": "cm-road", x1: O[0], y1: O[1], x2: ex, y2: ey }));
      svg.appendChild(el("circle", { "class": "cm-pin air", cx: ex, cy: ey, r: 7 }));
      svg.appendChild(el("path", { "class": "cm-edge-arrow", d: "M " + ex + " " + (ey + 13) + " l 5 -8 l -10 0 z" }));
      label(ex + 14, ey - 1, "start", AIRPORT.t, "Rajiv Gandhi Airport");
    }

    svg.appendChild(el("circle", { "class": "cm-o-pulse", cx: O[0], cy: O[1], r: 8 }));
    svg.appendChild(el("circle", { "class": "cm-o-dot", cx: O[0], cy: O[1], r: 8 }));
    txt(svg, "cm-o-lab", { x: O[0] - 12, y: O[1] - 14, "text-anchor": "end" }, "Elegant Nivasa");

    var cxN = W - 40, cyN = mobile ? 42 : 64;
    svg.appendChild(el("line", { "class": "cm-compass-n", x1: cxN, y1: cyN + 16, x2: cxN, y2: cyN - 12 }));
    svg.appendChild(el("path", { "class": "cm-compass-n", d: "M " + cxN + " " + (cyN - 18) + " l 5 10 l -10 0 z" }));
    txt(svg, "cm-compass", { x: cxN, y: cyN + 30, "text-anchor": "middle" }, "N");
  }

  build();
  if (mq.addEventListener) mq.addEventListener("change", build);
  else {
    // Legacy Safari (<14): MediaQueryList.addListener is deprecated but kept
    // as a fallback; access via an any-cast so the deprecation hint stays quiet.
    var mqLegacy = /** @type {any} */ (mq);
    if (mqLegacy.addListener) mqLegacy.addListener(build);
  }
})();
