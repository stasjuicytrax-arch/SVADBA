/* Точка входа для Yandex Cloud Functions (российский serverless).
   Функция vtitrah-leads: точка входа `yandex-function.handler`, среда Node.js 22.
   Заявки складываются в /tmp, поэтому для облака задайте LEADS_FILE=/tmp/leads.jsonl
   и не считайте файл надёжным хранилищем — включите логирование или базу. */

'use strict';

var handler = require('./lead-handler');

var ORIGINS = ['https://help-wedding.ru', 'https://www.help-wedding.ru', 'https://stasjuicytrax-arch.github.io'];

module.exports.handler = function (event) {
  var method = (event && (event.httpMethod || (event.requestContext && event.requestContext.http && event.requestContext.http.method))) || 'POST';
  var h = (event && event.headers) || {};
  var origin = h.Origin || h.origin || '';
  var headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': ORIGINS.indexOf(origin) !== -1 ? origin : ORIGINS[0],
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin'
  };

  if (method === 'OPTIONS') {
    return Promise.resolve({ statusCode: 204, headers: headers, body: '' });
  }

  if (method !== 'POST') {
    return Promise.resolve({ statusCode: 405, headers: headers, body: JSON.stringify({ ok: false, error: 'Метод не поддерживается' }) });
  }
  /* Запросы из чужих браузерных страниц не принимаем (без Origin — допускается для проверки из консоли) */
  if (origin && ORIGINS.indexOf(origin) === -1) {
    return Promise.resolve({ statusCode: 403, headers: headers, body: JSON.stringify({ ok: false, error: 'Запрещено' }) });
  }

  var raw = event && event.body ? event.body : '{}';
  if (event && event.isBase64Encoded) raw = Buffer.from(raw, 'base64').toString('utf8');

  var data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    return Promise.resolve({ statusCode: 400, headers: headers, body: JSON.stringify({ ok: false, error: 'Неверный формат данных' }) });
  }

  var meta = {
    ip: (event && event.headers && (event.headers['X-Forwarded-For'] || event.headers['x-forwarded-for']) || '').split(',')[0].trim() || 'unknown',
    userAgent: (event && event.headers && (event.headers['User-Agent'] || event.headers['user-agent'])) || ''
  };

  return handler.handleLead(data, meta).then(function (result) {
    return { statusCode: result.status, headers: headers, body: JSON.stringify(result.body) };
  });
};
