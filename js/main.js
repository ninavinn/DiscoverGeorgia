/* აღმოაჩინე საქართველო — main.js
   მოდულური სტრუქტურა: თითო ფუნქცია თითო ფუნქციონალზე. */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const safeStorage = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } }
  };

  /* ===== 1. მობილური მენიუ ===== */
  function initMenu() {
    const toggle = $('#menuToggle');
    const nav = $('#mainNav');
    const setOpen = (open) => {
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'მენიუს დახურვა' : 'მენიუს გახსნა');
    };
    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
    $$('a', nav).forEach(a => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
  }

  /* ===== 2. ბნელი / ნათელი თემა ===== */
  function initTheme() {
    const btn = $('#themeToggle');
    const saved = safeStorage.get('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const apply = (t) => {
      document.documentElement.dataset.theme = t;
      btn.textContent = t === 'dark' ? '☀️' : '🌙';
    };
    apply(saved || (prefersDark ? 'dark' : 'light'));
    btn.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      apply(next);
      safeStorage.set('theme', next);
    });
  }

  /* ===== 3. სლაიდერი (ისრები, წერტილები, კლავიატურა, ავტოგადაადგილება, swipe) ===== */
  function initSlider() {
    const slider = $('#slider');
    const slides = $$('.slide', slider);
    const dotsBox = $('#dots');
    let index = 0;
    let timer = null;

    const dots = slides.map((_, i) => {
      const d = document.createElement('button');
      d.className = 'dot';
      d.setAttribute('role', 'tab');
      d.setAttribute('aria-label', `სლაიდი ${i + 1}`);
      d.addEventListener('click', () => { show(i); restart(); });
      dotsBox.appendChild(d);
      return d;
    });

    function show(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach((s, n) => s.classList.toggle('active', n === index));
      dots.forEach((d, n) => {
        d.classList.toggle('active', n === index);
        d.setAttribute('aria-selected', String(n === index));
      });
    }
    const next = () => show(index + 1);
    const prev = () => show(index - 1);
    const start = () => { timer = setInterval(next, 5000); };
    const stop = () => clearInterval(timer);
    const restart = () => { stop(); start(); };

    $('#nextBtn').addEventListener('click', () => { next(); restart(); });
    $('#prevBtn').addEventListener('click', () => { prev(); restart(); });
    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
    document.addEventListener('keydown', e => {
      const r = slider.getBoundingClientRect();
      const visible = r.top < innerHeight && r.bottom > 0;
      if (!visible) return;
      if (e.key === 'ArrowRight') { next(); restart(); }
      if (e.key === 'ArrowLeft') { prev(); restart(); }
    });

    let startX = 0;
    slider.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) { dx < 0 ? next() : prev(); restart(); }
    });

    show(0);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) start();
  }

  /* ===== 4. გალერეის ფილტრი ===== */
  function initFilter() {
    const buttons = $$('.filter');
    const cards = $$('.card');
    buttons.forEach(btn => btn.addEventListener('click', () => {
      const f = btn.dataset.filter;
      buttons.forEach(b => b.classList.toggle('active', b === btn));
      cards.forEach(c => c.classList.toggle('hide', f !== 'all' && c.dataset.cat !== f));
    }));
  }

  /* ===== 5. მთვლელი ანიმაცია + scroll reveal (IntersectionObserver) ===== */
  function initObservers() {
    const animate = (el) => {
      const target = +el.dataset.target;
      const duration = 1500;
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min((t - t0) / duration, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString('ka-GE');
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add('visible');
        if (en.target.classList.contains('counter')) animate(en.target);
        obs.unobserve(en.target);
      });
    }, { threshold: 0.25 });

    $$('.card, .about-card, .stats li, .form').forEach(el => { el.classList.add('reveal'); io.observe(el); });
    $$('.counter').forEach(el => io.observe(el));
  }

  /* ===== 6. აქტიური ნავიგაცია სქროლისას ===== */
  function initScrollSpy() {
    const links = $$('.main-nav a');
    const sections = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
    const spy = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${en.target.id}`));
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => spy.observe(s));
  }

  /* ===== 7. ზემოთ დაბრუნების ღილაკი ===== */
  function initToTop() {
    const btn = $('#toTop');
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { btn.hidden = window.scrollY < 600; ticking = false; });
    }, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ===== 8. ფორმის ვალიდაცია ===== */
  function initForm() {
    const form = $('#contactForm');
    const msg = $('#message');
    const counter = $('#charCount');
    const success = $('#formSuccess');

    const rules = {
      name:   v => v.trim().length >= 2 || 'სახელი უნდა შეიცავდეს მინიმუმ 2 სიმბოლოს',
      email:  v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || 'შეიყვანე სწორი ელფოსტა',
      region: v => v !== '' || 'აირჩიე რეგიონი'
    };

    function check(field) {
      const input = form.elements[field];
      const result = rules[field](input.value);
      const ok = result === true;
      $(`#${field}Error`).textContent = ok ? '' : result;
      input.classList.toggle('invalid', !ok);
      input.setAttribute('aria-invalid', String(!ok));
      return ok;
    }

    Object.keys(rules).forEach(f => {
      form.elements[f].addEventListener('blur', () => check(f));
      form.elements[f].addEventListener('input', () => { if (form.elements[f].classList.contains('invalid')) check(f); });
    });

    msg.addEventListener('input', () => { counter.textContent = msg.value.length; });

    form.addEventListener('submit', e => {
      e.preventDefault();
      const allOk = Object.keys(rules).map(check).every(Boolean);
      if (!allOk) {
        const firstBad = $('.invalid', form);
        if (firstBad) firstBad.focus();
        return;
      }
      const name = form.elements.name.value.trim();
      success.textContent = `გმადლობთ, ${name}! შენი მოთხოვნა მივიღეთ — მარშრუტს ელფოსტით გამოგიგზავნით.`;
      success.hidden = false;
      form.reset();
      counter.textContent = '0';
    });
  }

  /* ===== ინიციალიზაცია ===== */
  document.addEventListener('DOMContentLoaded', () => {
    initMenu();
    initTheme();
    initSlider();
    initFilter();
    initObservers();
    initScrollSpy();
    initToTop();
    initForm();
  });
})();
