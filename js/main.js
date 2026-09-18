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

  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    curtain.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      var first = curtain.querySelector('a');
      if (first) first.focus();
    }
  }

  burger.addEventListener('click', function () {
    setMenu(curtain.hidden);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !curtain.hidden) {
      setMenu(false);
      burger.focus();
    }
  });

  /* Якорные ссылки — через Lenis, чтобы скролл оставался плавным */
  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('a[href^="#"]');
    if (!link) return;

    var href = link.getAttribute('href');
    if (href.length < 2) return;

    var target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();
    if (!curtain.hidden) setMenu(false);

    if (lenis) lenis.scrollTo(target, { offset: -80 });
    else target.scrollIntoView({ block: 'start' });
  });
})();
