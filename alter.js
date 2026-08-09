/* ══════════════════════════════════════════════════════════════
   ALTER — site script. Loaded on every page. Every block checks
   that the thing it drives is actually on the page first, so one
   missing section never stops the rest working.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── nav + announcement bar ────────────────────────────────── */
  var burger = document.querySelector('.burger');
  var links = document.getElementById('links');
  if (burger && links) {
    burger.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
  var barX = document.querySelector('.bar .x');
  if (barX) {
    barX.addEventListener('click', function () {
      var bar = barX.closest('.bar');
      if (bar) bar.remove();
    });
  }

  /* ── reveal on scroll ──────────────────────────────────────── */
  var targets = document.querySelectorAll('[data-reveal],[data-reveal-group]');
  if (targets.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ── stat rail: dots on a phone, count up once seen ────────── */
  var rail = document.querySelector('.stats');
  var railDots = document.querySelector('.stats-sec .dots');
  if (rail && railDots) {
    var stats = rail.querySelectorAll('.stat');
    stats.forEach(function (_, i) {
      var b = document.createElement('button');
      b.className = i === 0 ? 'on' : '';
      b.setAttribute('aria-label', 'Show stat ' + (i + 1));
      b.onclick = function () { rail.scrollTo({ left: rail.clientWidth * i, behavior: 'smooth' }); };
      railDots.appendChild(b);
    });
    rail.addEventListener('scroll', function () {
      var i = Math.round(rail.scrollLeft / rail.clientWidth);
      railDots.querySelectorAll('button').forEach(function (d, n) { d.classList.toggle('on', n === i); });
    }, { passive: true });

    if (!reduce) {
      var counted = false;
      var so = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting || counted) return;
          counted = true;
          rail.querySelectorAll('.stat b').forEach(function (el) {
            var m = el.textContent.trim().match(/([^0-9]*)([0-9,]+)(.*)/);
            if (!m) return;
            var pre = m[1], target = parseInt(m[2].replace(/,/g, ''), 10), post = m[3];
            if (!target) return;
            var start = null;
            (function tick(ts) {
              if (!start) start = ts || 0;
              var p = Math.min(((ts || 0) - start) / 1100, 1);
              var eased = 1 - Math.pow(1 - p, 3);
              el.textContent = pre + Math.floor(eased * target).toLocaleString() + post;
              if (p < 1) requestAnimationFrame(tick);
              else el.textContent = pre + target.toLocaleString() + post;
            })();
          });
        });
      }, { threshold: 0.4 });
      so.observe(rail);
    }
  }

  /* ── swipe carousels ───────────────────────────────────────── */
  document.querySelectorAll('.swipe').forEach(function (swipe) {
    var track = swipe.querySelector('.track');
    var dots = document.querySelector('[data-dots="' + swipe.id + '"]');
    var slides = swipe.querySelectorAll('.slide');
    if (!slides.length || !track) return;

    function step() {
      var gap = parseFloat(getComputedStyle(track).gap) || 14;
      return slides[0].offsetWidth + gap;
    }
    if (dots) {
      slides.forEach(function (_, i) {
        var d = document.createElement('button');
        d.className = i === 0 ? 'on' : '';
        d.setAttribute('aria-label', 'Go to ' + (i + 1));
        d.onclick = function () { swipe.scrollTo({ left: step() * i, behavior: 'smooth' }); };
        dots.appendChild(d);
      });
      swipe.addEventListener('scroll', function () {
        var i = Math.round(swipe.scrollLeft / step());
        dots.querySelectorAll('button').forEach(function (d, n) { d.classList.toggle('on', n === i); });
      }, { passive: true });
    }
  });

  document.querySelectorAll('[data-swipe]').forEach(function (btn) {
    btn.onclick = function () {
      var swipe = document.getElementById(btn.dataset.swipe);
      if (!swipe) return;
      var s = swipe.querySelector('.slide');
      var track = swipe.querySelector('.track');
      var gap = parseFloat(getComputedStyle(track).gap) || 14;
      swipe.scrollBy({ left: (s.offsetWidth + gap) * Number(btn.dataset.dir), behavior: 'smooth' });
    };
  });

  /* A photo that is missing leaves a clean empty panel: no broken icon,
     and no alt text spilling across the card. */
  document.querySelectorAll('.slide.tf img').forEach(function (img) {
    img.addEventListener('error', function () {
      img.removeAttribute('src');
      img.removeAttribute('alt');
      img.classList.add('missing');
    });
  });

  /* ── modal ─────────────────────────────────────────────────── */
  var opener = null;
  function openModal(id) {
    var m = document.getElementById(id);
    if (!m) return;
    opener = document.activeElement;
    m.hidden = false;
    document.body.classList.add('locked');
    var x = m.querySelector('.promo-x');
    if (x) x.focus();
  }
  function closeModal(id) {
    var m = document.getElementById(id);
    if (!m) return;
    m.hidden = true;
    document.body.classList.remove('locked');
    if (opener && opener.focus) opener.focus();
  }
  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-open]');
    if (o) { e.preventDefault(); openModal(o.getAttribute('data-open')); return; }
    var c = e.target.closest('[data-close]');
    if (c) { e.preventDefault(); closeModal(c.getAttribute('data-close')); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.promo:not([hidden])').forEach(function (m) { closeModal(m.id); });
  });
  window.ALTER = { openModal: openModal, closeModal: closeModal };
})();

