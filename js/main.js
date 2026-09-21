(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lenis = null;

  if (!reduced && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      requestAnimationFrame(function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      });
    }
  }

  window.site = { lenis: lenis, reduced: reduced };

  /* Шапка прячется при скролле вниз, возвращается при скролле вверх */
  var nav = document.getElementById('nav');
  var lastY = window.scrollY;

  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    if (y > 160 && y > lastY) nav.classList.add('nav--hidden');
    else nav.classList.remove('nav--hidden');
    lastY = y;
  }, { passive: true });

  /* Мобильное меню-«занавес» */
  var burger = document.getElementById('navBurger');
  var curtain = document.getElementById('navCurtain');
  var FOCUSABLE = 'a[href], button:not([disabled])';

  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    curtain.hidden = !open;
    document.body.classList.toggle('is-locked', open);

    if (lenis) {
      if (open) lenis.stop();
      else lenis.start();
    }

    if (open) {
      var first = curtain.querySelector(FOCUSABLE);
      if (first) first.focus();
    }
  }

  burger.addEventListener('click', function () {
    setMenu(curtain.hidden);
  });

  document.addEventListener('keydown', function (e) {
    if (curtain.hidden) return;

    if (e.key === 'Escape') {
      setMenu(false);
      burger.focus();
      return;
    }

    /* Пока занавес открыт, Tab не должен уводить на ссылки под ним */
    if (e.key !== 'Tab') return;

    var items = Array.prototype.slice.call(curtain.querySelectorAll(FOCUSABLE));
    if (!items.length) return;

    var first = items[0];
    var last = items[items.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  /* Аккордеон вопросов: высоту анимирует GSAP, без него — мгновенное раскрытие */
  var canAnimate = !reduced && typeof gsap !== 'undefined';

  document.querySelectorAll('.faq__q').forEach(function (button) {
    var item = button.closest('.faq__item');
    var answer = document.getElementById(button.getAttribute('aria-controls'));
    if (!answer) return;

    button.addEventListener('click', function () {
      var open = button.getAttribute('aria-expanded') === 'true';

      button.setAttribute('aria-expanded', String(!open));
      item.classList.toggle('is-open', !open);

      if (!canAnimate) {
        answer.classList.toggle('is-shown', !open);
        answer.style.height = open ? '0px' : 'auto';
        return;
      }

      /* Анимируем в пикселях: из 'auto' GSAP сначала мерит высоту,
         и первые ~0.3 с после клика ничего не происходило */
      if (open) {
        gsap.set(answer, { height: answer.scrollHeight });
        gsap.to(answer, {
          height: 0, duration: .32, ease: 'power3.out', overwrite: true,
          onComplete: function () { answer.classList.remove('is-shown'); }
        });
      } else {
        answer.classList.add('is-shown');
        gsap.fromTo(answer, { height: 0 }, {
          height: answer.scrollHeight, duration: .32, ease: 'power3.out', overwrite: true,
          onComplete: function () { answer.style.height = 'auto'; }
        });
      }
    });
  });

  /* Якорные ссылки — через Lenis, чтобы скролл оставался плавным */
  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('a[href^="#"]');
    if (!link) return;

    /* Кнопки попапа и загрузки обрабатывает forms.js */
    if (link.hasAttribute('data-popup') || link.hasAttribute('data-download')) return;

    var href = link.getAttribute('href');

    /* Пустая ссылка не должна отбрасывать страницу наверх */
    if (href.length < 2) {
      e.preventDefault();
      return;
    }

    var target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();

    if (!curtain.hidden) {
      setMenu(false);
      burger.focus();
    }

    if (lenis) lenis.scrollTo(target, { offset: -80 });
    else target.scrollIntoView({ block: 'start' });
  });
})();
