# Автоматическая Android-сборка в GitHub Actions

Этот workflow создаёт **подписанный Android App Bundle (`.aab`)** на инфраструктуре GitHub Actions. Он не использует Expo EAS Build и не расходует его лимит сборок. Для Google Play нужен именно `.aab`: Play Console создаёт оптимальные APK для устройств автоматически.[1][2]

После публикации GitHub Release workflow собирает AAB, добавляет его к GitHub Release и направляет во **внутренний трек Google Play**. Это не означает автоматический выпуск в production: тестирование и продвижение в production по-прежнему контролируются через Play Console.[2][5]

## Что нужно подготовить один раз

Создайте приватный репозиторий GitHub, загрузите туда архив исходного кода FocusList и включите вкладку **Actions**. Затем создайте upload key на своём компьютере в установленном JDK:

```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore focuslist-upload-key.jks \
  -alias focuslist-upload \
  -keyalg RSA -keysize 2048 -validity 10000
```

Не добавляйте файл `.jks` в репозиторий и не отправляйте его в чат. Сохраните файл и пароли в защищённом месте: один и тот же upload key нужен для последующих обновлений приложения.[3]

В репозитории откройте **Settings → Secrets and variables → Actions** и добавьте следующие секреты.

| Имя секрета                                   | Значение                                                                                 |
| --------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `ANDROID_KEYSTORE_BASE64`                     | Base64-представление файла `focuslist-upload-key.jks`                                    |
| `ANDROID_KEYSTORE_PASSWORD`                   | Пароль keystore                                                                          |
| `ANDROID_KEY_ALIAS`                           | `focuslist-upload` или ваш alias                                                         |
| `ANDROID_KEY_PASSWORD`                        | Пароль ключа                                                                             |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`            | Полное содержимое JSON-ключа service account с правами на приложение в Play Console      |
| `DISCORD_WEBHOOK_URL`                         | Необязательно: входящий Discord webhook для уведомлений о результате                     |
| `GOOGLE_PLAY_PRODUCTION_SERVICE_ACCOUNT_JSON` | JSON-ключ отдельного service account для production, сохранённый в protected environment |

Чтобы получить Base64 на macOS/Linux, выполните локально:

```bash
base64 -i focuslist-upload-key.jks | tr -d '\n'
```

На Windows PowerShell используйте:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("focuslist-upload-key.jks"))
```

## Настройка Google Play API

Создайте Google Cloud Project, включите **Google Play Developer API**, затем создайте service account. В Play Console откройте **Users and permissions**, пригласите email service account и предоставьте доступ только к приложению FocusList с правом выпускать релизы во внутренний трек. Содержимое JSON-ключа этого service account сохраните в GitHub Secrets как `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`. Не добавляйте JSON-ключ в репозиторий.[5]

> Первый AAB для нового приложения рекомендуется загрузить вручную в Play Console и завершить начальную настройку приложения. После этого workflow сможет публиковать новые AAB в `internal` через Publishing API.[5][6]

## Как запускать сборку

Для тестовой сборки откройте **Actions → Android App Bundle → Run workflow → Run workflow**. Workflow проверяет TypeScript и тесты, собирает debug APK, устанавливает его на Android-эмулятор и проверяет запуск FocusList до выпуска AAB. Включите `upload_to_play` только когда хотите автоматически отправить AAB в internal testing. После завершения доступны два артефакта: `focuslist-android-apk-*` для установки на телефон и `focuslist-android-aab-*` для Google Play.[10]

Для релизного запуска создайте и опубликуйте GitHub Release. Событие `published` запускает workflow, который добавляет AAB к релизу и отправляет его во внутренний трек Play Console. Каждая сборка получает уникальный Android `versionCode` из номера запуска GitHub, что необходимо для обновлений в Google Play.[2][7]

## Как установить APK на свой телефон

1. Откройте свой репозиторий GitHub → **Actions** → **Android App Bundle** → **Run workflow**.
2. Оставьте `upload_to_play` и `publish_to_production` выключенными, затем нажмите **Run workflow**.
3. Дождитесь зелёного статуса. Откройте завершённый запуск и в разделе **Artifacts** скачайте `focuslist-android-apk-*`.
4. Распакуйте ZIP-архив. Внутри будет файл `app-release.apk`.
5. Передайте `app-release.apk` на Android-телефон, например через USB, Google Drive или Telegram. Откройте файл в приложении «Файлы» и подтвердите установку. Если Android спросит разрешение на установку из этого источника, разрешите его только для приложения, из которого открыт APK.

> APK нужен для личного тестирования и установки вручную. Если после публикации через Google Play Android сообщит о несовпадающей подписи или не предложит обновление, удалите вручную установленную APK-версию и установите приложение из Google Play.