/* ══════════════════════════════════════════════════════════════
   Photos from the admin. Every image slot on the site is a .ph with
   a data-img key. The photo is inserted into the slot, so anything
   sitting on top of it (pills, names, captions) survives.
   ══════════════════════════════════════════════════════════════ */
window.ALTER_SUPABASE = {
  url: 'https://ghubvckcfcclzhbaafjh.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdodWJ2Y2tjZmNjbHpoYmFhZmpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5OTU3NTEsImV4cCI6MjA5OTU3MTc1MX0.O3P4jfXbBSBKpiKX8De8DiN36aLmZpjiZof9TORto68'
};

(function () {
  if (!window.supabase) return;
  var slots = document.querySelectorAll('[data-img]');
  if (!slots.length) return;
  var sb = window.supabase.createClient(window.ALTER_SUPABASE.url, window.ALTER_SUPABASE.key);

  sb.from('site_images').select('key,url').then(function (res) {
    var by = {};
    (res.data || []).forEach(function (r) { by[r.key] = r.url; });
    slots.forEach(function (el) {
      var url = by[el.getAttribute('data-img')];
      if (!url) return;
      var img = document.createElement('img');
      img.src = url;
      img.alt = el.getAttribute('data-alt') || '';
      img.loading = 'lazy';
      img.decoding = 'async';
      el.insertBefore(img, el.firstChild);
      el.classList.add('has-photo');
    });
  }).catch(function () {});

  /* Transformations, if this page has the carousel. Photos only: captions are
     deliberately not rendered, so a timeframe left in the database does not
     reappear under a photo. Clearing the caption field is optional. */
  var track = document.querySelector('#tf-swipe .track');
  if (track) {
    sb.from('transformations').select('*').eq('published', true).order('sort_order')
      .then(function (res) {
        var rows = res.data || [];
        if (!rows.length) return;
        track.innerHTML = rows.map(function (t) {
          var alt = (t.alt || 'Client transformation with ALTER strength training')
                      .replace(/"/g, '&quot;');
          return '<figure class="slide tf"><img src="' + t.image_url + '" alt="' + alt
               + '" width="900" height="1125" loading="lazy" decoding="async"></figure>';
        }).join('');
      })
      .catch(function () {});
  }
})();

/* ══════════════════════════════════════════════════════════════
   ANALYTICS
   Cookieless by design, so there is no consent banner and nothing
   here contradicts the privacy policy. Set your provider below and
   it loads itself. Leave it as 'none' and nothing is sent anywhere.

   ROXY: pick one and fill in the blank.
     plausible  -> plausible.io, about $9/mo, events included
     umami      -> cloud.umami.is, free tier, events included
     cloudflare -> free, page views only, no events
   ══════════════════════════════════════════════════════════════ */
window.ALTER_ANALYTICS = {
  provider: 'none',              // 'plausible' | 'umami' | 'cloudflare' | 'none'
  domain:   'alteryouapp.com',   // plausible: the site you added
  websiteId: '',                 // umami: the website ID from your dashboard
  umamiHost: 'https://cloud.umami.is',
  token:    '',                  // cloudflare: the beacon token
  honourDoNotTrack: false        // true respects DNT, at the cost of undercounting
};

(function () {
  var cfg = window.ALTER_ANALYTICS || {};
  var queue = [];

  /* track(name, props) works the same whichever provider is set, and does
     nothing at all when none is. Never pass anything personal into props. */
  window.track = function (name, props) {
    try {
      if (window.plausible) return window.plausible(name, props ? { props: props } : undefined);
      if (window.umami && window.umami.track) return window.umami.track(name, props);
      queue.push([name, props]);
    } catch (e) {}
  };

  if (cfg.provider === 'none' || !cfg.provider) return;
  if (cfg.honourDoNotTrack && (navigator.doNotTrack === '1' || window.doNotTrack === '1')) return;

  var s = document.createElement('script');
  s.defer = true;

  if (cfg.provider === 'plausible') {
    s.src = 'https://plausible.io/js/script.outbound-links.js';
    s.setAttribute('data-domain', cfg.domain);
    window.plausible = window.plausible || function () {
      (window.plausible.q = window.plausible.q || []).push(arguments);
    };
  } else if (cfg.provider === 'umami') {
    s.src = (cfg.umamiHost || 'https://cloud.umami.is') + '/script.js';
    s.setAttribute('data-website-id', cfg.websiteId);
  } else if (cfg.provider === 'cloudflare') {
    s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    s.setAttribute('data-cf-beacon', '{"token":"' + cfg.token + '"}');
  } else {
    return;
  }

  s.onload = function () {
    queue.splice(0).forEach(function (a) { window.track(a[0], a[1]); });
  };
  document.head.appendChild(s);
})();

/* ── what gets measured ────────────────────────────────────────
   Any element carrying data-track="name" reports a click, so you can
   tag something new in the HTML without touching this file. The rest
   below are the moments worth knowing about on this site.
   ─────────────────────────────────────────────────────────── */
(function () {
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-track]');
    if (el) window.track(el.getAttribute('data-track'), { page: location.pathname });
  });

  /* Did anyone actually reach the price? */
  var plans = document.querySelector('.plans');
  if (plans && 'IntersectionObserver' in window) {
    var seen = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && !seen) {
          seen = true;
          window.track('Saw pricing', { page: location.pathname });
          io.disconnect();
        }
      });
    }, { threshold: 0.4 });
    io.observe(plans);
  }

  /* Which questions people open tells you what the site failed to answer. */
  document.querySelectorAll('.faq details').forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      var q = d.querySelector('summary');
      window.track('Opened FAQ', { question: q ? q.textContent.trim().slice(0, 60) : '' });
    });
  });

  /* Did the transformations carousel hold anyone's attention? */
  var tf = document.getElementById('tf-swipe');
  if (tf) {
    var swiped = false;
    tf.addEventListener('scroll', function () {
      if (swiped) return;
      swiped = true;
      window.track('Swiped transformations');
    }, { passive: true });
  }
})();

