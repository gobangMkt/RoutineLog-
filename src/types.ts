export interface ParentTodo {
  id: string
  date: string // YYYY-MM-DD
  title: string
  time?: string // HH:MM
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

export interface Note {
  id: string
  date: string
  content: string
  time?: string
  sortOrder: number
}

export interface TemplateParent {
  title: string
  time?: string
  subs: string[]
}

export interface Template {
  id: string
  name: string
  parents: TemplateParent[]
  createdAt: string
}

export type CompletionMode = 'keep' | 'hide' | 'delete'

export interface UserSettings {
  completionMode: CompletionMode
}
