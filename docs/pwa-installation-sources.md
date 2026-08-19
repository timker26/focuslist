# PWA Installation Sources

| Требование                  | Реализация для FocusList                                                                                                                                                          | Источник                                                                          |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Установочная метаинформация | `public/manifest.json` с названием, иконками, portrait-ориентацией, `start_url` и `display: standalone`.                                                                          | [Expo — Progressive web apps](https://docs.expo.dev/guides/progressive-web-apps/) |
| Подключение manifest        | Manifest подключается в корневом HTML Expo web.                                                                                                                                   | [Expo — Progressive web apps](https://docs.expo.dev/guides/progressive-web-apps/) |
| Иконки                      | Для устойчивой установки нужен квадратный PNG; рекомендуемые размеры — минимум 192px и 512px.                                                                                     | [web.dev — Web app manifest](https://web.dev/learn/pwa/web-app-manifest)          |
| Обновления и offline        | Service worker полезен для offline, но агрессивное кеширование может задерживать обновления. Для FocusList используется сетевой shell без претензии на полноценный offline-режим. | [Expo — Progressive web apps](https://docs.expo.dev/guides/progressive-web-apps/) |

Установочная веб-версия не заменяет Android APK/AAB: она работает через браузер, но может быть добавлена на главный экран Android как отдельное окно.
