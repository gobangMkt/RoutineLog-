import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import { Plus, StickyNote, CheckSquare, Settings, BookTemplate, LogOut } from 'lucide-react'
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useStore } from './store'
import { clearSession } from './auth'
import type { ParentTodo } from './types'
import type { ViewMode } from './types'
import AuthScreen from './components/AuthScreen'
import Calendar from './components/Calendar'
import ParentCard from './components/ParentCard'
import DailyMemoSection from './components/DailyMemoSection'
import AddTodoModal from './components/AddTodoModal'
import TemplateModal from './components/TemplateModal'
import SettingsModal from './components/SettingsModal'
import { getTagColor } from './components/TagManageModal'

type Tab = 'todo' | 'memo'
type Modal = 'addTodo' | 'template' | 'settings' | null

const VIEW_MODES: { value: ViewMode; label: string }[] = [
  { value: 'default', label: '추가순' },
  { value: 'time',    label: '시간순' },
  { value: 'tag',     label: '태그별' },
]

// 드래그 가능한 카드 래퍼
function SortableCard({
  parent,
  children,
}: {
  parent: ParentTodo
  children: (dragHandleProps: React.HTMLAttributes<HTMLDivElement>, isDragging: boolean) => React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: parent.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`bg-surface mt-2 ${isDragging ? 'z-50 relative' : ''}`}
    >
      {children({ ...attributes, ...listeners }, isDragging)}
    </div>
  )
}

