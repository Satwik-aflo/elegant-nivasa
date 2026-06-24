/* =========================================================================
   ELEGANT NIVASA — shared interactions
   Self-contained, no dependencies. Each page includes this once.
   ========================================================================= */
(function () {
  "use strict";

  /* ---------- shared data ---------- */
  // Super built-up area (sft) per official brochure; price = rate x area.
  // Rate is the campaign starting rate (₹6,999/sft). Indicative — placeholder.
  var RATE = 6999;
  var UNITS = [
    { id: "t1", name: "Type 1 · 3 BHK", area: 1700, facing: "East",  img: "assets/img/floorplans/type-1.png",
      rooms: "Drawing · Living/Dining · 3 Bedrooms · 3 Toilets · Pooja · Kitchen · Utility · Balcony" },
    { id: "t2", name: "Type 2 · 3 BHK", area: 1375, facing: "West",  img: "assets/img/floorplans/type-2.png",
      rooms: "Drawing · Living/Dining · 3 Bedrooms · 2 Toilets · Pooja · Kitchen · Utility · Balcony" },
    { id: "t5", name: "Type 5 · 2 BHK", area: 1375, facing: "North", img: "assets/img/floorplans/type-5.png",
      rooms: "Drawing · Living/Dining · 2 Bedrooms · 2 Toilets · Kitchen · Utility · Balcony" },
    { id: "t4", name: "Type 4 · 3 BHK", area: 1845, facing: "West",  img: "assets/img/floorplans/type-4.png",
      rooms: "Drawing · Living/Dining · 3 Bedrooms · 3 Toilets · Pooja · Kitchen · Utility · 2 Balconies" },
    { id: "t6", name: "Type 6 · 3 BHK", area: 1845, facing: "East",  img: "assets/img/floorplans/type-6.png",
      rooms: "Drawing · Living/Dining · 3 Bedrooms · 3 Toilets · Pooja · Kitchen · Utility · Balcony" },
    { id: "t3", name: "Type 3 · 3 BHK", area: 2205, facing: "West",  img: "assets/img/floorplans/type-3.png",
      rooms: "Drawing · Living/Dining · 3 Bedrooms · 3 Toilets · Pooja · Dress · Kitchen · Utility · 2 Balconies" }
  ];
  function priceOf(area) { return area * RATE; }

  /* ---------- currency formatting (Indian) ---------- */
  function inr(n) {
    n = Math.round(n);
    var s = n.toString(), last3 = s.slice(-3), rest = s.slice(0, -3);
    if (rest) last3 = "," + last3;
    rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    return "₹" + rest + last3;
  }
  function crore(n) { // compact ₹ in Cr / L
    if (n >= 1e7) return "₹" + (n / 1e7).toFixed(2).replace(/\.?0+$/, "") + " Cr";
    if (n >= 1e5) return "₹" + (n / 1e5).toFixed(1).replace(/\.0$/, "") + " L";
    return inr(n);
  }

  // Comparison content (Scoreboard + angle-lead) is now rendered at BUILD TIME
  // from src/data/comparison.ts (ADR-0002); this file is behaviour-only. The
  // canonical Angle key is read off the <body> for analytics + WhatsApp text.
  // Sub-sites set data-angle (cost|handover|yield); the homepage/privacy set
  // data-page (home|legal). Fall through both so analytics labels each route
  // correctly — never silently default homepage events to "cost".
  var angleKey = document.body.getAttribute("data-angle")
    || document.body.getAttribute("data-page")
    || "home";

  /* ---------- ad-tag (UTM) capture ----------
     The ad's link carries ?utm_source=google&utm_campaign=…&utm_content=<angle>.
     We stash it on first landing so the source survives navigation — e.g. a
     visitor lands on /cost (tagged), clicks "explore full project" to the
     homepage (untagged), then books: the lead still records the google ad it
     came from. First tagged URL of the session wins. */
  function adTag() {
    var KEY = "en_utm";
    try {
      var current = location.search || "";
      if (/[?&]utm_/.test(current)) { sessionStorage.setItem(KEY, current); return current; }
      return sessionStorage.getItem(KEY) || current;
    } catch (err) {
      return location.search || "";
    }
  }

  /* =====================================================================
     NAV: scroll state + mobile toggle
     ===================================================================== */
  var header = document.querySelector(".site-header");
  var onScroll = function () {
    if (header) header.classList.toggle("scrolled", window.scrollY > 24);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* =====================================================================
     REVEAL on scroll
     ===================================================================== */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  /* =====================================================================
     COUNT-UP for hero ribbon / facts
     ===================================================================== */
  document.querySelectorAll("[data-count]").forEach(function (el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var dec = (el.getAttribute("data-dec") | 0);
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; co.unobserve(e.target);
        var t0 = null, dur = 1400;
        function step(t) {
          if (!t0) t0 = t; var p = Math.min((t - t0) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = (eased * target).toFixed(dec) + suffix;
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    co.observe(el);
  });

  /* =====================================================================
     CALCULATOR — tabbed: (1) affordability/eligibility from income,
     (2) rent-vs-own top-up. Shares the EMI maths and Nivasa pricing.
     ===================================================================== */
  var calcRoot = document.querySelector("[data-calc]");
  if (calcRoot) {
    // `plans` = absolute plate paths (leading slash so they resolve on the
    // sub-sites' /cost/ etc., not just the homepage). Areas with two variants
    // (1,845) open both in the lightbox so the visitor can swipe between them.
    var TIERS = [
      { label: "2 BHK · 1,375 sft", area: 1375, plans: ["/assets/img/floorplans/type-5.png"] },
      { label: "3 BHK · 1,700 sft", area: 1700, plans: ["/assets/img/floorplans/type-1.png"] },
      { label: "3 BHK · 1,845 sft", area: 1845, plans: ["/assets/img/floorplans/type-4.png", "/assets/img/floorplans/type-6.png"] },
      { label: "3 BHK · 2,205 sft", area: 2205, plans: ["/assets/img/floorplans/type-3.png"] }
    ];
    // magnify glyph for the fit-row floor-plan thumbnail (the chosen affordance).
    var EYE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>';
    // warm the plate images so the result thumbnails paint instantly when the
    // fit list re-renders on every slider move (no flash from the cache miss).
    TIERS.forEach(function (t) { t.plans.forEach(function (src) { var im = new Image(); im.src = src; }); });
    function emiOf(P, annual, years) {
      var r = annual / 12 / 100, n = years * 12;
      return r === 0 ? P / n : (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }
    function loanFromEmi(e, annual, years) {
      if (e <= 0) return 0;
      var r = annual / 12 / 100, n = years * 12;
      return r === 0 ? e * n : e * (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n));
    }
    function fill(r) { var mn = +r.min, mx = +r.max; r.style.setProperty("--p", ((+r.value - mn) / (mx - mn) * 100) + "%"); }
    function $(id) { return calcRoot.querySelector("#" + id); }
    // Sanitize a free-text number input: no NaN, no negatives, no exponent
    // (type=number accepts "1e9"), capped at the field's own max.
    function num(el) {
      var v = +el.value;
      if (!isFinite(v) || v < 0) v = 0;
      var mx = +el.max;
      if (mx && v > mx) v = mx;
      return v;
    }

    // ---- tab switching ----
    var tabs = calcRoot.querySelectorAll(".calc-tab");
    var panels = calcRoot.querySelectorAll(".calc-panel");
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        tabs.forEach(function (x) { x.classList.remove("active"); });
        t.classList.add("active");
        var m = t.getAttribute("data-mode");
        panels.forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== m; });
      });
    });

    // ---- affordability ----
    var aInc = $("aff-income"), aCo = $("aff-co"), aCoWrap = $("aff-co-wrap"), aCoInc = $("aff-co-income"),
        aEx = $("aff-existing"), aFoir = $("aff-foir"), aRate = $("aff-rate"), aTen = $("aff-ten"), aDp = $("aff-dp");
    function calcAfford() {
      var inc = num(aInc) + (aCo.checked ? num(aCoInc) : 0);
      var maxEMI = Math.max(inc * (+aFoir.value / 100) - num(aEx), 0);
      var loan = loanFromEmi(maxEMI, +aRate.value, +aTen.value);
      var dp = +aDp.value / 100;
      var budget = dp < 1 ? loan / (1 - dp) : loan;
      var area = budget / RATE;
      // indicative money outputs carry a `*` (footer disclaimer); the echoed
      // user inputs (income considered) and the sft area do not.
      $("aff-loan").textContent = crore(loan) + "*";
      $("aff-budget").textContent = crore(budget) + "*";
      $("aff-maxemi").textContent = inr(maxEMI) + "*";
      $("aff-dpamt").textContent = crore(budget - loan) + "*";
      $("aff-area").textContent = Math.round(area).toLocaleString("en-IN") + " sft";
      $("aff-income-tot").textContent = crore(inc);
      var best = null;
      // Each config row is a button → opens that config's floor-plan plate(s).
      var rows = TIERS.map(function (t, ti) {
        var price = t.area * RATE, ok = price <= budget; if (ok) best = t;
        return '<button type="button" class="fit-row ' + (ok ? "ok" : "no") + '" data-plan="' + ti + '">' +
          '<span class="fk">' + (ok ? "✓" : "✕") + '</span>' +
          '<span class="fl">' + t.label + '</span>' +
          '<span class="fit-fp">' + crore(price) + '*</span>' +
          '<span class="fit-thumb"><img src="' + t.plans[0] + '" alt="" decoding="async">' +
          '<span class="fit-mag">' + EYE_SVG + '</span></span></button>';
      }).join("");
      // "talk to Bharat" is actionable: sub-sites have rep cards (#reps), the
      // homepage doesn't — there the same CTA opens the book-a-visit dialog.
      var noFitCta = document.getElementById("reps")
        ? '<a class="fit-cta" href="#reps">talk to Bharat about flexible plans</a>'
        : '<button type="button" class="fit-cta" data-book-fit>talk to Bharat about flexible plans</button>';
      var head = best ? ('Your income can own up to a <b>' + best.label + '</b> at Nivasa.')
                      : ('Just shy of our current configs — ' + noFitCta);
      $("aff-fit").innerHTML = '<p class="fit-head">' + head + '</p>' + rows;
      // wire the homepage CTA (re-injected each render; innerHTML drops the old node).
      var fitBtn = $("aff-fit").querySelector("[data-book-fit]");
      if (fitBtn) fitBtn.addEventListener("click", function () {
        var d = document.getElementById("bookDialog");
        if (!d) return;
        if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", "");
        var fi = d.querySelector("input"); if (fi) fi.focus();
        if (window.track) window.track("book_visit_open", { page: angleKey, from: "afford" });
      });
      // each config row → open its floor-plan plate(s) in the lightbox.
      $("aff-fit").querySelectorAll("[data-plan]").forEach(function (b) {
        b.addEventListener("click", function () {
          var t = TIERS[+b.getAttribute("data-plan")];
          if (!t || !t.plans || !t.plans.length) return;
          openLightbox(t.plans, 0);
          if (window.track) window.track("floorplan_view", { page: angleKey, from: "afford", config: t.label });
        });
      });
      $("aff-income-val").textContent = crore(num(aInc));
      $("aff-co-val").textContent = crore(num(aCoInc));
      $("aff-emi-val").textContent = crore(num(aEx));
      $("aff-foir-val").textContent = aFoir.value + "% of income";
      $("aff-rate-val").textContent = (+aRate.value).toFixed(1) + "%";
      $("aff-ten-val").textContent = aTen.value + " yrs";
      $("aff-dp-val").textContent = aDp.value + "%";
      [aFoir, aRate, aTen, aDp].forEach(fill);
      shrinkStars(calcRoot); // re-wrap the freshly-injected money-output stars
    }
    aCo.addEventListener("change", function () { aCoWrap.hidden = !aCo.checked; calcAfford(); });
    [aInc, aCoInc, aEx].forEach(function (el) { el.addEventListener("input", calcAfford); });
    [aFoir, aRate, aTen, aDp].forEach(function (el) { el.addEventListener("input", calcAfford); });
    calcAfford();

    // ---- rent vs own ----
    var rRent = $("rnt-rent"), rUnit = $("rnt-unit"), rDp = $("rnt-dp"), rRate = $("rnt-rate"), rTen = $("rnt-ten");
    // Block the keys type=number tolerates but we never want (exponent / sign).
    [aInc, aCoInc, aEx, rRent].forEach(function (el) {
      el.addEventListener("keydown", function (e) {
        if (e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-") e.preventDefault();
      });
    });
    UNITS.slice().sort(function (a, b) { return a.area - b.area; }).forEach(function (u) {
      var o = document.createElement("option");
      o.value = u.area; o.textContent = u.name + " · " + u.area + " sft — " + crore(priceOf(u.area));
      rUnit.appendChild(o);
    });
    var rPanel = calcRoot.querySelector('[data-panel="rent"] .emi-result');
    function calcRent() {
      var rent = num(rRent);
      var dp = +rDp.value / 100, rate = +rRate.value, ten = +rTen.value;
      // Largest config (by area ≡ price) whose full EMI the rent already covers.
      var covered = null;
      UNITS.forEach(function (u) {
        if (emiOf(priceOf(u.area) * (1 - dp), rate, ten) <= rent && (!covered || u.area > covered.area)) covered = u;
      });
      if (covered) {
        // STATE B — "your rent already buys a home": drive the panel off `covered`,
        // sync the dropdown to it (spec 2026-06-22-rent-owns-a-home-state).
        if (+rUnit.value !== covered.area) rUnit.value = covered.area;
        var price = priceOf(covered.area);
        var emi = emiOf(price * (1 - dp), rate, ten);
        var surplus = Math.round(rent - emi);
        var bhk = covered.name.split("·").pop().trim();           // "Type 4 · 3 BHK" -> "3 BHK"
        rPanel.classList.add("emi--owns");
        $("rnt-head").textContent = "Your rent already buys a home";
        $("rnt-topup").innerHTML = bhk + " · " + covered.area.toLocaleString("en-IN") +
          " sft<small>your rent already covers this — ₹0 more</small>";
        $("rnt-sub").textContent = surplus > 0 ? inr(surplus) + "/mo to spare after the EMI" : "";
        $("rnt-emi").textContent = inr(emi) + "*";
        $("rnt-rent2").textContent = inr(rent);
        $("rnt-dpamt").textContent = crore(price * dp) + "*";
        $("rnt-equity").textContent = crore(price) + "*";
        $("rnt-msg").textContent = "Your " + inr(rent) + " rent already covers the full EMI on this home. " +
          "You're paying for a home every month — it just isn't yours.";
        $("rnt-dp-val").textContent = rDp.value + "% · " + crore(price * dp);
      } else {
        // STATE A — top-up: driven by the dropdown-selected unit (existing behaviour).
        var price = priceOf(+rUnit.value);
        var emi = emiOf(price * (1 - dp), rate, ten);
        var top = emi - rent;
        rPanel.classList.remove("emi--owns");
        $("rnt-head").textContent = "Just a little more than rent";
        $("rnt-topup").innerHTML = (top > 0 ? inr(top) : "₹0") + '*<small>/mo more</small>';
        $("rnt-sub").textContent = "on top of your " + inr(rent) + " rent — and the home is yours";
        $("rnt-emi").textContent = inr(emi) + "*";
        $("rnt-rent2").textContent = inr(rent);
        $("rnt-dpamt").textContent = crore(price * dp) + "*";
        $("rnt-equity").textContent = crore(price) + "*";
        $("rnt-msg").textContent = "You already pay " + inr(rent) + " a month in rent. For about " +
          inr(top) + " more, that money builds your own " + crore(price) + " asset — instead of zero equity.";
        $("rnt-dp-val").textContent = rDp.value + "% · " + crore(price * dp);
      }
      $("rnt-rent-val").textContent = inr(rent);
      $("rnt-rate-val").textContent = (+rRate.value).toFixed(1) + "%";
      $("rnt-ten-val").textContent = rTen.value + " yrs";
      [rDp, rRate, rTen].forEach(fill);
      shrinkStars(calcRoot); // re-wrap the freshly-injected money-output stars
    }
    rRent.addEventListener("input", calcRent);
    rUnit.addEventListener("change", calcRent);
    [rDp, rRate, rTen].forEach(function (el) { el.addEventListener("input", calcRent); });
    calcRent();

    // "See all floor plans" link in each result panel (both tabs). Homepage has
    // a #plans section to scroll to; sub-sites link to the homepage's (/#plans).
    var plansHref = document.getElementById("plans") ? "#plans" : "/#plans";
    calcRoot.querySelectorAll(".emi-result").forEach(function (res) {
      var a = document.createElement("a");
      a.className = "calc-plans-link";
      a.href = plansHref;
      a.innerHTML = 'See all six floor plans <span aria-hidden="true">→</span>';
      a.addEventListener("click", function () {
        if (window.track) window.track("floorplan_view", { page: angleKey, from: "viewall" });
      });
      res.appendChild(a);
    });
  }

  /* =====================================================================
     GALLERY lightbox (delegated)
     ===================================================================== */
  var lb, lbImg, gallerySet = [], gIndex = 0;
  function buildLightbox() {
    if (lb) return;
    lb = document.createElement("div");
    lb.className = "lightbox";
    lb.innerHTML =
      '<button class="lb-close" aria-label="Close">&times;</button>' +
      '<button class="lb-nav lb-prev" aria-label="Previous">&#8249;</button>' +
      '<img alt="">' +
      '<button class="lb-nav lb-next" aria-label="Next">&#8250;</button>';
    document.body.appendChild(lb);
    lbImg = lb.querySelector("img");
    lb.querySelector(".lb-close").addEventListener("click", closeLightbox);
    lb.querySelector(".lb-prev").addEventListener("click", function (e) { e.stopPropagation(); step(-1); });
    lb.querySelector(".lb-next").addEventListener("click", function (e) { e.stopPropagation(); step(1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLightbox(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });
  }
  function openLightbox(set, i) {
    buildLightbox(); gallerySet = set; gIndex = i;
    lbImg.src = set[i]; lb.classList.add("open"); document.body.style.overflow = "hidden";
    lb.querySelectorAll(".lb-nav").forEach(function (n) { n.style.display = set.length > 1 ? "grid" : "none"; });
  }
  function closeLightbox() { lb.classList.remove("open"); document.body.style.overflow = ""; }
  function step(d) { gIndex = (gIndex + d + gallerySet.length) % gallerySet.length; lbImg.src = gallerySet[gIndex]; }

  // wire EVERY [data-gallery] (the homepage has two: the gallery grid AND the
  // floor-plans grid). Each gallery gets its own image set so prev/next stays
  // within it. querySelector (singular) used to wire only the first → the
  // floor-plan "Enlarge" cards were dead on both desktop and mobile.
  document.querySelectorAll("[data-gallery]").forEach(function (galWrap) {
    var figs = Array.prototype.slice.call(galWrap.querySelectorAll("figure"));
    var srcs = figs.map(function (f) { return f.querySelector("img").getAttribute("data-full") || f.querySelector("img").src; });
    figs.forEach(function (f, i) { f.addEventListener("click", function () { openLightbox(srcs, i); }); });
  });

  /* =====================================================================
     LEAD FORM validation + simulated submit (WhatsApp + DB in live build)
     ===================================================================== */
  var EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  var PHONE_RE = /^[6-9]\d{9}$/;           // Indian mobile: 10 digits, starts 6-9
  // last 10 digits, so a pasted "+91 98765 43210" still resolves correctly
  var phone10 = function (v) { var d = v.replace(/\D/g, ""); return d.length > 10 ? d.slice(-10) : d; };
  document.querySelectorAll("[data-leadform]").forEach(function (form) {
    // intent="brochure" → email-only soft capture; default "lead" → name + phone.
    var intent = form.getAttribute("data-intent") === "brochure" ? "brochure" : "lead";
    function fail(field, msg) {
      var wrap = field.closest(".form-field"); wrap.classList.add("err");
      var e = wrap.querySelector(".form-err"); if (e && msg) e.textContent = msg;
    }
    // single source of truth for per-field rules (used live, on blur, and on submit)
    function valid(f) {
      var n = f.getAttribute("name"), v = f.value.trim();
      if (n === "name") return v.length >= 2;
      if (n === "phone") return PHONE_RE.test(phone10(f.value));
      if (n === "email") return intent === "brochure" ? EMAIL_RE.test(v) : (!v || EMAIL_RE.test(v));
      return true;
    }
    function msgFor(f) {
      var n = f.getAttribute("name");
      return n === "name" ? "Please enter your name"
           : n === "phone" ? "Enter a valid 10-digit mobile"
           : "Enter a valid email";
    }
    form.querySelectorAll("input,select,textarea").forEach(function (f) {
      var isPhone = f.getAttribute("name") === "phone";
      f.addEventListener("input", function () {
        if (isPhone) f.value = phone10(f.value);   // restrict to digits as they type
        f.closest(".form-field").classList.remove("err");
      });
      // surface problems when leaving a field — but don't nag an empty one
      f.addEventListener("blur", function () {
        if (f.value.trim() && !valid(f)) fail(f, msgFor(f));
      });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      var name = form.querySelector("[name=name]");
      var phone = form.querySelector("[name=phone]");
      var email = form.querySelector("[name=email]");
      form.querySelectorAll(".form-field").forEach(function (w) { w.classList.remove("err"); });
      if (intent === "brochure") {
        // email required & valid; name/phone optional
        if (!email || !valid(email)) { if (email) fail(email, msgFor(email)); ok = false; }
      } else {
        if (name && !valid(name)) { fail(name, msgFor(name)); ok = false; }
        if (phone && !valid(phone)) { fail(phone, msgFor(phone)); ok = false; }
        if (email && email.value && !valid(email)) { fail(email, msgFor(email)); ok = false; }
      }
      if (!ok) return;
      // Live: POST to D1 + sales email via /api/lead
      var btn = form.querySelector("button[type=submit]");
      btn.textContent = "Sending…"; btn.disabled = true;
      function showSuccess() {
        // Lead is already written to D1. Navigate to the matching thank-you page; it
        // fires the conversion on load (Meta + Clarity + dataLayer via track(), GTM
        // page-view → Google Ads) and, for brochure, auto-starts the PDF download.
        window.location.href = intent === "brochure" ? "/thank-you-brochure/" : "/thank-you-visit/";
      }
      fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: intent,
          name: name ? name.value.trim() : "",
          phone: phone ? phone.value.replace(/\D/g, "").slice(-10) : "",
          email: email ? email.value.trim() : "",
          source_page: location.pathname,
          utm: adTag()
        })
      }).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      }).then(showSuccess).catch(function () {
        btn.textContent = "Try again"; btn.disabled = false;
      });
    });
  });

  /* =====================================================================
     DIALOGS — a trigger opens a native <dialog> in place instead of
     navigating (href kept as a no-JS fallback). Native <dialog> gives us
     Esc-to-close + focus trapping for free. Two dialogs:
       [data-book]      → book-a-visit (name + phone, intent=lead)
       [data-brochure]  → brochure email prompt (email, intent=brochure)
     Internal links (close ✕, "download without email") have no trigger attr.
     ===================================================================== */
  function wireDialog(dlg, triggerSel, trackName) {
    if (!dlg) return;
    document.querySelectorAll(triggerSel).forEach(function (trigger) {
      trigger.addEventListener("click", function (e) {
        e.preventDefault();
        if (typeof dlg.showModal === "function") dlg.showModal();
        else dlg.setAttribute("open", "");
        var firstInput = dlg.querySelector("input");
        if (firstInput) firstInput.focus();
        if (window.track) window.track(trackName, { page: angleKey });
      });
    });
    dlg.querySelectorAll("[data-book-close]").forEach(function (x) {
      x.addEventListener("click", function () { dlg.close(); });
    });
    // click on the backdrop (outside the card) closes
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg) dlg.close();
    });
  }
  wireDialog(document.getElementById("bookDialog"), "[data-book]", "book_visit_open");
  wireDialog(document.getElementById("brochureDialog"), "[data-brochure]", "brochure_open");

  /* =====================================================================
     WHATSAPP direct-connect — prefilled message baked in at build time
     ===================================================================== */
  document.querySelectorAll("[data-wa]").forEach(function (a) {
    // Number is base64-encoded in markup (anti-scrape, CLAUDE.md §3); decode here.
    var num = "";
    try { num = atob(a.getAttribute("data-wa") || ""); } catch (err) { num = ""; }
    if (!/^\d{8,15}$/.test(num)) return; // bad/empty payload — leave link inert
    var rep = a.getAttribute("data-rep") || "team";
    // Message text is build-time injected per Angle (ADR-0002); {rep} filled here.
    var msg = (a.getAttribute("data-wa-msg") || "Hi {rep}, I'd like to know more about Elegant Nivasa.").replace("{rep}", rep);
    a.setAttribute("href", "https://wa.me/" + num + "?text=" + encodeURIComponent(msg));
    a.setAttribute("target", "_blank");
    a.addEventListener("click", function () {
      if (window.track) window.track("whatsapp_click", { page: angleKey, rep: rep });
    });
  });

  /* =====================================================================
     Generic click tracking — any [data-track] element fires its named event
     through track() (Clarity + Meta + Google Ads). Covers the homepage
     sticky-bar Call / WhatsApp, which are plain tel:/wa.me anchors (not
     dialogs or [data-wa]), so every direct contact gets attributed.
     ===================================================================== */
  document.querySelectorAll("[data-track]").forEach(function (el) {
    el.addEventListener("click", function () {
      if (window.track) window.track(el.getAttribute("data-track"), { page: angleKey });
    });
  });

  /* =====================================================================
     YEAR + smooth anchor offset
     ===================================================================== */
  document.querySelectorAll("[data-year]").forEach(function (e) { e.textContent = new Date().getFullYear(); });

  /* =====================================================================
     FOOTNOTE STARS — every figure carries a literal "*" tied to the footer
     disclaimer. Shrink each into a small superscript marker (<sup.dstar>).
     Most *-bearing copy is server-rendered (caught by the one-time pass on
     load below); the EMI calculator re-injects starred money outputs on every
     slider move, so calcAfford()/calcRent() call shrinkStars(calcRoot) again
     after each render to re-wrap their fresh stars (already-wrapped <sup> are
     skipped, and re-rendered textContent drops the old <sup> first).
     ===================================================================== */
  function shrinkStars(root) {
    root = root || document.body;
    var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, SUP: 1, NOSCRIPT: 1, OPTION: 1 };
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue || n.nodeValue.indexOf("*") < 0) return NodeFilter.FILTER_REJECT;
        if (n.parentNode && SKIP[n.parentNode.nodeName]) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function (node) {
      var parts = node.nodeValue.split("*");
      var frag = document.createDocumentFragment();
      parts.forEach(function (p, i) {
        if (i > 0) {
          var s = document.createElement("sup");
          s.className = "dstar"; s.textContent = "*";
          frag.appendChild(s);
        }
        if (p) frag.appendChild(document.createTextNode(p));
      });
      node.parentNode.replaceChild(frag, node);
    });
  }
  shrinkStars();
})();
