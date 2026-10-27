/* =============================================================
   EduPilot shared script. Every module checks that its elements
   exist, so one file serves every page. Follows Apple fluid
   interface guidance: tactile feedback, spring transitions,
   momentum projection, and graceful keyboard navigation.
   ============================================================= */
(() => {
  'use strict';

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTyping = (t) => !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

  /* ---------------------------------------------------------
     Toast: status / completion / error feedback
     --------------------------------------------------------- */
  let toastHost;
  function toast(message, kind = 'info') {
    if (!toastHost) {
      toastHost = document.createElement('div');
      toastHost.className = 'toast-host';
      toastHost.setAttribute('aria-live', 'polite');
      document.body.append(toastHost);
    }
    const el = document.createElement('div');
    el.className = 'toast ' + kind;
    el.textContent = message;
    toastHost.append(el);
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 260);
    }, 2800);
  }

  /* ---------------------------------------------------------
     Theme toggle (light / dark), remembered between visits
     --------------------------------------------------------- */
  function initTheme() {
    const btn = $('#themeBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const root = document.documentElement;
      const next = root.dataset.theme === 'light' ? 'dark' : 'light';
      root.classList.add('theme-fade');
      root.dataset.theme = next;
      try { localStorage.setItem('ep-theme', next); } catch (e) { /* private mode */ }
      setTimeout(() => root.classList.remove('theme-fade'), 350);
    });
  }

  /* ---------------------------------------------------------
     Jump-to sheet. Keyboard events: "/" opens, keyup filters,
     arrows move, Enter goes, Esc closes.
     --------------------------------------------------------- */
  const quickNav = { isOpen: () => false, open: () => {} };

  function initQuickNav() {
    const pages = $$('.sidebar .nav-item').map((a) => ({
      href: a.getAttribute('href'),
      icon: ($('.icon', a) || {}).textContent || '',
      label: Array.from(a.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim(),
    }));
    if (!pages.length) return;

    const scrim = document.createElement('div');
    scrim.className = 'qn-scrim';
    scrim.hidden = true;
    scrim.innerHTML =
      '<div class="qn" role="dialog" aria-modal="true" aria-label="Jump to a page">' +
      '<input class="qn-input" type="search" placeholder="Jump to a page…" aria-label="Jump to a page" autocomplete="off">' +
      '<ul class="qn-list" role="listbox"></ul>' +
      '<div class="qn-foot"><kbd>↑</kbd> <kbd>↓</kbd> move · <kbd>Enter</kbd> go · <kbd>Esc</kbd> close</div>' +
      '</div>';
    document.body.append(scrim);

    const input = $('.qn-input', scrim);
    const list = $('.qn-list', scrim);
    let shown = [];
    let active = 0;
    let opener = null;

    function render() {
      const q = input.value.trim().toLowerCase();
      shown = pages.filter((p) => p.label.toLowerCase().includes(q));
      active = Math.min(active, Math.max(shown.length - 1, 0));
      list.innerHTML = '';
      if (!shown.length) {
        const li = document.createElement('li');
        li.className = 'qn-empty';
        li.textContent = 'No matching page';
        list.append(li);
        return;
      }
      shown.forEach((p, i) => {
        const li = document.createElement('li');
        li.className = 'qn-item';
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', String(i === active));
        const icon = document.createElement('span');
        icon.className = 'icon';
        icon.textContent = p.icon;
        li.append(icon, document.createTextNode(p.label));
        li.addEventListener('mouseover', () => setActive(i));
        li.addEventListener('click', () => go(i));
        list.append(li);
      });
    }
    function setActive(i) {
      active = i;
      $$('.qn-item', list).forEach((li, idx) => {
        li.setAttribute('aria-selected', String(idx === i));
        if (idx === i) li.scrollIntoView({ block: 'nearest' });
      });
    }
    function go(i) { if (shown[i]) window.location.href = shown[i].href; }

    function open() {
      opener = document.activeElement;
      input.value = '';
      active = 0;
      render();
      scrim.hidden = false;
      void scrim.offsetWidth;            // commit the hidden state so the transition runs
      scrim.classList.add('open');
      input.focus();
    }
    function close() {
      scrim.classList.remove('open');
      setTimeout(() => { scrim.hidden = true; }, reduceMotion() ? 0 : 250);
      if (opener && opener.focus) opener.focus();
    }

    input.addEventListener('keyup', (e) => {
      if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(e.key)) return;
      active = 0;
      render();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (shown.length) setActive((active + 1) % shown.length); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (shown.length) setActive((active - 1 + shown.length) % shown.length); }
      else if (e.key === 'Enter') { e.preventDefault(); go(active); }
      else if (e.key === 'Escape') { e.preventDefault(); close(); }
    });
    scrim.addEventListener('pointerdown', (e) => { if (e.target === scrim) close(); });

    document.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      if (e.key === '/') { e.preventDefault(); open(); }
    });
    const btn = $('#qnBtn');
    if (btn) btn.addEventListener('click', open);

    quickNav.isOpen = () => !scrim.hidden;
    quickNav.open = open;
  }

  /* ---------------------------------------------------------
     Events page: mouse events, keyboard search, signal
     --------------------------------------------------------- */
  function initEvents() {
    const grid = $('.event-grid');
    if (!grid) return;

    const cards = $$('.event-card', grid);
    const detail = $('#cardDetail');
    const savedCount = $('#savedCount');
    const DEFAULT = 'Hover a card for details · click to save';

    function toggleSave(card) {
      const on = card.classList.toggle('is-saved');
      card.setAttribute('aria-pressed', String(on));
      if (savedCount) savedCount.textContent = String($$('.is-saved', grid).length);
      toast((on ? 'Saved ' : 'Removed ') + card.dataset.title, on ? 'ok' : 'info');
    }
    cards.forEach((card) => {
      card.addEventListener('mouseover', () => { if (detail) detail.textContent = card.dataset.info; });
      card.addEventListener('mouseout',  () => { if (detail) detail.textContent = DEFAULT; });
      card.addEventListener('focus',     () => { if (detail) detail.textContent = card.dataset.info; });
      card.addEventListener('blur',      () => { if (detail) detail.textContent = DEFAULT; });
      card.addEventListener('click', () => toggleSave(card));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSave(card); }
      });
    });

    // Keyboard search: keydown shows the key, Enter confirms, Esc clears, keyup filters live
    const box = $('#eventSearch');
    const keyShown = $('#keyShown');
    const msg = $('#searchMsg');
    const empty = $('#noResults');

    function filter() {
      const q = box.value.trim().toLowerCase();
      let hits = 0;
      cards.forEach((c) => {
        const hit = !q || c.dataset.name.includes(q) || c.dataset.category.includes(q);
        c.hidden = !hit;
        if (hit) hits++;
      });
      if (empty) empty.hidden = hits > 0;
      box.classList.toggle('has-text', q !== '');
      return hits;
    }
    if (box) {
      box.addEventListener('keydown', (e) => {
        if (keyShown) keyShown.textContent = e.key === ' ' ? 'Space' : e.key;
        if (e.key === 'Enter') {
          const n = filter();
          if (msg) msg.textContent = n + (n === 1 ? ' event' : ' events') + ' found for “' + box.value.trim() + '”';
        } else if (e.key === 'Escape') {
          box.value = '';
          if (keyShown) keyShown.textContent = '–';
          if (msg) msg.textContent = '';
          filter();
        }
      });
      box.addEventListener('keyup', filter);
    }

    // Crowd signal
    const signalMsg = $('#signalMsg');
    $$('.light').forEach((l) => {
      const on  = () => { if (signalMsg) signalMsg.textContent = l.dataset.msg; };
      const off = () => { if (signalMsg) signalMsg.textContent = 'Hover a light'; };
      l.addEventListener('mouseover', on);
      l.addEventListener('mouseout', off);
      l.addEventListener('focus', on);
      l.addEventListener('blur', off);
    });
  }

  /* ---------------------------------------------------------
     Gallery: drag 1:1, project momentum, settle with a spring.
     Keys: ← → · N / P · Space for details.
     Supports #gallery and any .gallery-widget
     --------------------------------------------------------- */
  const project = (v, d = 0.998) => (v / 1000) * d / (1 - d);          // where a flick will come to rest
  const rubber = (over, dim, c = 0.55) => (over * dim * c) / (dim + c * Math.abs(over)); // soft edge

  function slideSrc(s) {
    if (s.img) return s.img;
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + (s.c1 || '#7c6af7') + '"/><stop offset="1" stop-color="' + (s.c2 || '#4fd1c5') + '"/></linearGradient></defs>' +
      '<rect width="640" height="360" fill="url(#g)"/>' +
      '<text x="320" y="218" font-size="120" text-anchor="middle">' + (s.emoji || '🧘') + '</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function setupGallery(root) {
    const slides = JSON.parse(root.dataset.slides || '[]');
    const viewport = $('.gallery-viewport', root);
    const track = $('.gallery-track', root);
    const dotsWrap = $('.gallery-dots', root);
    const caption = $('.gallery-caption', root) || $('#galleryCaption');
    if (!slides.length || !viewport || !track) return;

    slides.forEach((s, i) => {
      const fig = document.createElement('figure');
      fig.className = 'gallery-slide';
      const img = new Image();
      img.src = slideSrc(s);
      img.alt = s.name || s.title || 'Slide ' + (i + 1);
      img.draggable = false;
      fig.append(img);
      track.append(fig);

      if (dotsWrap) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', 'Show ' + (s.name || s.title || (i + 1)));
        dot.addEventListener('click', () => goTo(i, 0));
        dotsWrap.append(dot);
      }
    });

    let w = viewport.clientWidth || 1;
    let x = 0;
    let index = 0;
    let raf = 0;
    let showDetails = false;
    let drag = null;

    const minX = () => -(slides.length - 1) * w;
    const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
    function setX(v) { x = v; track.style.transform = 'translate3d(' + v + 'px,0,0)'; }

    function updateUI() {
      const s = slides[index];
      if (dotsWrap) {
        $$('button', dotsWrap).forEach((d, i) => d.setAttribute('aria-current', String(i === index)));
      }
      if (caption) {
        caption.innerHTML = '';
        const strong = document.createElement('strong');
        strong.textContent = s.name || s.title || '';
        caption.append(strong);
        if (showDetails || s.desc) {
          const small = document.createElement('small');
          small.textContent = s.desc || (s.day ? s.day + ', ' + s.time + ' · ' + s.venue : '');
          caption.append(small);
        }
      }
    }

    function springTo(target, v0 = 0, damping = 1, response = 0.35) {
      cancelAnimationFrame(raf);
      if (reduceMotion()) { setX(target); return; }
      const omega = (2 * Math.PI) / response;
      const k = omega * omega;
      const c = 2 * damping * omega;
      let v = v0;
      let last = performance.now();
      const step = (now) => {
        const dt = Math.min((now - last) / 1000, 0.032);
        last = now;
        const n = Math.max(1, Math.ceil(dt / 0.004));
        const h = dt / n;
        let pos = x;
        for (let i = 0; i < n; i++) {
          v += (-k * (pos - target) - c * v) * h;
          pos += v * h;
        }
        setX(pos);
        if (Math.abs(pos - target) < 0.1 && Math.abs(v) < 4) { setX(target); return; }
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }

    function goTo(i, velocity = 0) {
      index = clamp(i, 0, slides.length - 1);
      updateUI();
      springTo(-index * w, velocity);
    }

    viewport.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      cancelAnimationFrame(raf);
      drag = { id: e.pointerId, startX: e.clientX, startY: e.clientY, base: x, locked: false,
               hist: [{ t: e.timeStamp, x: e.clientX }] };
      viewport.classList.add('is-grabbing');
    });
    viewport.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (!drag.locked) {
        if (Math.hypot(dx, dy) < 10) return;
        if (Math.abs(dy) > Math.abs(dx)) { drag = null; viewport.classList.remove('is-grabbing'); return; }
        drag.locked = true;
        drag.startX = e.clientX;
        drag.base = x;
        viewport.setPointerCapture(e.pointerId);
        return;
      }
      drag.hist.push({ t: e.timeStamp, x: e.clientX });
      if (drag.hist.length > 8) drag.hist.shift();
      let nx = drag.base + (e.clientX - drag.startX);
      if (nx > 0) nx = rubber(nx, w);
      else if (nx < minX()) nx = minX() - rubber(minX() - nx, w);
      setX(nx);
    });
    function release(e) {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag;
      drag = null;
      viewport.classList.remove('is-grabbing');
      if (!d.locked) return;
      if (viewport.hasPointerCapture && viewport.hasPointerCapture(e.pointerId)) viewport.releasePointerCapture(e.pointerId);
      const last = d.hist[d.hist.length - 1];
      const recent = d.hist.filter((p) => last.t - p.t <= 100);
      const first = recent[0];
      const dt = (last.t - first.t) / 1000;
      const stale = e.timeStamp - last.t > 80;
      const v = !stale && dt > 0 ? (last.x - first.x) / dt : 0;
      const landing = x + project(v);
      const target = clamp(Math.round(-landing / w), index - 1, index + 1);
      goTo(target, v);
    }
    viewport.addEventListener('pointerup', release);
    viewport.addEventListener('pointercancel', release);

    document.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target) || quickNav.isOpen()) return;
      if (e.key === 'ArrowRight' || e.key === 'n' || e.key === 'N') goTo(index + 1);
      else if (e.key === 'ArrowLeft' || e.key === 'p' || e.key === 'P') goTo(index - 1);
      else if ((e.code === 'Space' || e.key === ' ') && !/^(BUTTON|A)$/.test(e.target.tagName)) {
        e.preventDefault();
        showDetails = !showDetails;
        updateUI();
      }
    });
    $$('[data-dir]', root).forEach((b) => b.addEventListener('click', () => goTo(index + Number(b.dataset.dir))));

    if ('ResizeObserver' in window) {
      new ResizeObserver(() => { w = viewport.clientWidth || w; setX(-index * w); }).observe(viewport);
    }
    w = viewport.clientWidth || w;
    updateUI();
    setX(0);
  }

  function initGallery() {
    $$('#gallery, .gallery-widget').forEach(setupGallery);
  }

  /* ---------------------------------------------------------
     Media: chime generated in code (no audio file needed)
     --------------------------------------------------------- */
  function initMedia() {
    const audio = $('#chime');
    if (!audio) return;
    const rate = 22050;
    const n = Math.floor(rate * 1.4);
    const buf = new ArrayBuffer(44 + n * 2);
    const v = new DataView(buf);
    const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    str(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    str(36, 'data'); v.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) {
      const t = i / rate;
      const env = Math.exp(-3 * t);
      const s = Math.sin(2 * Math.PI * 880 * t) * 0.6 + Math.sin(2 * Math.PI * 1320 * t) * 0.4;
      v.setInt16(44 + i * 2, s * env * 9000, true);
    }
    audio.src = URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
  }

  /* ---------------------------------------------------------
     Registration: inline regex validation + output table
     --------------------------------------------------------- */
  function initRegister() {
    const form = $('#regForm');
    if (!form) return;

    const E = (n) => form.elements[n];
    const val = (n) => (E(n).value || '').trim();
    const pat = (n, re, msg, optional = false) => () => {
      const v = val(n);
      if (!v) return optional ? '' : 'Required';
      return re.test(v) ? '' : msg;
    };
    const todayISO = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    if (E('dob')) E('dob').max = todayISO();

    const rules = {
      fullname: pat('fullname', /^[A-Za-z][A-Za-z .'-]{2,49}$/, '3–50 letters; spaces, dot and hyphen are fine'),
      regno:    pat('regno', /^\d{2}[A-Za-z]{3}\d{4}$/, 'Format like 23MIC0051'),
      email:    pat('email', /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Enter a valid email address'),
      mobile:   pat('mobile', /^[6-9]\d{9}$/, '10 digits, starting with 6 to 9'),
      password: pat('password', /^(?=.*[A-Za-z])(?=.*\d).{8,20}$/, '8–20 characters with a letter and a number'),
      web:      pat('web', /^https?:\/\/[^\s./]+\.\S{2,}$/i, 'Start with http:// or https://', true),
      age: () => {
        const v = val('age');
        if (!v) return 'Required';
        const n = Number(v);
        return n >= 16 && n <= 60 ? '' : 'Age must be between 16 and 60';
      },
      dob: () => {
        const v = val('dob');
        if (!v) return 'Required';
        return v <= todayISO() ? '' : 'Date of birth cannot be in the future';
      },
      dept:    () => (val('dept') ? '' : 'Choose a department'),
      skills:  () => (E('skills') && E('skills').selectedOptions.length ? '' : 'Pick at least one (Ctrl or Cmd-click for more)'),
      mode:    () => (E('mode') && E('mode').value ? '' : 'Choose how you will attend'),
      events:  () => (form.querySelector('input[name="events"]:checked') ? '' : 'Select at least one event'),
      arrival: () => {
        const v = val('arrival');
        if (!v) return '';
        return new Date(v) > new Date() ? '' : 'Pick a future date and time';
      },
    };

    function validate(name) {
      const box = form.querySelector('[data-field="' + name + '"]');
      if (!box || !rules[name]) return '';
      const err = rules[name]();
      box.classList.toggle('invalid', !!err);
      box.classList.toggle('valid', !err && box.classList.contains('touched'));
      const m = $('.msg', box);
      if (m) m.textContent = err;
      return err;
    }

    const bar = $('#pwBar');
    const barLabel = $('#pwLabel');
    function meter() {
      if (!bar) return;
      const v = E('password')?.value || '';
      let s = 0;
      if (v.length >= 8) s++;
      if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
      if (/\d/.test(v)) s++;
      if (/[^A-Za-z0-9]/.test(v)) s++;
      bar.style.width = v ? Math.max(s, 1) * 25 + '%' : '0';
      bar.dataset.level = String(v ? s : 0);
      if (barLabel) barLabel.textContent = v ? ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'][s] : '';
    }

    function onEdit(e) {
      const box = e.target.closest('[data-field]');
      if (!box) return;
      const name = box.dataset.field;
      if (e.type === 'change') box.classList.add('touched');
      if (box.classList.contains('touched')) validate(name);
      if (name === 'password') meter();
      if (name === 'exp' && $('#expVal')) $('#expVal').textContent = E('exp').value;
    }
    form.addEventListener('input', onEdit);
    form.addEventListener('change', onEdit);
    form.addEventListener('focusout', (e) => {
      if (e.target.matches('input[type="radio"], input[type="checkbox"]')) return;
      const box = e.target.closest('[data-field]');
      if (!box) return;
      box.classList.add('touched');
      validate(box.dataset.field);
    });

    form.addEventListener('reset', () => {
      setTimeout(() => {
        $$('[data-field]', form).forEach((b) => {
          b.classList.remove('touched', 'invalid', 'valid');
          const m = $('.msg', b);
          if (m) m.textContent = '';
        });
        meter();
        if ($('#expVal') && E('exp')) $('#expVal').textContent = E('exp').value;
        const out = $('#output');
        if (out) { out.hidden = true; out.innerHTML = ''; }
      }, 0);
    });

    function renderOutput(rows, ref) {
      const out = $('#output');
      if (!out) return;
      out.innerHTML = '';
      const h = document.createElement('h2');
      h.className = 'section-title';
      h.textContent = 'Registration details';
      const wrap = document.createElement('div');
      wrap.className = 'table-wrap';
      const table = document.createElement('table');
      table.className = 'table bordered';
      const head = table.createTHead().insertRow();
      ['Field', 'Value'].forEach((t) => { const th = document.createElement('th'); th.textContent = t; head.append(th); });
      const body = table.createTBody();
      rows.forEach(([label, value, swatch]) => {
        const tr = body.insertRow();
        tr.insertCell().textContent = label;
        const cell = tr.insertCell();
        if (swatch) {
          const sw = document.createElement('span');
          sw.className = 'swatch';
          sw.style.background = swatch;
          cell.append(sw);
        }
        cell.append(document.createTextNode(value));
      });
      wrap.append(table);
      const ok = document.createElement('p');
      ok.className = 'ok-line';
      ok.textContent = 'Registered successfully. Reference ' + ref;
      out.append(h, wrap, ok);
      out.hidden = false;
      out.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'nearest' });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let firstBad = null;
      Object.keys(rules).forEach((name) => {
        const box = form.querySelector('[data-field="' + name + '"]');
        if (!box) return;
        box.classList.add('touched');
        if (validate(name) && !firstBad) firstBad = box;
      });
      if (firstBad) {
        toast('Please fix the highlighted fields', 'err');
        const f = $('input, select, textarea', firstBad);
        if (f) f.focus();
        return;
      }

      const picked = $$('input[name="events"]:checked', form);
      const payload = {
        name: val('fullname'),
        regno: val('regno').toUpperCase(),
        email: val('email'),
        mobile: val('mobile'),
        events: picked.map((c) => c.value),
      };
      const submit = $('[type="submit"]', form);
      if (submit) {
        submit.disabled = true;
        submit.textContent = 'Registering…';
      }
      try {
        const res = await fetch(form.dataset.endpoint || '/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error('The server rejected the registration');

        const file = E('idcard')?.files?.[0];
        const skills = E('skills') ? Array.from(E('skills').selectedOptions).map((o) => o.value) : [];
        renderOutput([
          ['Name', payload.name],
          ['Register number', payload.regno],
          ['Email', payload.email],
          ['Mobile', payload.mobile],
          ['Password', '•'.repeat(Math.min(E('password')?.value?.length || 8, 12))],
          ['Age', val('age')],
          ['Date of birth', val('dob')],
          ['Department', val('dept')],
          ['Attending', E('mode')?.value || 'In person'],
          ['Skills', skills.join(', ')],
          ['Events', picked.map((c) => c.dataset.title || c.value).join(', ')],
          ['Preferred slot', val('slot') || 'Not set'],
          ['Arrival', val('arrival') || 'Not set'],
          ['Portfolio', val('web') || 'Not set'],
          ['Favourite event', val('favourite') || 'Not set'],
          ['Team colour', E('color')?.value || '#7c6af7', E('color')?.value || '#7c6af7'],
          ['Experience', (E('exp')?.value || '5') + ' / 10'],
          ['ID card', file ? file.name : 'Not uploaded'],
          ['Notes', val('notes') || 'None'],
        ], data.ref || 'REG-SUCCESS');
        toast('Registered · ' + (data.ref || 'Success'), 'ok');
      } catch (err) {
        toast(err.message, 'err');
      } finally {
        if (submit) {
          submit.disabled = false;
          submit.textContent = 'Register';
        }
      }
    });

    meter();
  }

  /* ---------------------------------------------------------
     Dashboard: stat cards mouseover/mouseout/click messages
     --------------------------------------------------------- */
  function initDashboard() {
    const cards = $$('.stat-card');
    const detail = $('#statDetail');
    if (!cards.length || !detail) return;
    const DEFAULT = 'Hover a metric for details · click to inspect';

    cards.forEach((card) => {
      const info = card.dataset.info || card.dataset.title || 'Metric card';
      card.addEventListener('mouseover', () => { detail.textContent = info; });
      card.addEventListener('mouseout',  () => { detail.textContent = DEFAULT; });
      card.addEventListener('focus',     () => { detail.textContent = info; });
      card.addEventListener('blur',      () => { detail.textContent = DEFAULT; });
      card.addEventListener('click', () => {
        const on = card.classList.toggle('is-saved');
        toast((on ? 'Inspecting: ' : 'Unchecked: ') + (card.dataset.title || 'Metric'), on ? 'ok' : 'info');
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const on = card.classList.toggle('is-saved');
          toast((on ? 'Inspecting: ' : 'Unchecked: ') + (card.dataset.title || 'Metric'), on ? 'ok' : 'info');
        }
      });
    });
  }

  /* ---------------------------------------------------------
     Academics: GPA Predictor (number + range slider + fetch)
     --------------------------------------------------------- */
  function initAcademics() {
    const range = $('#gpaHoursRange');
    const num = $('#gpaHoursNum');
    const btn = $('#gpaPredictBtn');
    const out = $('#gpaResult');
    if (!range || !btn) return;

    const sync = (val) => {
      const v = Math.max(0, Math.min(15, parseInt(val, 10) || 0));
      range.value = v;
      if (num) num.value = v;
      const lbl = $('#gpaHoursVal');
      if (lbl) lbl.textContent = v;
    };

    range.addEventListener('input', () => sync(range.value));
    if (num) num.addEventListener('input', () => sync(num.value));

    btn.addEventListener('click', async () => {
      const hours = parseInt(range.value, 10) || 0;
      btn.disabled = true;
      btn.textContent = 'Calculating…';
      try {
        const res = await fetch('/api/gpa-predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ extra_hours: hours }),
        });
        const data = await res.json();
        if (out) {
          out.hidden = false;
          out.innerHTML =
            '<div class="card" style="margin-top:14px;border-color:var(--accent);background:rgba(124,106,247,.08);padding:16px;">' +
            '<p style="font-size:13px;"><strong>Predicted CGPA:</strong> <span style="font-size:24px;color:var(--accent);font-weight:700;margin-left:8px;">' + data.predicted_cgpa + '</span></p>' +
            '<p class="muted" style="margin-top:4px;">Success probability: ' + data.base_probability + '% → <b>' + data.boosted_probability + '%</b></p>' +
            '<p style="margin-top:8px;font-size:12.5px;color:var(--success);font-weight:500">' + data.recommendation + '</p>' +
            '</div>';
        }
        toast('GPA Prediction computed', 'ok');
      } catch (e) {
        toast('Prediction failed. Try again.', 'err');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Predict CGPA';
      }
    });
  }

  /* ---------------------------------------------------------
     Timetable: slot hover details
     --------------------------------------------------------- */
  function initTimetable() {
    const slots = $$('.tt-slot');
    const detail = $('#ttDetail');
    if (!slots.length || !detail) return;
    const DEFAULT = 'Hover any course or lab slot for venue & faculty details';

    slots.forEach((s) => {
      const info = s.dataset.info || s.textContent.trim();
      s.addEventListener('mouseover', () => { detail.textContent = info; });
      s.addEventListener('mouseout',  () => { detail.textContent = DEFAULT; });
      s.addEventListener('focus',     () => { detail.textContent = info; });
      s.addEventListener('blur',      () => { detail.textContent = DEFAULT; });
    });
  }

  /* ---------------------------------------------------------
     Assignments: search (Enter/Esc/live filter) + click select
     --------------------------------------------------------- */
  function initAssignments() {
    const cards = $$('.assign-card');
    const box = $('#assignSearch');
    if (!cards.length) return;

    const countEl = $('#selectedAssignCount');
    const detail = $('#assignDetail');
    const DEFAULT = 'Hover an assignment for milestones · click to select';

    function toggleSelect(card) {
      const on = card.classList.toggle('is-saved');
      card.setAttribute('aria-pressed', String(on));
      if (countEl) countEl.textContent = String($$('.assign-card.is-saved').length);
      toast((on ? 'Selected: ' : 'Deselected: ') + card.dataset.title, on ? 'ok' : 'info');
    }

    cards.forEach((card) => {
      card.addEventListener('click', () => toggleSelect(card));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSelect(card); }
      });
      if (detail && card.dataset.info) {
        card.addEventListener('mouseover', () => { detail.textContent = card.dataset.info; });
        card.addEventListener('mouseout',  () => { detail.textContent = DEFAULT; });
      }
    });

    if (box) {
      const keyShown = $('#keyShownAssign');
      const msg = $('#assignMsg');
      const empty = $('#noAssignResults');

      function filter() {
        const q = box.value.trim().toLowerCase();
        let hits = 0;
        cards.forEach((c) => {
          const text = (c.dataset.title + ' ' + (c.dataset.course || '')).toLowerCase();
          const hit = !q || text.includes(q);
          c.hidden = !hit;
          if (hit) hits++;
        });
        if (empty) empty.hidden = hits > 0;
        box.classList.toggle('has-text', q !== '');
        return hits;
      }

      box.addEventListener('keydown', (e) => {
        if (keyShown) keyShown.textContent = e.key === ' ' ? 'Space' : e.key;
        if (e.key === 'Enter') {
          const n = filter();
          if (msg) msg.textContent = n + ' assignment(s) found for “' + box.value.trim() + '”';
        } else if (e.key === 'Escape') {
          box.value = '';
          if (keyShown) keyShown.textContent = '–';
          if (msg) msg.textContent = '';
          filter();
        }
      });
      box.addEventListener('keyup', filter);
    }
  }

  /* ---------------------------------------------------------
     Attendance: course selector + /api/attendance-forecast
     --------------------------------------------------------- */
  function initAttendance() {
    const sel = $('#courseSelect');
    const btn = $('#forecastBtn');
    const out = $('#forecastOutput');
    if (!sel || !btn || !out) return;

    async function forecast() {
      const code = sel.value;
      btn.disabled = true;
      btn.textContent = 'Forecasting…';
      try {
        const res = await fetch('/api/attendance-forecast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ course_code: code }),
        });
        const d = await res.json();
        const badge = d.status === 'safe'
          ? '<span class="chip chip-teal">Safe (>85%)</span>'
          : d.status === 'warning'
          ? '<span class="chip chip-orange">Warning (75–85%)</span>'
          : '<span class="chip chip-red">Critical (<75%)</span>';

        out.innerHTML =
          '<div class="table-wrap" style="margin-top:14px">' +
          '<table class="table bordered">' +
          '<thead><tr><th>Course</th><th class="center">Current %</th><th class="center">Attended</th><th class="center">Safe to Miss</th><th class="center">Status</th></tr></thead>' +
          '<tbody><tr>' +
          '<td><b>' + d.course + '</b> (' + code + ')</td>' +
          '<td class="center"><b>' + d.current_attendance + '%</b></td>' +
          '<td class="center">' + d.attended + ' / ' + d.total + '</td>' +
          '<td class="center" style="color:' + (d.safe_to_miss > 0 ? 'var(--success)' : 'var(--danger)') + ';font-weight:700">' + d.safe_to_miss + ' classes</td>' +
          '<td class="center">' + badge + '</td>' +
          '</tr></tbody>' +
          '</table></div>';
        out.hidden = false;
        toast('Forecast updated for ' + d.course, 'ok');
      } catch (e) {
        toast('Forecast failed. Please try again.', 'err');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Forecast Attendance';
      }
    }

    btn.addEventListener('click', forecast);
    sel.addEventListener('change', forecast);
  }

  /* ---------------------------------------------------------
     Career: skill-gap form (checkboxes + multiple select)
     --------------------------------------------------------- */
  function initCareer() {
    const form = $('#skillForm');
    const out = $('#missingSkills');
    if (!form || !out) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const current = new Set($$('input[name="has_skill"]:checked', form).map((c) => c.value.toLowerCase().trim()));
      const sel = $('#targetSkills');
      if (!sel) return;
      const targets = Array.from(sel.selectedOptions).map((o) => o.value);
      if (!targets.length) {
        toast('Please pick at least one target skill', 'err');
        return;
      }
      const missing = targets.filter((s) => !current.has(s.toLowerCase().trim()));
      out.hidden = false;
      out.innerHTML = '';
      const h3 = document.createElement('h3');
      h3.textContent = 'Identified Skill Gaps';
      out.append(h3);
      if (!missing.length) {
        const p = document.createElement('p');
        p.className = 'ok-line';
        p.textContent = '🎉 Excellent! You possess all selected skill requirements!';
        out.append(p);
        toast('All selected skills matched!', 'ok');
      } else {
        const p = document.createElement('p');
        p.className = 'muted';
        p.style.marginTop = '4px';
        p.textContent = 'Focus your upcoming study sprints on these competencies:';
        const div = document.createElement('div');
        div.className = 'choice-row';
        div.style.marginTop = '10px';
        missing.forEach((s) => {
          const sp = document.createElement('span');
          sp.className = 'chip chip-red';
          sp.textContent = 'Missing: ' + s;
          div.append(sp);
        });
        out.append(p, div);
        toast('Found ' + missing.length + ' missing skill(s)', 'info');
      }
    });
  }

  /* ---------------------------------------------------------
     Wellness: mood form (radio, range, color)
     --------------------------------------------------------- */
  function initWellness() {
    const form = $('#moodForm');
    const range = $('#energyRange');
    const valOut = $('#energyVal');
    if (range && valOut) {
      range.addEventListener('input', () => { valOut.textContent = range.value; });
    }
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const mood = form.querySelector('input[name="mood"]:checked')?.value || 'Neutral';
      const energy = range ? range.value : '70';
      const color = $('#auraColor')?.value || '#7c6af7';
      const msg = $('#moodMsg');
      if (msg) {
        msg.hidden = false;
        msg.innerHTML =
          '<p class="ok-line">Mood logged: <b>' + mood + '</b> · Energy: <b>' + energy + '%</b> · ' +
          'Aura: <span class="swatch" style="background:' + color + '"></span>' + color + '</p>';
      }
      toast('Mood logged: ' + mood, 'ok');
    });
  }

  /* ---------------------------------------------------------
     Chat: Enter sends, Escape clears, replies from /api/chat
     --------------------------------------------------------- */
  function initChat() {
    const box = $('#chatInput');
    const btn = $('#chatSendBtn');
    const list = $('#chatMessages');
    const quicks = $$('.quick-btn');
    if (!box || !list) return;

    function append(text, role) {
      const msg = document.createElement('div');
      msg.className = 'chat-msg ' + role;
      const bubble = document.createElement('div');
      bubble.className = 'chat-bubble ' + role;
      bubble.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
      msg.append(bubble);
      list.append(msg);
      list.scrollTop = list.scrollHeight;
    }

    async function send() {
      const text = box.value.trim();
      if (!text) return;
      box.value = '';
      append(text, 'user');

      const typing = document.createElement('div');
      typing.className = 'chat-msg bot typing-ind';
      typing.textContent = 'AI assistant is typing…';
      list.append(typing);
      list.scrollTop = list.scrollHeight;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text }),
        });
        const d = await res.json();
        typing.remove();
        append(d.reply || 'No response', 'bot');
      } catch (e) {
        typing.remove();
        append('Sorry, could not connect to campus assistant.', 'bot');
      }
    }

    box.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); send(); }
      else if (e.key === 'Escape') { box.value = ''; }
    });
    if (btn) btn.addEventListener('click', send);
    quicks.forEach((q) => {
      q.addEventListener('click', () => {
        box.value = q.dataset.msg || q.textContent.trim();
        send();
      });
    });
  }

  /* ---------------------------------------------------------
     Boot: guarded invocation for every page
     --------------------------------------------------------- */
  initTheme();
  initQuickNav();
  initEvents();
  initGallery();
  initMedia();
  initRegister();
  initDashboard();
  initAcademics();
  initTimetable();
  initAssignments();
  initAttendance();
  initCareer();
  initWellness();
  initChat();
})();
