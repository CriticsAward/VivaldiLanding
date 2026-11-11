# Vivaldi — время звучит

Непрерывное цифровое эссе о Вивальди, где историческая гравюра, рукопись и скрипка образуют одно движущееся полотно. Четыре концерта раскрываются по мере прокрутки: сезонные маски и атмосферная графика меняются вслед за сценой, а музыка после согласия пользователя переключается автоматически.

## Запуск

Откройте `index.html` через локальный HTTP-сервер. Сборка и JavaScript-зависимости не нужны. MP3-фрагменты длительностью 50 секунд хранятся в `media/` и работают с мобильными браузерами.

## GitHub Pages

Workflow `.github/workflows/deploy.yml` публикует корень репозитория при push в `main`. В Settings → Pages → Build and deployment выбран источник **GitHub Actions**.

## Музыка и лицензии

50-секундные MP3-фрагменты первых частей четырёх концертов Вивальди, исполнение скрипача John Harrison. Локальные копии перекодированы из Ogg-записей Wikimedia Commons. Все четыре исходных файла размещены там под CC BY-SA 4.0; MP3-фрагменты распространяются на тех же условиях. Полная атрибуция аудиозаписей и использованных исторических изображений — в [LICENSES.md](LICENSES.md).


## Art direction reset

The experience is staged as one continuous Baroque theatre: the opening portrait, red string, manuscript, violin and seasonal imagery recur as the visitor moves through the page. Four season scores crossfade after the visitor explicitly enables sound. Motion uses scroll-linked transforms and a small Canvas 2D weather field, with reduced-motion support.
