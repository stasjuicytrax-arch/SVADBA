/* Минимальный сервер для приёма заявок. Запуск: node server/server.js
   Переменные окружения — в server/.env.example. */

'use strict';

var http = require('http');
var handler = require('./lead-handler');

var PORT = Number(process.env.PORT || 8080);
var PATH_LEAD = process.env.LEAD_PATH || '/api/lead';
var ORIGIN = process.env.ALLOWED_ORIGIN || '*';
var MAX_BODY = 32 * 1024;

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', ORIGIN);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
}

function send(res, status, body) {
  var text = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(text) });
  res.end(text);
}

http.createServer(function (req, res) {
  cors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'POST' || req.url.split('?')[0] !== PATH_LEAD) {
    send(res, 404, { ok: false, error: 'Не найдено' });
    return;
  }

  var body = '';
  var tooBig = false;

  req.on('data', function (chunk) {
    body += chunk;
    if (body.length > MAX_BODY && !tooBig) {
      tooBig = true;
      send(res, 413, { ok: false, error: 'Слишком большой запрос' });
      req.destroy();
    }
  });

  req.on('end', function () {
    if (tooBig) return;

    var data;
    try {
      data = JSON.parse(body || '{}');
    } catch (e) {
      send(res, 400, { ok: false, error: 'Неверный формат данных' });
      return;
    }

    /* За обратным прокси (nginx) реальный адрес приходит в X-Forwarded-For */
    var forwarded = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();

    handler.handleLead(data, {
      ip: forwarded || req.socket.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || ''
    }).then(function (result) {
      send(res, result.status, result.body);
    }).catch(function (e) {
      console.error('Ошибка обработки заявки:', e);
      send(res, 500, { ok: false, error: 'Внутренняя ошибка' });
    });
  });
}).listen(PORT, function () {
  console.log('Приём заявок: http://127.0.0.1:' + PORT + PATH_LEAD);
});
