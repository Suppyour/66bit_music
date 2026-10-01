# План исправления замечаний и багов (Музлото)

> **Статус работ:**
> - **Уже исправлены:** №1, №2, №9, №11, №13, №14, №15, №16, №17, №18, №19, №20 (а также сыгранные песни и их зачёркивание).
> - **В работе / следующий этап:** Обычный приоритет (№3, №4, №5, №6, №7, №8, №10, №12).
> - **Внимание:** В соответствии с указанием, изменения в удалённый git-репозиторий **не отправляются** (`push` отключён).

---

## 🔴 Высокий приоритет (Красная зона)

### № 1. Обрезка трека до 30 секунд при загрузке
* **Проблема:** При загрузке аудиофайла трек обрезается до 30 секунд. Пользователь об этом не предупреждён, ограничение мешает полноценной игре.
* **Причина в коде:** В ранней версии бэкенда использовался сервис `AudioTrimmer.cs`, жестко нарезавший поток до 30 секунд в `CreateSong.cs` и `UpdateSong.cs`. В коде вызов нарезки был убран, однако старый скомпилированный сервис в контейнере или ранее загруженные треки сохранили 30-секундную длину, а также в интерфейсе нет ясности о поддерживаемых форматах и исходной длине трека.
* **Что будем делать:**
  1. Окончательно исключить любые остатки принудительного тримминга в бэкенде ([CreateSong.cs](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoBackend/MusicalLotoBackend.Core/Features/Songs/CreateSong.cs), [UpdateSong.cs](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoBackend/MusicalLotoBackend.Core/Features/Songs/UpdateSong.cs)), удалив неиспользуемый файл `AudioTrimmer.cs` или оставив его строго как опциональную утилиту.
  2. В модалке загрузки [AddSongModal.tsx](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoFrontend/src/components/AddSongModal/AddSongModal.tsx) добавить понятную подсказку: «Загружается полная версия трека (MP3, WAV, OGG, M4A). Ограничений по длительности нет».
  3. В плеере [MusicContext.tsx](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoFrontend/src/context/MusicContext.tsx) и [SongLibrary.tsx](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoFrontend/src/pages/SongLibrary/SongLibrary.tsx) убедиться, что отображается и воспроизводится полная длительность трека из метаданных аудио.

---

### № 2. Новые загруженные песни отображаются в конце списка
* **Проблема:** Загруженная песня падает в самый конец таблицы, приходится скроллить вниз, чтобы проверить успешность добавления. Логичнее видеть новые сверху.
* **Причина в коде:** В запросе [GetSongs.cs](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoBackend/MusicalLotoBackend.Core/Features/Songs/GetSongs.cs) отсутствует сортировка (`.OrderByDescending(...)`), а сущность `Song` наследует `BaseEntity.CreatedAt`. При создании новой записи в Postgres строки выдаются в порядке вставки (старые сверху, новые внизу).
* **Что будем делать:**
  1. В бэкенде [GetSongs.cs](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoBackend/MusicalLotoBackend.Core/Features/Songs/GetSongs.cs) добавить сортировку: `.OrderByDescending(s => s.CreatedAt)`.
  2. Во фронтенде в [SongLibrary.tsx](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoFrontend/src/pages/SongLibrary/SongLibrary.tsx) при получении ответа после добавления песни вставлять её на 1-ю позицию локального стейта (`[newSong, ...prev]`), чтобы мгновенно отобразить её в топе без задержек и перезагрузок.

---

### № 9. Невозможность вернуться в редактирование карточек созданной/сохранённой игры
* **Проблема:** Для уже созданной и сохранённой игры нельзя повторно открыть экран редактирования/выгрузки карточек (по хлебным крошкам возникает ошибка/пустой экран). Если ведущий сразу не скачал архив карточек — возможность выгрузки теряется.
* **Причина в коде:** В [Cabinet.tsx](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoFrontend/src/pages/Cabinet/Cabinet.tsx) карточки генерируются «на лету» перед сохранением игры, а в [Generator.tsx](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoFrontend/src/pages/Generator/Generator.tsx) при передаче `?sessionId=...` загружались только слайды, но не подтягивались сгенерированные билеты из БД (`session.Cards`). Кроме того, в списке сессий личного кабинета отсутствует прямая кнопка «Редактировать карточки / Скачать PDF».
* **Что будем делать:**
  1. В бэкенде добавить / проверить эндпоинт получения готовых карточек сессии `GET /api/Games/{sessionId}/cards`.
  2. В карточке игры в [Cabinet.tsx](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoFrontend/src/pages/Cabinet/Cabinet.tsx) добавить кнопку быстрого действия: «Карточки и печать» (переход на экран просмотра и повторного экспорта архива PDF).
  3. В [Generator.tsx](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoFrontend/src/pages/Generator/Generator.tsx) при открытии с `sessionId` инициализировать список карточек данными существующей сессии, восстанавливая параметры игры, оформление и возможность скачать архив в любой момент.

