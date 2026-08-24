/* Crema landing v3 — page script.
   Lives in its own file because vercel.json's CSP blocks every inline <script>.
   Three jobs: mount the scroll engine, run the live cost desk, drive the folio. */
(function () {
  'use strict';

  /* ---------- 1. scroll engine ---------- */
  if (window.ScrollCraft && ScrollCraft.mount) ScrollCraft.mount(document.body);

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canMove = !reduce && 'IntersectionObserver' in window && 'requestAnimationFrame' in window;

  /* ---------- 2. THE COST DESK (the signature move) -------------------------
     Crema's shipped demo shop. `base` is everything that is not whole milk
     (beans, cup, lid, sleeve, syrup) held constant; `oz` is fluid ounces of
     whole milk. At the $4.55/gal default these reproduce the app's own numbers
     exactly, which is the point: this is the product's arithmetic, not a mock.
     ponytail: six drinks hard-coded here rather than fetched from the app's
     seed — the seed is not served to this page, and a fetch would be a second
     source of truth to keep in sync. */
  var GAL_OZ = 128;
  // base = 18g espresso beans at $0.033/g + a 12oz cup/lid/sleeve at $0.30,
  // straight out of seedEN() in product/app.js. oz = fluid ounces of whole
  // milk, likewise. At the $4.608/gal default ($0.036/fl oz, the seed's own
  // unit cost) every row reproduces the app's displayed figure exactly.
  var DRINKS = [
    { name: 'Latte',       price: 5.00, base: 0.894, oz: 9 },
    { name: 'Flat White',  price: 4.90, base: 0.894, oz: 5.5 },
    { name: 'Cappuccino',  price: 4.75, base: 0.894, oz: 5 },
    { name: 'Cortado',     price: 4.50, base: 0.894, oz: 2.5 },
    { name: 'Americano',   price: 3.75, base: 0.894, oz: 0 },
    { name: 'Espresso',    price: 3.25, base: 0.894, oz: 0 }
  ];
  var ALERT_COGS = 30; // the app's own "this drink is in trouble" threshold

  var slider = document.getElementById('milk');
  var rows   = document.getElementById('deskRows');

  function money(n) { return '$' + n.toFixed(2); }

  function buildRows() {
    DRINKS.forEach(function (d, i) {
      var li = document.createElement('li');
      li.innerHTML =
        '<span class="d"></span>' +
        '<span class="cost"></span>' +
        '<span class="cogs"></span>' +
        '<span class="keeps"></span>';
      li.querySelector('.d').textContent = d.name;
      rows.appendChild(li);
      d.el = li;
    });
  }

  function paint(gal) {
    var perOz = gal / GAL_OZ, cogsSum = 0, keepSum = 0;

    DRINKS.forEach(function (d) {
      var cost  = d.base + d.oz * perOz;
      var cogs  = (cost / d.price) * 100;
      var keeps = d.price - cost;
      cogsSum += cogs; keepSum += keeps;

      d.el.querySelector('.cost').textContent  = 'costs ' + money(cost);
      d.el.querySelector('.keeps').textContent = 'keeps ' + money(keeps);
      var badge = d.el.querySelector('.cogs');
      badge.textContent = cogs.toFixed(1) + '%';
      badge.classList.toggle('is-alert', cogs > ALERT_COGS);
    });

    document.getElementById('avgCogs').textContent  = (cogsSum / DRINKS.length).toFixed(1) + '%';
    document.getElementById('avgKeeps').textContent = money(keepSum / DRINKS.length);
    document.getElementById('milkVal').textContent  = money(gal);
  }

  if (slider && rows) {
    buildRows();
    paint(parseFloat(slider.value));
    slider.addEventListener('input', function () { paint(parseFloat(slider.value)); });
  }

  /* ---------- 3. counters. Real figures only, both sourced on the page. ----- */
  function runCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dp     = parseInt(el.getAttribute('data-count-dp'), 10) || 0;
    var pre    = el.getAttribute('data-count-prefix') || '';
    var suf    = el.getAttribute('data-count-suffix') || '';
    var t0 = null, dur = 900;
    function frame(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);                 // ease-out, never ease-in
      el.textContent = pre + (target * e).toFixed(dp) + suf;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && !reduce && 'IntersectionObserver' in window) {
    // start from zero only once we know we can animate; otherwise the markup's
    // real value stands, so a no-JS or reduced-motion reader still sees a figure
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        co.unobserve(en.target);
        runCount(en.target);
      });
    }, { threshold: 0.6 });
    Array.prototype.forEach.call(counters, function (el) { co.observe(el); });
  }

  /* ---------- 4. the folio: chapter marker in the margin ------------------- */
  var folio = document.getElementById('folio');
  var zones = document.querySelectorAll('[data-folio-zone]');
  if (folio && zones.length && 'IntersectionObserver' in window) {
    var items = folio.querySelectorAll('li');

    function mark(id) {
      Array.prototype.forEach.call(items, function (li) {
        li.setAttribute('aria-current', li.getAttribute('data-folio') === id ? 'true' : 'false');
      });
    }

    // the folio is fixed and crosses both grounds, so it re-inks to whichever
    // chapter it is currently sitting over
    function ink(el) {
      var paper = el.classList.contains('ch--paper');
      folio.style.setProperty('--folio-ink', paper ? '#5A4A3A' : '#A89684');
    }

    var fo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        mark(en.target.getAttribute('data-folio-zone'));
        ink(en.target);
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

    Array.prototype.forEach.call(zones, function (el) { fo.observe(el); });
  }

  /* ---------- 5. THE MOTION LAYER ------------------------------------------
     Nothing here may be load-bearing for reading the page. `html.mo` gates
     every hiding rule in v3.css section 15, and it is added HERE, at the end,
     only once the work above has run without throwing. A blocked script, an
     old browser or prefers-reduced-motion leaves the class off and the page
     renders finished rather than blank. */
  if (!canMove) return;

  var docEl = document.documentElement;

  /* 5a. split headings into masked lines. Done by measuring where the browser
     actually broke the line, so it survives any width, any zoom and any
     fallback face — a hard-coded <br> split does not. */
  function splitLines(el) {
    /* Lines are MEASURED WITH A RANGE over the untouched markup, never by
       wrapping each word in a span first. Wrapping changes the layout you are
       trying to read: inline-block words plus `text-wrap: balance` re-broke the
       h1 into three lines where the browser had set two, so the split silently
       redesigned the headline it was supposed to animate. Measure, then edit. */
    var walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    var lines = [], last = null, n;
    while ((n = walk.nextNode())) {
      var text = n.textContent, i = 0;
      while (i < text.length) {
        while (i < text.length && /\s/.test(text[i])) i++;
        if (i >= text.length) break;
        var start = i;
        while (i < text.length && !/\s/.test(text[i])) i++;
        var r = document.createRange();
        r.setStart(n, start); r.setEnd(n, i);
        var top = Math.round(r.getBoundingClientRect().top);
        if (last === null || Math.abs(top - last) > 4) { lines.push([]); last = top; }
        lines[lines.length - 1].push(text.slice(start, i));
      }
    }
    if (lines.length < 2) return;                // nothing to stagger

    /* rebuild, keeping the emphasis the markup asked for. The page's split
       headings carry at most one <em>, so the words it holds are re-emphasised
       by matching them back. ponytail: a general inline-markup preserver is a
       much bigger thing than this page needs. */
    var em = el.querySelector('em, strong');
    var emWords = em ? em.textContent.split(/\s+/).filter(Boolean) : [];
    var emTag = em ? em.tagName.toLowerCase() : null;

    el.textContent = '';
    lines.forEach(function (words, i) {
      var mask = document.createElement('span'); mask.className = 'ln';
      var inner = document.createElement('i');
      inner.style.setProperty('--d', (i * 80) + 'ms');
      words.forEach(function (w, j) {
        var node = document.createTextNode(w);
        if (emWords.indexOf(w) !== -1) {
          var e = document.createElement(emTag);
          e.appendChild(node); node = e;
        }
        if (j) inner.appendChild(document.createTextNode(' '));
        inner.appendChild(node);
      });
      mask.appendChild(inner);
      el.appendChild(mask);
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-split]'), function (el) {
    try { splitLines(el); } catch (e) { /* leave the heading exactly as authored */ }
  });

  /* 5b. plates need an overflow wrapper for the image push-in, because the
     figure itself carries the wipe and cannot also clip the scale. */
  Array.prototype.forEach.call(document.querySelectorAll('[data-plate] img'), function (img) {
    var ph = document.createElement('span'); ph.className = 'ph';
    img.parentNode.insertBefore(ph, img); ph.appendChild(img);
  });

  /* 5c. stagger: children of a [data-group] enter in sequence, and so do the
     paragraphs of any column, so a chapter reads as one gesture rather than
     as six things arriving at once. */
  Array.prototype.forEach.call(document.querySelectorAll('[data-group]'), function (g) {
    var i = 0;
    Array.prototype.forEach.call(g.children, function (c) {
      c.setAttribute('data-rise', '');
      c.style.setProperty('--d', (i++ * 90) + 'ms');
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll('.col-text'), function (col) {
    var i = 0;
    Array.prototype.forEach.call(col.querySelectorAll(':scope > [data-rise]'), function (c) {
      if (!c.style.getPropertyValue('--d')) c.style.setProperty('--d', (i++ * 80) + 'ms');
    });
  });

  /* 5d. entrances. One observer for the whole page, unobserving as it goes. */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

  Array.prototype.forEach.call(
    document.querySelectorAll('[data-rise], [data-split], [data-plate], [data-open]'),
    function (el) { io.observe(el); }
  );

  /* 5e. the continuous driver. ONE rAF loop for the whole page, reading rects
     in a single batch per frame: a scroll handler per element is what makes
     this kind of page stutter. --p is 0 as an element's top reaches the bottom
     of the viewport and 1 as its bottom leaves the top. */
  var live = [].slice.call(document.querySelectorAll('[data-p], [data-par]'));
  var scrubs = [].slice.call(document.querySelectorAll('[data-desk-scrub]'));
  var ticking = false;

  function frame() {
    ticking = false;
    var vh = window.innerHeight;

    live.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var p = (vh - r.top) / (vh + r.height);
      p = p < 0 ? 0 : p > 1 ? 1 : p;
      el.style.setProperty('--p', p.toFixed(4));
      var par = el.getAttribute('data-par');
      if (par) el.style.setProperty('--par', ((p - 0.5) * parseFloat(par) * vh).toFixed(1));
    });

    /* the peak drives itself. As chapter 03 comes up the milk price sweeps,
       so the menu re-prices under the reader before they touch anything: the
       argument is made whether or not they take the handle. The moment they
       do, this stops for good — a control that fights the hand holding it is
       worse than no animation at all. */
    scrubs.forEach(function (sec) {
      if (deskTaken || !slider) return;
      var r = sec.getBoundingClientRect();
      var p = (vh - r.top) / (vh + r.height);
      // clamped, not skipped: the sweep is a half sine, so both ends of the
      // clamp land back on the demo shop's real milk price rather than leaving
      // the desk parked on an invented number after the chapter scrolls away.
      var k = (p - 0.18) / 0.44;
      k = k < 0 ? 0 : k > 1 ? 1 : k;
      var v = 4.608 + Math.sin(k * Math.PI) * 2.9;     // out to ~$7.50 and back
      slider.value = String(v);
      paint(v);
    });
  }

  var deskTaken = false;
  if (slider) {
    ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
      slider.addEventListener(ev, function () { deskTaken = true; }, { passive: true });
    });
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(frame);
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  frame();

  /* only now is it safe for the stylesheet to hide anything */
  docEl.classList.add('mo');
})();