function MainApp({ phone, uid }: { phone: string; uid: string }) {
  const store = useStore(uid)
  const [tab, setTab] = useState<Tab>('todo')
  const [modal, setModal] = useState<Modal>(null)
  const [editingParent, setEditingParent] = useState<ParentTodo | null>(null)
  const [blockAddBtn, setBlockAddBtn] = useState(false)

  // 모달 닫힌 직후 고스트 클릭으로 하단 버튼이 눌리는 것 방지
  const closeModal = () => { setModal(null); setBlockAddBtn(true); setTimeout(() => setBlockAddBtn(false), 600) }
  const closeEditing = () => { setEditingParent(null); setBlockAddBtn(true); setTimeout(() => setBlockAddBtn(false), 600) }

  const {
    currentDate, setCurrentDate, goToToday,
    dayParents, getSubsFor, markedDates, parents,
    addParent, updateParent, deleteParent, toggleParent, reorderParents,
    addSub, updateSub, deleteSub, toggleSub,
    getMemosForDate, addMemo, updateMemo, deleteMemo,
    tagList, tagColors, addTag, deleteTag, setTagColor, renameTag,
    templates, saveTemplate, deleteTemplate, applyTemplate,
    settings, setSettings,
    saveError, clearSaveError,
  } = store

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  if (store.loading) return (
    <div className="min-h-screen bg-page-bg flex flex-col items-center justify-center gap-3">
      <div className="w-14 h-14 rounded-full bg-teal-light flex items-center justify-center">
        <span className="text-2xl">📋</span>
      </div>
      <p className="text-[15px] font-semibold text-text-dark">루틴로그</p>
      <p className="text-[13px] text-text-gray">데이터를 불러오는 중...</p>
    </div>
  )

  if (store.loadError) return (
    <div className="min-h-screen bg-page-bg flex flex-col items-center justify-center gap-4 px-6">
      <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
        <span className="text-2xl">⚠️</span>
      </div>
      <p className="text-[15px] font-semibold text-text-dark text-center">데이터 로드 실패</p>
      <p className="text-[13px] text-red-500 text-center break-all">{store.loadError}</p>
      <button
        onClick={() => window.location.reload()}
        className="px-5 py-2.5 rounded-[10px] bg-teal text-white text-[14px] font-semibold"
      >
        다시 시도
      </button>
    </div>
  )

  const doneCount = dayParents.filter(p => p.status === 'done').length
  const totalCount = dayParents.length
  const dayMemos = getMemosForDate(currentDate)
  const viewMode = settings.viewMode ?? 'default'

  const formatSelectedDate = (d: string) => {
    const date = new Date(d + 'T00:00:00')
    const days = ['일', '월', '화', '수', '목', '금', '토']
    const label = d === new Date().toISOString().slice(0, 10) ? ' · 오늘' : ''
    return `${date.getMonth() + 1}월 ${date.getDate()}일 ${days[date.getDay()]}요일${label}`
  }

  const formatPhoneShort = (p: string) =>
    p.length === 11 ? `${p.slice(0, 3)}-${p.slice(3, 7)}-${p.slice(7)}` : p

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = dayParents.findIndex(p => p.id === active.id)
    const newIndex = dayParents.findIndex(p => p.id === over.id)
    const reordered = arrayMove(dayParents, oldIndex, newIndex)
    reorderParents(reordered.map(p => p.id))
  }

  const cardProps = {
    tagList, tagColors, enableSubTodo: settings.enableSubTodo,
    onToggle: toggleParent, onDelete: deleteParent,
    onUpdate: (id: string, patch: Partial<ParentTodo>) => updateParent(id, patch),
    onEdit: (p: ParentTodo) => setEditingParent(p),
    onAddSub: addSub, onToggleSub: toggleSub, onDeleteSub: deleteSub,
    onUpdateSub: (id: string, title: string) => updateSub(id, { title }),
  }

  const renderTodoList = () => {
    if (dayParents.length === 0) {
      return (
        <div className="bg-surface px-5 py-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-teal-light flex items-center justify-center mb-4 text-3xl">📋</div>
          <p className="text-[15px] font-semibold text-text-dark">TO-DO가 없어요</p>
          <p className="text-[14px] text-text-gray mt-1">아래 버튼으로 추가해보세요</p>
        </div>
      )
    }

    // 추가순 — 드래그 가능
    if (viewMode === 'default') {
      return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={dayParents.map(p => p.id)} strategy={verticalListSortingStrategy}>
            {dayParents.map(parent => (
              <SortableCard key={parent.id} parent={parent}>
                {(dragHandleProps, isDragging) => (
                  <ParentCard
                    parent={parent}
                    subs={getSubsFor(parent.id)}
                    isDragging={isDragging}
                    dragHandleProps={dragHandleProps}
                    {...cardProps}
                  />
                )}
              </SortableCard>
            ))}
          </SortableContext>
        </DndContext>
      )
    }

    // 태그별 — 그룹 헤더
    if (viewMode === 'tag') {
      const groups: { tag: string | undefined; items: typeof dayParents }[] = []
      dayParents.forEach(p => {
        const last = groups[groups.length - 1]
        if (last && last.tag === p.tag) last.items.push(p)
        else groups.push({ tag: p.tag, items: [p] })
      })
      return (
        <>
          {groups.map((group, gi) => (
            <div key={group.tag ?? '__none__'}>
              <div className={`px-5 pb-2 ${gi > 0 ? 'pt-4' : 'pt-3'}`}>
                {group.tag ? (
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-[6px] ${getTagColor(group.tag, tagColors)}`}>
                    {group.tag}
                  </span>
                ) : (
                  <span className="text-[12px] font-semibold text-text-gray">태그 없음</span>
                )}
              </div>
              {group.items.map(parent => (
                <div key={parent.id} className="bg-surface mt-2">
                  <ParentCard parent={parent} subs={getSubsFor(parent.id)} {...cardProps} />
                </div>
              ))}
            </div>
          ))}
        </>
      )
    }

    // 시간순
    return (
      <>
        {dayParents.map(parent => (
          <div key={parent.id} className="bg-surface mt-2">
            <ParentCard parent={parent} subs={getSubsFor(parent.id)} {...cardProps} />
          </div>
        ))}
      </>
    )
  }

  return (
    <div className="min-h-screen bg-page-bg w-full overflow-x-hidden">
      {/* 저장 오류 토스트 */}
      {saveError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-32px)] max-w-[440px]">
          <div className="bg-red-50 border border-red-200 rounded-[12px] px-4 py-3 flex items-start gap-3 shadow-md">
            <span className="text-lg leading-none mt-0.5">⚠️</span>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-red-700">저장 실패 — 새로고침해도 데이터가 사라집니다</p>
              <p className="text-[12px] text-red-500 mt-0.5 break-all">{saveError}</p>
            </div>
            <button onClick={clearSaveError} className="text-red-400 hover:text-red-600 text-lg leading-none">✕</button>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="sticky top-0 z-20 bg-surface border-b border-border-def w-full">
        <div className="max-w-[480px] mx-auto px-5 pt-5 pb-0 flex items-center justify-between">
          <div>
            <h1 onClick={goToToday} className="text-[20px] font-bold text-text-dark cursor-pointer leading-tight">
              루틴로그
            </h1>
            <p className="text-[14px] text-text-gray mt-0.5">매일의 루틴을 기록하세요</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setModal('template')}
              className="flex items-center gap-1 text-[13px] font-semibold text-teal px-3 py-1.5 rounded-[10px] bg-teal-light hover:bg-teal-border transition-colors"
            >
              <BookTemplate size={14} /> 템플릿
            </button>
            <button onClick={() => setModal('settings')} className="p-2 rounded-[10px] hover:bg-page-bg transition-colors">
              <Settings size={18} className="text-text-gray" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-[480px] mx-auto px-5 flex items-center mt-3">
          <button
            onClick={() => setTab('todo')}
            className={`flex items-center gap-1.5 px-1 pb-2.5 mr-6 text-[14px] font-semibold border-b-2 transition-colors ${
              tab === 'todo' ? 'border-teal text-teal' : 'border-transparent text-text-gray'
            }`}
          >
            <CheckSquare size={15} /> TO-DO
          </button>
          <button
            onClick={() => setTab('memo')}
            className={`flex items-center gap-1.5 px-1 pb-2.5 text-[14px] font-semibold border-b-2 transition-colors ${
              tab === 'memo' ? 'border-teal text-teal' : 'border-transparent text-text-gray'
            }`}
          >
            <StickyNote size={15} /> 메모
            {dayMemos.length > 0 && tab !== 'memo' && (
              <span className="w-1.5 h-1.5 rounded-full bg-teal" />
            )}
          </button>
          <div className="flex-1" />
          <button
            onClick={async () => { await clearSession(); window.location.reload() }}
            className="flex items-center gap-1 text-[12px] text-text-gray hover:text-text-dark pb-2.5 transition-colors"
          >
            <LogOut size={12} /> {formatPhoneShort(phone)}
          </button>
        </div>
      </header>

      <main className={`max-w-[480px] mx-auto ${tab === 'todo' ? 'pb-[90px]' : 'pb-6'}`}>
        {/* Calendar */}
        <div className="bg-surface mt-2">
          <Calendar currentDate={currentDate} markedDates={markedDates} onSelectDate={setCurrentDate} />
        </div>

        {/* Date + progress + 정렬 탭 */}
        <div className="bg-surface mt-2 px-5 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-text-dark">{formatSelectedDate(currentDate)}</h2>
            {tab === 'todo' && totalCount > 0 && (
              <span className="text-[13px] font-semibold text-teal">{doneCount}/{totalCount} 완료</span>
            )}
          </div>
          {tab === 'todo' && totalCount > 0 && (
            <div className="h-1.5 bg-border-def rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-teal rounded-full transition-all duration-500"
                style={{ width: `${Math.round((doneCount / totalCount) * 100)}%` }}
              />
            </div>
          )}

          {/* 정렬 탭 — TO-DO 탭에서만 표시 */}
          {tab === 'todo' && (
            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border-def">
              <span className="text-[11px] text-text-gray font-medium mr-0.5">정렬</span>
              {VIEW_MODES.map(m => (
                <button
                  key={m.value}
                  onClick={() => setSettings({ ...settings, viewMode: m.value })}
                  className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-colors ${
                    viewMode === m.value
                      ? 'bg-teal text-white'
                      : 'bg-page-bg text-text-gray hover:bg-border-def'
                  }`}
                >
                  {m.label}
                </button>
              ))}
              {viewMode === 'default' && dayParents.length > 1 && (
                <span className="text-[11px] text-text-muted ml-auto">≡ 길게 눌러 순서 변경</span>
              )}
            </div>
          )}
        </div>

        {/* TO-DO 탭 */}
        {tab === 'todo' && (
          <div className="mt-2">
            {renderTodoList()}
          </div>
        )}

        {/* 메모 탭 */}
        {tab === 'memo' && (
          <div className="bg-surface mt-2 px-5 py-5">
            <DailyMemoSection
              date={currentDate}
              memos={dayMemos}
              onAdd={addMemo}
              onUpdate={updateMemo}
              onDelete={deleteMemo}
            />
          </div>
        )}
      </main>

      {/* Bottom Bar */}
      {tab === 'todo' && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-surface border-t border-border-def px-5 pt-3 pb-4 z-10">
          <button
            onClick={() => !blockAddBtn && setModal('addTodo')}
            className="w-full flex items-center justify-center gap-2 py-[15px] rounded-[10px] bg-teal text-white text-[16px] font-bold hover:bg-teal-hover active:scale-[0.98] transition-all"
          >
            <Plus size={20} strokeWidth={2.5} /> TO-DO 추가
          </button>
        </div>
      )}

      {modal === 'addTodo' && (
        <AddTodoModal
          tagList={tagList} tagColors={tagColors}
          onClose={closeModal}
          onAdd={(title, opts) => addParent(title, opts)}
        />
      )}
      {editingParent && (
        <AddTodoModal
          tagList={tagList} tagColors={tagColors}
          onClose={closeEditing}
          initialData={editingParent}
          onEdit={patch => updateParent(editingParent.id, patch)}
        />
      )}
      {modal === 'template' && (
        <TemplateModal
          templates={templates}
          currentParents={parents.filter(p => p.date === currentDate)}
          onClose={() => setModal(null)}
          onSave={saveTemplate}
          onDelete={deleteTemplate}
          onApply={applyTemplate}
        />
      )}
      {modal === 'settings' && (
        <SettingsModal
          settings={settings}
          tagList={tagList}
          tagColors={tagColors}
          onClose={() => setModal(null)}
          onUpdate={setSettings}
          onAddTag={addTag}
          onDeleteTag={deleteTag}
          onSetTagColor={setTagColor}
          onRenameTag={renameTag}
        />
      )}
    </div>
  )
}

export default function App() {
  const [authLoading, setAuthLoading] = useState(true)
  const [user, setUser] = useState<{ uid: string; phone: string } | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const phone = localStorage.getItem('rl_phone') ?? ''
        setUser({ uid: firebaseUser.uid, phone })
      } else {
        setUser(null)
      }
      setAuthLoading(false)
    })
    return () => unsub()
  }, [])

  if (authLoading) return (
    <div className="min-h-screen bg-page-bg flex flex-col items-center justify-center gap-3">
      <div className="w-14 h-14 rounded-full bg-teal-light flex items-center justify-center">
        <span className="text-2xl">📋</span>
      </div>
      <p className="text-[15px] font-semibold text-text-dark">루틴로그</p>
      <p className="text-[13px] text-text-gray">인증 확인 중...</p>
    </div>
  )

  if (!user) return <AuthScreen onLogin={s => setUser(s)} />
  return <MainApp phone={user.phone} uid={user.uid} />
}
