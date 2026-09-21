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
  /* Скорость прокрутки — для лёгкой реакции бегущей строки */
  var scrollVel = 0;
  var prevY = window.scrollY;

  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    scrollVel = Math.min(Math.abs(y - prevY), 80);
    prevY = y;
    queueTimecode();
  }, { passive: true });

  /* boost — насколько лента ускоряется от прокрутки (0 — не реагирует) */
  function infiniteRow(row, dir, speed, boost) {
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
    var lastT = 0;

    /* Скорость задана в пикселях за кадр 60 Гц и пересчитывается по реальному времени:
       иначе на мониторах 120–144 Гц ленты ехали бы в 2–2.4 раза быстрее */
    function tick(t) {
      rafId = null;
      if (!visible) { lastT = 0; return; }

      var k = lastT ? Math.min((t - lastT) / 16.667, 3) : 1;
      lastT = t;
      x += dir * (speed + (boost ? scrollVel * boost : 0)) * k;
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
    /* Лента вдвое медленнее фото-рядов (0.35), чтобы не выглядела прилепленной к ним,
       и слегка ускоряется от прокрутки: обычный скролл даёт около +60%, рывок — до ×3 */
    var track = document.querySelector('.marquee__track');
    if (track) infiniteRow(track, -1, 0.17, 0.004);

    /* Затухание скорости прокрутки — пока она есть */
    (function decay() {
      if (scrollVel > 0.05) {
        scrollVel *= 0.9;
        requestAnimationFrame(decay);
      } else {
        scrollVel = 0;
        setTimeout(decay, 200);
      }
    })();

    document.querySelectorAll('.strip__row').forEach(function (row) {
      infiniteRow(row, parseFloat(row.getAttribute('data-strip-dir')) || -1, 0.35);
    });
  }

  window.addEventListener('resize', function () {
    measureScroll();
    queueTimecode();
  });

  /* ------------------------------------ 09: фото меняется по пунктам списка */
  var whyItems = document.querySelectorAll('.why__item');
  var whyPhotos = document.querySelectorAll('.why__photo');

  if (whyItems.length && whyPhotos.length && 'IntersectionObserver' in window) {
    var whyObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var i = entry.target.getAttribute('data-why');
        whyPhotos.forEach(function (photo) {
          photo.classList.toggle('is-on', photo.getAttribute('data-why-photo') === i);
        });
      });
    }, { rootMargin: '-45% 0px -45% 0px' });

    whyItems.forEach(function (item) { whyObserver.observe(item); });
  }

  /* --------------------------------- 10: колонки отзывов едут навстречу */
  function reviewColumn(col, dir) {
    var originals = Array.prototype.slice.call(col.children);
    if (!originals.length) return;

    var gap = parseFloat(getComputedStyle(col).rowGap) || 0;
    var unit = 0;
    var y = dir < 0 ? 0 : -1;
    var paused = false;
    var rafId = null;
    var lastT = 0;

    function measure() {
      col.querySelectorAll('[data-clone]').forEach(function (n) { n.remove(); });

      unit = originals.reduce(function (sum, node) {
        return sum + node.getBoundingClientRect().height + gap;
      }, 0);

      /* Считаем по своей высоте: scrollHeight у колонки врёт — грид растягивает
         её под самую высокую соседку, и второй колонке клоны не доставались */
      var need = unit + col.parentElement.clientHeight;
      var have = unit;
      var guard = 0;
      while (have < need && guard < 8) {
        originals.forEach(function (node) {
          var clone = node.cloneNode(true);
          clone.setAttribute('data-clone', '');
          clone.setAttribute('aria-hidden', 'true');
          col.appendChild(clone);
        });
        have += unit;
        guard++;
      }
      if (y === -1) y = -unit;
    }

    measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

    function tick(t) {
      rafId = null;
      if (paused) { lastT = 0; return; }

      var k = lastT ? Math.min((t - lastT) / 16.667, 3) : 1;
      lastT = t;
      y += dir * 0.35 * k;
      if (unit > 0) {
        while (y <= -unit) y += unit;
        while (y > 0) y -= unit;
      }
      col.style.transform = 'translate3d(0,' + y + 'px,0)';
      rafId = requestAnimationFrame(tick);
    }

    function start() { if (rafId === null && !paused) rafId = requestAnimationFrame(tick); }

    var cols = col.parentElement;
    cols.addEventListener('pointerenter', function () { paused = true; });
    cols.addEventListener('pointerleave', function () { paused = false; start(); });
    cols.addEventListener('focusin', function () { paused = true; });
    cols.addEventListener('focusout', function () { paused = false; start(); });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        paused = !entries[0].isIntersecting;
        start();
      }, { rootMargin: '200px 0px' }).observe(cols);
    }

    start();
  }

  /* Едут только на десктопе: на телефоне колонки превращаются в свайп-слайдер */
  if (!reduced && window.matchMedia('(min-width: 900px)').matches) {
    document.querySelectorAll('.reviews__col').forEach(function (col) {
      reviewColumn(col, parseFloat(col.getAttribute('data-reviews-dir')) || -1);
    });
  }

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
    gsap.fromTo('.film__pill img', { scale: 2.5 }, {
      scale: 2.1, ease: 'none',
      scrollTrigger: { trigger: '.film', start: 'top bottom', end: 'bottom top', scrub: true }
    });

    gsap.fromTo('.film__photo img', { scale: 1.12 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: '.film__photo', start: 'top bottom', end: 'bottom 40%', scrub: true }
    });

    /* Второе фото проявляется снизу и доворачивается в свой наклон */
    gsap.from('.film__photo', {
      scrollTrigger: { trigger: '.film__body', start: 'top 80%' },
      clipPath: 'inset(100% 0% 0% 0%)', rotation: 2, y: 40, duration: 1.1, ease: 'power4.out'
    });

    /* Хронометраж заполняется, пока полоса проходит через экран */
    gsap.to('.chrono__fill', {
      scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: '.chrono', start: 'top 95%', end: 'top 20%', scrub: true }
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

    /* 11: раскадровка едет горизонтально, пока секция закреплена */
    var pin = document.querySelector('.stages__pin');
    var track = document.querySelector('.stages__track');
    var viewport = document.querySelector('.stages__viewport');
    var fill = document.querySelector('.stages__progress-fill');

    if (pin && track && viewport && window.matchMedia('(min-width: 900px)').matches) {
      var distance = function () {
        return Math.max(track.scrollWidth - viewport.clientWidth, 0);
      };

      gsap.to(track, {
        x: function () { return -distance(); },
        ease: 'none',
        scrollTrigger: {
          trigger: '.stages',
          start: 'top top',
          end: function () { return '+=' + (distance() + window.innerHeight * 0.4); },
          pin: pin,
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: function (self) {
            if (fill) fill.style.transform = 'scaleX(' + self.progress + ')';
          }
        }
      });
    }

    /* Лёгкий параллакс занавеса */
    gsap.to('.hero__bg', {
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
      yPercent: 10, ease: 'none'
    });
  }
})();
