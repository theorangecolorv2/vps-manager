# VPS Manager — Практические задачи

> Задачи отсортированы по сложности. Каждая задача нужна проекту.
> Теорию смотри в `REACT_TUTORIAL.md`

---

## Структура проекта

```
vps-manager/frontend/src/
├── components/
│   ├── Header.tsx        ← хедер со статистикой
│   ├── FolderSection.tsx ← секция папки (сворачивается)
│   ├── ServerCard.tsx    ← карточка сервера
│   └── StatusBadge.tsx   ← бейдж online/offline
├── types/
│   └── index.ts          ← типы Server, Folder
├── data/
│   └── mockData.ts       ← тестовые данные
└── App.tsx               ← главный компонент
```

---

# УРОВЕНЬ 1: Разминка (Props, JSX)

> Цель: вспомнить синтаксис, props, условный рендеринг

---

## Задача 1.1: Иконка копирования IP

**Что сделать:** В `ServerCard.tsx` добавить кнопку копирования IP-адреса.

**Зачем проекту:** Удобно копировать IP в буфер обмена.

**Файл:** `components/ServerCard.tsx`

**Шаги:**
1. Найди строку где выводится `{server.ip}`
2. Рядом добавь кнопку с иконкой (используй символ 📋 или текст "Copy")
3. Кнопка пока ничего не делает — это нормально

**Код для вставки:**
```tsx
<div className="font-mono text-sm text-gray-400 mb-3 pb-3 border-dark-500 flex items-center justify-between">
  <span>{server.ip}</span>
  <button className="text-gray-500 hover:text-white transition-colors ml-2">
    📋
  </button>
</div>
```

**Проверь себя:**
- [ ] Иконка появилась рядом с каждым IP
- [ ] При наведении иконка становится белой

---

## Задача 1.2: Показать количество серверов в папке

**Что сделать:** В `FolderSection.tsx` показать сколько серверов в папке.

**Зачем проекту:** Видеть количество серверов без разворачивания.

**Файл:** `components/FolderSection.tsx`

**Подсказка:** У `folder` есть поле `servers` — это массив. Используй `.length`

**Примерный результат:**
```
▼ Production (3)
```

**Код:**
```tsx
// Где-то рядом с названием папки добавь:
<span className="text-gray-500 text-sm ml-2">
  ({folder.servers.length})
</span>
```

**Проверь себя:**
- [ ] У каждой папки показано число серверов
- [ ] Production (3), Development (2), Clients (4)

---

## Задача 1.3: Бейдж "дорогой сервер"

**Что сделать:** Если сервер стоит больше 20 EUR/USD — показать бейдж "Premium".

**Зачем проекту:** Быстро видеть дорогие серверы.

**Файл:** `components/ServerCard.tsx`

**Подсказка:** Используй условный рендеринг `{условие && <элемент />}`

**Код:**
```tsx
// Добавь рядом с StatusBadge:
{server.price > 20 && (
  <span className="bg-yellow-500/20 text-yellow-500 text-xs px-2 py-0.5 rounded-full">
    Premium
  </span>
)}
```

**Проверь себя:**
- [ ] Бейдж появился у Database Master (29.99) и Client C (24)
- [ ] У дешёвых серверов бейджа нет

---

## Задача 1.4: Отдельный компонент InfoRow

**Что сделать:** В `ServerCard` есть повторяющийся код для строк Provider/Price/Payment. Вынеси в отдельный компонент.

**Зачем проекту:** Убрать дублирование кода, легче поддерживать.

**Создай файл:** `components/InfoRow.tsx`

```tsx
interface InfoRowProps {
  label: string
  value: string
}

export function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wide">
        {label}
      </div>
      <div className="text-sm text-gray-300">{value}</div>
    </div>
  )
}
```

