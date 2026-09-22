# «В титрах» — сайт свадебного агентства

Одностраничный сайт свадебного агентства «В титрах» (Пермь) — редизайн [help-wedding.ru](https://help-wedding.ru/).

Чистые HTML + CSS + JS, без сборки и npm. GSAP, ScrollTrigger и Lenis лежат локально в `js/vendor/`.

## Как открыть

Двойной клик по `index.html` — сайт работает прямо из папки.

## Структура

```
index.html           главная страница
politika.html        политика конфиденциальности
soglasie.html        согласие на обработку персональных данных
css/                 tokens.css (цвета, шрифты, отступы), base.css, sections.css, fonts.css
js/                  main.js, motion.js (анимации), gallery.js, forms.js, config.js
js/vendor/           GSAP, ScrollTrigger, Lenis
fonts/               Inter Tight, Onest, JetBrains Mono (woff2)
assets/sections/     картинки по блокам сайта
assets/galleries/    фото для галерей портфолио
server/              обработчик заявок → Telegram (см. server/README.md)
docs/                ТЗ, юридические требования, промты этапов
DESIGN.md, PRODUCT.md  дизайн-система и описание продукта
```

## Форма заявки

Пока адрес обработчика не указан, форма показывает, что отправка не подключена.
Чтобы заявки приходили в Telegram:

1. Разверните `server/` на хостинге (инструкция — `server/README.md`).
2. Скопируйте `server/.env.example` в `server/.env` и впишите токен бота и chat_id. Файл `.env` в git не попадает.
3. В `js/config.js` укажите адрес обработчика в `SITE_FORM_ENDPOINT`.

## Публикация

Сайт статический — подходит любой хостинг, в том числе GitHub Pages:
Settings → Pages → Branch: `main`, папка `/ (root)`.
Обработчик заявок (`server/`) на GitHub Pages не запустится — его нужно размещать отдельно, на российском хостинге (docs/LEGAL.md).