/* ── challenge signup ─────────────────────────────────────────
   Posts in the background so nobody is thrown to another site, then
   swaps the form for a confirmation. If the request fails the form
   comes back with the error rather than silently losing the entry.
   ─────────────────────────────────────────────────────────── */
(function () {
  var form = document.getElementById('join-form');
  if (!form || !window.fetch) return;
  var box = form.closest('.join');
  var err = box.querySelector('.join-err');
  var done = box.querySelector('.join-done');
  var fine = box.querySelector('.join-fine');
  var btn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (err) err.hidden = true;
    if (btn) { btn.disabled = true; btn.textContent = 'Saving your spot'; }

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    }).then(function (res) {
      if (!res.ok) throw new Error('bad response');
      form.hidden = true;
      if (fine) fine.hidden = true;
      var h = box.querySelector('h3');
      if (h) h.hidden = true;
      if (done) done.hidden = false;
      if (window.track) window.track('Challenge signup');
      done.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }).catch(function () {
      if (err) err.hidden = false;
      if (btn) { btn.disabled = false; btn.textContent = 'Save my spot'; }
    });
  });
})();

/* ══════════════════════════════════════════════════════════════
   BRAND FILES FROM THE ADMIN
   The favicon and the iPhone home-screen icon are swapped live from
   the site_images table, so they can be changed without touching the
   server. The social share image cannot be done this way: Facebook,
   WhatsApp and Instagram read the raw HTML and never run JavaScript,
   so og:image has to be a real URL in the page. It points at a fixed
   address in Supabase storage, which the admin overwrites in place.
   ══════════════════════════════════════════════════════════════ */
(function () {
  if (!window.supabase) return;
  var sb = window.supabase.createClient(window.ALTER_SUPABASE.url, window.ALTER_SUPABASE.key);
  sb.from('site_images').select('key,url')
    .in('key', ['brand_favicon', 'brand_appicon'])
    .then(function (res) {
      (res.data || []).forEach(function (r) {
        if (!r.url) return;
        var el = document.getElementById(r.key === 'brand_favicon' ? 'fav' : 'appicon');
        if (el) el.href = r.url;
      });
    })
    .catch(function () {});
})();