---

### № 11. Отсутствует правило победы: «Вся карточка»
* **Проблема:** В интерфейсе создания игры доступны только правила «Горизонталь», «Вертикаль» и «Диагональ», а популярного классического правила лото «Вся карточка» нет.
* **Причина в коде:** В бэкенде флаг `WinningRules.FullCard = 4` уже существует в [GameSession.cs](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoBackend/MusicalLotoBackend.Domain/Models/GameSession.cs) и логика проверки реализована в [CheckBingo.cs](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoBackend/MusicalLotoBackend.Core/Features/Cards/CheckBingo.cs). Однако на форме создания игры в [Cabinet.tsx](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoFrontend/src/pages/Cabinet/Cabinet.tsx) отрисованы только 3 плашки (`rules & 1`, `rules & 2`, `rules & 8`).
* **Что будем делать:**
  1. В блоке выбора правил [Cabinet.tsx](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoFrontend/src/pages/Cabinet/Cabinet.tsx) добавить 4-ю карточку правила: «Вся карточка» с иконкой `Полное поле.svg` (флаг `rules & 4`).
  2. В [CreateGameModal.tsx](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoFrontend/src/components/CreateGameModal/CreateGameModal.tsx) синхронизировать компоновку и стили.
  3. В [PrintCard.tsx](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoFrontend/src/components/PrintCard/PrintCard.tsx) добавить мини-схему для победной комбинации «Вся карточка» (все 25 ячеек закрашены) в блок «Победные комбинации» на печатном бланке.

---

### № 13. Неудачный вид пометки «уникальности» песен (бантики перевернулись, ножницы)
* **Проблема:** В ячейках билета декоративные уголки («бантики») перевёрнуты, а в правой панели памятки иконка выглядит как ножницы (`✂`), что сбивает с толку пользователей.
* **Причина в коде:** 
  - В [PrintCard.tsx](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoFrontend/src/components/PrintCard/PrintCard.tsx) (строка 160) жестко прописан символ `<span className="scissors-icon">✂</span> — твоя уникальная песня`.
  - В [PrintCard.css](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoFrontend/src/components/PrintCard/PrintCard.css) для угловых SVG-элементов задана трансформация `transform: rotate(135deg)` и др., из-за чего векторные узлы выворачиваются наизнанку.
* **Что будем делать:**
  1. Заменить символ ножниц `✂` на аккуратную и гармоничную тематическую иконку (подарок 🎁 / звезда ⭐ / кристалл / праздничный бейдж).
  2. Переработать векторную графику декоративных уголков центральной ячейки: использовать цельный SVG-бордер либо правильные координаты без слепых поворотов, чтобы декоративные уголки смотрелись премиально и симметрично.

---

### № 14. Визуальный баг на выгруженных файлах (наложение плашки на границу бланка)
* **Проблема:** В сгенерированном PDF-файле плашка правого верхнего угла налезает прямо на верхнюю рамку билета, при этом в предпросмотре браузера этого не видно и подвинуть её нельзя.
* **Причина в коде:** В [PrintCard.css](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoFrontend/src/components/PrintCard/PrintCard.css) для `.scissors-label` задано жесткое абсолютное позиционирование `top: 40px; right: 20px;`. При рендеринге страницы в движке wkhtmltopdf / Chromium PDF с фиксированным разрешением 793×560px происходит смещение координат относительно рамки `inner-border-box`.
* **Что будем делать:**
  1. Убрать слепое абсолютное позиционирование `top: 40px`. Встроить плашку в нормальный поток заголовка правой колонки (`.card-right-panel`) с фиксированным безопасным отступом от границы рамки.
  2. Протестировать генерацию PDF через бэкенд и убедиться в идентичности вида в браузере и в выгруженном файле.
  3. В панель настроек карточки в [Cabinet.tsx](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoFrontend/src/pages/Cabinet/Cabinet.tsx) добавить возможность регулировки верхнего отступа/позиционирования шапки.

---

