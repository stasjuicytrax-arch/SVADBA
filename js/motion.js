(function () {
  'use strict';

  var reduced = window.site ? window.site.reduced : true;
  var lenis = window.site ? window.site.lenis : null;
  var hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';

  /* ---------------------------------------------------------------- Интро */
  /* Раскрывается внутренняя сцена: у внешней рамки свой clip-path со срезом углов */
  var screen = document.getElementById('heroStage');
  var introDone = false;

  function endIntro() {
    if (introDone) return;
    introDone = true;
    document.body.classList.remove('is-intro');
    if (lenis) lenis.start();
  }

  if (!reduced && hasGsap) {
    /* Класс ставится из JS: в разметке он запер бы страницу без скриптов */
    document.body.classList.add('is-intro');
    if (lenis) lenis.stop();

    var intro = gsap.timeline({ onComplete: endIntro });

    intro
      .fromTo(screen,
        { clipPath: 'inset(0% 50% 0% 50%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power4.out' })
      .from('.hero__bg', { scale: 1.18, duration: 1.4, ease: 'power3.out' }, 0)
      .from('.hero__eyebrow', { y: 20, opacity: 0, duration: .7, ease: 'power3.out' }, 0.55)
      .from('.hero__logo', { y: 28, opacity: 0, duration: .8, ease: 'power3.out' }, 0.65)
      .from('.hero__card', { y: 20, opacity: 0, duration: .6, stagger: .08, ease: 'power3.out' }, 0.85)
      .from('.hero__scroll', { opacity: 0, duration: .5 }, 1.05);

    var skip = function () {
      if (introDone) return;
      intro.progress(1);
      document.removeEventListener('click', skip);
      document.removeEventListener('keydown', skip);
    };

    document.addEventListener('click', skip);
    document.addEventListener('keydown', skip);
  }

  /* ----------------------------------------------------------- Таймкод */
  var timecode = document.getElementById('timecode');
  var tcValue = document.getElementById('timecodeValue');
  var tcProgress = document.getElementById('timecodeProgress');
  var scrollMax = 0;
  var tcQueued = false;

  function measureScroll() {
    scrollMax = document.documentElement.scrollHeight - window.innerHeight;
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function renderTimecode() {
    tcQueued = false;
    var p = scrollMax > 0 ? Math.min(Math.max(window.scrollY / scrollMax, 0), 1) : 0;

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

  function queueTimecode() {
    if (tcQueued) return;
    tcQueued = true;
    requestAnimationFrame(renderTimecode);
  }

  measureScroll();
  renderTimecode();

  /* Таймкод висит поверх всего; над светлыми «экранами» светлые цвета давали 2.4:1 */
  var lightScreens = document.querySelectorAll('.section--screen');
  if (lightScreens.length && 'IntersectionObserver' in window) {
    var onLight = new Set();
    var tcObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) onLight.add(entry.target);
        else onLight.delete(entry.target);
      });
      timecode.classList.toggle('timecode--on-light', onLight.size > 0);
    }, { rootMargin: '0px 0px -100% 0px' });

    lightScreens.forEach(function (el) { tcObserver.observe(el); });
  }

  /* --------------------------------------------------- Бесконечные ленты */
  window.addEventListener('scroll', queueTimecode, { passive: true });

  function infiniteRow(row, dir, speed) {
    var originals = Array.prototype.slice.call(row.children);
    if (!originals.length) return;

    var gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    var unit = 0;
    var x = 0;
    var visible = true;

    function measure() {
      /* Клоны удаляются перед пересчётом: иначе каждый resize наращивал DOM */
      row.querySelectorAll('[data-clone]').forEach(function (n) { n.remove(); });

      unit = originals.reduce(function (sum, node) {
        return sum + node.getBoundingClientRect().width + gap;
      }, 0);

      /* Лента сдвигается до -unit, поэтому за точкой сдвига должна оставаться
         ещё минимум ширина окна текста — иначе в кадре пустота */
      var need = unit + window.innerWidth;
      var guard = 0;
      while (row.scrollWidth < need && guard < 8) {
        originals.forEach(function (node) {
          var clone = node.cloneNode(true);
          clone.setAttribute('data-clone', '');
          clone.setAttribute('aria-hidden', 'true');
          row.appendChild(clone);
        });
        guard++;
      }
    }

    measure();

    /* Пока шрифты не загрузились, ширина фраз другая — пересчёт после загрузки,
       иначе на стыке цикла был бы рывок */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

    /* Только изменение ширины: на мобиле адресная строка шлёт resize по высоте */
    var lastWidth = window.innerWidth;
    var resizeTimer = null;

    window.addEventListener('resize', function () {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measure, 200);
    });

    window.addEventListener('load', measure);

    var rafId = null;

    function tick() {
      rafId = null;
      if (!visible) return;

      x += dir * speed;
      if (unit > 0) {
        while (x <= -unit) x += unit;
        while (x > 0) x -= unit;
      }

      row.style.transform = 'translate3d(' + x + 'px,0,0)';
      rafId = requestAnimationFrame(tick);
    }

    function start() {
      if (rafId === null && visible) rafId = requestAnimationFrame(tick);
    }

    /* Лента за пределами экрана не должна жечь батарею.
       Заодно догружаем кадры: lazy не срабатывает у картинок, спрятанных по горизонтали,
       и они всплывали бы пустыми, когда лента их довезёт */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) {
          row.querySelectorAll('img[loading="lazy"]').forEach(function (img) { img.loading = 'eager'; });
        }
        start();
      }, { rootMargin: '200px 0px' }).observe(row);
    }

    start();
  }

  if (!reduced) {
    var track = document.querySelector('.marquee__track');
    if (track) infiniteRow(track, -1, 0.5);

    document.querySelectorAll('.strip__row').forEach(function (row) {
      infiniteRow(row, parseFloat(row.getAttribute('data-strip-dir')) || -1, 0.35);
    });
  }

  window.addEventListener('resize', function () {
    measureScroll();
    queueTimecode();
  });

  /* ------------------------------------------------ Появление блока 04 */
  if (!reduced && hasGsap) {
    gsap.from('.wordmark__eyebrow', {
      scrollTrigger: { trigger: '.wordmark', start: 'top 78%' },
      y: 20, opacity: 0, duration: .8, ease: 'power3.out'
    });

    gsap.from('.wordmark__big', {
      scrollTrigger: { trigger: '.wordmark', start: 'top 74%' },
      y: 50, opacity: 0, duration: 1, ease: 'power4.out'
    });

    gsap.fromTo('.wordmark__photo',
      { clipPath: 'inset(100% 0% 0% 0%)' },
      {
        scrollTrigger: { trigger: '.wordmark__stage', start: 'top 85%' },
        clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power4.out'
      });

    /* 05: строки заголовка поднимаются по очереди */
    gsap.from('.film__line', {
      scrollTrigger: { trigger: '.film', start: 'top 72%' },
      y: 48, opacity: 0, duration: .9, stagger: .08, ease: 'power4.out'
    });

    /* Фото-пилюля: медленный зум внутри при скролле (DESIGN.md §3) */
    gsap.fromTo('.film__pill img', { scale: 1.4 }, {
      scale: 1.05, ease: 'none',
      scrollTrigger: { trigger: '.film', start: 'top bottom', end: 'bottom top', scrub: true }
    });

    gsap.fromTo('.film__photo img', { scale: 1.12 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: '.film__photo', start: 'top bottom', end: 'bottom 40%', scrub: true }
    });

    /* Хлопушка «хлопает» один раз при появлении */
    gsap.fromTo('.film__clapper', { rotation: -16 }, {
      rotation: 0, duration: .24, delay: .25, ease: 'power4.in',
      scrollTrigger: { trigger: '.film__text', start: 'top 85%', once: true }
    });

    /* 06: веер раскрывается от скролла — из стопки в стороны */
    var fanScroll = { trigger: '.fan', start: 'top 85%', end: 'center 50%', scrub: true };
    gsap.from('.fan__card--left', { x: 0, rotation: 0, ease: 'none', scrollTrigger: fanScroll });
    gsap.from('.fan__card--right', { x: 0, rotation: 0, ease: 'none', scrollTrigger: fanScroll });
    gsap.from('.fan__card--center', { y: 0, ease: 'none', scrollTrigger: fanScroll });

    /* Лёгкий параллакс занавеса */
    gsap.to('.hero__bg', {
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
      yPercent: 10, ease: 'none'
    });
  }
})();
