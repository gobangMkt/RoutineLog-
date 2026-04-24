import { useState, useEffect, useRef } from 'react'
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
type PendingApply = { id: string; mode: 'merge' | 'overwrite' } | null

export default function TemplateModal({ templates, currentParents, onClose, onSave, onDelete, onApply }: Props) {
  const [view, setView] = useState<View>('list')
  const [name, setName] = useState('')
  const [selectedParents, setSelectedParents] = useState<string[]>(currentParents.map(p => p.id))
  const [pendingApply, setPendingApply] = useState<PendingApply>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const [sheetY, setSheetY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startYRef = useRef(0)

  useEffect(() => {
    const y = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${y}px`
    document.body.style.width = '100%'
    document.body.style.overflowY = 'scroll'
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflowY = ''
      window.scrollTo(0, y)
    }
  }, [])

  const onHandlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true)
    startYRef.current = e.clientY
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onHandlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    setSheetY(Math.max(0, e.clientY - startYRef.current))
  }
  const onHandlePointerUp = () => {
    setIsDragging(false)
    if (sheetY > 100) onClose()
    else setSheetY(0)
  }

  const toggleParent = (id: string) =>
    setSelectedParents(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  const handleSave = () => {
    if (name.trim() && selectedParents.length > 0) {
      onSave(name.trim(), selectedParents)
      onClose()
    }
  }

  const handleApply = (keepTime: boolean) => {
    if (!pendingApply) return
    onApply(pendingApply.id, pendingApply.mode, keepTime)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="relative w-full max-w-[480px] bg-surface rounded-t-[20px] flex flex-col slide-up"
        style={{
          maxHeight: '85vh',
          transform: `translateY(${sheetY}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 드래그 핸들 */}
        <div
          className="w-10 h-1.5 bg-border-def rounded-full mx-auto mt-4 flex-shrink-0 cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerUp}
        />

        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 pt-4 pb-0 flex-shrink-0">
          <h2 className="text-[20px] font-bold text-text-dark">템플릿</h2>
          <button onClick={onClose} className="p-1 rounded-[8px] hover:bg-page-bg">
            <X size={20} className="text-text-gray" />
          </button>
        </div>

        {/* 탭 */}
        <div className="flex gap-2 px-6 pt-4 pb-3 flex-shrink-0">
          <button
            onClick={() => { setView('list'); setPendingApply(null) }}
            className={`flex-1 py-2.5 rounded-[10px] text-[14px] font-semibold transition-colors flex items-center justify-center gap-1 ${
              view === 'list' ? 'bg-teal text-white' : 'bg-page-bg text-text-gray hover:bg-border-def'
            }`}
          >
            <Download size={14} /> 불러오기
          </button>
          <button
            onClick={() => { setView('save'); setPendingApply(null) }}
            className={`flex-1 py-2.5 rounded-[10px] text-[14px] font-semibold transition-colors flex items-center justify-center gap-1 ${
              view === 'save' ? 'bg-teal text-white' : 'bg-page-bg text-text-gray hover:bg-border-def'
            }`}
          >
            <BookTemplate size={14} /> 저장하기
          </button>
        </div>

        <div ref={scrollRef} className="overflow-y-auto overscroll-contain flex-1 px-6 pb-8">
          {view === 'list' ? (
            <>
              {templates.length === 0 ? (
                <p className="text-center text-text-gray text-[14px] py-8">저장된 템플릿이 없습니다</p>
              ) : (
                templates.map(t => (
                  <div key={t.id} className="mb-2">
                    {/* 템플릿 행 */}
                    <div className={`flex items-center gap-2 px-4 py-3 rounded-[10px] border-[1.5px] transition-colors ${
                      pendingApply?.id === t.id ? 'border-teal bg-teal-sel' : 'border-border-def hover:border-teal hover:bg-teal-sel'
                    }`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-text-dark truncate">{t.name}</p>
                        <p className="text-[12px] text-text-gray mt-0.5">{t.parents.length}개 투두 묶음</p>
                      </div>
                      <button
                        onClick={() => setPendingApply({ id: t.id, mode: 'merge' })}
                        className="text-[13px] font-semibold px-3 py-1.5 rounded-[8px] bg-teal-light text-teal hover:bg-teal-border transition-colors flex-shrink-0"
                      >
                        합치기
                      </button>
                      <button
                        onClick={() => setPendingApply({ id: t.id, mode: 'overwrite' })}
                        className="text-[13px] font-semibold px-3 py-1.5 rounded-[8px] bg-page-bg text-text-body border border-border-def hover:border-teal transition-colors flex-shrink-0"
                      >
                        덮어쓰기
                      </button>
                      <button onClick={() => { onDelete(t.id); if (pendingApply?.id === t.id) setPendingApply(null) }}
                        className="p-1.5 hover:bg-error-bg rounded-[6px] flex-shrink-0">
                        <Trash2 size={14} className="text-error" />
                      </button>
                    </div>

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
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
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

        {/* 시간 유지 팝업 오버레이 */}
        {pendingApply && (
          <div className="absolute inset-0 bg-black/40 rounded-t-[20px] flex items-center justify-center px-8 z-10">
            <div className="bg-surface rounded-[16px] w-full p-6 shadow-xl">
              <p className="text-[17px] font-bold text-text-dark text-center mb-1">시간을 유지할까요?</p>
              <p className="text-[13px] text-text-gray text-center mb-5">
                {pendingApply.mode === 'overwrite' ? '덮어쓰기' : '합치기'}로 적용합니다
              </p>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => handleApply(false)}
                  className="flex-1 py-3 rounded-[10px] bg-page-bg text-text-body font-semibold text-[14px] border border-border-def"
                >
                  시간 제외
                </button>
                <button
                  onClick={() => handleApply(true)}
                  className="flex-1 py-3 rounded-[10px] bg-teal text-white font-bold text-[14px]"
                >
                  시간 유지
                </button>
              </div>
              <button
                onClick={() => setPendingApply(null)}
                className="w-full py-2 text-[13px] text-text-gray text-center"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
