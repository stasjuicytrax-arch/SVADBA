(function () {
  'use strict';

  /* Попап-форма №2 появится на Этапе 6 (docs/TZ.md). До этого кнопки не должны
     проваливаться в href="#" — пока ведём в Телеграм, чтобы заявку можно было оставить. */
  var FALLBACK = 'https://t.me/stastoropov';

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest && e.target.closest('[data-popup="write"]');
    if (!trigger) return;

    e.preventDefault();
    window.open(FALLBACK, '_blank', 'noopener');
  });

  /* Ссылку на файл презентации заказчик ещё не прислал (docs/TZ.md, открытые вопросы) */
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest && e.target.closest('[data-download="presentation"]');
    if (!trigger) return;

    e.preventDefault();
  });
})();
