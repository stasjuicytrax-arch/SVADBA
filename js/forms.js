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

  /* ------------------------------------------------ Форма-«билет», блок 07 */
  var form = document.getElementById('ticketForm');

  if (form) {
    var consent = document.getElementById('f-consent');
    var submit = form.querySelector('.ticket__submit');
    var hint = document.getElementById('consentHint');
    var done = document.getElementById('ticketDone');
    var fields = Array.prototype.slice.call(form.querySelectorAll('.ticket__input'));
    var date = document.getElementById('f-date');

    var now = new Date();
    date.min = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');

    /* docs/LEGAL.md §2.2: без согласия кнопка неактивна и видна подсказка */
    var syncConsent = function () {
      submit.disabled = !consent.checked;
      hint.hidden = consent.checked;
    };
    consent.addEventListener('change', syncConsent);
    syncConsent();

    var check = function (input) {
      var error = document.getElementById('e-' + input.id.slice(2));
      var empty = input.value.trim() === '';
      var message = '';

      if (empty) message = input.type === 'date' ? 'Выберите дату премьеры' : 'Заполните это поле';
      else if (input.validity.rangeUnderflow) message = 'Эта дата уже прошла';
      else if (!input.validity.valid) message = 'Проверьте это поле';

      input.setAttribute('aria-invalid', message ? 'true' : 'false');
      error.textContent = message;
      error.hidden = !message;
      return !message;
    };

    fields.forEach(function (input) {
      input.addEventListener('blur', function () {
        if (input.value || input.getAttribute('aria-invalid') === 'true') check(input);
      });
      input.addEventListener('input', function () {
        if (input.getAttribute('aria-invalid') === 'true') check(input);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var firstBad = null;
      fields.forEach(function (input) {
        if (!check(input) && !firstBad) firstBad = input;
      });
      if (!consent.checked && !firstBad) firstBad = consent;
      if (firstBad) {
        firstBad.focus();
        return;
      }

      /* То, что по LEGAL.md сохраняется вместе с заявкой: страница, время, версия согласия */
      form.elements.page.value = location.href.split('#')[0];
      form.elements.sent_at.value = new Date().toISOString();

      /* Отправки пока нет: обработчик send.php появится на российском хостинге */
      form.hidden = true;
      done.hidden = false;
    });
  }

  /* Ссылку на файл презентации заказчик ещё не прислал (docs/TZ.md, открытые вопросы) */
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest && e.target.closest('[data-download="presentation"]');
    if (!trigger) return;

    e.preventDefault();
  });
})();
