(function () {
  'use strict';

  var ENDPOINT = window.SITE_FORM_ENDPOINT || '';
  var PHONE = window.SITE_CONTACT_PHONE || '';
  var TELEGRAM = window.SITE_CONTACT_TELEGRAM || '';
  var CONSENT_VERSION = 'soglasie-v1-2026-09';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------ Отправка заявки
     Заявка уходит на обработчик на российском хостинге (docs/LEGAL.md §2.3),
     а он уже сохраняет её и шлёт уведомление в Телеграм. Токен бота живёт
     только на сервере — в этом файле его нет и быть не должно. */
  function sendLead(data) {
    if (!ENDPOINT) return Promise.reject(new Error('endpoint-not-set'));

    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 12000) : null;

    return fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller ? controller.signal : undefined
    }).then(function (res) {
      if (timer) clearTimeout(timer);

      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) {
          /* Текст ошибки сервера («слишком часто», «укажите телефон») показываем как есть */
          var error = new Error('http-' + res.status);
          error.serverMessage = data && data.error;
          throw error;
        }
        return data;
      });
    });
  }

  /* Поля, которые по LEGAL.md §2.2 сохраняются вместе с заявкой */
  function leadBase(formName) {
    return {
      form: formName,
      page: location.href.split('#')[0],
      sent_at: new Date().toISOString(),
      consent_version: CONSENT_VERSION
    };
  }

  /* ------------------------------------------------ Телефон: маска +7 (999) 123-45-67 */
  function maskPhone(value) {
    var digits = value.replace(/\D/g, '');

    if (digits.charAt(0) === '8') digits = '7' + digits.slice(1);
    if (digits.charAt(0) !== '7') digits = '7' + digits;
    digits = digits.slice(0, 11);

    var out = '+7';
    if (digits.length > 1) out += ' (' + digits.slice(1, 4);
    if (digits.length >= 5) out += ') ' + digits.slice(4, 7);
    if (digits.length >= 8) out += '-' + digits.slice(7, 9);
    if (digits.length >= 10) out += '-' + digits.slice(9, 11);
    return out;
  }

  function bindPhone(input) {
    if (!input) return;

    input.addEventListener('focus', function () {
      if (!input.value) input.value = '+7 ';
    });

    input.addEventListener('input', function () {
      var atEnd = input.selectionStart === input.value.length;
      input.value = maskPhone(input.value);
      if (atEnd) input.selectionStart = input.selectionEnd = input.value.length;
    });

    input.addEventListener('blur', function () {
      if (input.value.replace(/\D/g, '').length <= 1) input.value = '';
    });
  }

  function todayISO() {
    var now = new Date();
    return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  }

  /* ------------------------------------------------ Попап «Написать нам» */
  var modal = document.getElementById('writeModal');

  if (modal) {
    var windowEl = modal.querySelector('.modal__window');
    var form = document.getElementById('writeForm');
    var done = document.getElementById('writeDone');
    var fail = document.getElementById('writeFail');
    var consent = document.getElementById('w-consent');
    var hint = document.getElementById('writeConsentHint');
    var submit = form.querySelector('.mform__submit');
    var trap = document.getElementById('w-company');
    var fields = Array.prototype.slice.call(form.querySelectorAll('.mfield__input'));
    var lastFocused = null;
    var openedAt = 0;
    var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea, select';

    bindPhone(document.getElementById('w-phone'));
    document.getElementById('w-date').min = todayISO();

    function openModal(trigger) {
      lastFocused = trigger || document.activeElement;
      openedAt = Date.now();

      modal.hidden = false;
      document.body.classList.add('is-locked');
      if (window.site && window.site.lenis) window.site.lenis.stop();

      /* Кадр на перерисовку, иначе переход не проигрывается */
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { modal.classList.add('is-open'); });
      });

      var narrow = window.matchMedia('(max-width: 899px)').matches;
      var first = form.hidden
        ? done.querySelector(FOCUSABLE)
        : (narrow ? windowEl : document.getElementById('w-name'));
      if (first) first.focus({ preventScroll: true });
    }

    function hide() {
      modal.hidden = true;
      document.body.classList.remove('is-locked');
      if (window.site && window.site.lenis) window.site.lenis.start();
      if (lastFocused && lastFocused.focus) lastFocused.focus({ preventScroll: true });
    }

    function closeModal() {
      if (modal.hidden) return;
      modal.classList.remove('is-open');

      if (reduced) { hide(); return; }

      var closed = false;
      var finish = function () { if (!closed) { closed = true; hide(); } };
      windowEl.addEventListener('transitionend', finish, { once: true });
      setTimeout(finish, 520);
    }

    /* Открывают все кнопки «Написать нам»: шапка, мобильное меню, футер */
    document.addEventListener('click', function (e) {
      var trigger = e.target.closest && e.target.closest('[data-popup="write"]');
      if (!trigger) return;

      e.preventDefault();

      /* Мобильное меню закрываем, чтобы не оставалось под попапом */
      var curtain = document.getElementById('navCurtain');
      var burger = document.getElementById('navBurger');
      if (curtain && !curtain.hidden && burger) burger.click();

      openModal(trigger);
    });

    modal.addEventListener('click', function (e) {
      if (e.target.closest('[data-modal-close]')) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (modal.hidden) return;

      if (e.key === 'Escape') {
        closeModal();
        return;
      }

      if (e.key !== 'Tab') return;

      var items = Array.prototype.slice.call(modal.querySelectorAll(FOCUSABLE)).filter(function (el) {
        return el.offsetParent !== null;
      });
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

    /* --------------------------------------------- Проверка полей */
    function check(input) {
      var error = document.getElementById('w-e-' + input.id.slice(2));
      var value = input.value.trim();
      var message = '';

      if (input.required && !value) {
        message = input.id === 'w-name' ? 'Напишите, как к вам обращаться' : 'Оставьте телефон для связи';
      } else if (input.id === 'w-name' && value.length < 2) {
        message = 'Слишком короткое имя';
      } else if (input.id === 'w-phone' && value.replace(/\D/g, '').length !== 11) {
        message = 'Телефон целиком: +7 и 10 цифр';
      } else if (input.validity && input.validity.rangeUnderflow) {
        message = 'Эта дата уже прошла';
      }

      input.setAttribute('aria-invalid', message ? 'true' : 'false');

      if (error) {
        error.textContent = message;
        error.hidden = !message;
      }
      return !message;
    }

    fields.forEach(function (input) {
      input.addEventListener('blur', function () {
        if (input.value || input.getAttribute('aria-invalid') === 'true') check(input);
      });
      input.addEventListener('input', function () {
        if (input.getAttribute('aria-invalid') === 'true') check(input);
      });
    });

    /* docs/LEGAL.md §2.2: без галочки согласия кнопка неактивна */
    function syncConsent() {
      submit.disabled = !consent.checked;
      hint.hidden = consent.checked;
    }
    consent.addEventListener('change', syncConsent);
    syncConsent();

    function showFail(text, withContacts) {
      var contacts = '';
      if (withContacts && PHONE) {
        contacts = ' Позвоните нам: ' + PHONE + (TELEGRAM ? ' или напишите в <a href="' + TELEGRAM + '" target="_blank" rel="noopener">телеграм</a>.' : '.');
      }
      fail.innerHTML = text + contacts;
      fail.hidden = false;
    }

    function showDone() {
      form.hidden = true;
      done.hidden = false;
      modal.classList.add('is-sent');

      /* Перерисовываем галочку заново, если попап открывают повторно */
      var mark = done.querySelector('.mdone__mark');
      if (mark && !reduced) mark.parentNode.replaceChild(mark.cloneNode(true), mark);

      var closeBtn = done.querySelector('.mdone__close');
      if (closeBtn) closeBtn.focus({ preventScroll: true });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      fail.hidden = true;

      var firstBad = null;
      fields.forEach(function (input) {
        if (!check(input) && !firstBad) firstBad = input;
      });
      if (!consent.checked && !firstBad) firstBad = consent;
      if (firstBad) {
        firstBad.focus();
        return;
      }

      /* Ловушка для ботов: поле спрятано, человек его не заполнит и не отправит
         форму за полторы секунды. Боту показываем обычный экран, но не шлём */
      if (trap.value || Date.now() - openedAt < 1500) {
        showDone();
        return;
      }

      var base = leadBase('Написать нам');
      form.elements.page.value = base.page;
      form.elements.sent_at.value = base.sent_at;

      var label = submit.querySelector('.cta__label');
      submit.disabled = true;
      label.textContent = 'Отправляем';

      sendLead({
        name: form.elements.name.value.trim(),
        phone: form.elements.phone.value.trim(),
        date: form.elements.date.value,
        note: form.elements.note.value.trim(),
        form: base.form,
        page: base.page,
        sent_at: base.sent_at,
        consent: true,
        consent_version: base.consent_version
      }).then(function () {
        showDone();
      }).catch(function (err) {
        if (err && err.message === 'endpoint-not-set') {
          showFail('Форма ещё не подключена к серверу — адрес обработчика задаётся в js/config.js.', true);
        } else if (err && err.serverMessage) {
          showFail(err.serverMessage + '.', true);
        } else {
          showFail('Не получилось отправить заявку.', true);
        }
      }).then(function () {
        submit.disabled = !consent.checked;
        label.textContent = 'Отправить';
      });
    });
  }

  /* ------------------------------------------------ Форма-«билет», блок 07 */
  var ticket = document.getElementById('ticketForm');

  if (ticket) {
    var tConsent = document.getElementById('f-consent');
    var tSubmit = ticket.querySelector('.ticket__submit');
    var tHint = document.getElementById('consentHint');
    var tDone = document.getElementById('ticketDone');
    var tFail = document.getElementById('ticketFail');
    var tFields = Array.prototype.slice.call(ticket.querySelectorAll('.ticket__input'));

    document.getElementById('f-date').min = todayISO();
    bindPhone(document.getElementById('f-contact'));

    var tSync = function () {
      tSubmit.disabled = !tConsent.checked;
      tHint.hidden = tConsent.checked;
    };
    tConsent.addEventListener('change', tSync);
    tSync();

    var tCheck = function (input) {
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

    tFields.forEach(function (input) {
      input.addEventListener('blur', function () {
        if (input.value || input.getAttribute('aria-invalid') === 'true') tCheck(input);
      });
      input.addEventListener('input', function () {
        if (input.getAttribute('aria-invalid') === 'true') tCheck(input);
      });
    });

    ticket.addEventListener('submit', function (e) {
      e.preventDefault();
      if (tFail) tFail.hidden = true;

      var firstBad = null;
      tFields.forEach(function (input) {
        if (!tCheck(input) && !firstBad) firstBad = input;
      });
      if (!tConsent.checked && !firstBad) firstBad = tConsent;
      if (firstBad) {
        firstBad.focus();
        return;
      }

      var base = leadBase('Оставьте заявку (блок 07)');
      ticket.elements.page.value = base.page;
      ticket.elements.sent_at.value = base.sent_at;

      tSubmit.disabled = true;

      sendLead({
        name: ticket.elements.names.value.trim(),
        phone: ticket.elements.contact.value.trim(),
        date: ticket.elements.date.value,
        note: 'Локация: ' + ticket.elements.place.value.trim(),
        form: base.form,
        page: base.page,
        sent_at: base.sent_at,
        consent: true,
        consent_version: base.consent_version
      }).then(function () {
        ticket.hidden = true;
        tDone.hidden = false;
      }).catch(function (err) {
        /* Без обработчика форма не должна врать, что заявка ушла */
        if (tFail) {
          tFail.textContent = (err && err.serverMessage ? err.serverMessage + '.' : 'Не получилось отправить заявку.') + ' Позвоните нам: ' + PHONE;
          tFail.hidden = false;
        }
        tSubmit.disabled = !tConsent.checked;
      });
    });
  }

  /* Ссылку на файл презентации заказчик ещё не прислал (docs/TZ.md, открытые вопросы) */
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest && e.target.closest('[data-download="presentation"]');
    if (!trigger) return;

    e.preventDefault();
  });
})();
