import { useState } from 'react'
import { X, Trash2, BookTemplate, Download } from 'lucide-react'
import type { Template, ParentTodo } from '../types'
import { formatTime } from '../types'

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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-[480px] bg-surface rounded-[20px_20px_0_0] px-6 pt-6 pb-8 slide-up max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-border-def rounded-full mx-auto mb-5" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h2 className="text-[20px] font-bold text-text-dark">템플릿</h2>
          <button onClick={onClose} className="p-1 rounded-[8px] hover:bg-page-bg">
            <X size={20} className="text-text-gray" />
          </button>
        </div>

        {/* Tab toggle */}
        <div className="flex gap-2 mb-4 flex-shrink-0">
          <button
            onClick={() => setView('list')}
            className={`flex-1 py-2.5 rounded-[10px] text-[14px] font-semibold transition-colors flex items-center justify-center gap-1 ${
              view === 'list' ? 'bg-teal text-white' : 'bg-page-bg text-text-gray hover:bg-border-def'
            }`}
          >
            <Download size={14} />불러오기
          </button>
          <button
            onClick={() => setView('save')}
            className={`flex-1 py-2.5 rounded-[10px] text-[14px] font-semibold transition-colors flex items-center justify-center gap-1 ${
              view === 'save' ? 'bg-teal text-white' : 'bg-page-bg text-text-gray hover:bg-border-def'
            }`}
          >
            <BookTemplate size={14} />저장하기
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {view === 'list' ? (
            <>
              {/* Apply options */}
              <div className="bg-teal-light border-[1.5px] border-teal-border rounded-[10px] px-4 py-3 mb-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-[12px] text-text-gray mb-2">적용 방식</p>
                  <div className="flex gap-2">
                    {(['merge', 'overwrite'] as const).map(m => (
                      <button
                        key={m}
                        onClick={() => setApplyMode(m)}
                        className={`text-[13px] px-3 py-1.5 rounded-[8px] font-semibold transition-colors ${
                          applyMode === m ? 'bg-teal text-white' : 'bg-surface text-text-gray border border-border-def'
                        }`}
                      >
                        {m === 'merge' ? '합치기' : '덮어쓰기'}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={keepTime}
                    onChange={e => setKeepTime(e.target.checked)}
                    className="w-4 h-4 accent-teal"
                  />
                  <span className="text-[13px] text-text-body">시간 유지</span>
                </label>
              </div>

              {templates.length === 0 ? (
                <p className="text-center text-text-gray text-[14px] py-8">저장된 템플릿이 없습니다</p>
              ) : (
                templates.map(t => (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-3 rounded-[10px] border-[1.5px] border-border-def mb-2 hover:border-teal hover:bg-teal-sel transition-colors">
                    <div className="flex-1">
                      <p className="text-[14px] font-semibold text-text-dark">{t.name}</p>
                      <p className="text-[12px] text-text-gray mt-0.5">{t.parents.length}개 투두 묶음</p>
                    </div>
                    <button
                      onClick={() => { onApply(t.id, applyMode, keepTime); onClose() }}
                      className="text-[13px] font-semibold bg-teal text-white px-3 py-1.5 rounded-[8px] hover:bg-teal-hover transition-colors"
                    >
                      적용
                    </button>
                    <button onClick={() => onDelete(t.id)} className="p-1.5 hover:bg-error-bg rounded-[6px]">
                      <Trash2 size={14} className="text-error" />
                    </button>
                  </div>
                ))
              )}
            </>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-[14px] font-semibold text-text-dark mb-2">템플릿 이름</label>
                <input
                  autoFocus value={name} onChange={e => setName(e.target.value)}
                  placeholder="예: 평일 루틴"
                  className="w-full px-4 py-[14px] border-[1.5px] border-border-def focus:border-teal rounded-[10px] text-[15px] text-text-dark outline-none transition-colors placeholder:text-text-muted"
                />
              </div>

              <p className="text-[13px] font-semibold text-text-gray mb-2">저장할 투두 선택</p>
              {currentParents.length === 0 ? (
                <p className="text-center text-text-gray text-[13px] py-4">이 날짜의 투두가 없습니다</p>
              ) : (
                currentParents.map(p => (
                  <label key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] hover:bg-page-bg cursor-pointer mb-1 border border-transparent hover:border-border-def">
                    <input
                      type="checkbox"
                      checked={selectedParents.includes(p.id)}
                      onChange={() => toggleParent(p.id)}
                      className="w-4 h-4 accent-teal"
                    />
                    <span className="text-[14px] text-text-dark flex-1">{p.title}</span>
                    <span className="text-[12px] text-teal font-medium">{formatTime(p.startTime, p.endTime)}</span>
                  </label>
                ))
              )}
              <button
                onClick={handleSave}
                disabled={!name.trim() || selectedParents.length === 0}
                className="w-full mt-4 py-[15px] rounded-[10px] bg-teal text-white font-bold text-[16px] disabled:bg-disabled-bg disabled:text-text-muted transition-colors"
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
