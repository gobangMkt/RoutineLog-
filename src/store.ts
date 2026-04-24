import { useState, useEffect, useRef } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { v4 as uuidv4 } from 'uuid'
import type { ParentTodo, SubTodo, MemoItem, Template, UserSettings } from './types'

const DEFAULT_SETTINGS: UserSettings = { completionMode: 'keep', enableSubTodo: true, viewMode: 'default' }
const today = () => new Date().toISOString().slice(0, 10)

async function loadAll(phone: string) {
  const keys = ['parents', 'subs', 'memos', 'templates', 'settings', 'meta'] as const
  const snaps = await Promise.all(keys.map(k => getDoc(doc(db, 'users', phone, 'data', k))))
  const [p, s, m, t, cfg, meta] = snaps
  return {
    parents:   (p.exists()   ? p.data()?.items   : [])  ?? [] as ParentTodo[],
    subs:      (s.exists()   ? s.data()?.items   : [])  ?? [] as SubTodo[],
    memos:     (m.exists()   ? m.data()?.items   : [])  ?? [] as MemoItem[],
    templates: (t.exists()   ? t.data()?.items   : [])  ?? [] as Template[],
    settings:  cfg.exists()  ? { ...DEFAULT_SETTINGS, ...cfg.data() } : DEFAULT_SETTINGS,
    tagList:   (meta.exists() ? meta.data()?.tagList   : [])  ?? [] as string[],
    tagColors: (meta.exists() ? meta.data()?.tagColors : {})  ?? {} as Record<string, string>,
  }
}

function useSave<T>(phone: string, key: string, value: T, ready: boolean, asItems = true) {
  const timer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    if (!ready) return
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setDoc(doc(db, 'users', phone, 'data', key), asItems ? { items: value } : (value as object))
    }, 800)
    return () => clearTimeout(timer.current)
  }, [value, ready])
}

