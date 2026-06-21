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
  var angleKey = document.body.getAttribute("data-angle") || "cost";

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
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { nav.classList.remove("open"); toggle.classList.remove("open"); });
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
     COMPARISON BARS (animate width on view)
     ===================================================================== */
  document.querySelectorAll("[data-bar]").forEach(function (track) {
    var fill = track.querySelector(".bar-fill");
    var pct = track.getAttribute("data-bar");
    var bo = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { fill.style.width = pct + "%"; bo.unobserve(e.target); } });
    }, { threshold: 0.4 });
    bo.observe(track);
  });

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
     FLOOR PLAN explorer
     ===================================================================== */
  var fp = document.querySelector("[data-floorplans]");
  if (fp) {
    var tabsWrap = fp.querySelector(".fp-tabs");
    var stage = fp.querySelector(".fp-stage");
    UNITS.forEach(function (u, i) {
      var b = document.createElement("button");
      b.className = "fp-tab" + (i === 0 ? " active" : "");
      b.innerHTML = '<span><span class="ttl">' + u.name + '</span><span class="sub">' + u.facing +
        ' facing · ' + u.area + ' sft</span></span><span class="sz">' + crore(priceOf(u.area)) + '</span>';
      b.addEventListener("click", function () {
        tabsWrap.querySelectorAll(".fp-tab").forEach(function (t) { t.classList.remove("active"); });
        b.classList.add("active"); renderPlan(u);
      });
      tabsWrap.appendChild(b);
    });
    function renderPlan(u) {
      stage.innerHTML =
        '<div class="fp-stage-head">' +
          '<h3>' + u.name + '</h3>' +
          '<span class="badge">' + u.facing + ' Facing</span>' +
          '<span class="badge">' + u.area + ' sft (SBA)</span>' +
          '<span class="price">' + crore(priceOf(u.area)) + '<small>Indicative · @ ₹' + RATE.toLocaleString("en-IN") + '/sft</small></span>' +
        '</div>' +
        '<div class="fp-img" data-zoom="' + u.img + '"><img src="' + u.img + '" alt="' + u.name + ' floor plan" loading="lazy"></div>' +
        '<p class="muted" style="margin-top:14px;font-size:.92rem">' + u.rooms + '</p>';
      stage.querySelector(".fp-img").addEventListener("click", function () { openLightbox([u.img], 0); });
    }
    renderPlan(UNITS[0]);
  }

  /* =====================================================================
     CALCULATOR — tabbed: (1) affordability/eligibility from income,
     (2) rent-vs-own top-up. Shares the EMI maths and Nivasa pricing.
     ===================================================================== */
  var calcRoot = document.querySelector("[data-calc]");
  if (calcRoot) {
    var TIERS = [
      { label: "2 BHK · 1,375 sft", area: 1375 },
      { label: "3 BHK · 1,700 sft", area: 1700 },
      { label: "3 BHK · 1,845 sft", area: 1845 },
      { label: "3 BHK · 2,205 sft", area: 2205 }
    ];
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
      $("aff-loan").textContent = crore(loan);
      $("aff-budget").textContent = crore(budget);
      $("aff-maxemi").textContent = inr(maxEMI);
      $("aff-dpamt").textContent = crore(budget - loan);
      $("aff-area").textContent = Math.round(area).toLocaleString("en-IN") + " sft";
      $("aff-income-tot").textContent = crore(inc);
      var best = null;
      var rows = TIERS.map(function (t) {
        var price = t.area * RATE, ok = price <= budget; if (ok) best = t;
        return '<div class="fit-row ' + (ok ? "ok" : "no") + '"><span class="fk">' + (ok ? "✓" : "✕") + '</span>' +
          '<span class="fl">' + t.label + '</span><span class="fp">' + crore(price) + '</span></div>';
      }).join("");
      var head = best ? ('Your income can own up to a <b>' + best.label + '</b> at Nivasa.')
                      : 'Just shy of our current configs — talk to Bharat about flexible plans.';
      $("aff-fit").innerHTML = '<p class="fit-head">' + head + '</p>' + rows;
      $("aff-income-val").textContent = crore(num(aInc));
      $("aff-co-val").textContent = crore(num(aCoInc));
      $("aff-emi-val").textContent = crore(num(aEx));
      $("aff-foir-val").textContent = aFoir.value + "% of income";
      $("aff-rate-val").textContent = (+aRate.value).toFixed(1) + "%";
      $("aff-ten-val").textContent = aTen.value + " yrs";
      $("aff-dp-val").textContent = aDp.value + "%";
      [aFoir, aRate, aTen, aDp].forEach(fill);
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
    function calcRent() {
      var rent = num(rRent);
      var price = priceOf(+rUnit.value);
      var dp = +rDp.value / 100;
      var loan = price * (1 - dp);
      var emi = emiOf(loan, +rRate.value, +rTen.value);
      var top = emi - rent;
      $("rnt-topup").innerHTML = (top > 0 ? inr(top) : "₹0") + '<small>/mo more</small>';
      $("rnt-rentecho").textContent = inr(rent).replace("₹", "");
      $("rnt-emi").textContent = inr(emi);
      $("rnt-rent2").textContent = inr(rent);
      $("rnt-dpamt").textContent = crore(price * dp);
      $("rnt-equity").textContent = crore(price);
      $("rnt-msg").textContent = top <= 0
        ? "Your rent already covers the EMI — you could own this home for what you pay now, and stop paying off someone else's loan."
        : "You already pay " + inr(rent) + " a month in rent. For about " + inr(top) + " more, that money builds your own " + crore(price) + " asset — instead of zero equity.";
      $("rnt-rent-val").textContent = inr(rent);
      $("rnt-dp-val").textContent = rDp.value + "% · " + crore(price * dp);
      $("rnt-rate-val").textContent = (+rRate.value).toFixed(1) + "%";
      $("rnt-ten-val").textContent = rTen.value + " yrs";
      [rDp, rRate, rTen].forEach(fill);
    }
    rRent.addEventListener("input", calcRent);
    rUnit.addEventListener("change", calcRent);
    [rDp, rRate, rTen].forEach(function (el) { el.addEventListener("input", calcRent); });
    calcRent();
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

  var galWrap = document.querySelector("[data-gallery]");
  if (galWrap) {
    var figs = Array.prototype.slice.call(galWrap.querySelectorAll("figure"));
    var srcs = figs.map(function (f) { return f.querySelector("img").getAttribute("data-full") || f.querySelector("img").src; });
    figs.forEach(function (f, i) { f.addEventListener("click", function () { openLightbox(srcs, i); }); });
  }

  /* =====================================================================
     LEAD FORM validation + simulated submit (WhatsApp + DB in live build)
     ===================================================================== */
  var EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  document.querySelectorAll("[data-leadform]").forEach(function (form) {
    var success = form.parentNode.querySelector(".form-success");
    // intent="brochure" → email-only soft capture; default "lead" → name + phone.
    var intent = form.getAttribute("data-intent") === "brochure" ? "brochure" : "lead";
    function fail(field, msg) {
      var wrap = field.closest(".form-field"); wrap.classList.add("err");
      var e = wrap.querySelector(".form-err"); if (e && msg) e.textContent = msg;
    }
    form.querySelectorAll("input,select,textarea").forEach(function (f) {
      f.addEventListener("input", function () { f.closest(".form-field").classList.remove("err"); });
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
        if (!email || !EMAIL_RE.test(email.value.trim())) { if (email) fail(email, "Enter a valid email"); ok = false; }
      } else {
        if (name && !name.value.trim()) { fail(name, "Please enter your name"); ok = false; }
        if (phone && !/^[6-9]\d{9}$/.test(phone.value.replace(/\D/g, "").slice(-10))) { fail(phone, "Enter a valid 10-digit mobile"); ok = false; }
        if (email && email.value && !EMAIL_RE.test(email.value)) { fail(email, "Enter a valid email"); ok = false; }
      }
      if (!ok) return;
      // Live: POST to D1 + sales email via /api/lead
      var btn = form.querySelector("button[type=submit]");
      btn.textContent = "Sending…"; btn.disabled = true;
      function showSuccess() {
        form.style.display = "none";
        if (success) {
          success.classList.add("show");
          var nm = success.querySelector("[data-name]"); if (nm && name) nm.textContent = name.value.trim().split(" ")[0];
        }
        // brochure prompt: kick off the actual PDF download once captured
        var dl = form.getAttribute("data-download");
        if (dl) {
          var a = document.createElement("a");
          a.href = dl; a.setAttribute("download", "");
          document.body.appendChild(a); a.click(); a.remove();
        }
        if (window.track) window.track(intent === "brochure" ? "brochure_request" : "lead_submit", { page: angleKey });
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
          utm: location.search
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
     YEAR + smooth anchor offset
     ===================================================================== */
  document.querySelectorAll("[data-year]").forEach(function (e) { e.textContent = new Date().getFullYear(); });
})();