**Потом в ServerCard:**
```tsx
import { InfoRow } from './InfoRow'

// Замени повторяющийся код на:
<InfoRow label="Provider" value={server.provider} />
<InfoRow label="Price" value={server.price > 0 ? `${server.price} ${server.currency}` : 'Free'} />
```

**Проверь себя:**
- [ ] Визуально ничего не изменилось
- [ ] Код стал короче и чище

---

# УРОВЕНЬ 2: Состояние (useState)

> Цель: научиться работать с состоянием компонента

---

## Задача 2.1: Копирование IP в буфер

**Что сделать:** Сделать кнопку копирования из задачи 1.1 рабочей.

**Зачем проекту:** Реальный функционал копирования.

**Файл:** `components/ServerCard.tsx`

**Шаги:**
1. Добавь состояние для показа "Скопировано!"
2. По клику копируй IP и показывай уведомление
3. Через 2 секунды скрывай уведомление

**Код:**
```tsx
import { useState } from 'react'

export function ServerCard({ server }: ServerCardProps) {
  const [copied, setCopied] = useState(false)

  const copyIP = () => {
    navigator.clipboard.writeText(server.ip)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    // ... остальной код
    <button onClick={copyIP} className="...">
      {copied ? '✓' : '📋'}
    </button>
  )
}
```

**Проверь себя:**
- [ ] Клик по иконке копирует IP
- [ ] Иконка меняется на галочку
- [ ] Через 2 сек возвращается обратно

---

## Задача 2.2: Кнопка "Развернуть/Свернуть все"

**Что сделать:** В Header добавить кнопку, которая разворачивает или сворачивает все папки.

**Зачем проекту:** Быстро посмотреть все серверы или всё свернуть.

**Файлы:** `App.tsx`, `components/Header.tsx`

**Шаги:**

1. В `App.tsx` добавь функции:
```tsx
const expandAll = () => {
  setExpandedFolders(new Set(mockData.map(f => f.id)))
}

const collapseAll = () => {
  setExpandedFolders(new Set())
}

const allExpanded = expandedFolders.size === mockData.length
```

2. Передай в Header:
```tsx
<Header
  folders={mockData}
  allExpanded={allExpanded}
  onExpandAll={expandAll}
  onCollapseAll={collapseAll}
/>
```

3. В `Header.tsx` добавь props и кнопку:
```tsx
interface HeaderProps {
  folders: Folder[]
  allExpanded: boolean
  onExpandAll: () => void
  onCollapseAll: () => void
}

// В JSX добавь кнопку:
<button
  onClick={allExpanded ? onCollapseAll : onExpandAll}
  className="text-gray-400 hover:text-white transition-colors"
>
  {allExpanded ? '▼ Collapse All' : '▶ Expand All'}
</button>
```

**Проверь себя:**
- [ ] Кнопка показывает "Expand All" когда что-то свёрнуто
- [ ] Кнопка показывает "Collapse All" когда всё развёрнуто
- [ ] Клик работает правильно

---

## Задача 2.3: Фильтр по статусу

**Что сделать:** Добавить кнопки фильтрации: All / Online / Offline.

**Зачем проекту:** Быстро найти проблемные (offline) серверы.

**Файл:** `App.tsx`

**Шаги:**

1. Добавь состояние:
```tsx
type StatusFilter = 'all' | 'online' | 'offline'
const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
```

2. Отфильтруй данные:
```tsx
const filteredData = mockData.map(folder => ({
  ...folder,
  servers: folder.servers.filter(server => {
    if (statusFilter === 'all') return true
    return server.status === statusFilter
  })
})).filter(folder => folder.servers.length > 0)
```

3. Добавь кнопки над списком:
```tsx
<div className="flex gap-2 mb-4">
  {(['all', 'online', 'offline'] as const).map(status => (
    <button
      key={status}
      onClick={() => setStatusFilter(status)}
      className={`px-3 py-1 rounded-lg capitalize ${
        statusFilter === status
          ? 'bg-indigo-500 text-white'
          : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
      }`}
    >
      {status}
    </button>
  ))}
</div>
```

