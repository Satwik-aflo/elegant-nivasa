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

/* LOCATION — the drive-time section is now a static CSS isochrone timeline
   (.loc-spine in proto.css) + a Google Maps embed; no JS needed. The old
   bespoke SVG bearing-map ([data-citymap]) was removed 2026-06-25. */
