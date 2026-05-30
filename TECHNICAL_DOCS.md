# Техническая документация: Mizuchi

> Дата: 2026-03-03
> Версия: 0.0.0
> Статус проекта: активная разработка (pre-alpha)

---

## Содержание

1. [Обзор проекта](#1-обзор-проекта)
2. [Стек технологий](#2-стек-технологий)
3. [Структура проекта](#3-структура-проекта)
4. [Архитектура](#4-архитектура)
   - 4.1 [Иерархия данных](#41-иерархия-данных)
   - 4.2 [Система нод (граф сигналов)](#42-система-нод-граф-сигналов)
   - 4.3 [Система рендеринга (Canvas)](#43-система-рендеринга-canvas)
   - 4.4 [Паттерн команд (Undo/Redo)](#44-паттерн-команд-undoredo)
   - 4.5 [IdComponent и адресация объектов](#45-idcomponent-и-адресация-объектов)
   - 4.6 [Сериализация и персистентность](#46-сериализация-и-персистентность)
5. [Аудио-движок](#5-аудио-движок)
6. [Bloom-эффект (WebGL)](#6-bloom-эффект-webgl)
7. [Пользовательский интерфейс](#7-пользовательский-интерфейс)
8. [Ключевые алгоритмы](#8-ключевые-алгоритмы)
9. [Хорошие решения](#9-хорошие-решения)
10. [Проблемы и недоработки](#10-проблемы-и-недоработки)
11. [Сводная таблица файлов](#11-сводная-таблица-файлов)

---

## 1. Обзор проекта

**Mizuchi** — браузерный DAW (Digital Audio Workstation) с нодовым редактором синтеза звука. Приложение позволяет:

- Редактировать ноты в piano roll (редактор Score)
- Располагать паттерны на таймлайне (редактор Mix)
- Маршрутизировать аудиосигнал через граф обработки (редактор NodeSpace)
- Воспроизводить результат в реальном времени через Web Audio API
- Сохранять проект в `localStorage`

Проект написан на TypeScript с React в качестве роутера и оболочки, а весь реальный UI — это Canvas 2D + WebGL.

---

## 2. Стек технологий

| Слой | Технология | Версия |
|------|-----------|--------|
| Язык | TypeScript | 5.7.2 |
| Фреймворк (оболочка) | React | 19.0.0 |
| Роутинг | React Router DOM | 7.1.1 |
| Сборка | Vite | 5.4.8 |
| UI-рендеринг | Canvas 2D API | — |
| Пост-обработка | WebGL2 | — |
| Аудио | Web Audio API | — |
| Хранилище | localStorage | — |
| Тесты | отсутствуют | — |

> ⚠️ **Внешних зависимостей для рендеринга нет** — всё написано с нуля поверх нативных API браузера.

---

## 3. Структура проекта

```
mizuchi_ts/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html                         # Точка входа (HTML-шаблон)
└── src/
    ├── index.tsx                      # Монтирование React
    ├── App.tsx                        # Роутинг (EditorPage, SettingsPage, HomePage)
    ├── main.ts                        # Инициализация Mizuchi (Canvas entry)
    ├── style.css                      # Глобальные стили
    ├── img/                           # Логотипы
    ├── pages/
    │   ├── EditorPage.tsx             # Основная страница редактора
    │   ├── SettingsPage.tsx           # Настройки (заглушка)
    │   └── HomePage.tsx               # Главная (не используется)
    └── mizuchi/
        ├── main/
        │   ├── index.ts               # Re-export Mizuchi
        │   ├── mizuchi.ts             # Главный контроллер (UI-привязки)
        │   └── mixer.ts               # Движок воспроизведения
        ├── data/
        │   ├── mix.ts                 # Корневой объект проекта
        │   ├── track.ts               # Трек (мелодическая линия)
        │   └── score.ts               # Score (последовательность нот)
        ├── nodes/
        │   ├── node.ts                # Абстрактный базовый Node
        │   ├── node_space.ts          # Граф нод
        │   ├── output_node.ts         # Нода-вывод
        │   ├── note_input_node.ts     # Ноты → Аудиосигнал
        │   ├── track_node.ts          # Вход с трека
        │   ├── input_node.ts          # Общий вход
        │   ├── delay_node.ts          # Эффект задержки
        │   ├── distortion_node.ts     # Искажение
        │   ├── invert_node.ts         # Инверсия
        │   ├── mix_node.ts            # Микширование
        │   ├── noise_node.ts          # Генератор шума
        │   ├── base_osc_node.ts       # Осциллятор
        │   └── node_components/       # UI-компоненты нод
        ├── classes/
        │   ├── id_component.ts        # Базовый класс с ID и адресацией
        │   ├── note.ts                # Нота (MIDI-подобная)
        │   ├── Input.ts               # Входной порт
        │   ├── Output.ts              # Выходной порт
        │   ├── connectors.ts          # Соединение портов
        │   ├── selection.ts           # Управление выделением
        │   ├── menu.ts                # Контекстное меню
        │   ├── hovered.ts             # Состояние hover
        │   ├── WindowController.ts    # Управление размером панелей
        │   ├── SectorSelection.ts     # Выделение прямоугольником
        │   ├── CommandPattern.ts      # Undo/Redo
        │   └── BloomShader.ts         # Bloom-эффект (WebGL2)
        ├── curves/
        │   ├── curve.ts               # Квадратичная кривая Безье
        │   ├── function.ts            # Обёртка функции
        │   ├── mapping_function.ts    # Маппинг формы волны
        │   └── points.ts              # Опорные и управляющие точки
        └── drawers/
            ├── Drawer.ts              # Базовый класс рендерера
            ├── view.ts                # Обёртка Canvas-контекста
            ├── score_drawer.ts        # Piano roll рендерер (450 строк)
            ├── score_controller.ts    # Контроллер piano roll
            ├── mix_drawer.ts          # Mix view рендерер
            ├── mix_controller.ts      # Контроллер mix view
            ├── node_space_drawer.ts   # Рендерер графа нод
            ├── node_space_consroller.ts # Контроллер графа нод
            └── osc_drawer.ts          # Осциллоскоп (не используется)
```

---

## 4. Архитектура

### 4.1 Иерархия данных

Все данные проекта организованы в дерево:

```
Mix (корень проекта)
├── bpm, loop_start, loop_end, sampleRate
├── NodeSpace (глобальный граф сигналов)
│   ├── OutputNode
│   ├── InputNode
│   ├── nodes: IdArray<Node>
│   └── connectors: IdArray<Connector>
├── tracks: IdArray<Track>
│   └── Track
│       ├── name, color, height
│       ├── scores: IdArray<Score>
│       │   └── Score
│       │       ├── absolute_start, duration, loop_duration, relative_start
│       │       └── notes: IdArray<Note>
│       │           └── Note { pitch, start, duration }
│       └── NodeSpace (трековый граф)
└── CommandPattern (история команд)
```

**Ключевая особенность**: каждый узел дерева знает своего родителя (`parent`). Это используется для построения адресных путей (см. раздел 4.5).

---

### 4.2 Система нод (граф сигналов)

Центральная концепция — нодовый граф, аналогичный профессиональным DAW (Ableton Rack, Bitwig Modulator и т. п.).

#### Базовый класс `Node` (`src/mizuchi/nodes/node.ts`)

```typescript
abstract class Node extends IdComponent {
    inputs:  Input[]         // Входные порты
    outputs: Output[]        // Выходные порты
    components: NodeComponent[] // UI-элементы внутри ноды
    x: number; y: number;   // Позиция в NodeSpace
    width: number; height: number;

    abstract compute(): any   // Вычислить выход ноды
    abstract render(view: View): void // Отрисовать ноду
    _render(view: View): void // Общая рамочная отрисовка (frame + ports + name)
    hitScan(x, y, r): Input | Output | NodeComponent | Node | null
    moveTo(x, y): void       // Двигает ноду и обновляет кривые коннекторов
    translate(dx, dy): void  // Относительный сдвиг
}
```

#### Типы портов (`Input.ts`, `Output.ts`)

Порты типизированы перечислением:

```typescript
enum PortType { Signal, Float, Bool, MultiFloat, Midi }
```

- **OutputSignal** содержит кэш (`cache: number | null`) — предотвращает повторное вычисление одного фрейма
- **InputSignal** при `get()` вызывает `output.parent.compute()` рекурсивно
- Один `Output` может быть подключён к нескольким `Input` (fan-out)
- Один `Input` имеет не более одного входящего `Connector`

#### `NodeSpace` — контейнер графа (`node_space.ts`)

`NodeSpace` сам является `Node`, что позволяет вкладывать пространства нод друг в друга (Sub-patch архитектура):

```typescript
class NodeSpace extends Node {
    outputNode: OutputNode
    inputNode:  InputNode
    nodes:      IdArray<Node>
    connectors: IdArray<Connector>
    compute(): number { return this.outputNode.compute() }
}
```

`compute()` запускает ленивое рекурсивное вычисление всего графа от OutputNode вверх по коннекторам.

#### `Connector` — соединение (`connectors.ts`)

Хранит ссылки на выходной и входной порт, а также кривую Безье для визуализации. При перемещении ноды кривая автоматически обновляется в `Node.moveTo()`.

---

### 4.3 Система рендеринга (Canvas)

Архитектура рендеринга — **MVC поверх Canvas**:

| Компонент | Класс | Роль |
|-----------|-------|------|
| Модель | `Mix`, `Track`, `Score`, `Note`, `NodeSpace` | Данные |
| Представление | `ScoreDrawer`, `MixDrawer`, `NodeSpaceDrawer` | Рендеринг |
| Контроллер | `score_controller`, `mix_controller`, `node_space_consroller` | Обработка ввода |

#### Базовый `Drawer` (`Drawer.ts`)

Предоставляет:
- Доступ к `CanvasRenderingContext2D` (`ctx`)
- Размеры с учётом `devicePixelRatio`
- Общие отступы (`margin_left`, `margin_top`)
- Флаг `stopRender` для паузы отрисовки

#### `View` (`view.ts`) — обёртка контекста с трансформациями

Инкапсулирует систему координат мирового пространства в Node Editor:

```
Мировые координаты → Экранные координаты:
  screenX = (worldX + center.x) * scale + width/2
  screenY = -(worldY + center.y) * scale - height/2

Экранные → Мировые:
  worldX = (screenX * dpr - width/2) / scale - center.x
```

`View` также содержит цветовую схему, методы `drawSquare`, `drawCircle`, `drawPin`, `drawFrame`, `drawCurve`, `drawText`, `drawLine`.

#### Три независимых Canvas

```
EditorPage.tsx
├── MixCanvas    + MixBloomCanvas    → MixDrawer    + BloomShader
├── ScoreCanvas  + ScoreBloomCanvas  → ScoreDrawer  + BloomShader
└── NodeCanvas   + NodeBloomCanvas   → NodeSpaceDrawer + BloomShader
```

Каждый имеет основной Canvas (2D, `mix/canvas/black`) и оверлейный Canvas (WebGL, bloom).

---

### 4.4 Паттерн команд (Undo/Redo)

Реализован в `CommandPattern.ts` (249 строк). Классическая реализация GoF Command:

```
CommandPattern
├── commands[]       ← история выполненных
└── undoCommands[]  ← история отменённых (для redo)

Command (базовый)
├── Complex          ← группа команд (выполняются как одна)
├── SimpleCommand
│   ├── Create       ← создание объекта
│   └── Delete       ← удаление объекта
└── Move             ← перемещение/изменение параметров
```

**Режим записи** (`recordOpen()` / `recordClose()`): все добавленные команды буферизуются и в конце создаётся один `Complex`. Используется для drag-операций.

**Оптимизация**: при добавлении `Complex` с единственной командой — разворачивает её до атомарной.

**Сериализация**: каждая команда сериализуется через Full ID объектов (`subject.getFullId()`, `object.getFullId()`), что позволяет восстановить её после загрузки из `localStorage`.

---

### 4.5 IdComponent и адресация объектов

Базовый класс `IdComponent` — фундамент для всей системы адресации:

```typescript
abstract class IdComponent {
    id: number
    separator: string  // Символ-разделитель уровня (e.g., 't', 's', 'n', 'e')
    parent: any | null

    getFullId(): string  // Строит путь, обходя родителей
    abstract findByFullID(fullID: string): any  // Навигация по пути
    static findByID(array, id): any  // Поиск по числовому ID
}
```

**Система полных ID** — строковые пути:

| Путь | Расшифровка |
|------|-------------|
| `""` | Mix (корень) |
| `t1` | Track с id=1 |
| `t1s0` | Score с id=0 в Track 1 |
| `t1s0n5` | Note с id=5 в Score 0 в Track 1 |
| `e2` | Node с id=2 в NodeSpace |

Разделители: `t` → Track, `s` → Score, `n` → Note, `e` → Node.

**`IdArray<T>`** — подкласс `Array` с автоинкрементным счётчиком ID:

```typescript
class IdArray<T> extends Array<T> {
    increment: number = 0
    getNewId(): number { return this.increment++ }
    toJSON(): { data: T[], increment: number }
}
```

---

### 4.6 Сериализация и персистентность

Сохранение выполняется в `Mix.save()` → `localStorage.setItem('key', json)`.

#### Обработка циклических ссылок

`JSON.stringify` с кастомным `replacer`:

```typescript
save() {
    const seen = new Set()
    const replacer = (key, value) => {
        if (typeof value === "object" && seen.has(value)) {
            // Обнаружена циклическая ссылка
            return undefined
        }
        if (value instanceof IdComponent && value.parent === null) {
            // "Удалённый" объект — сохранить в deleted[], вернуть индекс
            this.deleted.push(value)
            return String(this.deleted.indexOf(value))
        }
        seen.add(value)
        return value
    }
    localStorage.setItem('key', JSON.stringify(this, replacer))
}
```

#### Отложенное разрешение ссылок

Коннекторы нод хранят Full ID портов. При загрузке порты разрешаются после полного создания дерева:

```typescript
mix.setAsideFullID('t0s1n3', (obj) => { connector.input = obj })
// После всех fromJSON() вызывает settler'ы:
for (let entry of this.fullIDs) {
    entry.setter(this.findByFullID(entry.fullID))
}
```

#### Массив `deleted`

Удалённые объекты (участвующие в истории команд) не уничтожаются, а хранятся в `mix.deleted[]`. При сохранении их ссылки заменяются числовыми индексами (`"0"`, `"1"`...). При загрузке восстанавливаются через `fromJSON`.

---

## 5. Аудио-движок

### Mixer (`mixer.ts`)

```typescript
class Mixer {
    private audioCtx: AudioContext | null
    private chunkLength: number = 1050
    private chunk_buffer: number = 5   // Количество буферизованных чанков
    private counter: number            // Активных чанков в очереди

    async toggle()        // Старт/стоп воспроизведения
    private play()        // Создаёт AudioContext, генерирует первые chunk_buffer чанков
    private stop()        // Закрывает AudioContext
    private generateChunk()  // Вычисляет 1050 семплов через nodeSpace.compute()
    private toBuffer(array)  // Создаёт AudioBuffer, планирует воспроизведение
}
```

### Пайплайн воспроизведения

```
play()
  │
  ├─ Создать AudioContext (фиксирует sampleRate, обычно 44100 или 48000)
  ├─ Вычислить loop_start, loop_end в семплах
  │    sample = beats * 30 / bpm * sampleRate
  └─ generateChunk() × chunk_buffer (параллельно через async/await)
       │
       ├─ for i in range(1050):
       │    ├─ Обновить mix.playback++
       │    ├─ Проверить конец лупа → сброс playback
       │    └─ chunk[i] = mix.nodeSpace.compute()
       │         └─ OutputNode.compute()
       │              └─ NoteInputNode.compute()
       │                   ├─ Найти активные ноты в текущий момент
       │                   ├─ Вычислить частоту: 440 * 2^((pitch-69)/12)
       │                   └─ Сэмплировать таблицу волны
       └─ toBuffer(chunk)
            ├─ AudioContext.createBuffer(1, 1050, sampleRate)
            ├─ buffer.copyToChannel(chunk, 0)
            ├─ source.start(scheduledTime)  ← точное планирование
            └─ source.addEventListener("ended", → generateChunk())
```

### Особенности

- **Самоподдерживающийся конвейер**: `ended` событие запускает новый чанк, когда буфер опустеет до `chunk_buffer - 1`
- **Визуальная синхронизация**: каждые 10 000 итераций вызывает `mixDrawer.render()` (обновляет позицию playhead)
- **Точное планирование**: `source.start(time)` использует аудио-часы (`AudioContext`), не `setTimeout`

---

## 6. Bloom-эффект (WebGL)

`BloomShader.ts` — полноценный WebGL2 пост-процессинг поверх Canvas 2D:

### Алгоритм (4 прохода)

```
Canvas2D (source)
    │
    ▼ uploadSourceTexture()
[sourceTexture]
    │
    ├─ Pass 1: Bright Pass (яркостный фильтр)
    │    Выделяет пиксели ярче threshold (0.2)
    │    dot(rgb, vec3(0.2126, 0.7152, 0.0722)) > threshold
    │    → brightTexture
    │
    ├─ Pass 2: Horizontal Gaussian Blur
    │    Гауссово размытие по X (21 sample)
    │    → blurTexture1
    │
    ├─ Pass 3: Vertical Gaussian Blur
    │    Гауссово размытие по Y (21 sample)
    │    → blurTexture2
    │
    └─ Pass 4: Combine
         original.rgb + bloom.rgb * intensity
         → displayCanvas (WebGL)
```

### Параметры

```typescript
params = {
    intensity:  1.2,   // Интенсивность свечения
    radius:     1.5,   // Радиус ядра Гаусса
    threshold:  0.2,   // Порог яркости
    spread:     2.8    // Умножитель радиуса размытия
}
```

### Жизненный цикл

- `show()` / `hide()` — включает/выключает bloom, переключая `hidden` оверлейного Canvas
- По умолчанию **выключен** (`on = false`), включается кнопкой Shader в UI
- `resize()` — пересоздаёт фреймбуферы при изменении размера

---

## 7. Пользовательский интерфейс

### Точка входа `Mizuchi` (`mizuchi.ts`)

Конструктор вручную подключает все DOM-элементы:

```typescript
class Mizuchi {
    constructor() {
        // DOM-биндинги: loop_start, loop_end, bpm, shader, reset
        // Создаёт ScoreDrawer, NodeSpaceDrawer, MixDrawer
        // Создаёт BloomShader для каждого canvas
        // Создаёт WindowController для score и node панелей
        // Глобальные горячие клавиши: Ctrl+S (сохранить), Space (play/stop)
    }
}
```

### Горячие клавиши

| Клавиша | Действие |
|---------|----------|
| `Space` | Play / Stop |
| `Ctrl+S` | Сохранить проект |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Ctrl+C` | Копировать (Score) |
| `Ctrl+V` | Вставить (Score) |
| `Ctrl+X` | Вырезать (Score) |
| `Ctrl+D` | Дублировать (Score) |
| `Ctrl+A` | Выделить всё (Score) |
| `Delete` / `Backspace` | Удалить выделенное |
| `Arrow Up/Down` | Сдвинуть питч |
| `Arrow Left/Right` | Сдвинуть старт |
| `Enter` | Применить изменения |

### `WindowController`

Управляет изменяемыми панелями (`score-canvas-wrapper`, `node-space-canvas-wrapper`): изменение размера drag'ом, передача событий дочернему `Drawer`.

---

## 8. Ключевые алгоритмы

### Кривая Безье для коннекторов и осциллятора

`Curve` хранит опорные (`BasicPoint`) и управляющие (`HandlePoint`) точки и строит квадратичную кривую Безье:

```typescript
// Рендеринг через стандартный Canvas API
ctx.quadraticCurveTo(handle.x, handle.y, end.x, end.y)
```

Hit-тест коннектора — перебор по параметру `t` с шагом 0.1:

```typescript
hitScan(xx, yy, threshold) {
    for (let t = 0; t <= 1; t += 0.1) {
        const pt = quadraticBezier(t, p0, control, p1)
        if (distance(pt, {xx, yy}) < threshold) return this
    }
    return null
}
```

### Нота → семпл

```typescript
// Частота ноты (MIDI-стандарт)
freq = 440 * Math.pow(2, (pitch - 69) / 12)

// Период волны в семплах
period = sampleRate / freq

// Позиция в таблице [0, 1)
tablePos = (playback - noteStart) % period / period

// Значение семпла
sample = oscFunction.getSample(tablePos)
```

### `getNotesAt` — активные ноты в момент времени

```typescript
getNotesAt(currentTime: number): Note[] {
    let relativeTime = (currentTime + this.relative_start) % this.loop_duration
    return this.notes.filter(note =>
        note.start <= relativeTime && relativeTime < note.start + note.duration
    )
}
```

### Вычисление таймлайна (Mixer)

```typescript
// Конвертация такт → семпл
// 1 такт = 2 бита, BPM = удар в минуту
sample = beat * (60 / bpm) * sampleRate / 2
// или эквивалентно:
sample = beat * 30 / bpm * sampleRate
```

### Рендеринг сетки piano roll

Прозрачность горизонтальных линий сетки адаптивно снижается при высоком масштабировании:

```typescript
const opacity = Math.pow((1 - notes_width_count / 120), 1.5)
ctx.strokeStyle = `rgba(200,200,200,${opacity})`
```

---

## 9. Хорошие решения

### ✅ Нодовая архитектура с lazy evaluation

Вычисление аудиографа происходит лениво: `outputNode.compute()` рекурсивно запрашивает значения у подключённых нод. Благодаря кэшированию в `OutputSignal.cache` каждая нода вычисляется ровно один раз за фрейм.

### ✅ Паттерн команд с полной сериализацией

`CommandPattern` корректно сериализуется и десериализуется: команды хранят Full ID, а не прямые ссылки. Это позволяет пережить сохранение/загрузку с сохранением полной истории undo/redo.

### ✅ WebGL bloom поверх Canvas 2D

Разделение рендеринга: основная сцена рисуется в Canvas 2D (простота кода), а bloom-эффект добавляется через отдельный WebGL canvas-оверлей. Классический подход, исключающий переписывание всего рендерера на GPU.

### ✅ `IdArray` как расширение нативного `Array`

Наследование от `Array<T>` позволяет использовать весь нативный API (`forEach`, `splice`, `includes`, `indexOf`) без адаптеров. Автоинкрементный `increment` решает проблему повторного использования ID при undo/redo удалений.

### ✅ Sub-patch NodeSpace

`NodeSpace extends Node` — элегантная рекурсивная архитектура, позволяющая вкладывать пространства нод. Граф обработки трека и глобальный граф — одна и та же концепция.

### ✅ Full ID для адресации без глобального реестра

Объекты не требуют централизованного реестра. Любой объект находится через `mix.findByFullID("t1s0n5")` — иерархический парсинг строки. Это упрощает сериализацию и делает команды самодостаточными.

### ✅ `setAsideFullID` — отложенное разрешение

Позволяет десериализовать граф с прямыми ссылками без двух проходов. Зависимые объекты регистрируют колбэк, который вызывается после полного построения дерева.

### ✅ Точное аудио-планирование

`AudioBufferSourceNode.start(time)` использует аудио-часы AudioContext (высокоточные), а не `setTimeout`. Это обеспечивает стабильное воспроизведение без дрожания (jitter).

### ✅ Адаптивная прозрачность сетки

Прозрачность горизонтальных линий в piano roll вычисляется нелинейно (`Math.pow`), что даёт плавный переход от читаемой сетки к пустому фону при максимальном zoom.

---

## 10. Проблемы и недоработки

### 🔴 Критические

#### Блокировка основного потока при генерации аудио

```typescript
// mixer.ts:55-66
for (let i = 0; i < this.chunkLength; i++) {
    chunk[i] = this.mix.nodeSpace.compute()
}
```

`generateChunk` обозначен `async`, но внутри нет `await`. Всё вычисление 1050 семплов происходит синхронно в одном вызове. При сложном графе это **заморозит UI**.

**Должно быть**: `AudioWorkletProcessor` или `OfflineAudioContext`, а не `createBufferSource`.

---

#### Глобальный мутабельный синглтон

```typescript
// mix.ts:245
export const mix = new Mix()
```

`mix` — глобальный экспортируемый объект. Все модули импортируют его напрямую. Это делает тестирование невозможным и создаёт неявные зависимости.

---

#### Потенциальная потеря данных при сохранении

Нет атомарности записи: если `JSON.stringify` упадёт (TypeError из-за нераспознанного циклического объекта), `localStorage` останется с пустой строкой (`localStorage.setItem('key', '')`):

```typescript
// mizuchi.ts:16
resetButton.addEventListener("click", () => {
    localStorage.setItem('key', '');  // Безвозвратный сброс
})
```

Нет подтверждения, нет резервной копии.

---

#### Отсутствие тестов

В проекте нет ни одного теста. Бизнес-логика (`Score.getNotesAt`, `CommandPattern`, `Curve`, `IdArray`) не покрыта. Регрессии вносятся незаметно.

---

### 🟡 Серьёзные

#### Широкое использование `any`

```typescript
// Примеры из кода
parent: any | null
deleted: any = []
findByFullID(fullId: string): any
static AnyNodefromJSON(json: any, parent: any, mix: Mix): Node
```

TypeScript теряет смысл там, где везде `any`. Ошибки типов всплывают только в рантайме.

---

#### Ошибка в `NodeSpace.connectNodes`

```typescript
// node_space.ts:141-149
connectNodes(node1, node2, input_index, output_index, con_i) {
    const input  = node1.outputs[input_index]  // ← outputs[input_index]?!
    const output = node2.inputs[output_index]  // ← inputs[output_index]?!
    ...
    input.connected.push(con)   // input — это Output
    output.connected = con      // output — это Input
}
```

Имена переменных `input`/`output` перепутаны (инвертированы) относительно семантики. Функция работает, но код вводит в заблуждение.

---

#### `ScoreDrawer` создаётся с `new Score(mix.tracks[0], 0, 0)`

```typescript
// mizuchi.ts:41
const score_drawer = new ScoreDrawer(scoreCanvas, new Score(mix.tracks[0],0,0), mix, scoreBloom)
```

`ScoreDrawer` создаётся с временным пустым `Score`, не привязанным к реальным данным трека. Переключение между треками/score не реализовано.

---

#### Рендеринг на каждый `pointermove`

```typescript
// score_drawer.ts:137-141
this.canvas.addEventListener('pointermove', (e) => {
    if (this.stopRender) return;
    this.render()                   // ← полный ре-рендер на каждое движение
    this.controller.hitScan(...)
})
```

Нет `requestAnimationFrame`, нет dirty-флага. При большом количестве нот или на медленных устройствах это источник лагов.

---

#### `render()` вызывается в `generateChunk()`

```typescript
// mixer.ts:62-63
if (i % 10000 == 0)
    this.mixDrawer.render()
```

`1050 < 10000` — условие **никогда не выполняется**. Playhead не двигается во время воспроизведения.

---

#### Неработающий `node_space_consroller` (опечатка в имени файла)

`node_space_consroller.ts` — опечатка в имени файла (лишняя буква `s`). Незначительно, но показательно для общего качества именования.

---

#### Неиспользуемый код

```typescript
// mizuchi.ts:35 — закомментирован OscDrawer
// const oscDrawer = new OscDrawer(...)

// mizuchi.ts:86-105 — закомментированы все пресеты (Sine, Saw, Square, Triangle)

// osc_drawer.ts — файл есть, но нигде не используется

// CommandPattern.ts:222-249 — класс Set закомментирован
// score.ts:70-77 — метод addScore закомментирован
```

Накапливается мёртвый код. Инициализация `ScoreDrawer` содержит `new Score(mix.tracks[0],0,0)` — временный хак.

---

#### Хранилище — единственный ключ в `localStorage`

```typescript
localStorage.setItem('key', log)   // ключ буквально 'key'
```

- Нет версионирования схемы
- Нет экспорта в файл
- ~5 МБ лимит localStorage может быть превышен при большом проекте
- Нет автосохранения (только `Ctrl+S`)

---

#### Проблема с `Score.select` (баг)

```typescript
// score.ts:103-104
c.start = Math.min(c.start, notes[0].start)
c.end   = Math.max(c.end, notes[0].start)  // ← должно быть notes[0].start + notes[0].duration?
```

`c.end` сравнивается с `notes[0].start`, а не с концом ноты.

---

### 🟢 Мелкие замечания

#### Magic numbers

```typescript
this.chunkLength = 1050      // Почему 1050, а не 1024?
notes_width_count = 24       // Отображаемый диапазон нот
chunk_buffer = 5             // Количество заранее просчитанных чанков
const opas = Math.pow((1-this.notes_width_count/120), 1.5)  // Почему 120?
```

Ни один из этих параметров не задокументирован и не вынесен в константы.

---

#### Конфликт именования в `node_space.ts`

Переменные в `connectNodes` называются `input` и `output`, но содержат противоположные типы. Комментарий в коде:

```typescript
console.log(obj, out_index, in_index)  // Debug-лог в продакшн-коде
```

---

#### Debug-логи в продакшне

```typescript
console.log("chunk")           // mixer.ts:67
console.log(mix.nodeSpace)     // mizuchi.ts:72
console.log(data)              // mix.ts:35
console.log("Start: ", this)   // mix.ts:121
console.log("Final: ", this)   // mix.ts:166
```

При каждом сохранении/загрузке/генерации чанка в консоль идут данные.

---

#### Отсутствует проверка WebGL2

```typescript
// BloomShader.ts:38-40
if (!gl) {
    throw new Error('WebGL2 not supported!')
}
```

`throw` выбросит ошибку, но она не перехватывается в `Mizuchi`. Если браузер не поддерживает WebGL2 — приложение упадёт.

---

## 11. Сводная таблица файлов

| Файл | Строк | Назначение | Примечание |
|------|-------|-----------|-----------|
| `score_drawer.ts` | 450 | Piano roll рендерер | Самый большой файл |
| `BloomShader.ts` | 334 | WebGL2 bloom | Хорошая реализация |
| `CommandPattern.ts` | 249 | Undo/Redo | Хорошая реализация |
| `mix.ts` | 243 | Корень проекта | Глобальный синглтон |
| `view.ts` | 223 | Canvas-утилиты | Чистый код |
| `curve.ts` | 193 | Кривая Безье | |
| `score.ts` | 163 | Последовательность нот | Есть баг в select() |
| `node_space.ts` | 151 | Граф нод | Путаница с именами |
| `node.ts` | 141 | Базовая нода | Хорошая абстракция |
| `mizuchi.ts` | 123 | Главный контроллер | Много закомментированного |
| `connectors.ts` | 121 | Коннектор-соединение | |
| `mixer.ts` | 88 | Аудио-движок | Проблема с потоком |
| `id_component.ts` | 70 | Адресация объектов | Хорошее решение |
| `osc_drawer.ts` | ? | Осциллоскоп | **Не используется** |

---

*Документация сгенерирована на основе анализа исходного кода. Версия от 2026-03-03.*
