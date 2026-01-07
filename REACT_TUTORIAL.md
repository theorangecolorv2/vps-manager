# React + TypeScript: Практический учебник

> Это пособие создано на основе задач проекта VPS Manager.
> Каждая концепция объясняется подробно с примерами из реального кода.

---

## Содержание

1. [Основы React: компоненты и JSX](#1-основы-react-компоненты-и-jsx)
2. [Props — передача данных в компоненты](#2-props--передача-данных-в-компоненты)
3. [useState — состояние компонента](#3-usestate--состояние-компонента)
4. [useEffect — побочные эффекты](#4-useeffect--побочные-эффекты)
5. [useMemo и useCallback — оптимизация](#5-usememo-и-usecallback--оптимизация)
6. [Кастомные хуки](#6-кастомные-хуки)
7. [TypeScript в React](#7-typescript-в-react)
8. [Практика: разбор задач проекта](#8-практика-разбор-задач-проекта)

---

# 1. Основы React: компоненты и JSX

## Что такое компонент?

**Компонент** — это функция, которая возвращает JSX (разметку). Это кирпичик интерфейса.

```tsx
// Самый простой компонент
function Hello() {
  return <h1>Привет!</h1>
}
```

### Почему функция, а не класс?

Раньше в React были классовые компоненты. Сейчас используют **функциональные** — они проще и с хуками работают лучше.

## Что такое JSX?

**JSX** — это синтаксис, похожий на HTML, но внутри JavaScript. Браузер его не понимает — Babel/TypeScript превращает его в обычный JS.

```tsx
// Это JSX:
<div className="card">Текст</div>

// Превращается в:
React.createElement('div', { className: 'card' }, 'Текст')
```

### Ключевые отличия от HTML:

| HTML | JSX | Почему |
|------|-----|--------|
| `class="..."` | `className="..."` | `class` — зарезервированное слово в JS |
| `for="..."` | `htmlFor="..."` | `for` — тоже зарезервировано |
| `onclick="..."` | `onClick={...}` | camelCase + функция вместо строки |
| `style="color: red"` | `style={{ color: 'red' }}` | Объект вместо строки |

## Вставка JavaScript в JSX

Используй **фигурные скобки** `{}` чтобы вставить JS-выражение:

```tsx
function Greeting() {
  const name = 'Вася'
  const isAdmin = true

  return (
    <div>
      {/* Переменная */}
      <h1>Привет, {name}!</h1>

      {/* Выражение */}
      <p>2 + 2 = {2 + 2}</p>

      {/* Тернарный оператор (условие) */}
      <span>{isAdmin ? 'Админ' : 'Пользователь'}</span>

      {/* Логическое И (показать если true) */}
      {isAdmin && <button>Удалить всё</button>}
    </div>
  )
}
```

### Важно понимать:

- `{}` — это "окно в JavaScript" внутри JSX
- Внутри `{}` можно только **выражения** (то, что возвращает значение)
- Нельзя: `if`, `for`, `while` — это **инструкции**
- Можно: тернарник `? :`, `.map()`, `.filter()`, переменные

## Рендеринг списков

Для вывода массива используй `.map()`:

```tsx
function ServerList() {
  const servers = ['server1', 'server2', 'server3']

  return (
    <ul>
      {servers.map((server, index) => (
        <li key={index}>{server}</li>
      ))}
    </ul>
  )
}
```

### Что за `key`?

**key** — уникальный идентификатор элемента в списке. React использует его чтобы понять, какие элементы изменились.

```tsx
// Плохо — индекс как key (проблемы при сортировке/удалении)
{items.map((item, i) => <Item key={i} />)}

// Хорошо — уникальный id
{items.map(item => <Item key={item.id} />)}
```

---

# 2. Props — передача данных в компоненты

## Что такое Props?

**Props** (properties) — это данные, которые родительский компонент передаёт дочернему. Как аргументы функции.

```tsx
// Родитель передаёт props
<ServerCard name="Production" ip="192.168.1.1" />

// Дочерний компонент принимает props
function ServerCard(props) {
  return (
    <div>
      <h2>{props.name}</h2>
      <p>{props.ip}</p>
    </div>
  )
}
```

## Деструктуризация props

Вместо `props.name` удобнее сразу достать нужные поля:

```tsx
// Деструктуризация в параметрах
function ServerCard({ name, ip }) {
  return (
    <div>
      <h2>{name}</h2>
      <p>{ip}</p>
    </div>
  )
}
```

## Props с TypeScript

В TypeScript мы **описываем типы props** через interface:

```tsx
// Описываем какие props ожидаем
interface ServerCardProps {
  name: string           // обязательный
  ip: string             // обязательный
  status?: string        // необязательный (знак ?)
  onDelete: () => void   // функция без аргументов
}

// Указываем тип в параметрах
function ServerCard({ name, ip, status, onDelete }: ServerCardProps) {
  return (
    <div>
      <h2>{name}</h2>
      <p>{ip}</p>
      {status && <span>{status}</span>}
      <button onClick={onDelete}>Удалить</button>
    </div>
  )
}
```

### Зачем типизация?

1. **Автодополнение** — IDE подсказывает какие props есть
2. **Ошибки при компиляции** — забыл передать обязательный prop? TypeScript скажет
3. **Документация** — interface показывает что компонент принимает

## Специальный prop: children

**children** — это то, что ты вставляешь между тегами компонента:

```tsx
// Использование
<Card>
  <h1>Заголовок</h1>
  <p>Текст внутри</p>
</Card>

// Компонент
interface CardProps {
  children: React.ReactNode  // специальный тип для children
}

function Card({ children }: CardProps) {
  return (
    <div className="card">
      {children}  {/* Сюда вставится h1 и p */}
    </div>
  )
}
```

### React.ReactNode

Это тип, который принимает:
- Строки и числа
- JSX элементы
- Массивы элементов
- `null` и `undefined`
- Фрагменты

---

# 3. useState — состояние компонента

## Что такое состояние?

**Состояние (state)** — это данные, которые могут меняться и при изменении вызывают перерисовку компонента.

Props — данные снаружи (от родителя), State — данные внутри компонента.

## Синтаксис useState

```tsx
import { useState } from 'react'

function Counter() {
  // useState возвращает массив из 2 элементов:
  // [текущее значение, функция для изменения]
  const [count, setCount] = useState(0)
  //     ↑          ↑                    ↑
  //  значение   сеттер          начальное значение

  return (
    <div>
      <p>Счётчик: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  )
}
```

## Как работает useState

1. `useState(0)` — создаёт "ячейку памяти" с начальным значением 0
2. `count` — текущее значение из этой ячейки
3. `setCount(новое значение)` — записывает новое значение и **перерисовывает компонент**

### Важно!

```tsx
// НЕПРАВИЛЬНО — напрямую менять state нельзя
count = 5  // React не узнает об изменении

// ПРАВИЛЬНО — через сеттер
setCount(5)  // React узнает и перерисует
```

## useState с TypeScript

```tsx
// Тип выводится автоматически из начального значения
const [count, setCount] = useState(0)  // number

// Явно указать тип (когда начальное значение не даёт понять тип)
const [user, setUser] = useState<User | null>(null)

// Для объектов
interface Server {
  id: number
  name: string
  ip: string
}
const [server, setServer] = useState<Server | null>(null)
```

## Обновление объектов и массивов

State **иммутабельный** — нужно создавать новый объект, а не менять старый:

```tsx
// Объект
const [server, setServer] = useState({ name: 'prod', ip: '1.1.1.1' })

// НЕПРАВИЛЬНО
server.name = 'dev'  // мутация, React не увидит

// ПРАВИЛЬНО — создаём новый объект через spread
setServer({ ...server, name: 'dev' })
//          ↑ копируем все поля
//                      ↑ перезаписываем name
```

```tsx
// Массив
const [items, setItems] = useState([1, 2, 3])

// Добавить элемент
setItems([...items, 4])  // [1, 2, 3, 4]

// Удалить элемент
setItems(items.filter(x => x !== 2))  // [1, 3]

// Изменить элемент
setItems(items.map(x => x === 2 ? 20 : x))  // [1, 20, 3]
```

## Функциональное обновление

Когда новое значение зависит от предыдущего, используй функцию:

```tsx
// Может быть проблема при быстрых кликах
setCount(count + 1)

// Гарантированно правильно
setCount(prev => prev + 1)
//       ↑ предыдущее значение
```

---

# 4. useEffect — побочные эффекты

## Что такое побочный эффект?

**Побочный эффект (side effect)** — это всё, что выходит за рамки рендеринга:
- Запросы к API
- Подписки (таймеры, события)
- Работа с localStorage
- Изменение document.title

## Синтаксис useEffect

```tsx
import { useEffect } from 'react'

useEffect(() => {
  // Код эффекта
}, [/* массив зависимостей */])
```

## Три варианта использования

### 1. Запуск при каждом рендере (без массива)

```tsx
useEffect(() => {
  console.log('Компонент отрендерился')
})
// Вызывается после КАЖДОГО рендера — обычно не нужно
```

### 2. Запуск только при монтировании (пустой массив)

```tsx
useEffect(() => {
  console.log('Компонент появился на странице')
  fetchData()  // загрузить данные один раз
}, [])  // пустой массив = только при монтировании
```

**Монтирование** — момент, когда компонент впервые появляется в DOM.

### 3. Запуск при изменении зависимостей

```tsx
useEffect(() => {
  console.log('userId изменился:', userId)
  fetchUserData(userId)
}, [userId])  // запустится когда userId изменится
```

## Функция очистки (cleanup)

Если эффект создаёт что-то, что нужно "убрать" — возвращай функцию очистки:

```tsx
useEffect(() => {
  // Создаём таймер
  const timer = setInterval(() => {
    console.log('тик')
  }, 1000)

  // Возвращаем функцию очистки
  return () => {
    clearInterval(timer)  // Убираем таймер
  }
}, [])
```

### Когда вызывается cleanup?

1. Перед повторным запуском эффекта (при изменении зависимостей)
2. При размонтировании компонента (когда он удаляется из DOM)

## Пример: debounce поиска

```tsx
function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

  useEffect(() => {
    // Не искать пустую строку
    if (!query) {
      setResults([])
      return
    }

    // Задержка перед поиском (debounce)
    const timer = setTimeout(() => {
      searchAPI(query).then(setResults)
    }, 300)

    // Очистка: отменить таймер если query изменится раньше
    return () => clearTimeout(timer)
  }, [query])

  return (/* ... */)
}
```

## Частые ошибки

### Забыли зависимость

```tsx
// НЕПРАВИЛЬНО — используем count, но не указали в зависимостях
useEffect(() => {
  console.log(count)  // будет всегда показывать старое значение
}, [])

// ПРАВИЛЬНО
useEffect(() => {
  console.log(count)
}, [count])
```

### Бесконечный цикл

```tsx
// НЕПРАВИЛЬНО — setData вызывает ре-рендер → эффект → setData → ...
useEffect(() => {
  setData(fetchData())
})  // нет массива зависимостей!

// ПРАВИЛЬНО
useEffect(() => {
  fetchData().then(setData)
}, [])  // только при монтировании
```

---

# 5. useMemo и useCallback — оптимизация

## Проблема: лишние вычисления

При каждом рендере компонента весь код внутри него выполняется заново:

```tsx
function ServerList({ servers }) {
  // Эта фильтрация выполняется при КАЖДОМ рендере
  // даже если servers не изменился
  const activeServers = servers.filter(s => s.status === 'online')

  return (/* ... */)
}
```

## useMemo — кэширование значений

**useMemo** запоминает результат вычисления и пересчитывает только когда зависимости изменились:

```tsx
import { useMemo } from 'react'

function ServerList({ servers }) {
  // Пересчитается ТОЛЬКО когда servers изменится
  const activeServers = useMemo(() => {
    return servers.filter(s => s.status === 'online')
  }, [servers])
  //   ↑ зависимости

  return (/* ... */)
}
```

### Когда использовать useMemo?

- Тяжёлые вычисления (фильтрация/сортировка больших массивов)
- Создание объектов, которые передаются в дочерние компоненты
- НЕ используй для простых операций — overhead от useMemo может быть больше

## useCallback — кэширование функций

**useCallback** запоминает функцию. Без него функция пересоздаётся при каждом рендере:

```tsx
function Parent() {
  const [count, setCount] = useState(0)

  // БЕЗ useCallback: новая функция при каждом рендере
  const handleClick = () => {
    console.log('clicked')
  }

  // С useCallback: та же функция, пока зависимости не изменятся
  const handleClick = useCallback(() => {
    console.log('clicked')
  }, [])

  return <Child onClick={handleClick} />
}
```

### Когда использовать useCallback?

- Когда передаёшь функцию в дочерний компонент, обёрнутый в `React.memo`
- Когда функция является зависимостью useEffect
- НЕ используй везде подряд — это преждевременная оптимизация

## Разница между useMemo и useCallback

```tsx
// useMemo — кэширует РЕЗУЛЬТАТ функции
const value = useMemo(() => computeExpensiveValue(a, b), [a, b])

// useCallback — кэширует САМУ функцию
const fn = useCallback(() => doSomething(a, b), [a, b])

// useCallback(fn, deps) это то же самое что useMemo(() => fn, deps)
```

---

# 6. Кастомные хуки

## Что это?

**Кастомный хук** — это функция, которая использует другие хуки и начинается с `use`.

Зачем: **переиспользование логики** между компонентами.

## Правила хуков

1. Название начинается с `use` (useSearch, useLocalStorage)
2. Вызывать хуки можно только на верхнем уровне (не в if/for/функциях)
3. Вызывать хуки можно только в компонентах или других хуках

## Пример: useLocalStorage

Разберём хук из твоих задач построчно:

```tsx
// hooks/useLocalStorage.ts
import { useState, useEffect } from 'react'

// <T> — это generic (обобщённый тип), позволяет работать с любым типом данных
export function useLocalStorage<T>(key: string, initial: T): [T, (v: T) => void] {
//                             ↑                         ↑
//                          generic                 возвращает кортеж

  // useState с функцией инициализации (ленивая инициализация)
  const [value, setValue] = useState<T>(() => {
    try {
      // Пробуем прочитать из localStorage
      const item = localStorage.getItem(key)
      // Если есть — парсим JSON, если нет — используем initial
      return item ? JSON.parse(item) : initial
    } catch {
      // При ошибке парсинга возвращаем initial
      return initial
    }
  })

  // При изменении value или key — сохраняем в localStorage
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  // Возвращаем как useState: [значение, сеттер]
  return [value, setValue]
}
```

### Использование:

```tsx
function App() {
  // Вместо useState используем useLocalStorage
  // Данные сохранятся даже после перезагрузки страницы
  const [theme, setTheme] = useLocalStorage('theme', 'dark')
  const [servers, setServers] = useLocalStorage<Server[]>('servers', [])

  return (/* ... */)
}
```

## Пример: useSearch

Разберём хук поиска из задач:

```tsx
// hooks/useSearch.ts
import { useState, useEffect, useMemo } from 'react'
import type { Folder } from '../types'

export function useSearch(folders: Folder[], query: string) {
  // Состояние для "отложенного" запроса (debounced)
  const [debounced, setDebounced] = useState(query)

  // Debounce логика
  useEffect(() => {
    // Устанавливаем таймер на 300мс
    const t = setTimeout(() => setDebounced(query), 300)
    // Cleanup: если query изменится раньше — отменяем таймер
    return () => clearTimeout(t)
  }, [query])

  // Фильтрация с мемоизацией
  return useMemo(() => {
    // Пустой запрос — возвращаем всё
    if (!debounced.trim()) return folders

    const q = debounced.toLowerCase()

    // Фильтруем серверы внутри каждой папки
    return folders.map(f => ({
      ...f,  // копируем папку
      servers: f.servers.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.ip.includes(q) ||
        s.provider.toLowerCase().includes(q)
      )
    })).filter(f => f.servers.length > 0)  // убираем пустые папки
  }, [folders, debounced])
}
```

### Что такое debounce?

**Debounce** — задержка выполнения, пока пользователь не прекратит ввод.

Без debounce: поиск запускается на каждую букву (`п`, `пр`, `про`, `прод`...)
С debounce: поиск запускается через 300мс после последнего ввода

### Использование:

```tsx
function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const filteredFolders = useSearch(folders, searchQuery)

  return (
    <div>
      <input
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        placeholder="Поиск..."
      />
      {filteredFolders.map(folder => (
        <FolderSection key={folder.id} folder={folder} />
      ))}
    </div>
  )
}
```

---

# 7. TypeScript в React

## Зачем TypeScript?

1. **Ловит ошибки до запуска** — опечатки, неправильные типы
2. **Автодополнение** — IDE знает какие поля и методы есть
3. **Документация** — типы показывают что ожидает функция/компонент

## Базовые типы

```tsx
// Примитивы
let name: string = 'Вася'
let age: number = 25
let isAdmin: boolean = true

// Массивы
let ids: number[] = [1, 2, 3]
let names: Array<string> = ['a', 'b']  // альтернативный синтаксис

// Объекты через interface
interface User {
  id: number
  name: string
  email?: string  // ? = необязательное поле
}

// Union типы (или)
let status: 'online' | 'offline' | 'unknown'
let value: string | number  // строка или число
```

## Типы для React

### Props компонента

```tsx
interface ButtonProps {
  label: string
  onClick: () => void           // функция без аргументов и возврата
  disabled?: boolean            // необязательный
  variant?: 'primary' | 'danger'  // только эти значения
}

function Button({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  )
}
```

### События

```tsx
// Клик
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  console.log(e.target)
}

// Изменение input
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  console.log(e.target.value)
}

// Отправка формы
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()
}
```

### Children

```tsx
interface CardProps {
  children: React.ReactNode  // любой валидный JSX
}

// Или более строго
interface CardProps {
  children: React.ReactElement  // только один JSX элемент
}
```

## Generic (обобщённые типы)

Generic позволяет создавать переиспользуемые типы:

```tsx
// Функция, которая работает с любым типом
function first<T>(arr: T[]): T | undefined {
  return arr[0]
}

first([1, 2, 3])      // вернёт number
first(['a', 'b'])     // вернёт string

// useState с generic
const [user, setUser] = useState<User | null>(null)
```

## Utility Types

TypeScript предоставляет полезные типы-утилиты:

```tsx
interface User {
  id: number
  name: string
  email: string
}

// Partial — все поля становятся необязательными
type PartialUser = Partial<User>
// { id?: number; name?: string; email?: string }

// Pick — выбрать только некоторые поля
type UserName = Pick<User, 'name'>
// { name: string }

// Omit — исключить поля
type UserWithoutId = Omit<User, 'id'>
// { name: string; email: string }

// Record — словарь
type UsersById = Record<number, User>
// { [key: number]: User }
```

---

# 8. Практика: разбор задач проекта

## Задача 1: Модальное окно

Разберём компонент Modal построчно:

```tsx
// components/Modal.tsx

// Описываем что компонент принимает
interface ModalProps {
  isOpen: boolean              // открыта ли модалка
  onClose: () => void          // функция закрытия
  children: React.ReactNode    // содержимое модалки
}

export function Modal({ isOpen, onClose, children }: ModalProps) {
  // Ранний возврат: если модалка закрыта — не рендерим ничего
  if (!isOpen) return null

  return (
    // Оверлей (затемнение фона)
    // onClick={onClose} — клик по оверлею закрывает модалку
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      {/* Само окно модалки */}
      {/* onClick={e => e.stopPropagation()} — клик по окну НЕ закрывает */}
      <div
        className="bg-dark-800 rounded-xl p-6 max-w-lg w-full mx-4 border border-dark-500"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
```

### Разбор CSS классов (Tailwind):

```
fixed inset-0    → position: fixed; top/right/bottom/left: 0 (на весь экран)
bg-black/70      → чёрный фон с 70% прозрачности
flex items-center justify-center → центрируем содержимое
z-50             → z-index: 50 (поверх всего)
```

### Как использовать в App.tsx:

```tsx
function App() {
  // Состояние для выбранного сервера
  const [selectedServer, setSelectedServer] = useState<Server | null>(null)

  return (
    <div>
      {/* Список серверов */}
      {servers.map(server => (
        <ServerCard
          key={server.id}
          server={server}
          onClick={() => setSelectedServer(server)}  // открыть модалку
        />
      ))}

      {/* Модалка */}
      <Modal
        isOpen={selectedServer !== null}  // открыта если сервер выбран
        onClose={() => setSelectedServer(null)}  // закрыть = убрать выбор
      >
        {selectedServer && (
          <div>
            <h2>{selectedServer.name}</h2>
            <p>IP: {selectedServer.ip}</p>
            <p>Провайдер: {selectedServer.provider}</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
```

### Паттерн: Модалка через состояние

```tsx
// null = закрыта, объект = открыта с данными
const [selected, setSelected] = useState<Item | null>(null)

// Открыть
onClick={() => setSelected(item)}

// Закрыть
onClose={() => setSelected(null)}

// Проверка
isOpen={selected !== null}
```

---

## Задача 2: Поле поиска

Добавляем поиск в Header:

```tsx
// components/Header.tsx
interface HeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function Header({ searchQuery, onSearchChange }: HeaderProps) {
  return (
    <header className="bg-dark-800 border-b border-dark-500 p-4">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold">VPS Manager</h1>

        {/* Поле поиска */}
        <input
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Поиск серверов..."
          className="bg-dark-700 border border-dark-500 rounded-lg px-4 py-2
                     focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </header>
  )
}
```

### Подключение в App.tsx с хуком поиска:

```tsx
import { useState } from 'react'
import { useSearch } from './hooks/useSearch'
import { mockFolders } from './data/mockData'

function App() {
  const [searchQuery, setSearchQuery] = useState('')

  // Хук возвращает отфильтрованные папки
  const filteredFolders = useSearch(mockFolders, searchQuery)

  return (
    <div>
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main>
        {filteredFolders.map(folder => (
          <FolderSection key={folder.id} folder={folder} />
        ))}

        {/* Показать если ничего не найдено */}
        {filteredFolders.length === 0 && searchQuery && (
          <p className="text-gray-400 text-center py-8">
            Ничего не найдено по запросу "{searchQuery}"
          </p>
        )}
      </main>
    </div>
  )
}
```

---

## Шпаргалка: частые паттерны

### Условный рендеринг

```tsx
// Показать если true
{isLoading && <Spinner />}

// Один или другой
{isError ? <Error /> : <Content />}

// Несколько условий
{status === 'loading' && <Spinner />}
{status === 'error' && <Error />}
{status === 'success' && <Content />}
```

### Список с обработчиком

```tsx
{items.map(item => (
  <div key={item.id} onClick={() => handleClick(item)}>
    {item.name}
  </div>
))}
```

### Форма

```tsx
const [formData, setFormData] = useState({ name: '', email: '' })

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target
  setFormData(prev => ({ ...prev, [name]: value }))
}

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  console.log(formData)
}

return (
  <form onSubmit={handleSubmit}>
    <input name="name" value={formData.name} onChange={handleChange} />
    <input name="email" value={formData.email} onChange={handleChange} />
    <button type="submit">Отправить</button>
  </form>
)
```

### Загрузка данных

```tsx
const [data, setData] = useState<Data | null>(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

useEffect(() => {
  fetchData()
    .then(setData)
    .catch(e => setError(e.message))
    .finally(() => setLoading(false))
}, [])

if (loading) return <Spinner />
if (error) return <Error message={error} />
if (!data) return null
return <Content data={data} />
```

---

# Упражнения для закрепления

## Уровень 1: Повторение

1. Создай компонент `StatusBadge`, который принимает `status: 'online' | 'offline' | 'unknown'` и показывает цветной бейдж
2. Добавь в `Modal` кнопку закрытия (крестик в углу)

## Уровень 2: Практика хуков

3. Добавь в `useSearch` возможность поиска по нескольким полям (название, IP, теги)
4. Создай хук `useDebounce<T>(value: T, delay: number): T` — универсальный debounce

## Уровень 3: Интеграция

5. Реализуй добавление нового сервера через форму в модалке
6. Добавь сортировку серверов (по имени, по статусу, по цене)

---

Удачи в поезде! Если что-то непонятно — перечитай соответствующий раздел.
