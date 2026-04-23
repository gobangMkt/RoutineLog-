import { useState } from 'react'
import { X, Trash2, BookTemplate, Download } from 'lucide-react'
import type { Template, ParentTodo } from '../types'

interface Props {
  templates: Template[]
  currentParents: ParentTodo[]
  onClose: () => void
  onSave: (name: string, parentIds: string[]) => void
  onDelete: (id: string) => void
  onApply: (id: string, mode: 'merge' | 'overwrite', keepTime: boolean) => void
}

type View = 'list' | 'save'

export default function TemplateModal({ templates, currentParents, onClose, onSave, onDelete, onApply }: Props) {
  const [view, setView] = useState<View>('list')
  const [name, setName] = useState('')
  const [selectedParents, setSelectedParents] = useState<string[]>(currentParents.map(p => p.id))
  const [applyMode, setApplyMode] = useState<'merge' | 'overwrite'>('merge')
  const [keepTime, setKeepTime] = useState(true)

  const toggleParent = (id: string) =>
    setSelectedParents(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  const handleSave = () => {
    if (name.trim() && selectedParents.length > 0) {
      onSave(name.trim(), selectedParents)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl p-5 pb-8 shadow-2xl max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-gray-900">템플릿</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

        {/* Tab */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setView('list')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${view === 'list' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}
          >
            <Download size={14} className="inline mr-1" />불러오기
          </button>
          <button
            onClick={() => setView('save')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${view === 'save' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}
          >
            <BookTemplate size={14} className="inline mr-1" />저장하기
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {view === 'list' ? (
            <>
              {/* Apply options */}
              <div className="flex gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1.5">적용 방식</p>
                  <div className="flex gap-2">
                    {(['merge', 'overwrite'] as const).map(m => (
                      <button
                        key={m}
                        onClick={() => setApplyMode(m)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${applyMode === m ? 'bg-primary text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
                      >
                        {m === 'merge' ? '합치기' : '덮어쓰기'}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={keepTime} onChange={e => setKeepTime(e.target.checked)} className="accent-primary" />
                  <span className="text-xs text-gray-500">시간 유지</span>
                </label>
              </div>

              {templates.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">저장된 템플릿이 없습니다</p>
              ) : (
                templates.map(t => (
                  <div key={t.id} className="flex items-center gap-2 p-3 rounded-xl border border-gray-100 mb-2 hover:bg-gray-50">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{t.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{t.parents.length}개 투두 묶음</p>
                    </div>
                    <button
                      onClick={() => { onApply(t.id, applyMode, keepTime); onClose() }}
                      className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-600"
                    >
                      적용
                    </button>
                    <button onClick={() => onDelete(t.id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                ))
              )}
            </>
          ) : (
            <>
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="템플릿 이름"
                className="w-full border-b-2 border-gray-200 focus:border-primary outline-none text-[15px] font-medium pb-2 mb-4"
              />
              <p className="text-xs text-gray-500 mb-2">저장할 투두 선택</p>
              {currentParents.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-4">오늘 투두가 없습니다</p>
              ) : (
                currentParents.map(p => (
                  <label key={p.id} className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer mb-1">
                    <input
                      type="checkbox"
                      checked={selectedParents.includes(p.id)}
                      onChange={() => toggleParent(p.id)}
                      className="accent-primary"
                    />
                    <span className="text-sm text-gray-800">{p.title}</span>
                    {p.time && <span className="text-xs text-primary ml-auto">{p.time}</span>}
                  </label>
                ))
              )}
              <button
                onClick={handleSave}
                disabled={!name.trim() || selectedParents.length === 0}
                className="w-full mt-4 py-3 rounded-2xl bg-primary text-white font-semibold text-[15px] disabled:opacity-40"
              >
                저장하기
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
