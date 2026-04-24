import { useState, useEffect, useRef } from 'react'
import { X, Clock, ChevronDown, Info, Trash2 } from 'lucide-react'
import { formatTimeInput, isValidTime } from '../types'
import type { ParentTodo } from '../types'
import { getTagColor } from './TagManageModal'

interface Props {
  tagList: string[]
  tagColors: Record<string, string>
  onClose: () => void
  onAdd?: (title: string, opts: { startTime?: string; endTime?: string; description?: string; tag?: string }) => void
  initialData?: ParentTodo
  onEdit?: (patch: Partial<ParentTodo>) => void
  onDelete?: () => void
}

export default function AddTodoModal({ tagList, tagColors, onClose, onAdd, initialData, onEdit, onDelete }: Props) {
  const isEditMode = !!initialData

  const [title, setTitle] = useState(initialData?.title ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [showTime, setShowTime] = useState(!!(initialData?.startTime || initialData?.endTime))
  const [startEnabled, setStartEnabled] = useState(initialData ? !!initialData.startTime : true)
  const [endEnabled, setEndEnabled] = useState(initialData ? !!initialData.endTime : true)
  const [startTime, setStartTime] = useState(initialData?.startTime ?? '')
  const [endTime, setEndTime] = useState(initialData?.endTime ?? '')
  const [tag, setTag] = useState(initialData?.tag ?? '')
  const [showTagDrop, setShowTagDrop] = useState(false)
  const [showTagTooltip, setShowTagTooltip] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (scrollRef.current) scrollRef.current.scrollTop = 0
    return () => { document.body.style.overflow = prev }
  }, [])

  const isDisabled =
    !title.trim() ||
    (showTime && startEnabled && !isValidTime(startTime)) ||
    (showTime && endEnabled && !isValidTime(endTime))

  const submit = () => {
    if (isDisabled) return
    try {
      const st = startEnabled && isValidTime(startTime) ? startTime : undefined
      const et = endEnabled && isValidTime(endTime) ? endTime : undefined
      if (isEditMode && onEdit) {
        onEdit({ title: title.trim(), description: description.trim() || undefined, startTime: st, endTime: et, tag: tag || undefined })
      } else if (onAdd) {
        onAdd(title.trim(), { startTime: st, endTime: et, description: description.trim() || undefined, tag: tag || undefined })
      }
    } catch (e) {
      console.error('submit error:', e)
    }
    onClose()
  }

  const handleTimeInput = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(formatTimeInput(e.target.value))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-[480px] bg-surface rounded-t-[20px] slide-up flex flex-col"
        style={{ maxHeight: '90dvh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex-shrink-0 px-6 pt-6 pb-0">
          <div className="w-10 h-1 bg-border-def rounded-full mx-auto mb-5" />
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[20px] font-bold text-text-dark">{isEditMode ? 'TO-DO 수정' : 'TO-DO 추가'}</h3>
            <button onClick={onClose} className="p-1 rounded-[8px] hover:bg-page-bg"><X size={20} className="text-text-gray" /></button>
          </div>
        </div>

        {/* 스크롤 영역 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain px-6 pb-2">
          <div className="mb-4">
            <label className="block text-[14px] font-semibold text-text-dark mb-2">제목</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="TO-DO 제목을 입력하세요"
              className="w-full px-4 py-[14px] border-[1.5px] border-border-def focus:border-teal rounded-[10px] text-[15px] text-text-dark outline-none transition-colors placeholder:text-text-muted"
            />
          </div>

          <div className="mb-4">
            <label className="block text-[14px] font-semibold text-text-dark mb-2">설명 <span className="text-text-gray font-normal text-[13px]">(선택)</span></label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="내용을 입력하세요" rows={2}
              className="w-full px-4 py-[14px] border-[1.5px] border-border-def focus:border-teal rounded-[10px] text-[15px] text-text-dark outline-none transition-colors resize-none placeholder:text-text-muted"
            />
          </div>

          <div className="mb-4">
            <button onClick={() => setShowTime(v => !v)}
              className={`flex items-center gap-2 text-[13px] font-semibold px-3 py-2 rounded-[10px] transition-colors ${showTime ? 'bg-teal-light text-teal' : 'bg-page-bg text-text-gray hover:bg-border-def'}`}>
              <Clock size={15} /> 시간 설정
              <span className={`ml-1 w-8 h-4 rounded-full transition-colors relative ${showTime ? 'bg-teal' : 'bg-border-def'}`}>
                <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${showTime ? 'left-4' : 'left-0.5'}`} />
              </span>
            </button>
            {showTime && (
              <div className="mt-3 space-y-2">
                {[
                  { label: '시작 시간', enabled: startEnabled, setEnabled: setStartEnabled, val: startTime, setVal: setStartTime, ph: '09:00' },
                  { label: '끝 시간', enabled: endEnabled, setEnabled: setEndEnabled, val: endTime, setVal: setEndTime, ph: '18:00' },
                ].map(({ label, enabled, setEnabled, val, setVal, ph }) => (
                  <div key={label} className="flex items-center gap-3">
                    <button onClick={() => setEnabled(v => !v)} className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${enabled ? 'bg-teal' : 'bg-border-def'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${enabled ? 'left-4' : 'left-0.5'}`} />
                    </button>
                    <span className="text-[13px] text-text-gray w-14 flex-shrink-0">{label}</span>
                    <input type="text" inputMode="numeric" value={val} onChange={handleTimeInput(setVal)}
                      disabled={!enabled} placeholder={ph} maxLength={5}
                      className={`flex-1 border-[1.5px] rounded-[10px] px-3 py-2 text-[14px] outline-none transition-colors ${!enabled ? 'bg-page-bg text-text-muted border-border-def' : val && !isValidTime(val) ? 'border-error text-error' : 'border-border-def focus:border-teal text-text-dark'}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative mb-4">
            <div className="flex items-center gap-1 mb-2">
              <label className="text-[14px] font-semibold text-text-dark">태그 <span className="text-text-gray font-normal text-[13px]">(선택)</span></label>
              <div className="relative">
                <button onMouseEnter={() => setShowTagTooltip(true)} onMouseLeave={() => setShowTagTooltip(false)} onTouchStart={() => setShowTagTooltip(v => !v)} className="text-text-muted hover:text-text-gray">
                  <Info size={13} />
                </button>
                {showTagTooltip && (
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 bg-text-dark text-white text-[11px] rounded-[8px] px-2.5 py-1.5 whitespace-nowrap z-40 pointer-events-none leading-tight">
                    태그는 설정 메뉴에서<br/>추가·관리할 수 있어요
                  </div>
                )}
              </div>
            </div>
            <button onClick={() => setShowTagDrop(v => !v)}
              className={`w-full flex items-center justify-between px-4 py-[14px] border-[1.5px] rounded-[10px] text-[15px] transition-colors ${showTagDrop ? 'border-teal' : 'border-border-def hover:border-text-gray'}`}>
              {tag ? <span className={`text-[11px] font-bold px-2 py-0.5 rounded-[6px] ${getTagColor(tag, tagColors)}`}>{tag}</span> : <span className="text-text-muted">태그 선택</span>}
              <div className="flex items-center gap-1">
                {tag && <button onClick={e => { e.stopPropagation(); setTag('') }}><X size={14} className="text-text-gray" /></button>}
                <ChevronDown size={15} className="text-text-gray" />
              </div>
            </button>
            {showTagDrop && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border-def rounded-[10px] z-20 overflow-hidden max-h-40 overflow-y-auto">
                {tagList.length === 0
                  ? <div className="px-4 py-3 bg-teal-light"><p className="text-[13px] text-teal font-medium">설정 메뉴에서 태그를 추가하세요</p></div>
                  : tagList.map(t => (
                    <button key={t} onMouseDown={() => { setTag(t); setShowTagDrop(false) }} className="w-full text-left px-4 py-2.5 hover:bg-page-bg flex items-center gap-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-[6px] ${getTagColor(t, tagColors)}`}>{t}</span>
                    </button>
                  ))
                }
              </div>
            )}
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex-shrink-0 px-6 pt-3 pb-8">
          {isEditMode && onDelete && (
            confirmDelete ? (
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => { onDelete(); onClose() }}
                  className="flex-1 py-[13px] rounded-[10px] bg-error text-white font-bold text-[15px] flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={15} /> 삭제 확인
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-[13px] rounded-[10px] bg-page-bg text-text-gray font-bold text-[15px]"
                >
                  취소
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full py-[13px] rounded-[10px] border border-error text-error font-semibold text-[15px] mb-3 hover:bg-error-bg transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 size={15} /> 삭제하기
              </button>
            )
          )}
          <button
            onClick={submit}
            disabled={isDisabled}
            className="w-full py-[15px] rounded-[10px] bg-teal text-white font-bold text-[16px] disabled:bg-disabled-bg disabled:text-text-muted hover:bg-teal-hover transition-colors"
          >
            {isEditMode ? '수정 완료' : '추가하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
