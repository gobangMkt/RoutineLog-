import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useStore } from './store'
import Header from './components/Header'
import Calendar from './components/Calendar'
import ParentCard from './components/ParentCard'
import NoteCard from './components/NoteCard'
import AddModal from './components/AddModal'
import TemplateModal from './components/TemplateModal'
import SettingsModal from './components/SettingsModal'

type Modal = 'add' | 'template' | 'settings' | null

export default function App() {
  const store = useStore()
  const [modal, setModal] = useState<Modal>(null)

  const {
    currentDate, setCurrentDate, goToToday,
    dayParents, dayNotes, getSubsFor, parents, notes,
    addParent, updateParent, deleteParent, toggleParent,
    addSub, updateSub, deleteSub, toggleSub,
    addNote, updateNote, deleteNote,
    templates, saveTemplate, deleteTemplate, applyTemplate,
    settings, setSettings,
  } = store

  const doneCount = dayParents.filter(p => p.status === 'done').length
  const totalCount = dayParents.length

  // Build marked dates map for calendar dots
  const markedDates: Record<string, { total: number; done: number }> = {}
  parents.forEach(p => {
    if (!markedDates[p.date]) markedDates[p.date] = { total: 0, done: 0 }
    markedDates[p.date].total++
    if (p.status === 'done') markedDates[p.date].done++
  })
  notes.forEach(n => {
    if (!markedDates[n.date]) markedDates[n.date] = { total: 0, done: 0 }
    markedDates[n.date].total++
  })

  const formatSelectedDate = (d: string) => {
    const date = new Date(d + 'T00:00:00')
    const days = ['일', '월', '화', '수', '목', '금', '토']
    const today = new Date().toISOString().slice(0, 10)
    const label = d === today ? ' · 오늘' : ''
    return `${date.getMonth() + 1}월 ${date.getDate()}일 ${days[date.getDay()]}요일${label}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        currentDate={currentDate}
        onToday={goToToday}
        onOpenSettings={() => setModal('settings')}
        onOpenTemplate={() => setModal('template')}
      />

      <main className="max-w-lg mx-auto pt-3 pb-28">
        {/* Calendar */}
        <Calendar
          currentDate={currentDate}
          markedDates={markedDates}
          onSelectDate={setCurrentDate}
        />

        {/* Selected date label + progress */}
        <div className="px-4 mb-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-gray-800">{formatSelectedDate(currentDate)}</h2>
            {totalCount > 0 && (
              <span className="text-xs font-medium text-primary">{doneCount}/{totalCount} 완료</span>
            )}
          </div>
          {totalCount > 0 && (
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${Math.round((doneCount / totalCount) * 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Todo list */}
        <div className="px-4">
          {dayParents.length === 0 && dayNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-sm font-medium">아직 기록이 없어요</p>
              <p className="text-xs mt-1">+ 버튼으로 투두나 메모를 추가해보세요</p>
            </div>
          ) : (
            <>
              {dayParents.map(parent => (
                <ParentCard
                  key={parent.id}
                  parent={parent}
                  subs={getSubsFor(parent.id)}
                  onToggle={toggleParent}
                  onDelete={deleteParent}
                  onUpdate={(id, patch) => updateParent(id, patch)}
                  onAddSub={addSub}
                  onToggleSub={toggleSub}
                  onDeleteSub={deleteSub}
                  onUpdateSub={(id, title) => updateSub(id, { title })}
                />
              ))}

              {dayNotes.length > 0 && (
                <>
                  {dayParents.length > 0 && (
                    <div className="flex items-center gap-2 my-4">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-xs text-gray-400">메모</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                  )}
                  {dayNotes.map(note => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onDelete={deleteNote}
                      onUpdate={updateNote}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </main>

      {/* FAB */}
      <button
        onClick={() => setModal('add')}
        className="fixed bottom-8 right-1/2 translate-x-1/2 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-600 active:scale-95 transition-all"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {/* Modals */}
      {modal === 'add' && (
        <AddModal
          onClose={() => setModal(null)}
          onAddParent={addParent}
          onAddNote={addNote}
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
          onClose={() => setModal(null)}
          onUpdate={setSettings}
        />
      )}
    </div>
  )
}
