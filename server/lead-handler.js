/* Обработчик заявок с сайта «В титрах».
   Пишется без зависимостей — обычный Node, чтобы вставал на любой хостинг.

   Порядок действий важен юридически (docs/LEGAL.md §2.3):
   1) заявка сохраняется здесь, на сервере в России;
   2) только потом уходит уведомление в Телеграм.
   Токен бота берётся из переменных окружения и на клиент не попадает.

   В Яндекс.Облаке (функция vtitrah-leads) api.telegram.org недоступен, поэтому
   уведомление идёт через релей stevent-relay на Cloudflare — как на st-event.com:
   TELEGRAM_API_BASE=https://stevent-relay.ngperm.workers.dev + заголовок X-Relay-Key. */

'use strict';

var fs = require('fs');
var path = require('path');
var https = require('https');

var LEADS_FILE = process.env.LEADS_FILE || path.join(__dirname, 'data', 'leads.jsonl');
var BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
var CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
var API_BASE = process.env.TELEGRAM_API_BASE || 'https://api.telegram.org';
var RELAY_KEY = process.env.TELEGRAM_RELAY_KEY || '';

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
  if (clean(body.company, 50) || clean(body.site, 50)) return { error: 'spam' };

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
      consent_version: clean(body.consent_version, 40),
      utm: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
        .map(function (k) { return [k.replace('utm_', ''), clean(body[k], 120)]; })
        .filter(function (pair) { return pair[1]; })
    }
  };
}

function save(lead) {
  var dir = path.dirname(LEADS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(LEADS_FILE, JSON.stringify(lead) + '\n', 'utf8');
}

function esc(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function telegramText(lead) {
  var time = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
  var rows = [
    '#vtitrah 🔔 <b>Новая заявка — В титрах</b>',
    '',
    '<b>Форма:</b> ' + esc(lead.form),
    '<b>Имя:</b> ' + esc(lead.name),
    '<b>Телефон:</b> ' + esc(lead.phone)
  ];

  if (lead.date) rows.push('<b>Дата:</b> ' + esc(lead.date.split('-').reverse().join('.')));
  if (lead.note) rows.push('<b>Комментарий:</b> ' + esc(lead.note));

  rows.push('');
  rows.push('<b>Страница:</b> ' + esc(lead.page || '—') + ' | <b>Время:</b> ' + esc(time) + ' (МСК)');
  if (lead.utm && lead.utm.length) {
    rows.push('<b>UTM:</b> ' + esc(lead.utm.map(function (p) { return p[0] + ': ' + p[1]; }).join(' / ')));
  }
  rows.push('<b>Согласие:</b> ' + esc(lead.consent_version || '—'));

  return rows.join('\n');
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

    var base;
    try { base = new URL(API_BASE); } catch (e) { resolve({ sent: false, reason: 'Неверный TELEGRAM_API_BASE' }); return; }

    var headers = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) };
    if (RELAY_KEY) headers['X-Relay-Key'] = RELAY_KEY;

    var req = https.request({
      hostname: base.hostname,
      port: base.port || 443,
      path: base.pathname.replace(/\/$/, '') + '/bot' + BOT_TOKEN + '/sendMessage',
      method: 'POST',
      headers: headers,
      timeout: 8000
    }, function (res) {
      var raw = '';
      res.on('data', function (c) { raw += c; });
      res.on('end', function () {
        var j = {};
        try { j = JSON.parse(raw); } catch (e) { /* не JSON */ }
        resolve({ sent: res.statusCode === 200 && j.ok !== false, reason: 'HTTP ' + res.statusCode + (j.description ? ': ' + j.description : '') });
      });
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

  /* В облаке /tmp живёт недолго — копия заявки остаётся в журнале функции (Yandex Cloud Logging, РФ) */
  console.log('Заявка: ' + JSON.stringify(lead));

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
