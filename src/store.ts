import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { ParentTodo, SubTodo, Note, Template, UserSettings, CompletionMode } from './types'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

const today = () => new Date().toISOString().slice(0, 10)

export function useStore() {
  const [parents, setParents] = useState<ParentTodo[]>(() => load('rl_parents', []))
  const [subs, setSubs] = useState<SubTodo[]>(() => load('rl_subs', []))
  const [notes, setNotes] = useState<Note[]>(() => load('rl_notes', []))
  const [templates, setTemplates] = useState<Template[]>(() => load('rl_templates', []))
  const [settings, setSettings] = useState<UserSettings>(() =>
    load('rl_settings', { completionMode: 'keep' as CompletionMode })
  )
  const [currentDate, setCurrentDate] = useState<string>(today())

  useEffect(() => { save('rl_parents', parents) }, [parents])
  useEffect(() => { save('rl_subs', subs) }, [subs])
  useEffect(() => { save('rl_notes', notes) }, [notes])
  useEffect(() => { save('rl_templates', templates) }, [templates])
  useEffect(() => { save('rl_settings', settings) }, [settings])

  // --- Parent ---
  const addParent = (title: string, time?: string) => {
    const newParent: ParentTodo = {
      id: uuidv4(), date: currentDate, title, time,
      status: 'todo', sortOrder: Date.now(),
    }
    setParents(p => [...p, newParent])
    return newParent.id
  }

  const updateParent = (id: string, patch: Partial<ParentTodo>) => {
    setParents(p => p.map(x => x.id === id ? { ...x, ...patch } : x))
  }

  const deleteParent = (id: string) => {
    setParents(p => p.filter(x => x.id !== id))
    setSubs(s => s.filter(x => x.parentId !== id))
  }

  const toggleParent = (id: string) => {
    const parent = parents.find(p => p.id === id)
    if (!parent) return
    if (parent.status === 'done') {
      updateParent(id, { status: 'todo', doneAt: undefined })
      return
    }
    if (settings.completionMode === 'delete') {
      deleteParent(id)
    } else {
      updateParent(id, { status: 'done', doneAt: new Date().toISOString() })
    }
  }

  // --- Sub ---
  const addSub = (parentId: string, title: string) => {
    const newSub: SubTodo = {
      id: uuidv4(), parentId, title,
      status: 'todo', sortOrder: Date.now(),
    }
    setSubs(s => [...s, newSub])
  }

  const updateSub = (id: string, patch: Partial<SubTodo>) => {
    setSubs(s => s.map(x => x.id === id ? { ...x, ...patch } : x))
  }

  const deleteSub = (id: string) => {
    setSubs(s => s.filter(x => x.id !== id))
  }

  const toggleSub = (id: string) => {
    const sub = subs.find(s => s.id === id)
    if (!sub) return
    if (sub.status === 'done') {
      updateSub(id, { status: 'todo', doneAt: undefined })
      return
    }
    if (settings.completionMode === 'delete') {
      deleteSub(id)
    } else {
      updateSub(id, { status: 'done', doneAt: new Date().toISOString() })
    }
  }

  // --- Note ---
  const addNote = (content: string, time?: string) => {
    const newNote: Note = {
      id: uuidv4(), date: currentDate, content, time, sortOrder: Date.now(),
    }
    setNotes(n => [...n, newNote])
  }

  const updateNote = (id: string, patch: Partial<Note>) => {
    setNotes(n => n.map(x => x.id === id ? { ...x, ...patch } : x))
  }

  const deleteNote = (id: string) => {
    setNotes(n => n.filter(x => x.id !== id))
  }

  // --- Template ---
  const saveTemplate = (name: string, parentIds: string[]) => {
    const selectedParents = parents.filter(p => parentIds.includes(p.id))
    const tplParents = selectedParents.map(p => ({
      title: p.title,
      time: p.time,
      subs: subs.filter(s => s.parentId === p.id && s.status === 'todo').map(s => s.title),
    }))
    const tpl: Template = {
      id: uuidv4(), name, parents: tplParents, createdAt: new Date().toISOString(),
    }
    setTemplates(t => [...t, tpl])
  }

  const deleteTemplate = (id: string) => {
    setTemplates(t => t.filter(x => x.id !== id))
  }

  const applyTemplate = (templateId: string, mode: 'merge' | 'overwrite', keepTime: boolean) => {
    const tpl = templates.find(t => t.id === templateId)
    if (!tpl) return
    if (mode === 'overwrite') {
      setParents(p => p.filter(x => x.date !== currentDate))
      setSubs(s => {
        const removedIds = parents.filter(p => p.date === currentDate).map(p => p.id)
        return s.filter(x => !removedIds.includes(x.parentId))
      })
    }
    tpl.parents.forEach(tp => {
      const newParent: ParentTodo = {
        id: uuidv4(), date: currentDate, title: tp.title,
        time: keepTime ? tp.time : undefined,
        status: 'todo', sortOrder: Date.now() + Math.random(),
      }
      setParents(p => [...p, newParent])
      tp.subs.forEach(subTitle => {
        const newSub: SubTodo = {
          id: uuidv4(), parentId: newParent.id, title: subTitle,
          status: 'todo', sortOrder: Date.now() + Math.random(),
        }
        setSubs(s => [...s, newSub])
      })
    })
  }

  // --- Date helpers ---
  const goToPrevDay = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() - 1)
    setCurrentDate(d.toISOString().slice(0, 10))
  }
  const goToNextDay = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + 1)
    setCurrentDate(d.toISOString().slice(0, 10))
  }
  const goToToday = () => setCurrentDate(today())

  // --- Filtered data for current date ---
  const dayParents = parents
    .filter(p => p.date === currentDate)
    .filter(p => settings.completionMode === 'hide' ? p.status !== 'done' : true)
    .sort((a, b) => {
      if (a.time && !b.time) return -1
      if (!a.time && b.time) return 1
      if (a.time && b.time) return a.time.localeCompare(b.time)
      return a.sortOrder - b.sortOrder
    })

  const dayNotes = notes
    .filter(n => n.date === currentDate)
    .sort((a, b) => {
      if (a.time && !b.time) return -1
      if (!a.time && b.time) return 1
      return a.sortOrder - b.sortOrder
    })

  const getSubsFor = (parentId: string) =>
    subs
      .filter(s => s.parentId === parentId)
      .filter(s => settings.completionMode === 'hide' ? s.status !== 'done' : true)
      .sort((a, b) => a.sortOrder - b.sortOrder)

  return {
    currentDate, setCurrentDate, goToPrevDay, goToNextDay, goToToday,
    dayParents, dayNotes, getSubsFor,
    parents, notes,
    addParent, updateParent, deleteParent, toggleParent,
    addSub, updateSub, deleteSub, toggleSub,
    addNote, updateNote, deleteNote,
    templates, saveTemplate, deleteTemplate, applyTemplate,
    settings, setSettings,
  }
}
