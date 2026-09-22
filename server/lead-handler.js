/* Обработчик заявок с сайта «В титрах».
   Пишется без зависимостей — обычный Node, чтобы вставал на любой хостинг.

   Порядок действий важен юридически (docs/LEGAL.md §2.3):
   1) заявка сохраняется здесь, на сервере в России;
   2) только потом уходит уведомление в Телеграм.
   Токен бота берётся из переменных окружения и на клиент не попадает. */

'use strict';

var fs = require('fs');
var path = require('path');
var https = require('https');

var LEADS_FILE = process.env.LEADS_FILE || path.join(__dirname, 'data', 'leads.jsonl');
var BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
var CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

/* Не больше пяти заявок с одного адреса за десять минут */
var RATE_LIMIT = Number(process.env.RATE_LIMIT || 5);
var RATE_WINDOW = 10 * 60 * 1000;
var hits = new Map();

function tooOften(ip) {
  var now = Date.now();
  var list = (hits.get(ip) || []).filter(function (t) { return now - t < RATE_WINDOW; });

  list.push(now);
  hits.set(ip, list);

  /* Чистим старые записи, чтобы карта не росла бесконечно */
  if (hits.size > 5000) {
    hits.forEach(function (times, key) {
      if (!times.length || now - times[times.length - 1] > RATE_WINDOW) hits.delete(key);
    });
  }

  return list.length > RATE_LIMIT;
}

function clean(value, max) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, max);
}

function validate(body) {
  /* Ловушка для ботов: поле спрятано на странице, человек его не заполняет */
  if (clean(body.company, 50)) return { error: 'spam' };

  var name = clean(body.name, 80);
  var phone = clean(body.phone, 30);
  var digits = phone.replace(/\D/g, '');

  if (name.length < 2) return { error: 'Укажите имя' };
  if (digits.length < 11 || digits.length > 15) return { error: 'Укажите телефон целиком' };
  if (body.consent !== true) return { error: 'Нужно согласие на обработку персональных данных' };

  return {
    lead: {
      name: name,
      phone: phone,
      date: clean(body.date, 20),
      note: clean(body.note, 1000),
      form: clean(body.form, 80) || 'Форма сайта',
      page: clean(body.page, 300),
      sent_at: clean(body.sent_at, 40),
      consent: true,
      consent_version: clean(body.consent_version, 40)
    }
  };
}

function save(lead) {
  var dir = path.dirname(LEADS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(LEADS_FILE, JSON.stringify(lead) + '\n', 'utf8');
}

function telegramText(lead) {
  var rows = [
    '<b>Новая заявка с сайта</b>',
    '',
    'Форма: ' + lead.form,
    'Имя: ' + lead.name,
    'Телефон: ' + lead.phone
  ];

  if (lead.date) rows.push('Дата: ' + lead.date);
  if (lead.note) rows.push('Комментарий: ' + lead.note);

  rows.push('');
  rows.push('Страница: ' + lead.page);
  rows.push('Время: ' + lead.sent_at);
  rows.push('Согласие: ' + lead.consent_version);

  return rows.join('\n').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/&lt;b&gt;/g, '<b>').replace(/&lt;\/b&gt;/g, '</b>');
}

function notifyTelegram(lead) {
  return new Promise(function (resolve) {
    if (!BOT_TOKEN || !CHAT_ID) {
      resolve({ sent: false, reason: 'Телеграм не настроен' });
      return;
    }

    var payload = JSON.stringify({
      chat_id: CHAT_ID,
      text: telegramText(lead),
      parse_mode: 'HTML',
      disable_web_page_preview: true
    });

    var req = https.request({
      hostname: 'api.telegram.org',
      path: '/bot' + BOT_TOKEN + '/sendMessage',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
      timeout: 8000
    }, function (res) {
      res.resume();
      resolve({ sent: res.statusCode === 200, reason: 'HTTP ' + res.statusCode });
    });

    req.on('timeout', function () { req.destroy(); });
    req.on('error', function (e) { resolve({ sent: false, reason: e.message }); });
    req.end(payload);
  });
}

/* Принимает разобранное тело запроса, возвращает { status, body } */
function handleLead(body, meta) {
  var ip = (meta && meta.ip) || 'unknown';

  if (tooOften(ip)) {
    return Promise.resolve({ status: 429, body: { ok: false, error: 'Слишком много заявок подряд. Попробуйте позже' } });
  }

  var checked = validate(body || {});

  if (checked.error === 'spam') {
    /* Боту отвечаем как обычно, но ничего не сохраняем и не шлём */
    return Promise.resolve({ status: 200, body: { ok: true } });
  }

  if (checked.error) {
    return Promise.resolve({ status: 400, body: { ok: false, error: checked.error } });
  }

  var lead = checked.lead;
  lead.received_at = new Date().toISOString();
  lead.ip = ip;
  lead.user_agent = clean(meta && meta.userAgent, 300);

  try {
    save(lead);
  } catch (e) {
    return Promise.resolve({ status: 500, body: { ok: false, error: 'Не удалось сохранить заявку' } });
  }

  /* Уведомление — уже после сохранения. Если Телеграм недоступен,
     заявка всё равно принята и лежит в файле */
  return notifyTelegram(lead).then(function (result) {
    if (!result.sent) console.error('Заявка сохранена, но уведомление в Телеграм не ушло:', result.reason);
    return { status: 200, body: { ok: true } };
  });
}

module.exports = { handleLead: handleLead, validate: validate, telegramText: telegramText };
