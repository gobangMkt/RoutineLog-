import { useState } from 'react'
import { Plus, StickyNote, CheckSquare, Settings, BookTemplate, LogOut } from 'lucide-react'
import { useStore } from './store'
import { getSession, clearSession } from './auth'
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

function MainApp({ phone, uid }: { phone: string; uid: string }) {
  const store = useStore(uid)
  const [tab, setTab] = useState<Tab>('todo')
  const [modal, setModal] = useState<Modal>(null)

  const {
    currentDate, setCurrentDate, goToToday,
    dayParents, getSubsFor, markedDates, parents,
    addParent, updateParent, deleteParent, toggleParent,
    addSub, updateSub, deleteSub, toggleSub,
    getMemosForDate, addMemo, updateMemo, deleteMemo,
    tagList, tagColors, addTag, deleteTag, setTagColor, renameTag,
    templates, saveTemplate, deleteTemplate, applyTemplate,
    settings, setSettings,
  } = store

  if (store.loading) return (
    <div className="min-h-screen bg-page-bg flex flex-col items-center justify-center gap-3">
      <div className="w-14 h-14 rounded-full bg-teal-light flex items-center justify-center">
        <span className="text-2xl">📋</span>
      </div>
      <p className="text-[15px] font-semibold text-text-dark">루틴로그</p>
      <p className="text-[13px] text-text-gray">데이터를 불러오는 중...</p>
    </div>
  )

  const doneCount = dayParents.filter(p => p.status === 'done').length
  const totalCount = dayParents.length
  const dayMemos = getMemosForDate(currentDate)

  const formatSelectedDate = (d: string) => {
    const date = new Date(d + 'T00:00:00')
    const days = ['일', '월', '화', '수', '목', '금', '토']
    const label = d === new Date().toISOString().slice(0, 10) ? ' · 오늘' : ''
    return `${date.getMonth() + 1}월 ${date.getDate()}일 ${days[date.getDay()]}요일${label}`
  }

  const formatPhoneShort = (p: string) =>
    p.length === 11 ? `${p.slice(0, 3)}-${p.slice(3, 7)}-${p.slice(7)}` : p

  // 태그별 보기: 그룹 헤더 렌더링
  const renderTodoList = () => {
    if (dayParents.length === 0) {
      return (
        <div className="bg-surface px-5 py-10 flex flex-col items-center text-text-gray">
          <div className="w-16 h-16 rounded-full bg-teal-light flex items-center justify-center mb-4 text-3xl">📋</div>
          <p className="text-[15px] font-semibold text-text-dark">TO-DO가 없어요</p>
          <p className="text-[14px] text-text-gray mt-1">아래 버튼으로 추가해보세요</p>
        </div>
      )
    }

    if ((settings.viewMode ?? 'default') === 'tag') {
      // 태그별 그룹화
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
              {/* 그룹 헤더 */}
              <div className={`px-5 pb-2 ${gi > 0 ? 'pt-4' : 'pt-3'}`}>
                {group.tag ? (
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-[6px] ${getTagColor(group.tag, tagColors)}`}>
                    {group.tag}
                  </span>
                ) : (
                  <span className="text-[12px] font-semibold text-text-gray">태그 없음</span>
                )}
              </div>
              {group.items.map((parent, i) => (
                <div key={parent.id} className={`bg-surface ${i > 0 ? 'mt-2' : ''}`}>
                  <ParentCard
                    parent={parent}
                    subs={getSubsFor(parent.id)}
                    tagList={tagList}
                    tagColors={tagColors}
                    enableSubTodo={settings.enableSubTodo}
                    onToggle={toggleParent}
                    onDelete={deleteParent}
                    onUpdate={(id, patch) => updateParent(id, patch)}
                    onAddSub={addSub}
                    onToggleSub={toggleSub}
                    onDeleteSub={deleteSub}
                    onUpdateSub={(id, title) => updateSub(id, { title })}
                  />
                </div>
              ))}
            </div>
          ))}
        </>
      )
    }

    // default / time 보기
    return (
      <>
        {dayParents.map((parent, i) => (
          <div key={parent.id} className={`bg-surface ${i > 0 ? 'mt-2' : ''}`}>
            <ParentCard
              parent={parent}
              subs={getSubsFor(parent.id)}
              tagList={tagList}
              tagColors={tagColors}
              enableSubTodo={settings.enableSubTodo}
              onToggle={toggleParent}
              onDelete={deleteParent}
              onUpdate={(id, patch) => updateParent(id, patch)}
              onAddSub={addSub}
              onToggleSub={toggleSub}
              onDeleteSub={deleteSub}
              onUpdateSub={(id, title) => updateSub(id, { title })}
            />
          </div>
        ))}
      </>
    )
  }

  return (
    <div className="min-h-screen bg-page-bg w-full overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-surface border-b border-border-def w-full">
        <div className="max-w-[480px] mx-auto px-5 pt-5 pb-0 flex items-center justify-between">
          <div>
            <h1
              onClick={goToToday}
              className="text-[20px] font-bold text-text-dark cursor-pointer leading-tight"
            >
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

        {/* Date label */}
        <div className="bg-surface mt-2 px-5 py-4">
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

      {/* Bottom Bar — TO-DO 탭에서만 표시 */}
      {tab === 'todo' && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-surface border-t border-border-def px-5 pt-3 pb-4 z-10">
          <button
            onClick={() => setModal('addTodo')}
            className="w-full flex items-center justify-center gap-2 py-[15px] rounded-[10px] bg-teal text-white text-[16px] font-bold hover:bg-teal-hover active:scale-[0.98] transition-all"
          >
            <Plus size={20} strokeWidth={2.5} /> TO-DO 추가
          </button>
        </div>
      )}

      {modal === 'addTodo' && (
        <AddTodoModal tagList={tagList} tagColors={tagColors} onClose={() => setModal(null)} onAdd={(title, opts) => addParent(title, opts)} />
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
  const [session, setSession] = useState<{ phone: string; uid: string } | null>(() => getSession())
  if (!session) return <AuthScreen onLogin={setSession} />
  return <MainApp phone={session.phone} uid={session.uid} />
}
