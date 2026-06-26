/* =========================================================================
   FLOOR PLANS — swipe carousel controls (arrows + progress bar) over a native
   scroll-snap track ([data-fpcar] in index.astro). Swipe is the primary,
   native interaction (kept snappy to avoid the arrow rage-clicks Clarity
   flagged); arrows + bar are thin helpers. Tapping a plate still opens the
   site.js [data-gallery] lightbox — a horizontal swipe scrolls, it doesn't tap.
   ========================================================================= */
(function () {
  "use strict";
  var car = document.querySelector("[data-fpcar]");
  if (!car) return;
  var track = car.querySelector(".fp-track");
  var slides = track ? track.querySelectorAll(".fp-card") : [];
  if (!slides.length) return;
  var prev = car.querySelector(".fp-prev"), next = car.querySelector(".fp-next");
  var bar = car.querySelector("[data-fpbar] span");

  // slide's position within the track's scroll content (offsetParent-agnostic)
  function pos(i) { return slides[i].getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft; }
  function current() {
    var x = track.scrollLeft, best = 0, bd = Infinity;
    for (var i = 0; i < slides.length; i++) { var d = Math.abs(pos(i) - x); if (d < bd) { bd = d; best = i; } }
    return best;
  }

  // `idx` = the intended slide, advanced synchronously on each arrow tap. Deriving the target from
  // current() instead read scrollLeft *mid-smooth-scroll*, so a 2nd fast tap saw the old slide and
  // re-targeted the same card — taps got dropped (the arrow "rage-click" symptom). A settled
  // scroll/swipe re-syncs idx from the real position via sync().
  var idx = 0;
  function clamp(i) { return Math.max(0, Math.min(slides.length - 1, i)); }
  function paint(i) {
    if (bar) bar.style.width = ((i + 1) / slides.length * 100) + "%";
    if (prev) prev.disabled = i <= 0;
    if (next) next.disabled = i >= slides.length - 1;
  }
  function go(i) { idx = clamp(i); track.scrollTo({ left: pos(idx), behavior: "smooth" }); paint(idx); }
  function sync() { idx = current(); paint(idx); }

  if (prev) prev.addEventListener("click", function () { go(idx - 1); });
  if (next) next.addEventListener("click", function () { go(idx + 1); });
  var t;
  track.addEventListener("scroll", function () { clearTimeout(t); t = setTimeout(sync, 70); }, { passive: true });
  addEventListener("resize", function () { clearTimeout(t); t = setTimeout(sync, 120); });
  sync();
})();

/* LOCATION — the drive-time section is now a static CSS isochrone timeline
   (.loc-spine in proto.css) + a Google Maps embed; no JS needed. The old
   bespoke SVG bearing-map ([data-citymap]) was removed 2026-06-25. */
