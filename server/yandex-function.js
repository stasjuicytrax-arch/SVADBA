/* Точка входа для Yandex Cloud Functions (российский serverless).
   В настройках функции: точка входа `yandex-function.handler`, среда Node.js 18+.
   Заявки складываются в /tmp, поэтому для облака задайте LEADS_FILE=/tmp/leads.jsonl
   и не считайте файл надёжным хранилищем — включите логирование или базу. */

'use strict';

var handler = require('./lead-handler');

module.exports.handler = function (event) {
  var method = (event && (event.httpMethod || (event.requestContext && event.requestContext.http && event.requestContext.http.method))) || 'POST';
  var headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (method === 'OPTIONS') {
    return Promise.resolve({ statusCode: 204, headers: headers, body: '' });
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