### № 15. Текст описания на титульном слайде не отображается при проведении
* **Проблема:** При редактировании титульного слайда ведущий вводит описание, но на самом слайде (в превью и на презентации) отображается только заголовок и стандартная надпись «МУЗЫКАЛЬНОЕ ЛОТО».
* **Причина в коде:** В [Gameplay.tsx](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoFrontend/src/pages/Gameplay/Gameplay.tsx) (строки 815–820 и 1253–1259) разметка титульного слайда жестко выводит `<p className="presenter-subheading">МУЗЫКАЛЬНОЕ ЛОТО</p>`, полностью игнорируя свойство `activeSlide.content`.
* **Что будем делать:**
  1. В [Gameplay.tsx](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoFrontend/src/pages/Gameplay/Gameplay.tsx) (как в блоке предпросмотра, так и в полноэкранном режиме презентатора) выводить пользовательский текст:
     ```tsx
     <p className="presenter-subheading">
         {activeSlide.content && activeSlide.content.trim() ? activeSlide.content : 'МУЗЫКАЛЬНОЕ ЛОТО'}
     </p>
     ```
  2. Добавить поддержку многострочного описания или подзаголовка, если введено более одной строки.

---

### № 18. Плашка «Активная песня» нечитаема на цветных фонах и требует гибкой настройки
* **Проблема:** Плашка «АКТИВНАЯ ПЕСНЯ» на слайде проигрывания трека теряет контраст на оранжевых, красных или светлых фонах. Нужна читаемость, возможность менять текст (например, «Сейчас играет») или вовсе скрывать плашку.
* **Причина в коде:** В [Gameplay.css](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoFrontend/src/pages/Gameplay/Gameplay.css) стили `.presenter-song-badge` имеют полупрозрачный фон `rgba(255, 255, 255, 0.12)` и светло-голубой цвет `#93C5FD`, который сливается практически с любым фоном, кроме глубокого синего/черного. Текст зашит хардкодом в разметке.
* **Что будем делать:**
  1. Обеспечить высокий контраст плашки: темный полупрозрачный подслой (`background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(10px); color: #FFFFFF; border: 1px solid rgba(255,255,255,0.2)`), сохраняющий 100% читаемость на абсолютно любом фоне.
  2. В карточке редактирования слайда песни в [Presentation.tsx](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoFrontend/src/pages/Presentation/Presentation.tsx) и [Gameplay.tsx](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoFrontend/src/pages/Gameplay/Gameplay.tsx) добавить управление:
     - Поле кастомного текста бейджа (по умолчанию: «Сейчас играет» / «Активная песня»).
     - Тумблер скрытия плашки (показывать / скрыть).

---

### № 20. Игровое поле на слайде презентации слишком узкое (пустые зоны по бокам)
* **Проблема:** На слайде игрового поля сетка ячеек зажата по ширине в узкую полосу по центру экрана, а слева и справа остаются огромные неиспользуемые пустоты.
* **Причина в коде:** В [Gameplay.css](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoFrontend/src/pages/Gameplay/Gameplay.css) для `.gameboard-grid-custom` жестко задано `grid-template-columns: repeat(6, 1fr)`. При 50–60 песнях поле вытягивается в 10 высоких строк и сжимается по горизонтали.
* **Что будем делать:**
  1. Сделать сетку адаптивной под соотношение 16:9 и количество треков: динамически рассчитывать число колонок (8–10 колонок для экранов 1920×1080 при большом количестве песен, либо `grid-template-columns: repeat(auto-fit, minmax(110px, 1fr))`).
  2. Расширить контейнер игрового поля на слайде презентации до `max-width: 95vw; width: 100%`, сбалансировав отступы сверху и снизу, чтобы поле занимало экран равномерно и красиво.

---

## 🟡 Обычный приоритет (Остальные замечания)

### № 3. Порядок полей в модалке «Добавить песню»
* **Проблема:** Область загрузки файла находится внизу, а поля названия и исполнителя наверху, хотя они автоматически заполняются из имени файла.
* **Что будем делать:**
  - В [AddSongModal.tsx](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoFrontend/src/components/AddSongModal/AddSongModal.tsx) переместить блок Drag & Drop загрузки аудиофайла на первое место.
  - Поля «Название» и «Исполнитель» разместить ниже — пользователь видит, как они автоматически заполняются после выбора трека, и при необходимости корректирует их.

---

### № 4. Дёргание модалки редактирования при включённом воспроизведении
* **Проблема:** Если играет музыка, модалка редактирования песни начинает мерцать/дергаться каждые несколько сотен миллисекунд.
* **Причина в коде:** В [MusicContext.tsx](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoFrontend/src/context/MusicContext.tsx) событие `timeupdate` обновляет `currentTime` несколько раз в секунду, вызывая ререндер страницы [SongLibrary.tsx](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoFrontend/src/pages/SongLibrary/SongLibrary.tsx) и дочерней модалки [EditSongModal.tsx](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoFrontend/src/components/EditSongModal/EditSongModal.tsx).
* **Что будем делать:**
  - Обернуть `EditSongModal` в `React.memo` с кастомным компаратором пропсов.
  - В стилях модалки зафиксировать координаты и добавить аппаратное ускорение `transform: translateZ(0); backface-visibility: hidden`, чтобы исключить любые субпиксельные сдвиги при ререндерах.

