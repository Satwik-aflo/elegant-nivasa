/* =============================================================================
   ELEGANT NIVASA — HOME PAGE  (vanilla, no dependencies, no build step)
   Header scroll · mobile nav · scroll reveals · count-up · smooth scroll ·
   gallery lightbox · hero parallax · form validation + simulated submit.
   Mockup only — no live backend (per project scope).
   ============================================================================= */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Header scroll state ---------- */
  var header = $(".site-header");
  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav ---------- */
  var toggle = $(".nav-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      document.body.classList.toggle("menu-open");
    });
  }
  $$(".nav-links a, .nav .btn").forEach(function (a) {
    a.addEventListener("click", function () { document.body.classList.remove("menu-open"); });
  });

  /* ---------- Smooth scroll for in-page anchors ---------- */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      var top = t.getBoundingClientRect().top + window.scrollY - 64;
      window.scrollTo({ top: top, behavior: prefersReduced ? "auto" : "smooth" });
    });
  });

  /* ---------- Scroll reveals ---------- */
  var revealEls = $$(".reveal, .stagger");
  if (prefersReduced || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Count-up ---------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = (el.getAttribute("data-count").split(".")[1] || "").length;
    if (prefersReduced) { el.textContent = target.toFixed(decimals); return; }
    var dur = 1400, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(decimals);
    }
    requestAnimationFrame(step);
  }
  var counts = $$("[data-count]");
  if ("IntersectionObserver" in window && !prefersReduced) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { animateCount(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    counts.forEach(function (el) { cio.observe(el); });
  } else {
    counts.forEach(animateCount);
  }

  /* ---------- Hero parallax (desktop, motion-allowed only) ---------- */
  var heroBg = $(".hero-bg img");
  if (heroBg && finePointer && !prefersReduced) {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (y < window.innerHeight) heroBg.style.transform = "translateY(" + (y * 0.18) + "px)";
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- Gallery lightbox ---------- */
  var lb = $(".lightbox");
  if (lb) {
    var lbImg = $(".lb-img", lb);
    var lbCount = $(".lb-count", lb);
    var items = $$(".gal-item");
    var sources = items.map(function (it) { return it.getAttribute("data-full") || $("img", it).src; });
    var idx = 0, lastFocus = null;

    function show(i) {
      idx = (i + sources.length) % sources.length;
      lbImg.src = sources[idx];
      if (lbCount) lbCount.textContent = (idx + 1) + " / " + sources.length;
    }
    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      lb.classList.add("open");
      lb.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      $(".lb-close", lb).focus();
    }
    function close() {
      lb.classList.remove("open");
      lb.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    }
    items.forEach(function (it, i) {
      it.addEventListener("click", function () { open(i); });
      it.setAttribute("tabindex", "0");
      it.setAttribute("role", "button");
      it.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(i); }
      });
    });
    $(".lb-close", lb).addEventListener("click", close);
    $(".lb-next", lb).addEventListener("click", function () { show(idx + 1); });
    $(".lb-prev", lb).addEventListener("click", function () { show(idx - 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") show(idx + 1);
      if (e.key === "ArrowLeft") show(idx - 1);
    });
  }

  /* ---------- Enquire form: validation + simulated submit ---------- */
  var form = $("#enquire-form");
  if (form) {
    var phoneRe = /^[6-9]\d{9}$/;            // Indian mobile (10 digits, starts 6-9)
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function setErr(field, on) {
      var wrap = field.closest(".field") || field.closest(".consent");
      if (wrap) wrap.classList.toggle("show-err", on);
      field.classList.toggle("invalid", on);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = $("#f-name", form);
      var phone = $("#f-phone", form);
      var email = $("#f-email", form);
      var consent = $("#f-consent", form);
      var ok = true;

      if (!name.value.trim()) { setErr(name, true); ok = false; } else setErr(name, false);

      var cleanPhone = phone.value.replace(/[\s\-+]/g, "").replace(/^91(?=\d{10}$)/, "");
      if (!phoneRe.test(cleanPhone)) { setErr(phone, true); ok = false; } else setErr(phone, false);

      if (!emailRe.test(email.value.trim())) { setErr(email, true); ok = false; } else setErr(email, false);

      if (!consent.checked) { setErr(consent, true); ok = false; } else setErr(consent, false);

      if (!ok) {
        var firstErr = form.querySelector(".invalid");
        if (firstErr) firstErr.focus();
        return;
      }

      // Simulated submit (mockup — no backend wired yet).
      var btn = $("button[type=submit]", form);
      var orig = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = "Sending…";
      setTimeout(function () {
        form.classList.add("done");
        btn.disabled = false;
        btn.innerHTML = orig;
      }, 700);
    });

    // clear error as the user fixes the field
    $$("#enquire-form input").forEach(function (inp) {
      inp.addEventListener("input", function () { setErr(inp, false); });
      inp.addEventListener("change", function () { setErr(inp, false); });
    });
  }

  /* ---------- Footer year ---------- */
  var yr = $("[data-year]");
  if (yr) yr.textContent = new Date().getFullYear();
})();
