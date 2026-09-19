(function () {
  'use strict';

  /* Список фото собран из assets/galleries/ прямо в скрипт: без fetch сайт работает с диска (file://).
     id — хэши старого сайта, чтобы старые ссылки открывали ту же галерею (docs/TZ.md, блок 08). */
  var GALLERIES = [
    {
      "id": "nadezdadamir",
      "tag": "КАДР 001",
      "names": "Дамир и Надежда",
      "dir": "01-damir-nadezhda",
      "files": [
        "01-DSC00116_resized.jpg",
        "02-DSC00824.jpg",
        "03-DSC01054.jpg",
        "04-DSC00612.jpg",
        "05-DSC00852.jpg",
        "06-DSC00413.jpg",
        "07-DSC01157.jpg",
        "08-DSC00124_resized.jpg",
        "09-DSC04775.jpg",
        "10-DSC01249.jpg",
        "11-DSC01724.jpg",
        "12-DSC02040.jpg",
        "13-DSC02016.jpg",
        "14-DSC01453.jpg",
        "15-DSC01195.jpg",
        "16-DSC01401.jpg",
        "17-DSC00373.jpg",
        "18-DSC01107.jpg",
        "19-DSC00304.jpg",
        "20-DSC01724.jpg",
        "21-DSC01321.jpg"
      ]
    },
    {
      "id": "romandaria",
      "tag": "КАДР 002",
      "names": "Роман и Дарья",
      "dir": "02-roman-daria",
      "files": [
        "01-DSC04230.jpg",
        "02-DSC05033.jpg",
        "03-DSC01054.jpg",
        "04-DSC05015.jpg",
        "05-DSC04855.jpg",
        "06-DSC05068.jpg",
        "07-DSC04974.jpg",
        "08-DSC04744.jpg",
        "09-DSC05144.jpg",
        "10-DSC05510.jpg",
        "11-DSC05655.jpg",
        "12-DSC05734.jpg",
        "13-DSC04775.jpg",
        "14-DSC05037.jpg",
        "15-DSC05074.jpg",
        "16-DSC04370.jpg",
        "17-DSC00373.jpg"
      ]
    },
    {
      "id": "kseniasergey",
      "tag": "КАДР 003",
      "names": "Сергей и Ксения",
      "dir": "03-sergey-ksenia",
      "files": [
        "01-DSC04916.jpg",
        "02-DSC05669.jpg",
        "03-DSC06847.jpg",
        "04-DSC05333.jpg",
        "05-DSC06868.jpg",
        "06-DSC04952.jpg",
        "07-DSC05528.jpg",
        "08-DSC07382.jpg",
        "09-DSC08629.jpg",
        "10-DSC05510.jpg",
        "11-DSC08649.jpg",
        "12-DSC08875.jpg",
        "13-DSC05297.jpg",
        "14-DSC06879.jpg",
        "15-DSC06651.jpg",
        "16-DSC06927.jpg",
        "17-DSC05154.jpg"
      ]
    },
    {
      "id": "evgiyalena",
      "tag": "КАДР 004",
      "names": "Евгений и Алена",
      "dir": "04-evgeny-alena",
      "files": [
        "01-DSC09547.jpg",
        "02-DSC09591.jpg",
        "03-DSC06847.jpg",
        "04-DSC11913.jpg",
        "05-DSC12393.jpg",
        "06-DSC09550.jpg",
        "07-DSC14209.jpg",
        "08-DSC14331.jpg",
        "09-DSC12651.jpg",
        "10-DSC14716.jpg",
        "11-DSC15507.jpg",
        "12-DSC09597.jpg",
        "13-DSC11958.jpg",
        "14-DSC09601.jpg",
        "15-DSC12089.jpg",
        "16-DSC09551.jpg",
        "17-DSC09565.jpg"
      ]
    },
    {
      "id": "aleksandrasergey",
      "tag": "КАДР 005",
      "names": "Сергей и Александра",
      "dir": "05-sergey-aleksandra",
      "files": [
        "01-DSC05720.jpg",
        "02-DSC06611.jpg",
        "03-DSC06847.jpg",
        "04-DSC06868.jpg",
        "05-DSC08483.jpg",
        "06-DSC05744.jpg",
        "07-DSC08930.jpg",
        "08-DSC05849.jpg",
        "09-DSC06874.jpg",
        "10-DSC06030.jpg",
        "11-DSC06583.jpg",
        "12-DSC05829.jpg",
        "13-DSC06088.jpg"
      ]
    },
    {
      "id": "alekseyanna",
      "tag": "КАДР 006",
      "names": "Алексей и Анна",
      "dir": "06-aleksey-anna",
      "files": [
        "01-DSC01148.jpg",
        "02-DSC01375.jpg",
        "03-DSC00969.jpg",
        "04-DSC01039.jpg",
        "05-DSC01418.jpg",
        "06-DSC00325.jpg",
        "07-DSC00679.jpg",
        "08-DSC01799.jpg",
        "09-DSC02135.jpg",
        "10-DSC01829.jpg",
        "11-DSC02230.jpg",
        "12-DSC02235.jpg",
        "13-DSC09170.jpg",
        "14-DSC09141.jpg",
        "15-DSC09029.jpg",
        "16-DSC09464.jpg",
        "17-DSC02313.jpg",
        "18-DSC02342.jpg",
        "19-DSC09585.jpg",
        "20-DSC09674.jpg",
        "21-DSC09903.jpg",
        "22-DSC00309.jpg",
        "23-DSC00934.jpg",
        "24-DSC01370.jpg",
        "25-DSC01771.jpg",
        "26-DSC00581.jpg",
        "27-DSC02300_1.jpg",
        "28-DSC08996.jpg",
        "29-DSC09249.jpg",
        "30-DSC09230.jpg",
        "31-DSC09477.jpg",
        "32-DSC02338.jpg",
        "33-DSC09907.jpg"
      ]
    },
    {
      "id": "antonyulia",
      "tag": "КАДР 007",
      "names": "Антон и Юля",
      "dir": "07-anton-yulia",
      "files": [
        "01-AJ-1.jpg",
        "02-AJ-431.jpg",
        "03-AJ-559.jpg",
        "04-AJ-4.jpg",
        "05-AJ-396.jpg",
        "06-AJ-74.jpg",
        "07-AJ-42.jpg",
        "08-AJ-391.jpg",
        "09-AJ-447.jpg",
        "10-AJ-384.jpg",
        "11-AJ-61.jpg",
        "12-AJ-43.jpg",
        "13-AJ-73.jpg"
      ]
    },
    {
      "id": "dmitruyekaterina",
      "tag": "КАДР 008",
      "names": "Дмитрий и Екатерина",
      "dir": "08-dmitry-ekaterina",
      "files": [
        "01-DSC04358.jpg",
        "02-DSC05063.jpg",
        "03-DSC05269.jpg",
        "04-DSC05292.jpg",
        "05-DSC04264.jpg",
        "06-DSC05147.jpg",
        "07-DSC04511.jpg",
        "08-DSC04293.jpg",
        "09-DSC04741.jpg",
        "10-DSC05272.jpg",
        "11-DSC04551.jpg",
        "12-DSC04316.jpg",
        "13-DSC04412.jpg"
      ]
    },
    {
      "id": "pavelksenia",
      "tag": "КАДР 009",
      "names": "Павел и Ксения",
      "dir": "09-pavel-ksenia",
      "files": [
        "01-DSC02162.jpg",
        "02-DSC02793_1.jpg",
        "03-DSC02646_1.jpg",
        "04-DSC03111.jpg",
        "05-DSC03190.jpg",
        "06-DSC02036.jpg",
        "07-DSC02327.jpg",
        "08-DSC02977.jpg",
        "09-DSC02539.jpg",
        "10-DSC02869.jpg",
        "11-DSC02740.jpg",
        "12-DSC02562.jpg",
        "13-DSC02208_1.jpg"
      ]
    },
    {
      "id": "sergeymaria",
      "tag": "КАДР 010",
      "names": "Сергей и Мария",
      "dir": "10-sergey-maria",
      "files": [
        "01-koryakov_0002.jpg",
        "02-koryakov_0055.jpg",
        "03-koryakov_0009.jpg",
        "04-koryakov_0118.jpg",
        "05-koryakov_0004.jpg",
        "06-koryakov_0005.jpg",
        "07-koryakov_0099.jpg",
        "08-koryakov_0008.jpg",
        "09-koryakov_0011.jpg",
        "10-koryakov_0013.jpg",
        "11-koryakov_0007.jpg",
        "12-koryakov_0103.jpg",
        "13-koryakov_0006.jpg"
      ]
    }
  ];

  var BASE = 'assets/galleries/';
  var byId = {};
  GALLERIES.forEach(function (g) { byId[g.id] = g; });

  var lenis = window.site ? window.site.lenis : null;
  var box, stage, photo, title, counter, thumbs;
  var current = null;
  var index = 0;
  var lastFocus = null;
  var openedFromPage = false;

  function pad(n) { return String(n).padStart(2, '0'); }
  function src(g, i) { return BASE + g.dir + '/' + g.files[i]; }

  function build() {
    box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-labelledby', 'lightboxTitle');
    box.hidden = true;
    box.innerHTML =
      '<div class="lightbox__stage"><img class="lightbox__photo" alt=""></div>' +
      '<div class="lightbox__bar">' +
        '<p class="lightbox__title" id="lightboxTitle"></p>' +
        '<p class="lightbox__counter" aria-live="polite"></p>' +
        '<div class="lightbox__controls">' +
          '<button type="button" class="lightbox__btn" data-lb="prev" aria-label="Предыдущий кадр"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7"/></svg></button>' +
          '<button type="button" class="lightbox__btn" data-lb="next" aria-label="Следующий кадр"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></button>' +
          '<button type="button" class="lightbox__btn" data-lb="close" aria-label="Закрыть галерею"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>' +
        '</div>' +
      '</div>' +
      '<div class="lightbox__film"><ol class="lightbox__thumbs"></ol></div>';
    document.body.appendChild(box);

    stage = box.querySelector('.lightbox__stage');
    photo = box.querySelector('.lightbox__photo');
    title = box.querySelector('.lightbox__title');
    counter = box.querySelector('.lightbox__counter');
    thumbs = box.querySelector('.lightbox__thumbs');

    box.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-lb]');
      if (btn) {
        var act = btn.getAttribute('data-lb');
        if (act === 'prev') show(index - 1);
        else if (act === 'next') show(index + 1);
        else close();
        return;
      }
      var thumb = e.target.closest('[data-index]');
      if (thumb) show(+thumb.getAttribute('data-index'));
    });

    /* Свайп по фото */
    var startX = null;
    stage.addEventListener('pointerdown', function (e) { startX = e.clientX; });
    stage.addEventListener('pointerup', function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    });
  }

  function renderThumbs(g) {
    thumbs.innerHTML = g.files.map(function (f, i) {
      return '<li><button type="button" class="lightbox__thumb" data-index="' + i + '" aria-label="Кадр ' + (i + 1) + '">' +
        '<img src="' + src(g, i) + '" alt="" loading="lazy"></button></li>';
    }).join('');
  }

  function show(i) {
    var total = current.files.length;
    index = (i + total) % total;

    photo.src = src(current, index);
    photo.alt = current.names + ', кадр ' + (index + 1) + ' из ' + total;
    counter.textContent = 'КАДР ' + pad(index + 1) + ' / ' + pad(total);

    /* Соседние кадры — заранее, чтобы листание было без пустоты */
    [index + 1, index - 1].forEach(function (n) {
      new Image().src = src(current, (n + total) % total);
    });

    thumbs.querySelectorAll('.lightbox__thumb').forEach(function (t, n) {
      if (n === index) {
        t.setAttribute('aria-current', 'true');
        t.scrollIntoView({ block: 'nearest', inline: 'center' });
      } else {
        t.removeAttribute('aria-current');
      }
    });
  }

  function open(id) {
    var g = byId[id];
    if (!g) return;
    if (!box) build();

    if (box.hidden) lastFocus = document.activeElement;
    current = g;
    title.textContent = g.tag + ' — ' + g.names.toUpperCase();
    renderThumbs(g);
    box.hidden = false;
    document.body.classList.add('is-locked');
    if (lenis) lenis.stop();
    show(0);
    box.querySelector('[data-lb="close"]').focus();
  }

  function close(fromHistory) {
    if (!box || box.hidden) return;
    box.hidden = true;
    document.body.classList.remove('is-locked');
    if (lenis) lenis.start();

    if (!fromHistory) {
      /* Открыли кликом по карточке — шаг назад по истории, иначе просто убираем хэш */
      if (openedFromPage) history.back();
      else history.replaceState(null, '', location.pathname + location.search + '#portfolio');
    }
    openedFromPage = false;
    if (lastFocus) lastFocus.focus();
  }

  function route(fromHistory) {
    var id = location.hash.slice(1);
    if (byId[id]) open(id);
    else close(fromHistory);
  }

  document.addEventListener('click', function (e) {
    var card = e.target.closest('.work');
    if (card) openedFromPage = true;
  });

  window.addEventListener('hashchange', function () { route(true); });
  route(true);

  document.addEventListener('keydown', function (e) {
    if (!box || box.hidden) return;

    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'ArrowRight') { show(index + 1); return; }
    if (e.key === 'ArrowLeft') { show(index - 1); return; }

    /* Фокус не уходит из открытой галереи */
    if (e.key === 'Tab') {
      var items = Array.prototype.slice.call(box.querySelectorAll('button'));
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* Курсор-кружок «Смотреть» над карточками — только для мыши */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var dot = document.createElement('div');
    dot.className = 'view-cursor';
    dot.setAttribute('aria-hidden', 'true');
    dot.textContent = 'Смотреть';
    document.body.appendChild(dot);

    var mx = 0, my = 0, queued = false;
    document.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      });
    }, { passive: true });

    document.querySelectorAll('.work').forEach(function (card) {
      card.addEventListener('pointerenter', function () { dot.classList.add('is-on'); });
      card.addEventListener('pointerleave', function () { dot.classList.remove('is-on'); });
    });
  }
})();