---

### № 5. Цвет рамки алерта «Песня успешно удалена»
* **Проблема:** Тост об успешном удалении имеет красную рамку, что воспринимается как ошибка.
* **Что будем делать:**
  - В [NotificationToast.css](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoFrontend/src/components/NotificationToast/NotificationToast.css) изменить оформление класса `.toast-delete`: использовать зеленый цвет успеха (`#10B981`) с мягкой тенью и иконкой галочки, либо нейтральный приятный акцентный тон, сигнализирующий об успешном действии.

---

### № 6. Песня перемещается в случайное место списка после редактирования
* **Проблема:** После изменения названия или автора песня исчезает из поля зрения и перемещается в случайное место таблицы.
* **Причина в коде:** В базе данных Postgres при `UPDATE` физическая строка перемещается, и без жесткого `ORDER BY` выборка возвращается в непредсказуемом порядке.
* **Что будем делать:**
  - Зафиксировать сортировку в [GetSongs.cs](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoBackend/MusicalLotoBackend.Core/Features/Songs/GetSongs.cs): `OrderByDescending(s => s.CreatedAt)`.
  - В [SongLibrary.tsx](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoFrontend/src/pages/SongLibrary/SongLibrary.tsx) обновлять трек точечно по `id` без перезатирания порядка строк.

---

### № 7. Отсутствие кнопки очистки поисковой строки
* **Проблема:** В строке поиска по библиотеке песен нельзя быстро стереть запрос одним кликом.
* **Что будем делать:**
  - В [SongLibrary.tsx](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoFrontend/src/pages/SongLibrary/SongLibrary.tsx) внутрь `.search-bar` добавить кнопку «✕» при наличии текста в `searchQuery`, сбрасывающую поиск в 1 клик.

---

### № 8. Валидация на дубликаты песен при загрузке
* **Проблема:** Отсутствует проверка на уже загруженные песни, из-за чего библиотека засоряется повторками.
* **Что будем делать:**
  - На клиенте в [AddSongModal.tsx](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoFrontend/src/components/AddSongModal/AddSongModal.tsx): перед отправкой сверять совпадение `Title + Artist` с уже загруженными треками пользователя и выводить предупреждающую подсказку.
  - На сервере в [CreateSong.cs](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoBackend/MusicalLotoBackend.Core/Features/Songs/CreateSong.cs): добавить проверку существования аналогичного трека у данного `UserId`.

---

### № 10. Неинтуитивная работа полей количества участников и размера карточки
* **Проблема:** Поля размера карточки и числа участников ведут себя непредсказуемо при вводе с клавиатуры (жесткий сброс на 3 при стирании цифры, непонятно, сколько песен нужно для игры).
* **Что будем делать:**
  - В [Cabinet.tsx](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoFrontend/src/pages/Cabinet/Cabinet.tsx) и [CreateGameModal.tsx](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoFrontend/src/components/CreateGameModal/CreateGameModal.tsx):
    - Для размера карточки предоставить понятный выбор (например, кнопки-чипы: «3×3 (9 песен)», «4×4 (16 песен)», «5×5 (25 песен)») с подсказкой необходимого минимума треков.
    - Для количества участников использовать удобный счетчик (+ / -) с валидацией по событию `onBlur` вместо агрессивного сброса на каждом символе.

---

### № 12. Гибкая настройка оформления лейблов на карточках и слайдах
* **Проблема:** Невозможно выбрать отдельный цвет для конкретного лейбла или переместить его положение.
* **Что будем делать:**
  - В панели кастомизации карточки [Cabinet.tsx](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoFrontend/src/pages/Cabinet/Cabinet.tsx) предусмотреть селекторы акцентного цвета для отдельных блоков (заголовок, рамка, подвал).
  - В редакторе слайдов [Presentation.tsx](file:///c:/Users/darli/Desktop/66bit_music/MusicalLotoFrontend/src/pages/Presentation/Presentation.tsx) предусмотреть выбор выравнивания текста (по центру / влево) и базовые темы оформления.

---

## 📋 Порядок выполнения работ

1. **Этап 1 (Критический функционал):** Пункты №1, №2, №11, №15 (полные треки, порядок добавления, правило «Вся карточка», описание титульного слайда).
2. **Этап 2 (Визуал и презентация):** Пункты №18, №20, №13, №14 (контраст бейджа активной песни, адаптивная ширина игрового поля, исправление ножниц/бантиков и смещения плашки в PDF).
3. **Этап 3 (UX карточек и генератора):** Пункты №9, №10 (возврат к карточкам существующей игры, интуитивные поля настроек).
4. **Этап 4 (UX библиотеки песен и полировка):** Пункты №3, №4, №5, №6, №7, №8, №12.
