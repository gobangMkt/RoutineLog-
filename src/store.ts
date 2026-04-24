import { useState, useEffect, useRef } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { v4 as uuidv4 } from 'uuid'
import type { ParentTodo, SubTodo, MemoItem, Template, UserSettings } from './types'

const DEFAULT_SETTINGS: UserSettings = { completionMode: 'keep', enableSubTodo: true, viewMode: 'default' }
const today = () => new Date().toISOString().slice(0, 10)

// Firestore는 undefined 값을 허용하지 않으므로 undefined 필드를 재귀적으로 제거
function stripUndefined<T>(obj: T): T {
  if (Array.isArray(obj)) return obj.map(stripUndefined) as unknown as T
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as object)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, stripUndefined(v)])
    ) as T
  }
  return obj
}

async function loadAll(uid: string) {
  const keys = ['parents', 'subs', 'memos', 'templates', 'settings', 'meta'] as const
  const snaps = await Promise.all(keys.map(k => getDoc(doc(db, 'users', uid, 'data', k))))
  const [p, s, m, t, cfg, meta] = snaps
  return {
    parents:   (p.exists()   ? p.data()?.items : [])  ?? [] as ParentTodo[],
    subs:      (s.exists()   ? s.data()?.items : [])  ?? [] as SubTodo[],
    memos:     (m.exists()   ? m.data()?.items : [])  ?? [] as MemoItem[],
    templates: (t.exists()   ? t.data()?.items : [])  ?? [] as Template[],
    settings:  cfg.exists()  ? { ...DEFAULT_SETTINGS, ...cfg.data() } : DEFAULT_SETTINGS,
    tagList:   (meta.exists() ? meta.data()?.tagList   : []) ?? [] as string[],
    tagColors: (meta.exists() ? meta.data()?.tagColors : {}) ?? {} as Record<string, string>,
  }
}

