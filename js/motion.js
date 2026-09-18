(function () {
  'use strict';

  var reduced = window.site ? window.site.reduced : true;
  var lenis = window.site ? window.site.lenis : null;
  var hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';

  /* ---------------------------------------------------------------- Интро */
  var screen = document.getElementById('heroScreen');
  var heroLogo = document.querySelector('.hero__logo');
  var heroEyebrow = document.querySelector('.hero__eyebrow');
  var heroCards = document.querySelectorAll('.hero__card');
  var introDone = false;

  function endIntro() {
    if (introDone) return;
    introDone = true;
    document.body.classList.remove('is-intro');
    if (lenis) lenis.start();
  }

  if (reduced || !hasGsap) {
    endIntro();
  } else {
    if (lenis) lenis.stop();

    var intro = gsap.timeline({ onComplete: endIntro });

    intro
      .fromTo(screen,
        { clipPath: 'inset(0% 50% 0% 50%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power4.out' })
      .from('.hero__bg', { scale: 1.22, duration: 1.4, ease: 'power3.out' }, 0)
      .from([heroEyebrow, heroLogo], { y: 28, opacity: 0, duration: .7, stagger: .1, ease: 'power3.out' }, 0.55)
      .from(heroCards, { y: 20, opacity: 0, duration: .6, stagger: .08, ease: 'power3.out' }, 0.8)
      .from('.hero__scroll', { opacity: 0, duration: .5 }, 1.0);

    /* Интро можно пропустить кликом */
    document.addEventListener('click', function skip() {
      if (introDone) return;
      intro.progress(1);
      document.removeEventListener('click', skip);
    }, { once: false });
  }

  /* ----------------------------------------------------------- Таймкод */
  var tcValue = document.getElementById('timecodeValue');
  var tcProgress = document.getElementById('timecodeProgress');

  function pad(n) { return String(n).padStart(2, '0'); }

  function renderTimecode() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;

    /* Прогресс страницы читается как хронометраж фильма: 90 минут при 24 к/с */
    var frames = Math.round(p * 90 * 60 * 24);
    var sec = Math.floor(frames / 24);

    tcValue.textContent = [
      pad(Math.floor(sec / 3600)),
      pad(Math.floor(sec / 60) % 60),
      pad(sec % 60),
      pad(frames % 24)
    ].join(':');

    tcProgress.style.width = (p * 100) + '%';
  }

  window.addEventListener('scroll', renderTimecode, { passive: true });
  window.addEventListener('resize', renderTimecode);
  renderTimecode();

  /* ------------------------------------------- Бесконечные ленты (02, 03) */
  var scrollDir = -1;
  var scrollVel = 0;
  var prevY = window.scrollY;

  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    var d = y - prevY;
    if (d !== 0) scrollDir = d > 0 ? -1 : 1;
    scrollVel = Math.min(Math.abs(d), 90);
    prevY = y;
  }, { passive: true });

  function infiniteRow(row, baseDir, baseSpeed, followScroll) {
    var originals = Array.prototype.slice.call(row.children);
    if (!originals.length) return;

    var gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    var unit = 0;
    var x = 0;

    function measure() {
      unit = originals.reduce(function (sum, node) {
        return sum + node.getBoundingClientRect().width + gap;
      }, 0);

      var guard = 0;
      while (row.scrollWidth < window.innerWidth * 2 && guard < 8) {
        originals.forEach(function (node) { row.appendChild(node.cloneNode(true)); });
        guard++;
      }
    }

    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);

    (function tick() {
      var dir = followScroll ? baseDir * scrollDir * -1 : baseDir;
      var speed = baseSpeed + scrollVel * 0.05;

      x += dir * speed;
      if (unit > 0) {
        while (x <= -unit) x += unit;
        while (x > 0) x -= unit;
      }

      row.style.transform = 'translate3d(' + x + 'px,0,0)';
      scrollVel *= 0.92;
      requestAnimationFrame(tick);
    })();
  }

  if (!reduced) {
    var marquee = document.getElementById('marqueeTrack');
    if (marquee) infiniteRow(marquee, -1, 0.9, true);

    document.querySelectorAll('.strip__row').forEach(function (row) {
      var dir = parseFloat(row.getAttribute('data-strip-dir')) || -1;
      infiniteRow(row, dir, 0.35, false);
    });
  }

  /* ------------------------------------------------ Появление блока 04 */
  if (!reduced && hasGsap) {
    gsap.from('.wordmark__eyebrow, .wordmark__small', {
      scrollTrigger: { trigger: '.wordmark', start: 'top 78%' },
      y: 24, opacity: 0, duration: .8, stagger: .08, ease: 'power3.out'
    });

    gsap.from('.wordmark__big', {
      scrollTrigger: { trigger: '.wordmark', start: 'top 74%' },
      y: 60, opacity: 0, duration: 1, ease: 'power4.out'
    });

    gsap.fromTo('.wordmark__photo',
      { clipPath: 'inset(100% 0% 0% 0%)' },
      {
        scrollTrigger: { trigger: '.wordmark__stage', start: 'top 85%' },
        clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power4.out'
      });

    /* Лёгкий параллакс занавеса в hero */
    gsap.to('.hero__bg', {
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
      yPercent: 12, ease: 'none'
    });
  }
})();
