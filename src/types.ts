export interface ParentTodo {
  id: string
  date: string
  title: string
  description?: string
  startTime?: string
  endTime?: string
  tag?: string
  status: 'todo' | 'done'
  doneAt?: string
  sortOrder: number
}

export interface SubTodo {
  id: string
  parentId: string
  title: string
  status: 'todo' | 'done'
  doneAt?: string
  sortOrder: number
}

export interface MemoItem {
  id: string
  date: string
  content: string
  createdAt: string
}

export interface Template {
  id: string
  name: string
  parents: {
    title: string
    description?: string
    startTime?: string
    endTime?: string
    tag?: string
    subs: string[]
  }[]
  createdAt: string
}

export type CompletionMode = 'keep' | 'hide' | 'delete'
export type ViewMode = 'default' | 'time' | 'tag'

export interface UserSettings {
  completionMode: CompletionMode
  enableSubTodo: boolean
  viewMode: ViewMode
}

export function formatTime(startTime?: string, endTime?: string): string | null {
  if (startTime && endTime) return `${startTime}~${endTime}`
  if (startTime) return startTime
  if (endTime) return endTime
  return null
}

// Auto-format "1500" → "15:00" as user types
export function formatTimeInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

export function isValidTime(val: string): boolean {
  if (!val) return true
  const m = val.match(/^(\d{2}):(\d{2})$/)
  if (!m) return false
  return parseInt(m[1]) <= 23 && parseInt(m[2]) <= 59
}