## Двуязычные заметки к релизу

Заметки для Google Play хранятся в `distribution/whatsnew/`: `whatsnew-ru-RU` и `whatsnew-en-US`. Перед публикацией нового релиза замените их текст на перечень конкретных изменений этой версии. Google Play поддерживает локализованные release notes для каждого выпуска.[11]

## Загрузка в Google Play

В Google Play Console создайте приложение, включите **Play App Signing** и сначала загрузите `.aab` в **Internal testing**. После проверки тестировщиками заполните карточку приложения, политику конфиденциальности и требования по контенту, затем продвиньте релиз в production. Для новых приложений Play App Signing является обязательным.[2]

Чтобы загрузить приложение сейчас, есть два понятных пути:

| Задача                                  | Что включить в GitHub Actions                            | Что сделать далее                                                                  |
| --------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Дать приложение себе или тестировщику   | Ничего дополнительно; скачайте `focuslist-android-apk-*` | Установите `app-release.apk` на Android-телефон по инструкции выше.                |
| Отправить тестовую версию в Google Play | `upload_to_play = true`                                  | Добавьте тестировщиков в **Internal testing** и поделитесь с ними ссылкой на тест. |
| Выпустить для всех пользователей        | `publish_to_production = true` и фраза подтверждения     | Дождитесь одобрения protected environment, затем проверьте выпуск в Play Console.  |

## Защищённый выпуск в production

Production **никогда не запускается по GitHub Release**. Он доступен только при ручном запуске workflow с включённым `publish_to_production`, точной фразой `PUBLISH_FOCUSLIST_PRODUCTION` в поле `production_confirmation` и после одобрения job `google-play-production` в GitHub.

В GitHub откройте **Settings → Environments → New environment**, создайте `google-play-production`, включите **Required reviewers**, запретите self-review и добавьте `GOOGLE_PLAY_PRODUCTION_SERVICE_ACCOUNT_JSON` как environment secret. У этого отдельного service account должны быть только необходимые права на production. После старта workflow reviewer увидит ожидание подтверждения и сможет разрешить или отклонить production-выпуск.[12]

> На бесплатном тарифе GitHub protection rules для environments доступны только в публичных репозиториях. Если нужные настройки недоступны для приватного репозитория, не включайте `publish_to_production`: выпускайте production вручную через Play Console после internal testing.[12]

## Уведомления о завершении

| Канал          | Что нужно сделать                                                         | Результат                                                                |
| -------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| GitHub Actions | Включить email или web notifications для Actions в настройках GitHub      | Уведомление о завершении инициированного workflow со статусом.[8]        |
| Discord        | Создать incoming webhook канала и сохранить URL как `DISCORD_WEBHOOK_URL` | Короткое сообщение об успехе или ошибке с прямой ссылкой на workflow.[9] |

В любом случае итог также виден в **Actions** и в summary workflow. Discord является необязательным: при отсутствии секрета шаг уведомления пропускается.

## Безопасность и ограничения

Workflow использует GitHub-hosted runner и GitHub Actions limits, а не квоту Expo EAS. Проверяйте лимиты и условия именно своего тарифа GitHub. Секреты доступны только во время запуска workflow и не выводятся в логи; не используйте публичный репозиторий для приложения до настройки секретов.

## References

[1] [Android Developers — About Android App Bundles](https://developer.android.com/guide/app-bundle)

[2] [Android Developers — Upload your app to the Play Console](https://developer.android.com/studio/publish/upload-bundle)

[3] [React Native — Publishing to Google Play Store](https://reactnative.dev/docs/signed-apk-android)

[4] [GitHub Docs — Building and testing Java with Gradle](https://docs.github.com/actions/use-cases-and-examples/building-and-testing/building-and-testing-java-with-gradle)

[5] [Google Play Developer APIs — Getting Started](https://developers.google.com/android-publisher/getting_started)

[6] [Google Play Developer APIs — Publishing API](https://developer.android.com/google/play/developer-api)

[7] [GitHub Docs — Events that trigger workflows](https://docs.github.com/actions/using-workflows/events-that-trigger-workflows)

[8] [GitHub Docs — Notifications for workflow runs](https://docs.github.com/en/actions/concepts/workflows-and-actions/notifications-for-workflow-runs)

[9] [Discord — Incoming webhooks](https://docs.discord.com/developers/platform/webhooks)

[10] [Android Emulator Runner — GitHub Action](https://github.com/ReactiveCircus/android-emulator-runner)

[11] [Google Play Console Help — Prepare and roll out a release](https://support.google.com/googleplay/android-developer/answer/9859348)

[12] [GitHub Docs — Managing environments for deployment](https://docs.github.com/actions/deployment/targeting-different-environments/using-environments-for-deployment)