4. Используй `filteredData` вместо `mockData` в map

**Проверь себя:**
- [ ] По умолчанию показаны все серверы
- [ ] Клик на "Online" показывает только online
- [ ] Клик на "Offline" показывает CDN Edge 1
- [ ] Активная кнопка подсвечена

---

## Задача 2.4: Выбор сервера (подготовка к модалке)

**Что сделать:** При клике на карточку сервера — сохранять его в состояние.

**Зачем проекту:** Основа для модального окна с деталями.

**Файлы:** `App.tsx`, `components/ServerCard.tsx`, `components/FolderSection.tsx`

**Шаги:**

1. В `App.tsx`:
```tsx
import type { Server } from './types'

const [selectedServer, setSelectedServer] = useState<Server | null>(null)
```

2. Передай через FolderSection в ServerCard:
```tsx
// App.tsx
<FolderSection
  ...
  onServerClick={setSelectedServer}
/>

// FolderSection.tsx — добавь в props и передай дальше
onServerClick: (server: Server) => void

// ServerCard.tsx — добавь в props
onClick?: () => void

// И в корневой div:
<div onClick={onClick} className="... cursor-pointer">
```

3. Временно покажи выбранный сервер:
```tsx
{selectedServer && (
  <div className="fixed bottom-4 right-4 bg-dark-700 p-4 rounded-lg">
    Выбран: {selectedServer.name}
    <button onClick={() => setSelectedServer(null)}>✕</button>
  </div>
)}
```

**Проверь себя:**
- [ ] Клик по карточке показывает имя сервера внизу
- [ ] Клик по ✕ закрывает
- [ ] Можно выбрать другой сервер

---

# УРОВЕНЬ 3: Хуки (useEffect, custom hooks)

> Цель: освоить эффекты и создание своих хуков

---

## Задача 3.1: Поиск серверов

**Что сделать:** Добавить поле поиска в Header.

**Зачем проекту:** Быстро найти сервер по имени/IP.

**Создай файл:** `hooks/useSearch.ts`

```tsx
import { useState, useEffect, useMemo } from 'react'
import type { Folder } from '../types'

export function useSearch(folders: Folder[], query: string) {
  const [debounced, setDebounced] = useState(query)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  return useMemo(() => {
    if (!debounced.trim()) return folders

    const q = debounced.toLowerCase()
    return folders
      .map(f => ({
        ...f,
        servers: f.servers.filter(s =>
          s.name.toLowerCase().includes(q) ||
          s.ip.includes(q) ||
          s.provider.toLowerCase().includes(q)
        )
      }))
      .filter(f => f.servers.length > 0)
  }, [folders, debounced])
}
```

**В App.tsx:**
```tsx
import { useSearch } from './hooks/useSearch'

const [searchQuery, setSearchQuery] = useState('')
const searchedData = useSearch(mockData, searchQuery)
// Используй searchedData вместо mockData
```

**В Header добавь input:**
```tsx
<input
  type="text"
  value={searchQuery}
  onChange={e => onSearchChange(e.target.value)}
  placeholder="Search servers..."
  className="bg-dark-700 border border-dark-500 rounded-lg px-4 py-2 w-64
             focus:outline-none focus:border-indigo-500 transition-colors"
/>
```

**Проверь себя:**
- [ ] Поиск по "hetzner" показывает 4 сервера
- [ ] Поиск по "185" показывает 2 сервера
- [ ] Поиск с задержкой (не на каждую букву)

---

## Задача 3.2: Сохранение состояния папок в localStorage

**Что сделать:** Запоминать какие папки развёрнуты после перезагрузки.

**Зачем проекту:** Сохранять UI состояние пользователя.

**Создай файл:** `hooks/useLocalStorage.ts`

