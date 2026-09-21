/* Защита текста от копирования. Работает на всех страницах сайта.
   Это защита от обычного копирования мышью, а не от кражи текста вообще:
   текст остаётся в исходном коде страницы. */
(function () {
  'use strict';

  /* Поля формы — исключение: иначе в них нельзя печатать и исправлять */
  function isField(target) {
    return target && target.closest && target.closest('input, textarea, select');
  }

  ['contextmenu', 'copy', 'cut', 'selectstart', 'dragstart'].forEach(function (type) {
    document.addEventListener(type, function (e) {
      if (isField(e.target)) return;
      e.preventDefault();
    });
  });

  document.addEventListener('keydown', function (e) {
    if (!e.ctrlKey && !e.metaKey) return;
    if (isField(e.target)) return;

    var key = (e.key || '').toLowerCase();
    if (key === 'c' || key === 'x' || key === 'a') e.preventDefault();
  });
})();
