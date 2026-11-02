/* Solace Minds — site interactions */
(function () {
  'use strict';
  /* ---------- shared header + footer (assets/components) ---------- */
  var PAGE_ALIAS = { 'blog-manage-daily-stress.html': 'blogs.html' }; // child pages highlight their section
  var page = location.pathname.split('/').pop() || 'index.html';
  page = PAGE_ALIAS[page] || page;
  function load(name) {
    var slot = document.querySelector('[data-include="' + name + '"]');
    if (!slot) return Promise.resolve();
    return fetch('assets/components/' + name + '.html').then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.text();
    }).then(function (html) {
      var tpl = document.createElement('template');
      tpl.innerHTML = html; // trailing </body> in each component is ignored here; it gives dev servers (Live Server) a safe spot to inject their reload script
      Array.prototype.forEach.call(tpl.content.querySelectorAll('script'), function (s) { s.remove(); });
      slot.replaceWith(tpl.content); // no wrapper element, so sticky header + layout stay as before
    }).catch(function (err) { console.error('Could not load ' + name + ' component (serve the site over http, not file://):', err); });
  }
  function markActive() {
    var links = document.querySelectorAll('.site-head a[href], #mnav a[href]');
    Array.prototype.forEach.call(links, function (a) {
      if (a.getAttribute('href') !== page) return;
      a.classList.add('active'); a.setAttribute('aria-current', 'page');
      var drop = a.closest('.has-drop'), btn = drop && drop.querySelector('button');
      if (btn) btn.classList.add('active');
    });
  }
  Promise.all([load('header'), load('footer')]).then(function () { markActive(); init(); });

  function init() {
    var root = document.documentElement;
    root.classList.add('js');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var WA_NUMBER = '919916095796';
    var EMAIL = 'sowmyabasavaraj@solaceminds.in';
    function $(s, c) { return (c || document).querySelector(s); }
    function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

    /* ---------- header + mobile menu ---------- */
    var head = $('.site-head');
    function onScroll() { if (head) head.classList.toggle('scrolled', window.scrollY > 10); }
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    var mnav = $('#mnav'), burger = $('#burger');
    function setNav(o) { if (!mnav) return; mnav.classList.toggle('open', o); burger && burger.setAttribute('aria-expanded', o); document.body.style.overflow = o ? 'hidden' : ''; if (o) { var c = $('[data-mclose]', mnav); c && c.focus(); } }
    if (burger) burger.addEventListener('click', function () { setNav(true); });
    $$('[data-mclose]').forEach(function (b) { b.addEventListener('click', function () { setNav(false); burger && burger.focus(); }); });
    $$('#mnav a').forEach(function (a) { a.addEventListener('click', function () { setNav(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && mnav && mnav.classList.contains('open')) setNav(false); });

    /* ---------- reveal on scroll ---------- */
    var rvs = $$('.rv');
    if ('IntersectionObserver' in window && !reduce) {
      var rv = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rv.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.01 });
      rvs.forEach(function (el) { rv.observe(el); });
    } else { rvs.forEach(function (el) { el.classList.add('in'); }); }

    /* ---------- counters ---------- */
    var nums = $$('[data-count]');
    if (nums.length && 'IntersectionObserver' in window && !reduce) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return; io.unobserve(e.target);
          var el = e.target, n = +el.dataset.count, sf = el.dataset.suffix || '', t0 = null;
          function f(t) { if (!t0) t0 = t; var k = Math.min((t - t0) / 1800, 1), v = Math.round(n * (1 - Math.pow(1 - k, 3))); el.innerHTML = v.toLocaleString('en-IN') + (sf ? '<span class="sf">' + sf + '</span>' : ''); if (k < 1) requestAnimationFrame(f); }
          requestAnimationFrame(f);
        });
      }, { threshold: .5 });
      nums.forEach(function (el) { io.observe(el); });
    }

    /* ---------- dialogs ---------- */
    function openDlg(d) { if (d.showModal) d.showModal(); else d.setAttribute('open', ''); }
    function closeDlg(d) { if (d.close) d.close(); else d.removeAttribute('open'); }
    $$('dialog').forEach(function (d) {
      d.addEventListener('click', function (e) { if (e.target === d) closeDlg(d); });
      $$('[data-close]', d).forEach(function (b) { b.addEventListener('click', function () { closeDlg(d); }); });
    });

    /* ---------- contact page: preselect service from ?service= ---------- */
    var svcParam = new URLSearchParams(location.search).get('service');
    if (svcParam) {
      var svcSel = $('#appointment select[name="service"]');
      if (svcSel && $$('option', svcSel).some(function (o) { return (o.value || o.text) === svcParam; })) svcSel.value = svcParam;
    }

    /* ---------- forms: validate, then hand off to WhatsApp / email ---------- */
    var today = new Date(); today = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    $$('input[type="date"]').forEach(function (d) { d.min = today; });
    var MSG = {
      name: 'Please enter your full name.', phone: 'Please enter a valid 10-digit mobile number.', email: 'Please enter a valid email address.',
      age: 'Please enter a valid age.', date: 'Please choose a date from today onwards.', service: 'Please choose a service.', mode: 'Please choose a consultation mode.',
      consent: 'Please confirm to continue.', org: 'Please enter your organization name.', orgtype: 'Please choose an organization type.', topic: 'Please choose a topic.',
      location: 'Please choose online or offline.', city: 'Please enter your city.'
    };
    function resetForm(form) {
      if (!form) return;
      var wrap = form.closest('[data-form-wrap]');
      form.hidden = false; form.reset();
      $$('.fld', form).forEach(function (f) { f.classList.remove('bad'); var e = $('.err', f); if (e) e.textContent = ''; });
      var sent = wrap && $('.sent', wrap); if (sent) sent.hidden = true;
      var intro = wrap && $('.form-intro', wrap.parentNode); if (intro) intro.hidden = false;
    }
    // $$('form[data-form]').forEach(function (form) {
    //   form.setAttribute('novalidate', '');
    //   form.addEventListener('submit', function (e) {
    //     e.preventDefault();
    //     var ok = true, first = null, seen = {};
        // $$('input,select,textarea', form).forEach(function (el) {
        //   if (!el.name || seen[el.name]) return; seen[el.name] = 1;
        //   var f = el.closest('.fld'); if (!f) return;
        //   var bad;
        //   if (el.type === 'radio') bad = el.required && !$('input[name="' + el.name + '"]:checked', form);
        //   else bad = !el.checkValidity();
        //   f.classList.toggle('bad', bad);
        //   var er = $('.err', f); if (er) er.textContent = bad ? (MSG[el.name] || 'Please check this field.') : '';
        //   if (bad) { ok = false; first = first || el; }
        // });
    //     if (!ok) { first.focus(); return; }
    //     var data = new FormData(form), lines = [], kind = form.getAttribute('data-form');
    //     lines.push(kind === 'workshop' ? 'Hello Solace Minds, I would like to request a workshop.' : kind === 'callback' ? 'Hello Solace Minds, please call me back.' : 'Hello Solace Minds, I would like to book an appointment.');
    //     $$('[data-label]', form).forEach(function (el) {
    //       var v = el.type === 'radio' ? (data.get(el.name) || '') : (el.type === 'checkbox' ? '' : el.value.trim());
    //       if (el.type === 'radio' && el !== $('input[name="' + el.name + '"]', form)) return;
    //       if (v) lines.push(el.getAttribute('data-label') + ': ' + v);
    //     });
    //     var text = lines.join('\n');
    //     var wrap = form.closest('[data-form-wrap]');
    //     var sent = $('.sent', wrap);
    //     var first_name = (data.get('name') || '').toString().trim().split(' ')[0];
    //     $('.sent-title', sent).textContent = 'Thank you' + (first_name ? ', ' + first_name : '') + '.';
    //     $('.wa-send', sent).href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text);
    //     $('.mail-send', sent).href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(kind === 'workshop' ? 'Workshop enquiry' : kind === 'callback' ? 'Callback request' : 'Appointment request') + '&body=' + encodeURIComponent(text);
    //     form.hidden = true;
    //     var intro = $('.form-intro', wrap.parentNode); if (intro) intro.hidden = true;
    //     sent.hidden = false;
    //     var t = $('.sent-title', sent); t.setAttribute('tabindex', '-1'); t.focus();
    //   });
    // });
    /* ---------- footer callback form: validate, then post to Google Apps Script ---------- */
    var CALLBACK_URL = 'https://script.google.com/macros/s/AKfycbzczog7yLyPRTzs90-nJBVmJ4lV5X0ExajrRffdRKLKSfmDzlDRd7G1uEGojJPhatgf/exec';
    var PHONE_RE = /^(?:\+91[\-\s]?|0)?[6-9]\d{9}$/;
    var EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    $$('form[data-form="callback"]').forEach(function (form) {
      var wrap = form.closest('[data-form-wrap]'), sent = $('.sent', wrap), status = $('.f-status', wrap), btn = $('button[type="submit"]', form);
      var sentText = $('p', sent), sentRow = $('.row', sent), sentAgain = $('[data-again]', sent), busy = false;
      function setStatus(msg) { status.textContent = msg; status.hidden = !msg; }
      function check(el) {
        var v = el.value.trim(), msg = '';
        if (!v) msg = 'This field is required.';
        else if (el.name === 'email' && !EMAIL_RE.test(v)) msg = MSG.email;
        else if (el.name === 'phone' && !PHONE_RE.test(v.replace(/\s/g, ''))) msg = MSG.phone;
        var f = el.closest('.fld'); f.classList.toggle('bad', !!msg); $('.err', f).textContent = msg;
        return !msg;
      }
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (busy) return;
        setStatus('');
        var inputs = $$('input', form), ok = inputs.map(check).every(Boolean);
        if (!ok) { var bad = $('.fld.bad input', form); bad && bad.focus(); return; }
        var v = {}; inputs.forEach(function (el) { v[el.name] = el.value.trim(); });
        var url = CALLBACK_URL + '?name=' + encodeURIComponent(v.name) + '&email=' + encodeURIComponent(v.email) +
          '&phone=' + encodeURIComponent(v.phone) + '&city=' + encodeURIComponent(v.city) + '&sendmail=true';
        busy = true; btn.disabled = true;
        fetch(url).then(function (r) { return r.text(); }).then(function (t) {
          if (t.trim() !== 'OK') throw new Error(t);
          $('.sent-title', sent).textContent = 'Thank you' + (v.name ? ', ' + v.name.split(' ')[0] : '') + '.';
          sentText.textContent = 'Your request has been received. Our team will call you back soon.';
          sentRow.hidden = true; sentAgain.hidden = true;
          form.reset(); form.hidden = true; sent.hidden = false;
          var t2 = $('.sent-title', sent); t2.setAttribute('tabindex', '-1'); t2.focus();
        }).catch(function (err) {
          console.error('Callback request failed:', err);
          setStatus('Sorry, we could not submit your request. Please try again or WhatsApp us on +91 99160 95796.');
        }).then(function () { busy = false; btn.disabled = false; });
      });
    });

    $$('[data-again]').forEach(function (b) {
      b.addEventListener('click', function () { resetForm($('form', b.closest('[data-form-wrap]'))); });
    });

    /* ---------- tabs ---------- */
    $$('.tabs').forEach(function (tl) {
      var btns = $$('button', tl);
      btns.forEach(function (b) {
        b.addEventListener('click', function () {
          btns.forEach(function (x) { x.setAttribute('aria-selected', x === b); var p = document.getElementById(x.getAttribute('aria-controls')); if (p) p.hidden = x !== b; });
        });
      });
    });

    /* ---------- in-page sub navigation highlight ---------- */
    var sub = $$('.subnav a');
    var track = $('.subnav .wrap');
    function subFades() {
      if (!track) return;
      var max = track.scrollWidth - track.clientWidth;
      track.classList.toggle('fade-l', track.scrollLeft > 4);
      track.classList.toggle('fade-r', track.scrollLeft < max - 4);
    }
    if (track) {
      track.addEventListener('scroll', subFades, { passive: true });
      window.addEventListener('resize', subFades);
      subFades();
    }
    // centre the active link inside the bar only, so the page itself never jumps
    function subCenter(a) {
      if (!track) return;
      var left = a.offsetLeft - (track.clientWidth - a.offsetWidth) / 2;
      track.scrollTo({ left: Math.max(0, left), behavior: reduce ? 'auto' : 'smooth' });
    }
    if (sub.length && 'IntersectionObserver' in window) {
      var map = {};
      sub.forEach(function (a) { var t = document.getElementById(a.getAttribute('href').slice(1)); if (t) map[t.id] = a; });
      var so = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) {
            sub.forEach(function (a) { a.classList.remove('on'); });
            var a = map[e.target.id]; if (a) { a.classList.add('on'); subCenter(a); }
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      Object.keys(map).forEach(function (id) { so.observe(document.getElementById(id)); });
    }

    /* ---------- filters (blog + gallery) ---------- */
    $$('[data-filter-group]').forEach(function (g) {
      var target = document.getElementById(g.getAttribute('data-filter-group'));
      $$('button', g).forEach(function (b) {
        b.addEventListener('click', function () {
          $$('button', g).forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
          var f = b.getAttribute('data-filter');
          $$('[data-cat]', target).forEach(function (it) { it.hidden = !(f === 'all' || it.getAttribute('data-cat').indexOf(f) > -1); });
        });
      });
    });

    /* ---------- lightbox ---------- */
    var lb = $('#lightbox');
    if (lb) {
      $$('.g-item').forEach(function (it) {
        it.addEventListener('click', function () {
          var img = $('img', it);
          $('img', lb).src = img.src; $('img', lb).alt = img.alt;
          $('p', lb).textContent = it.getAttribute('data-caption') || '';
          openDlg(lb);
        });
      });
    }

    /* ---------- working hours: mark today ---------- */
    var d = new Date().getDay(); // 0 Sun
    var row = $('.hours tr[data-day="' + d + '"]'); if (row) row.classList.add('today');

    /* ---------- marquee: repeat chips so each half covers the viewport, seamless -50% loop ---------- */
    $$('.marquee .track').forEach(function (track) {
      var base = $$('.chip:not([aria-hidden])', track);
      if (!base.length) return;
      function build() {
        track.innerHTML = '';
        base.forEach(function (c) { track.appendChild(c); });
        var setW = track.scrollWidth, need = track.parentNode.clientWidth;
        var reps = Math.max(1, Math.ceil(need / setW));
        var total = reps * 2;
        for (var i = 1; i < total; i++) {
          base.forEach(function (c) {
            var k = c.cloneNode(true);
            k.setAttribute('aria-hidden', 'true');
            k.querySelector('img') && k.querySelector('img').removeAttribute('loading');
            track.appendChild(k);
          });
        }
        // constant speed (~40px/s) regardless of how many copies were added
        track.style.setProperty('--mq-dur', (setW * reps / 40) + 's');
      }
      build();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
      var w = window.innerWidth, t;
      window.addEventListener('resize', function () {
        if (window.innerWidth === w) return;
        w = window.innerWidth; clearTimeout(t); t = setTimeout(build, 200);
      });
    });

    /* ---------- footer year ---------- */
    $$('[data-year]').forEach(function (y) { y.textContent = new Date().getFullYear(); });
  }
})();
/* preselect workshop topic from program buttons */
(function () {
  var sel = document.getElementById('ws-topic');
  if (!sel) return;
  document.querySelectorAll('[data-topic]').forEach(function (a) {
    a.addEventListener('click', function () { sel.value = a.getAttribute('data-topic'); });
  });
})();