export function useStore(uid: string) {
  const phone = uid
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(false)
  const [parents, setParents]       = useState<ParentTodo[]>([])
  const [subs, setSubs]             = useState<SubTodo[]>([])
  const [memos, setMemos]           = useState<MemoItem[]>([])
  const [templates, setTemplates]   = useState<Template[]>([])
  const [tagList, setTagList]       = useState<string[]>([])
  const [tagColors, setTagColorsState] = useState<Record<string, string>>({})
  const [settings, setSettings]     = useState<UserSettings>(DEFAULT_SETTINGS)
  const [currentDate, setCurrentDate] = useState<string>(today)

  // Load from Firestore on mount
  useEffect(() => {
    setLoading(true)
    loadAll(phone).then(data => {
      setParents(data.parents)
      setSubs(data.subs)
      setMemos(data.memos)
      setTemplates(data.templates)
      setSettings(data.settings)
      setTagList(data.tagList)
      setTagColorsState(data.tagColors)
      setLoading(false)
      setReady(true)
    })
  }, [phone])

  // Save to Firestore (debounced 800ms after change)
  useSave(phone, 'parents',   parents,   ready)
  useSave(phone, 'subs',      subs,      ready)
  useSave(phone, 'memos',     memos,     ready)
  useSave(phone, 'templates', templates, ready)
  useSave(phone, 'settings',  settings,  ready, false)

  // Save meta (tagList + tagColors) together
  const metaRef = useRef({ tagList, tagColors })
  useEffect(() => { metaRef.current = { tagList, tagColors } }, [tagList, tagColors])
  const metaTimer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    if (!ready) return
    clearTimeout(metaTimer.current)
    metaTimer.current = setTimeout(() => {
      setDoc(doc(db, 'users', phone, 'data', 'meta'), metaRef.current)
    }, 800)
    return () => clearTimeout(metaTimer.current)
  }, [tagList, tagColors, ready])

  // --- Parent ---
  const addParent = (title: string, opts?: { startTime?: string; endTime?: string; description?: string; tag?: string }) => {
    const id = uuidv4()
    setParents(p => [...p, {
      id, date: currentDate, title,
      startTime: opts?.startTime, endTime: opts?.endTime,
      description: opts?.description, tag: opts?.tag,
      status: 'todo', sortOrder: Date.now(),
    }])
    return id
  }

  const updateParent = (id: string, patch: Partial<ParentTodo>) =>
    setParents(p => p.map(x => x.id === id ? { ...x, ...patch } : x))

  const deleteParent = (id: string) => {
    setParents(p => p.filter(x => x.id !== id))
    setSubs(s => s.filter(x => x.parentId !== id))
  }

  const toggleParent = (id: string) => {
    const parent = parents.find(p => p.id === id)
    if (!parent) return
    if (parent.status === 'done') { updateParent(id, { status: 'todo', doneAt: undefined }); return }
    if (settings.completionMode === 'delete') deleteParent(id)
    else updateParent(id, { status: 'done', doneAt: new Date().toISOString() })
  }

  // --- Sub ---
  const addSub = (parentId: string, title: string) =>
    setSubs(s => [...s, { id: uuidv4(), parentId, title, status: 'todo', sortOrder: Date.now() }])

  const updateSub = (id: string, patch: Partial<SubTodo>) =>
    setSubs(s => s.map(x => x.id === id ? { ...x, ...patch } : x))

  const deleteSub = (id: string) => setSubs(s => s.filter(x => x.id !== id))

  const toggleSub = (id: string) => {
    const sub = subs.find(s => s.id === id)
    if (!sub) return
    if (sub.status === 'done') { updateSub(id, { status: 'todo', doneAt: undefined }); return }
    if (settings.completionMode === 'delete') deleteSub(id)
    else updateSub(id, { status: 'done', doneAt: new Date().toISOString() })
  }

  // --- Memos ---
  const getMemosForDate = (date: string) =>
    memos.filter(m => m.date === date).sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  const addMemo = (date: string, content: string) => {
    if (!content.trim()) return
    setMemos(m => [...m, { id: uuidv4(), date, content, createdAt: new Date().toISOString() }])
  }

  const updateMemo = (id: string, content: string) =>
    setMemos(m => m.map(x => x.id === id ? { ...x, content } : x))

  const deleteMemo = (id: string) => setMemos(m => m.filter(x => x.id !== id))

  // --- Tags ---
  const addTag = (name: string) => {
    const t = name.trim()
    if (t && !tagList.includes(t)) setTagList(l => [...l, t])
  }

  const deleteTag = (name: string) => {
    setTagList(l => l.filter(x => x !== name))
    setTagColorsState(c => { const n = { ...c }; delete n[name]; return n })
    setParents(p => p.map(x => x.tag === name ? { ...x, tag: undefined } : x))
  }

  const setTagColor = (name: string, colorId: string) =>
    setTagColorsState(c => ({ ...c, [name]: colorId }))

  const renameTag = (oldName: string, newName: string) => {
    const t = newName.trim()
    if (!t || t === oldName || tagList.includes(t)) return
    setTagList(l => l.map(x => x === oldName ? t : x))
    setTagColorsState(c => {
      const n = { ...c }
      if (n[oldName]) { n[t] = n[oldName]; delete n[oldName] }
      return n
    })
    setParents(p => p.map(x => x.tag === oldName ? { ...x, tag: t } : x))
  }

  // --- Templates ---
  const saveTemplate = (name: string, parentIds: string[]) => {
    const tplParents = parents.filter(p => parentIds.includes(p.id)).map(p => ({
      title: p.title, description: p.description,
      startTime: p.startTime, endTime: p.endTime, tag: p.tag,
      subs: subs.filter(s => s.parentId === p.id && s.status === 'todo').map(s => s.title),
    }))
    setTemplates(t => [...t, { id: uuidv4(), name, parents: tplParents, createdAt: new Date().toISOString() }])
  }

  const deleteTemplate = (id: string) => setTemplates(t => t.filter(x => x.id !== id))

  const applyTemplate = (templateId: string, mode: 'merge' | 'overwrite', keepTime: boolean) => {
    const tpl = templates.find(t => t.id === templateId)
    if (!tpl) return
    if (mode === 'overwrite') {
      const removedIds = parents.filter(p => p.date === currentDate).map(p => p.id)
      setParents(p => p.filter(x => x.date !== currentDate))
      setSubs(s => s.filter(x => !removedIds.includes(x.parentId)))
    }
    tpl.parents.forEach(tp => {
      const id = uuidv4()
      setParents(p => [...p, {
        id, date: currentDate, title: tp.title, description: tp.description, tag: tp.tag,
        startTime: keepTime ? tp.startTime : undefined, endTime: keepTime ? tp.endTime : undefined,
        status: 'todo', sortOrder: Date.now() + Math.random(),
      }])
      tp.subs.forEach(sub => setSubs(s => [...s, { id: uuidv4(), parentId: id, title: sub, status: 'todo', sortOrder: Date.now() + Math.random() }]))
    })
  }

  const goToToday = () => setCurrentDate(today())

  const dayParents = parents
    .filter(p => p.date === currentDate)
    .filter(p => settings.completionMode === 'hide' ? p.status !== 'done' : true)
    .sort((a, b) => {
      const vm = settings.viewMode ?? 'default'
      if (vm === 'time') {
        const aT = a.startTime || a.endTime
        const bT = b.startTime || b.endTime
        if (aT && !bT) return -1
        if (!aT && bT) return 1
        if (aT && bT) return aT.localeCompare(bT)
        return a.sortOrder - b.sortOrder
      }
      if (vm === 'tag') {
        const aTag = a.tag ?? '\uFFFF'
        const bTag = b.tag ?? '\uFFFF'
        if (aTag !== bTag) return aTag.localeCompare(bTag, 'ko')
        return a.sortOrder - b.sortOrder
      }
      // default: 추가순 (sortOrder)
      return a.sortOrder - b.sortOrder
    })

  const getSubsFor = (parentId: string) =>
    subs.filter(s => s.parentId === parentId)
      .filter(s => settings.completionMode === 'hide' ? s.status !== 'done' : true)
      .sort((a, b) => a.sortOrder - b.sortOrder)

  const markedDates: Record<string, { total: number; done: number }> = {}
  parents.forEach(p => {
    if (!markedDates[p.date]) markedDates[p.date] = { total: 0, done: 0 }
    markedDates[p.date].total++
    if (p.status === 'done') markedDates[p.date].done++
  })
  memos.forEach(m => {
    if (!markedDates[m.date]) markedDates[m.date] = { total: 0, done: 0 }
  })

  return {
    loading,
    currentDate, setCurrentDate, goToToday,
    dayParents, getSubsFor, markedDates, parents,
    addParent, updateParent, deleteParent, toggleParent,
    addSub, updateSub, deleteSub, toggleSub,
    memos, getMemosForDate, addMemo, updateMemo, deleteMemo,
    tagList, tagColors, addTag, deleteTag, setTagColor, renameTag,
    templates, saveTemplate, deleteTemplate, applyTemplate,
    settings, setSettings,
  }
}