export function useStore(uid: string) {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const readyRef = useRef(false)

  const [parents, setParents]          = useState<ParentTodo[]>([])
  const [subs, setSubs]                = useState<SubTodo[]>([])
  const [memos, setMemos]              = useState<MemoItem[]>([])
  const [templates, setTemplates]      = useState<Template[]>([])
  const [tagList, setTagList]          = useState<string[]>([])
  const [tagColors, setTagColorsState] = useState<Record<string, string>>({})
  const [settings, setSettingsState]   = useState<UserSettings>(DEFAULT_SETTINGS)
  const [currentDate, setCurrentDate]  = useState<string>(today)

  // 매 렌더마다 최신 상태를 ref에 동기화 (setState 바깥에서 save할 때 사용)
  const parentsRef  = useRef(parents)
  const subsRef     = useRef(subs)
  const memosRef    = useRef(memos)
  const templatesRef= useRef(templates)
  const tagListRef  = useRef(tagList)
  const tagColorsRef= useRef(tagColors)
  parentsRef.current  = parents
  subsRef.current     = subs
  memosRef.current    = memos
  templatesRef.current= templates
  tagListRef.current  = tagList
  tagColorsRef.current= tagColors

  // 초기 로드 — App 레벨에서 이미 Firebase Auth 확인 완료 후 진입하므로 바로 로드
  useEffect(() => {
    setLoading(true)
    readyRef.current = false
    let cancelled = false

    loadAll(uid).then(data => {
      if (cancelled) return
      setParents(data.parents)
      setSubs(data.subs)
      setMemos(data.memos)
      setTemplates(data.templates)
      setSettingsState(data.settings)
      setTagList(data.tagList)
      setTagColorsState(data.tagColors)
      setLoading(false)
      readyRef.current = true
    }).catch(err => {
      if (cancelled) return
      console.error('Firestore 로드 실패:', err)
      setLoadError(err?.code === 'permission-denied'
        ? '권한 오류: Firebase 보안 규칙을 확인하세요'
        : `로드 실패: ${err?.message ?? err}`)
      setLoading(false)
      readyRef.current = true  // 로드 실패해도 저장 시도는 허용
    })

    return () => { cancelled = true; readyRef.current = false }
  }, [uid])

  // 저장 헬퍼 — 로드 완료 후에만 저장 (덮어쓰기 방지)
  const save = (key: string, value: unknown, asItems = true) => {
    if (!readyRef.current) return
    setDoc(
      doc(db, 'users', uid, 'data', key),
      stripUndefined(asItems ? { items: value } : (value as object))
    ).catch(err => {
      console.error(`save(${key}) 실패:`, err)
      setSaveError(err?.code === 'permission-denied'
        ? 'Firebase 권한 오류: 보안 규칙을 확인하세요. 데이터가 저장되지 않습니다.'
        : `저장 실패: ${err?.message ?? err}`)
    })
  }

  const saveMeta = (tl: string[], tc: Record<string, string>) => {
    if (!readyRef.current) return
    setDoc(doc(db, 'users', uid, 'data', 'meta'), stripUndefined({ tagList: tl, tagColors: tc })).catch(err => {
      console.error('saveMeta 실패:', err)
      setSaveError(err?.code === 'permission-denied'
        ? 'Firebase 권한 오류: 보안 규칙을 확인하세요. 데이터가 저장되지 않습니다.'
        : `저장 실패: ${err?.message ?? err}`)
    })
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
    const next = [...parentsRef.current, newItem]
    setParents(next)
    save('parents', next)
    return id
  }

  const updateParent = (id: string, patch: Partial<ParentTodo>) => {
    const next = parentsRef.current.map(x => x.id === id ? { ...x, ...patch } : x)
    setParents(next)
    save('parents', next)
  }

  const deleteParent = (id: string) => {
    const nextParents = parentsRef.current.filter(x => x.id !== id)
    const nextSubs    = subsRef.current.filter(x => x.parentId !== id)
    setParents(nextParents)
    setSubs(nextSubs)
    save('parents', nextParents)
    save('subs', nextSubs)
  }

  const toggleParent = (id: string) => {
    const parent = parentsRef.current.find(p => p.id === id)
    if (!parent) return
    if (parent.status === 'done') { updateParent(id, { status: 'todo', doneAt: undefined }); return }
    if (settings.completionMode === 'delete') deleteParent(id)
    else updateParent(id, { status: 'done', doneAt: new Date().toISOString() })
  }

  const reorderParents = (orderedIds: string[]) => {
    const next = parentsRef.current.map(p => {
      const idx = orderedIds.indexOf(p.id)
      return idx !== -1 ? { ...p, sortOrder: idx * 1000 } : p
    })
    setParents(next)
    save('parents', next)
  }

  // --- Sub ---
  const addSub = (parentId: string, title: string) => {
    const next = [...subsRef.current, { id: uuidv4(), parentId, title, status: 'todo' as const, sortOrder: Date.now() }]
    setSubs(next)
    save('subs', next)
  }

  const updateSub = (id: string, patch: Partial<SubTodo>) => {
    const next = subsRef.current.map(x => x.id === id ? { ...x, ...patch } : x)
    setSubs(next)
    save('subs', next)
  }

  const deleteSub = (id: string) => {
    const next = subsRef.current.filter(x => x.id !== id)
    setSubs(next)
    save('subs', next)
  }

  const toggleSub = (id: string) => {
    const sub = subsRef.current.find(s => s.id === id)
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
    const next = [...memosRef.current, { id: uuidv4(), date, content, createdAt: new Date().toISOString() }]
    setMemos(next)
    save('memos', next)
  }

  const updateMemo = (id: string, content: string) => {
    const next = memosRef.current.map(x => x.id === id ? { ...x, content } : x)
    setMemos(next)
    save('memos', next)
  }

  const deleteMemo = (id: string) => {
    const next = memosRef.current.filter(x => x.id !== id)
    setMemos(next)
    save('memos', next)
  }

  // --- Tags ---
  const addTag = (name: string) => {
    const t = name.trim()
    if (!t || tagListRef.current.includes(t)) return
    const next = [...tagListRef.current, t]
    setTagList(next)
    saveMeta(next, tagColorsRef.current)
  }

  const deleteTag = (name: string) => {
    const newTagList   = tagListRef.current.filter(x => x !== name)
    const newTagColors = { ...tagColorsRef.current }
    delete newTagColors[name]
    setTagList(newTagList)
    setTagColorsState(newTagColors)
    saveMeta(newTagList, newTagColors)
    const nextParents = parentsRef.current.map(x => x.tag === name ? { ...x, tag: undefined } : x)
    setParents(nextParents)
    save('parents', nextParents)
  }

  const setTagColor = (name: string, colorId: string) => {
    const next = { ...tagColorsRef.current, [name]: colorId }
    setTagColorsState(next)
    saveMeta(tagListRef.current, next)
  }

  const renameTag = (oldName: string, newName: string) => {
    const t = newName.trim()
    if (!t || t === oldName || tagListRef.current.includes(t)) return
    const newTagList   = tagListRef.current.map(x => x === oldName ? t : x)
    const newTagColors = { ...tagColorsRef.current }
    if (newTagColors[oldName]) { newTagColors[t] = newTagColors[oldName]; delete newTagColors[oldName] }
    setTagList(newTagList)
    setTagColorsState(newTagColors)
    saveMeta(newTagList, newTagColors)
    const nextParents = parentsRef.current.map(x => x.tag === oldName ? { ...x, tag: t } : x)
    setParents(nextParents)
    save('parents', nextParents)
  }

  // --- Settings ---
  const setSettings = (s: UserSettings) => {
    setSettingsState(s)
    save('settings', s, false)
  }

  // --- Templates ---
  const saveTemplate = (name: string, parentIds: string[]) => {
    const tplParents = parentsRef.current.filter(p => parentIds.includes(p.id)).map(p => ({
      title: p.title, description: p.description,
      startTime: p.startTime, endTime: p.endTime, tag: p.tag,
      subs: subsRef.current.filter(s => s.parentId === p.id && s.status === 'todo').map(s => s.title),
    }))
    const next = [...templatesRef.current, { id: uuidv4(), name, parents: tplParents, createdAt: new Date().toISOString() }]
    setTemplates(next)
    save('templates', next)
  }

  const deleteTemplate = (id: string) => {
    const next = templatesRef.current.filter(x => x.id !== id)
    setTemplates(next)
    save('templates', next)
  }

  const applyTemplate = (templateId: string, mode: 'merge' | 'overwrite', keepTime: boolean) => {
    const tpl = templatesRef.current.find(t => t.id === templateId)
    if (!tpl) return

    let newParents = [...parentsRef.current]
    let newSubs    = [...subsRef.current]

    if (mode === 'overwrite') {
      const removedIds = newParents.filter(p => p.date === currentDate).map(p => p.id)
      newParents = newParents.filter(p => p.date !== currentDate)
      newSubs    = newSubs.filter(s => !removedIds.includes(s.parentId))
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
    setSubs(newSubs);       save('subs', newSubs)
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
    subs
      .filter(s => s.parentId === parentId)
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
    loading, loadError, saveError, clearSaveError: () => setSaveError(null),
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
