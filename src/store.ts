import { useState, useEffect, useRef } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { v4 as uuidv4 } from 'uuid'
import type { ParentTodo, SubTodo, MemoItem, Template, UserSettings } from './types'

const DEFAULT_SETTINGS: UserSettings = { completionMode: 'keep', enableSubTodo: true, viewMode: 'default' }
const today = () => new Date().toISOString().slice(0, 10)

async function loadAll(uid: string) {
  const keys = ['parents', 'subs', 'memos', 'templates', 'settings', 'meta'] as const
  const snaps = await Promise.all(keys.map(k => getDoc(doc(db, 'users', uid, 'data', k))))
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

export function useStore(uid: string) {
  const [loading, setLoading] = useState(true)
  const readyRef = useRef(false)

  const [parents, setParents]         = useState<ParentTodo[]>([])
  const [subs, setSubs]               = useState<SubTodo[]>([])
  const [memos, setMemos]             = useState<MemoItem[]>([])
  const [templates, setTemplates]     = useState<Template[]>([])
  const [tagList, setTagList]         = useState<string[]>([])
  const [tagColors, setTagColorsState]= useState<Record<string, string>>({})
  const [settings, setSettingsState]  = useState<UserSettings>(DEFAULT_SETTINGS)
  const [currentDate, setCurrentDate] = useState<string>(today)

  // 초기 로드
  useEffect(() => {
    setLoading(true)
    readyRef.current = false
    loadAll(uid).then(data => {
      setParents(data.parents)
      setSubs(data.subs)
      setMemos(data.memos)
      setTemplates(data.templates)
      setSettingsState(data.settings)
      setTagList(data.tagList)
      setTagColorsState(data.tagColors)
      setLoading(false)
      readyRef.current = true
    })
  }, [uid])

  // 즉시 저장 헬퍼
  const save = (key: string, value: unknown, asItems = true) => {
    if (!readyRef.current) return
    setDoc(
      doc(db, 'users', uid, 'data', key),
      asItems ? { items: value } : (value as object)
    ).catch(console.error)
  }

  const saveMeta = (tl: string[], tc: Record<string, string>) => {
    if (!readyRef.current) return
    setDoc(doc(db, 'users', uid, 'data', 'meta'), { tagList: tl, tagColors: tc }).catch(console.error)
  }

  // --- Parent ---
  const addParent = (title: string, opts?: { startTime?: string; endTime?: string; description?: string; tag?: string }) => {
    const id = uuidv4()
    const newItem: ParentTodo = {
      id, date: currentDate, title,
      startTime: opts?.startTime, endTime: opts?.endTime,
      description: opts?.description, tag: opts?.tag,
      status: 'todo', sortOrder: Date.now(),
    }
    setParents(prev => { const next = [...prev, newItem]; save('parents', next); return next })
    return id
  }

  const updateParent = (id: string, patch: Partial<ParentTodo>) =>
    setParents(prev => { const next = prev.map(x => x.id === id ? { ...x, ...patch } : x); save('parents', next); return next })

  const deleteParent = (id: string) => {
    setParents(prev => { const next = prev.filter(x => x.id !== id); save('parents', next); return next })
    setSubs(prev => { const next = prev.filter(x => x.parentId !== id); save('subs', next); return next })
  }

  const toggleParent = (id: string) => {
    const parent = parents.find(p => p.id === id)
    if (!parent) return
    if (parent.status === 'done') { updateParent(id, { status: 'todo', doneAt: undefined }); return }
    if (settings.completionMode === 'delete') deleteParent(id)
    else updateParent(id, { status: 'done', doneAt: new Date().toISOString() })
  }

  // 드래그 순서 변경 — 한 번의 Firestore 쓰기로 처리
  const reorderParents = (orderedIds: string[]) => {
    setParents(prev => {
      const next = prev.map(p => {
        const idx = orderedIds.indexOf(p.id)
        return idx !== -1 ? { ...p, sortOrder: idx * 1000 } : p
      })
      save('parents', next)
      return next
    })
  }

  // --- Sub ---
  const addSub = (parentId: string, title: string) =>
    setSubs(prev => { const next = [...prev, { id: uuidv4(), parentId, title, status: 'todo' as const, sortOrder: Date.now() }]; save('subs', next); return next })

  const updateSub = (id: string, patch: Partial<SubTodo>) =>
    setSubs(prev => { const next = prev.map(x => x.id === id ? { ...x, ...patch } : x); save('subs', next); return next })

  const deleteSub = (id: string) =>
    setSubs(prev => { const next = prev.filter(x => x.id !== id); save('subs', next); return next })

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
    setMemos(prev => { const next = [...prev, { id: uuidv4(), date, content, createdAt: new Date().toISOString() }]; save('memos', next); return next })
  }

  const updateMemo = (id: string, content: string) =>
    setMemos(prev => { const next = prev.map(x => x.id === id ? { ...x, content } : x); save('memos', next); return next })

  const deleteMemo = (id: string) =>
    setMemos(prev => { const next = prev.filter(x => x.id !== id); save('memos', next); return next })

  // --- Tags ---
  const addTag = (name: string) => {
    const t = name.trim()
    if (!t || tagList.includes(t)) return
    const newTagList = [...tagList, t]
    setTagList(newTagList)
    saveMeta(newTagList, tagColors)
  }

  const deleteTag = (name: string) => {
    const newTagList = tagList.filter(x => x !== name)
    const newTagColors = { ...tagColors }
    delete newTagColors[name]
    setTagList(newTagList)
    setTagColorsState(newTagColors)
    saveMeta(newTagList, newTagColors)
    setParents(prev => { const next = prev.map(x => x.tag === name ? { ...x, tag: undefined } : x); save('parents', next); return next })
  }

  const setTagColor = (name: string, colorId: string) => {
    const newTagColors = { ...tagColors, [name]: colorId }
    setTagColorsState(newTagColors)
    saveMeta(tagList, newTagColors)
  }

  const renameTag = (oldName: string, newName: string) => {
    const t = newName.trim()
    if (!t || t === oldName || tagList.includes(t)) return
    const newTagList = tagList.map(x => x === oldName ? t : x)
    const newTagColors = { ...tagColors }
    if (newTagColors[oldName]) { newTagColors[t] = newTagColors[oldName]; delete newTagColors[oldName] }
    setTagList(newTagList)
    setTagColorsState(newTagColors)
    saveMeta(newTagList, newTagColors)
    setParents(prev => { const next = prev.map(x => x.tag === oldName ? { ...x, tag: t } : x); save('parents', next); return next })
  }

  // --- Settings ---
  const setSettings = (s: UserSettings) => {
    setSettingsState(s)
    save('settings', s, false)
  }

  // --- Templates ---
  const saveTemplate = (name: string, parentIds: string[]) => {
    const tplParents = parents.filter(p => parentIds.includes(p.id)).map(p => ({
      title: p.title, description: p.description,
      startTime: p.startTime, endTime: p.endTime, tag: p.tag,
      subs: subs.filter(s => s.parentId === p.id && s.status === 'todo').map(s => s.title),
    }))
    setTemplates(prev => { const next = [...prev, { id: uuidv4(), name, parents: tplParents, createdAt: new Date().toISOString() }]; save('templates', next); return next })
  }

  const deleteTemplate = (id: string) =>
    setTemplates(prev => { const next = prev.filter(x => x.id !== id); save('templates', next); return next })

  const applyTemplate = (templateId: string, mode: 'merge' | 'overwrite', keepTime: boolean) => {
    const tpl = templates.find(t => t.id === templateId)
    if (!tpl) return

    let newParents = [...parents]
    let newSubs = [...subs]

    if (mode === 'overwrite') {
      const removedIds = newParents.filter(p => p.date === currentDate).map(p => p.id)
      newParents = newParents.filter(p => p.date !== currentDate)
      newSubs = newSubs.filter(s => !removedIds.includes(s.parentId))
    }

    tpl.parents.forEach(tp => {
      const id = uuidv4()
      newParents = [...newParents, {
        id, date: currentDate, title: tp.title, description: tp.description, tag: tp.tag,
        startTime: keepTime ? tp.startTime : undefined, endTime: keepTime ? tp.endTime : undefined,
        status: 'todo', sortOrder: Date.now() + Math.random(),
      }]
      tp.subs.forEach(sub => {
        newSubs = [...newSubs, { id: uuidv4(), parentId: id, title: sub, status: 'todo', sortOrder: Date.now() + Math.random() }]
      })
    })

    setParents(newParents); save('parents', newParents)
    setSubs(newSubs); save('subs', newSubs)
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
    addParent, updateParent, deleteParent, toggleParent, reorderParents,
    addSub, updateSub, deleteSub, toggleSub,
    memos, getMemosForDate, addMemo, updateMemo, deleteMemo,
    tagList, tagColors, addTag, deleteTag, setTagColor, renameTag,
    templates, saveTemplate, deleteTemplate, applyTemplate,
    settings, setSettings,
  }
}