```tsx
import { useState, useEffect } from 'react'

export function useLocalStorage<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}
```

**В App.tsx:**
```tsx
import { useLocalStorage } from './hooks/useLocalStorage'

// Проблема: Set нельзя напрямую в JSON
// Решение: храним массив, конвертируем в Set

const [expandedIds, setExpandedIds] = useLocalStorage<string[]>(
  'vps-expanded-folders',
  mockData.map(f => f.id)
)

const expandedFolders = new Set(expandedIds)

const toggleFolder = (folderId: string) => {
  if (expandedFolders.has(folderId)) {
    setExpandedIds(expandedIds.filter(id => id !== folderId))
  } else {
    setExpandedIds([...expandedIds, folderId])
  }
}
```

**Проверь себя:**
- [ ] Сверни папку, перезагрузи — осталась свёрнутой
- [ ] В DevTools → Application → localStorage видны данные

---

## Задача 3.3: Хук для статистики

**Что сделать:** Вынести расчёт статистики из Header в отдельный хук.

**Зачем проекту:** Переиспользовать статистику в других местах.

**Создай файл:** `hooks/useStats.ts`

```tsx
import { useMemo } from 'react'
import type { Folder } from '../types'

interface Stats {
  totalServers: number
  onlineServers: number
  offlineServers: number
  totalCost: number
  averagePing: number | null
}

export function useStats(folders: Folder[]): Stats {
  return useMemo(() => {
    const allServers = folders.flatMap(f => f.servers)

    const totalServers = allServers.length
    const onlineServers = allServers.filter(s => s.status === 'online').length
    const offlineServers = allServers.filter(s => s.status === 'offline').length
    const totalCost = allServers.reduce((sum, s) => sum + s.price, 0)

    const pings = allServers
      .map(s => s.lastPing)
      .filter((p): p is number => p !== undefined)

    const averagePing = pings.length > 0
      ? Math.round(pings.reduce((a, b) => a + b, 0) / pings.length)
      : null

    return { totalServers, onlineServers, offlineServers, totalCost, averagePing }
  }, [folders])
}
```

**Проверь себя:**
- [ ] Header использует хук вместо расчётов внутри
- [ ] Можно добавить новую статистику (averagePing, offlineServers)

---

# УРОВЕНЬ 4: Модальные окна и формы

> Цель: создать интерактивный UI

---

## Задача 4.1: Модальное окно

**Что сделать:** Создать переиспользуемый компонент Modal.

**Файл:** `components/Modal.tsx`

```tsx
import { useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden' // Блокируем скролл
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-dark-800 rounded-xl w-full max-w-lg border border-dark-500
                   animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className="flex justify-between items-center p-4 border-b border-dark-500">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  )
}
```

**Проверь себя:**
- [ ] Модалка открывается по клику на сервер
- [ ] Закрывается по клику на фон
- [ ] Закрывается по Escape
- [ ] Скролл страницы заблокирован когда открыта

---

## Задача 4.2: Модалка деталей сервера

**Что сделать:** Показать полную информацию о сервере в модалке.

**Создай файл:** `components/ServerModal.tsx`

