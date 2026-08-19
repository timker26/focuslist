# FocusList: как получить APK и загрузить приложение в Google Play

Эта инструкция разделена на две независимые части. Сначала создайте **APK**, чтобы установить FocusList на свой Android-телефон. Затем создайте **AAB**, чтобы отправить приложение в Google Play. Не загружайте APK в Google Play: для новых релизов нужен файл AAB.[1]

> **Важно:** ключ подписи и его пароли должны храниться только у вас. Не отправляйте `.jks`, Base64-строку и пароли в чат, по почте или в репозиторий.

## Что потребуется

| Для APK на своём телефоне                | Для Google Play                                     |
| ---------------------------------------- | --------------------------------------------------- |
| Аккаунт GitHub                           | Аккаунт Google Play Console                         |
| Компьютер с установленной Java JDK       | Заполненная карточка приложения                     |
| Приватный GitHub-репозиторий с FocusList | Политика конфиденциальности и декларации приложения |
| Около 15–30 минут на первую настройку    | AAB из GitHub Actions                               |

## Часть 1. Получите APK для установки на телефон

### Шаг 1. Загрузите проект в GitHub

В FocusList откройте меню **⋯ → Download as ZIP**. На [GitHub](https://github.com/new) создайте **приватный** репозиторий, распакуйте ZIP-архив и загрузите в него все файлы проекта. После загрузки проверьте, что в репозитории есть папка `.github/workflows` и файл `GITHUB_ACTIONS_ANDROID.md`.

### Шаг 2. Создайте ключ подписи один раз

На своём компьютере откройте терминал. При установленной Java JDK выполните:

```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore focuslist-upload-key.jks \
  -alias focuslist-upload \
  -keyalg RSA -keysize 2048 -validity 10000
```

Команда попросит задать пароль. Сохраните файл `focuslist-upload-key.jks` и оба пароля в надёжном месте. Этот же ключ понадобится для всех будущих обновлений приложения.[2]

### Шаг 3. Подготовьте Base64 ключа

Выберите одну команду для вашей системы. Результат скопируйте целиком — это будет длинная строка без переносов.

```bash
# macOS
base64 -i focuslist-upload-key.jks | tr -d '\n'

# Linux
base64 -w 0 focuslist-upload-key.jks
```

В Windows PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("focuslist-upload-key.jks"))
```

### Шаг 4. Добавьте четыре GitHub Secrets

В GitHub откройте репозиторий → **Settings → Secrets and variables → Actions → New repository secret**. Создайте эти четыре секрета:

| Имя                         | Что вставить                            |
| --------------------------- | --------------------------------------- |
| `ANDROID_KEYSTORE_BASE64`   | Длинную Base64-строку из шага 3         |
| `ANDROID_KEYSTORE_PASSWORD` | Пароль файла `focuslist-upload-key.jks` |
| `ANDROID_KEY_ALIAS`         | `focuslist-upload`                      |
| `ANDROID_KEY_PASSWORD`      | Пароль ключа                            |

### Шаг 5. Запустите сборку APK

Откройте вкладку **Actions** → workflow **Android App Bundle** → **Run workflow**. Оставьте переключатели `upload_to_play` и `publish_to_production` выключенными, затем нажмите **Run workflow**.

Дождитесь зелёной отметки. Откройте завершённый запуск, внизу страницы найдите **Artifacts** и скачайте `focuslist-android-apk-*`. Распакуйте ZIP: внутри будет `app-release.apk`.

### Шаг 6. Установите APK на Android

Передайте `app-release.apk` на телефон через USB, Google Drive, Telegram или другой удобный способ. Откройте его в приложении «Файлы» и подтвердите установку. Если Android спросит разрешение на установку из этого источника, разрешите его только для приложения, из которого открыт APK.

## Часть 2. Впервые загрузите FocusList в Google Play

Начните с **Internal testing**. Этот трек позволяет установить приложение себе и выбранным тестировщикам до публикации для всех пользователей.[3]

### Шаг 1. Создайте приложение в Play Console

Откройте [Google Play Console](https://play.google.com/console/), создайте приложение и заполните базовые сведения: название **FocusList**, язык по умолчанию, категорию и контактный email. Включите Play App Signing, если Play Console предложит это сделать.[1]

### Шаг 2. Получите AAB из GitHub

Запустите GitHub workflow ещё раз, по-прежнему оставив `upload_to_play` выключенным. После зелёного статуса скачайте артефакт `focuslist-android-aab-*`, распакуйте его и сохраните файл `app-release.aab`.

### Шаг 3. Отправьте AAB во внутреннее тестирование

В Play Console откройте **Testing → Internal testing → Create new release**. Загрузите `app-release.aab`, добавьте короткое описание изменений и сохраните релиз. Затем создайте список тестировщиков, добавьте свой Google-аккаунт и поделитесь выданной Play Console ссылкой на тест.

### Шаг 4. Проверьте приложение на телефоне

Откройте тестовую ссылку на телефоне, примите приглашение в тестирование и установите FocusList из Google Play. Проверьте создание задач, фото, вложения, уведомления и восстановление данных после перезапуска.

### Шаг 5. Подготовьте выпуск для всех

Перед production заполните в Play Console карточку приложения, добавьте иконку и скриншоты, разместите публичную политику конфиденциальности, заполните **Data safety**, возрастной рейтинг, целевую аудиторию и декларацию рекламы. После этого можно продвинуть проверенный внутренний релиз в production.[3][4]

> Для первого выпуска проще загружать AAB вручную через Play Console. Автоматическую отправку из GitHub включайте позже, когда внутреннее тестирование уже работает и вы добавили Google Play service account.

## Если что-то не получилось

| Проблема                   | Что сделать                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------- |
| Workflow красный           | Откройте упавший шаг в Actions, скопируйте текст ошибки и пришлите скриншот без паролей и ключей. |
| Нет Artifacts              | Убедитесь, что workflow завершился зелёной отметкой, затем прокрутите страницу запуска вниз.      |
| APK не устанавливается     | Проверьте разрешение «Установка неизвестных приложений» для приложения «Файлы» или браузера.      |
| AAB не загружается         | Проверьте, что выбран `app-release.aab`, а не APK, и что номер версии выше предыдущего релиза.    |
| Не видна кнопка production | Пока тестируйте через Internal testing: это безопасный и правильный первый шаг.                   |

## References

[1] [Android Developers — About Android App Bundles](https://developer.android.com/guide/app-bundle)

[2] [React Native — Publishing to Google Play Store](https://reactnative.dev/docs/signed-apk-android)

[3] [Google Play Console Help — Prepare and roll out a release](https://support.google.com/googleplay/android-developer/answer/9859348)

[4] [Google Play Console Help — Prepare your app for review](https://support.google.com/googleplay/android-developer/answer/9859455)
