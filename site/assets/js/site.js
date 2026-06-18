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

  /* =====================================================================
     COMPARISON — data-driven from "Nivasa vs New Launch Branded Builder
     2026" (Sheet 1), plus a rental-yield row inserted above handover.
     Renders the full scoreboard ([data-compare]) and the grouped
     deep-dives ([data-groups]). Runs before the reveal/count observers
     below so injected nodes get picked up.
     ===================================================================== */
  // Sheet 1 is grouped into three "comparatives" (the breaks below). The
  // scoreboard renders them as section dividers; the deep-dives reuse the
  // same three groups, with each variant floating its own group first.
  var CMP = [
    // ── The Cost Comparative ──
    { g:"cost",    metric:"Price / sft",            sub:"Same Kollur micro-market",       us:"₹7,000",   them:"₹8,500",   edge:"₹1,500/sft lighter", v:"win" },
    { g:"cost",    metric:"Total cost · 1,375 sft", sub:"Like-for-like home",             us:"₹96.25 L", them:"₹1.17 Cr", edge:"You keep ₹20.6 L",   v:"win" },
    // ── The Product Comparative ──
    { g:"product", metric:"Flats per acre",         sub:"How dense it feels",             us:"131",      them:"178",      edge:"26% less dense",     v:"win" },
    { g:"product", metric:"Ceiling height",         sub:"Floor to ceiling",               us:"9.8 ft",   them:"9.8 ft",   edge:"Matched",            v:"tie" },
    { g:"product", metric:"Car parks / home",       sub:"Covered parking",                us:"2.09",     them:"1.86",     edge:"13% more parking",   v:"win" },
    { g:"product", metric:"Built-up ÷ saleable",    sub:"Usable floor you pay for",       us:"0.77",     them:"0.70",     edge:"7% more livable",    v:"win" },
    { g:"product", metric:"Distance from ORR",      sub:"To the expressway",              us:"2.1 km",   them:"1.9 km",   edge:"+200 m · ~30 sec",   v:"tie" },
    { g:"product", metric:"Corridor width",         sub:"Shared corridors",               us:"8–14 ft",  them:"6–8 ft",   edge:"Wider & brighter",   v:"win" },
    // ── The Yield Comparative ──
    { g:"yield",   metric:"Handover",               sub:"Keys in your hand",              us:"2027",     them:"2031",     edge:"4 years earlier",    v:"win" },
    { g:"yield",   metric:"Rent collected by 2032", sub:"You earn from 2028; they build", us:"₹16.8 L",  them:"₹0",       edge:"₹16.8 L ahead",      v:"win" },
    { g:"yield",   metric:"Resale /sft @ 2031",     sub:"On a ₹7,000 entry vs ₹8,500",    us:"₹11,000",  them:"₹12,000",  edge:">14% higher ROI",    v:"win" }
  ];
  var GROUP_SEQ = ["cost", "product", "yield"];   // canonical (Sheet 1) order
  var GROUPS = {
    cost:    { label:"The Cost Comparative",    kicker:"What you pay",    line:"Same address, same carpet — a lighter cheque, and a lighter EMI." },
    product: { label:"The Product Comparative", kicker:"What you get",    line:"Less dense, more usable floor, more parking, wider corridors." },
    yield:   { label:"The Yield Comparative",   kicker:"What it returns", line:"Earlier handover, rent from 2028, and a higher ROI by 2031." }
  };
  var GROUP_ORDER = {
    cost:     ["cost", "product", "yield"],
    yield:    ["yield", "cost", "product"],
    handover: ["yield", "cost", "product"]
  };
  // Per page, highlight one metric inside the lead group.
  var HILITE = { yield: "Rent collected by 2032", handover: "Handover" };

  function renderCompare(host) {
    var wins = 0, ties = 0;
    CMP.forEach(function (r) { if (r.v === "win") wins++; else if (r.v === "tie") ties++; });
    var body = "";
    GROUP_SEQ.forEach(function (key) {
      var meta = GROUPS[key];
      body += '<div class="cmp-break"><span class="bk-t">' + meta.label + '</span>' +
        '<span class="bk-s">' + meta.kicker + '</span></div>';
      CMP.filter(function (r) { return r.g === key; }).forEach(function (r, i) {
        body += '<div class="cmp-row" data-v="' + r.v + '">' +
          '<div class="cr-metric"><span class="cr-n">0' + (i + 1) + '</span>' +
            '<span class="cr-name">' + r.metric + '<small>' + r.sub + '</small></span></div>' +
          '<div class="cr-us"><span class="cr-cap">Nivasa</span>' + r.us + '</div>' +
          '<div class="cr-them"><span class="cr-cap">Branded</span>' + r.them + '</div>' +
          '<div class="cr-edge"><span class="cr-pill cr-' + r.v + '">' + r.edge + '</span></div>' +
        '</div>';
      });
    });
    host.innerHTML =
      '<div class="cmp-score reveal">' +
        '<div class="cs-cell"><b data-count="' + wins + '">' + wins + '</b><span>points ahead</span></div>' +
        '<div class="cs-cell"><b data-count="' + ties + '">' + ties + '</b><span>level pegging</span></div>' +
        '<div class="cs-cell"><b>0</b><span>points behind</span></div>' +
        '<div class="cs-note">Elegant Nivasa vs a new-launch branded builder · same micro-market · 2026 model</div>' +
      '</div>' +
      '<div class="cmp-tbl reveal d1">' +
        '<div class="cmp-hrow"><div>The full audit</div><div>Elegant Nivasa</div><div>Branded builder</div><div>The edge</div></div>' +
        body +
      '</div>' +
      '<div class="cmp-bottom reveal d1">' +
        '<div class="adv-row">' +
          '<div class="adv-card"><div class="a">₹20.6L</div><div class="l">Lower entry cost</div></div>' +
          '<div class="adv-op">+</div>' +
          '<div class="adv-card"><div class="a">₹16.8L</div><div class="l">Rent earned by 2032</div></div>' +
          '<div class="adv-op">+</div>' +
          '<div class="adv-card"><div class="a">₹6.2L</div><div class="l">Interest saved</div></div>' +
          '<div class="adv-op">=</div>' +
          '<div class="adv-card total"><div class="a">₹43.6L</div><div class="l">Total advantage</div></div>' +
        '</div>' +
        '<p class="cmp-tagline">Same cheque today. <span>A great deal more over time — plus &gt;14% higher ROI.</span></p>' +
      '</div>';
  }

  function renderGroups(host, page) {
    var order = GROUP_ORDER[page] || GROUP_ORDER.cost;
    var hot = HILITE[page] || "";
    host.innerHTML = order.map(function (key, gi) {
      var meta = GROUPS[key];
      var lead = gi === 0;
      var cards = CMP.filter(function (r) { return r.g === key; }).map(function (r) {
        var isHot = r.metric === hot;
        return '<div class="gr-card" data-v="' + r.v + '"' + (isHot ? ' data-hot="1"' : '') + '>' +
          '<div class="gr-top"><span class="gr-metric">' + r.metric + '</span>' +
            (isHot ? '<span class="gr-foc">Your focus</span>' : '<span class="gr-edge">' + r.edge + '</span>') + '</div>' +
          '<div class="gr-vs">' +
            '<div class="gr-side us"><span class="lab">Elegant Nivasa</span><span class="val">' + r.us + '</span></div>' +
            '<div class="gr-div">vs</div>' +
            '<div class="gr-side them"><span class="lab">Branded builder</span><span class="val">' + r.them + '</span></div>' +
          '</div>' +
          '<div class="gr-foot"><span class="gr-tick gr-' + r.v + '">' + (r.v === "win" ? "Nivasa ahead" : "Level") + '</span>' +
            '<span class="gr-sub">' + (isHot ? r.edge : r.sub) + '</span></div>' +
        '</div>';
      }).join("");
      return '<article class="grp reveal' + (lead ? " grp--lead" : "") + '">' +
        '<header class="grp-head">' +
          '<p class="eyebrow">' + meta.kicker + (lead ? " · your angle" : "") + '</p>' +
          '<h3 class="grp-title">' + meta.label + '</h3>' +
          '<p class="grp-line">' + meta.line + '</p>' +
        '</header>' +
        '<div class="grp-rows">' + cards + '</div>' +
      '</article>';
    }).join("");
  }

  var pageKey = document.body.getAttribute("data-page") || "cost";
  var cmpHost = document.querySelector("[data-compare]");
  var grpHost = document.querySelector("[data-groups]");
  if (cmpHost) renderCompare(cmpHost);
  if (grpHost) renderGroups(grpHost, pageKey);

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
      var inc = (+aInc.value || 0) + (aCo.checked ? (+aCoInc.value || 0) : 0);
      var maxEMI = Math.max(inc * (+aFoir.value / 100) - (+aEx.value || 0), 0);
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
      $("aff-income-val").textContent = crore(+aInc.value || 0);
      $("aff-co-val").textContent = crore(+aCoInc.value || 0);
      $("aff-emi-val").textContent = crore(+aEx.value || 0);
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
    UNITS.slice().sort(function (a, b) { return a.area - b.area; }).forEach(function (u) {
      var o = document.createElement("option");
      o.value = u.area; o.textContent = u.name + " · " + u.area + " sft — " + crore(priceOf(u.area));
      rUnit.appendChild(o);
    });
    function calcRent() {
      var rent = +rRent.value || 0;
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
  document.querySelectorAll("[data-leadform]").forEach(function (form) {
    var success = form.parentNode.querySelector(".form-success");
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
      if (name && !name.value.trim()) { fail(name, "Please enter your name"); ok = false; }
      if (phone && !/^[6-9]\d{9}$/.test(phone.value.replace(/\D/g, "").slice(-10))) { fail(phone, "Enter a valid 10-digit mobile"); ok = false; }
      if (email && email.value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)) { fail(email, "Enter a valid email"); ok = false; }
      if (!ok) return;
      // Simulate async submit (live build → POST to DB + WhatsApp trigger)
      var btn = form.querySelector("button[type=submit]");
      var label = btn.textContent; btn.textContent = "Sending…"; btn.disabled = true;
      setTimeout(function () {
        form.style.display = "none";
        if (success) {
          success.classList.add("show");
          var nm = success.querySelector("[data-name]"); if (nm && name) nm.textContent = name.value.trim().split(" ")[0];
        }
        btn.textContent = label; btn.disabled = false;
      }, 850);
    });
  });

  /* =====================================================================
     WHATSAPP direct-connect — page-aware prefilled message per rep
     ===================================================================== */
  var WA_MSG = {
    cost:     "Hi {rep}, I saw the Elegant Nivasa cost comparison at Kollur — can you send the best price for a 3 BHK and current availability?",
    yield:    "Hi {rep}, I'm looking at Elegant Nivasa, Kollur for rental yield — can you share pricing and the expected rentals/possession?",
    handover: "Hi {rep}, I'm interested in Elegant Nivasa, Kollur (June 2027 possession) — can you share price, availability and a site-visit slot?"
  };
  document.querySelectorAll("[data-wa]").forEach(function (a) {
    var num = a.getAttribute("data-wa");
    var rep = a.getAttribute("data-rep") || "team";
    var msg = (WA_MSG[pageKey] || WA_MSG.cost).replace("{rep}", rep);
    a.setAttribute("href", "https://wa.me/" + num + "?text=" + encodeURIComponent(msg));
  });

  /* =====================================================================
     YEAR + smooth anchor offset
     ===================================================================== */
  document.querySelectorAll("[data-year]").forEach(function (e) { e.textContent = new Date().getFullYear(); });
})();