```tsx
import type { Server } from '../types'
import { Modal } from './Modal'
import { StatusBadge } from './StatusBadge'

interface ServerModalProps {
  server: Server | null
  onClose: () => void
}

export function ServerModal({ server, onClose }: ServerModalProps) {
  if (!server) return null

  return (
    <Modal isOpen={!!server} onClose={onClose} title={server.name}>
      <div className="space-y-4">
        {/* Статус и IP */}
        <div className="flex items-center justify-between">
          <code className="bg-dark-700 px-3 py-1 rounded font-mono">
            {server.ip}
          </code>
          <StatusBadge status={server.status} />
        </div>

        {/* Детали */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-gray-500 text-sm">Provider</div>
            <div>{server.provider}</div>
          </div>
          <div>
            <div className="text-gray-500 text-sm">Price</div>
            <div>{server.price} {server.currency}/month</div>
          </div>
          <div>
            <div className="text-gray-500 text-sm">Payment Day</div>
            <div>{server.paymentDate}th of month</div>
          </div>
          {server.lastPing && (
            <div>
              <div className="text-gray-500 text-sm">Last Ping</div>
              <div>{server.lastPing}ms</div>
            </div>
          )}
        </div>

        {/* Действия */}
        <div className="flex gap-2 pt-4 border-t border-dark-500">
          <button className="flex-1 bg-indigo-500 hover:bg-indigo-400 py-2 rounded-lg transition-colors">
            SSH Connect
          </button>
          <button className="flex-1 bg-dark-600 hover:bg-dark-500 py-2 rounded-lg transition-colors">
            Edit
          </button>
          <button className="bg-red-500/20 text-red-500 hover:bg-red-500/30 px-4 py-2 rounded-lg transition-colors">
            Delete
          </button>
        </div>
      </div>
    </Modal>
  )
}
```

**В App.tsx:**
```tsx
import { ServerModal } from './components/ServerModal'

// В JSX:
<ServerModal
  server={selectedServer}
  onClose={() => setSelectedServer(null)}
/>
```

**Проверь себя:**
- [ ] Клик по карточке открывает модалку
- [ ] Вся информация о сервере показана
- [ ] Кнопки пока не работают — это нормально

---

## Задача 4.3: Форма добавления сервера

**Что сделать:** Модалка с формой для нового сервера по клику на "Add Server".

**Создай файл:** `components/AddServerModal.tsx`

```tsx
import { useState } from 'react'
import type { Folder } from '../types'
import { Modal } from './Modal'

interface AddServerModalProps {
  isOpen: boolean
  onClose: () => void
  folders: Folder[]
  onAdd: (server: NewServer) => void
}

interface NewServer {
  name: string
  ip: string
  provider: string
  price: number
  currency: string
  paymentDate: string
  folderId: string
}

export function AddServerModal({ isOpen, onClose, folders, onAdd }: AddServerModalProps) {
  const [formData, setFormData] = useState<NewServer>({
    name: '',
    ip: '',
    provider: '',
    price: 0,
    currency: 'EUR',
    paymentDate: '1',
    folderId: folders[0]?.id || ''
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd(formData)
    onClose()
    // Сбросить форму
    setFormData({
      name: '',
      ip: '',
      provider: '',
      price: 0,
      currency: 'EUR',
      paymentDate: '1',
      folderId: folders[0]?.id || ''
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Server">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Server Name</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2
                       focus:outline-none focus:border-indigo-500"
            placeholder="My Server"
          />
        </div>

        {/* IP */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">IP Address</label>
          <input
            name="ip"
            value={formData.ip}
            onChange={handleChange}
            required
            pattern="^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$"
            className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2
                       focus:outline-none focus:border-indigo-500 font-mono"
            placeholder="192.168.1.1"
          />
        </div>

        {/* Provider */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Provider</label>
          <input
            name="provider"
            value={formData.provider}
            onChange={handleChange}
            className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2
                       focus:outline-none focus:border-indigo-500"
            placeholder="Hetzner, DigitalOcean, etc."
          />
        </div>

        {/* Price + Currency */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Price</label>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={handleChange}
              className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2
                         focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Currency</label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2
                         focus:outline-none focus:border-indigo-500"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="RUB">RUB</option>
            </select>
          </div>
        </div>

        {/* Folder */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Folder</label>
          <select
            name="folderId"
            value={formData.folderId}
            onChange={handleChange}
            className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2
                       focus:outline-none focus:border-indigo-500"
          >
            {folders.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-indigo-500 hover:bg-indigo-400 py-2.5 rounded-lg
                     font-semibold transition-colors"
        >
          Add Server
        </button>
      </form>
    </Modal>
  )
}
```

**Проверь себя:**
- [ ] Форма открывается по клику на "Add Server"
- [ ] Все поля работают
- [ ] При сабмите данные передаются в onAdd

---

## Задача 4.4: Добавление сервера в данные

**Что сделать:** Обработать onAdd и добавить сервер в mockData (в состоянии).

**Файл:** `App.tsx`

**Подсказка:** mockData нужно скопировать в useState, чтобы можно было изменять.

```tsx
const [folders, setFolders] = useState<Folder[]>(mockData)

const handleAddServer = (newServer: NewServer) => {
  const server: Server = {
    id: Date.now().toString(), // Простой уникальный ID
    name: newServer.name,
    ip: newServer.ip,
    provider: newServer.provider || 'Unknown',
    price: newServer.price,
    currency: newServer.currency,
    paymentDate: newServer.paymentDate,
    status: 'unknown'
  }

  setFolders(prev => prev.map(folder =>
    folder.id === newServer.folderId
      ? { ...folder, servers: [...folder.servers, server] }
      : folder
  ))
}
```

**Проверь себя:**
- [ ] Новый сервер появляется в выбранной папке
- [ ] Статистика в Header обновляется
- [ ] Данные теряются при перезагрузке (пока нет бэкенда — это ок)

---

# СПРАВОЧНИК

## React хуки

```tsx
// useState — состояние
const [value, setValue] = useState<string>('')
const [user, setUser] = useState<User | null>(null)

// useEffect — побочные эффекты
useEffect(() => {
  // при монтировании
  return () => { /* при размонтировании */ }
}, [])

useEffect(() => { /* при изменении deps */ }, [dep1, dep2])

// useMemo — кэш значения
const filtered = useMemo(() => items.filter(x => x.active), [items])

// useCallback — кэш функции
const onClick = useCallback(() => doSomething(), [])
```

---

## TypeScript

```tsx
// Типы
type Status = 'online' | 'offline'
interface User { id: number; name: string; email?: string }

// Generic
function first<T>(arr: T[]): T | undefined { return arr[0] }

// React props
interface Props { onClick: () => void; children: React.ReactNode }

// Events
(e: React.ChangeEvent<HTMLInputElement>) => e.target.value
(e: React.FormEvent) => e.preventDefault()

// Utility types
Partial<User>        // все поля optional
Pick<User, 'id'>     // только id
Omit<User, 'id'>     // всё кроме id
Record<string, User> // словарь
```

---

## Tailwind шпаргалка

```
# Flex/Grid
flex flex-col items-center justify-between gap-4
grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4

# Размеры
w-full w-64 max-w-lg h-10 min-h-screen

# Отступы
p-4 px-6 py-2 m-4 mx-auto mt-4 space-y-4

# Текст
text-sm text-lg font-semibold text-gray-400 text-center

# Цвета
bg-dark-700 bg-indigo-500 bg-red-500/20 border-dark-500

# Скругление
rounded rounded-lg rounded-xl rounded-full

# Hover/Focus
hover:bg-dark-600 focus:outline-none focus:ring-2

# Позиция
relative absolute fixed inset-0 z-50
```

---

# Чеклист прогресса

- [ ] 1.1 Иконка копирования
- [ ] 1.2 Количество серверов в папке
- [ ] 1.3 Бейдж "Premium"
- [ ] 1.4 Компонент InfoRow
- [ ] 2.1 Копирование IP работает
- [ ] 2.2 Развернуть/Свернуть все
- [ ] 2.3 Фильтр по статусу
- [ ] 2.4 Выбор сервера
- [ ] 3.1 Поиск серверов
- [ ] 3.2 localStorage для папок
- [ ] 3.3 Хук useStats
- [ ] 4.1 Компонент Modal
- [ ] 4.2 Модалка деталей сервера
- [ ] 4.3 Форма добавления
- [ ] 4.4 Добавление работает
