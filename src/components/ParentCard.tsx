import { useState } from 'react'
import { ChevronDown, ChevronRight, Trash2, Check, Plus, Clock, X, ChevronDown as DropIcon, Pencil } from 'lucide-react'
import type { ParentTodo, SubTodo } from '../types'
import { formatTime, formatTimeInput, isValidTime } from '../types'
import SubTodoItem from './SubTodoItem'
import { getTagColor } from './TagManageModal'

interface Props {
  parent: ParentTodo
  subs: SubTodo[]
  tagList: string[]
  tagColors: Record<string, string>
  enableSubTodo: boolean
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, patch: Partial<ParentTodo>) => void
  onEdit: (parent: ParentTodo) => void
  onAddSub: (parentId: string, title: string) => void
  onToggleSub: (id: string) => void
  onDeleteSub: (id: string) => void
  onUpdateSub: (id: string, title: string) => void
}

export default function ParentCard({
  parent, subs, tagList, tagColors, enableSubTodo,
  onToggle, onDelete, onUpdate, onEdit,
  onAddSub, onToggleSub, onDeleteSub, onUpdateSub,
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleVal, setTitleVal] = useState(parent.title)
  const [editingDesc, setEditingDesc] = useState(false)
  const [descVal, setDescVal] = useState(parent.description ?? '')
  const [addingSubTitle, setAddingSubTitle] = useState('')
  const [showAddSub, setShowAddSub] = useState(false)

  // Time edit state
  const [showTimeEdit, setShowTimeEdit] = useState(false)
  const [startEnabled, setStartEnabled] = useState(true)
  const [endEnabled, setEndEnabled] = useState(true)
  const [startVal, setStartVal] = useState(parent.startTime ?? '')
  const [endVal, setEndVal] = useState(parent.endTime ?? '')

  // Tag dropdown
  const [showTagDrop, setShowTagDrop] = useState(false)
  const [showTagTooltip, setShowTagTooltip] = useState(false)

  const done = parent.status === 'done'
  const timeLabel = formatTime(parent.startTime, parent.endTime)
  const hasDetail = !!parent.description || (enableSubTodo && subs.length > 0)

  const commitTitle = () => {
    if (titleVal.trim()) onUpdate(parent.id, { title: titleVal.trim() })
    else setTitleVal(parent.title)
    setEditingTitle(false)
  }

  const commitDesc = () => {
    onUpdate(parent.id, { description: descVal.trim() || undefined })
    setEditingDesc(false)
  }

  const openTimeEdit = () => {
    setStartVal(parent.startTime ?? '')
    setEndVal(parent.endTime ?? '')
    setStartEnabled(true)
    setEndEnabled(true)
    setShowTimeEdit(v => !v)
  }

  const commitTime = () => {
    const st = startEnabled && isValidTime(startVal) ? startVal : undefined
    const et = endEnabled && isValidTime(endVal) ? endVal : undefined
    onUpdate(parent.id, { startTime: st, endTime: et })
    setShowTimeEdit(false)
  }

  const clearTime = () => {
    onUpdate(parent.id, { startTime: undefined, endTime: undefined })
    setStartVal(''); setEndVal('')
    setShowTimeEdit(false)
  }

  const handleAddSub = () => {
    if (addingSubTitle.trim()) onAddSub(parent.id, addingSubTitle.trim())
    setAddingSubTitle(''); setShowAddSub(false)
  }

  const handleTimeInput = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setter(formatTimeInput(e.target.value))

  return (
    <div className={`transition-opacity ${done ? 'opacity-55' : ''}`}>
      {/* Main row */}
      <div className="flex items-center gap-2 px-4 py-3">

        {/* 시간 */}
        <div className="relative flex-shrink-0">
          <button
            onClick={openTimeEdit}
            className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-[8px] transition-colors ${
              timeLabel ? 'bg-teal-light text-teal' : 'bg-page-bg text-text-gray hover:bg-border-def'
            }`}
          >
            <Clock size={11} />
            <span className="whitespace-nowrap">{timeLabel ?? '시간'}</span>
          </button>

          {showTimeEdit && (
            <div className="absolute left-0 top-full mt-1 bg-surface border border-border-def rounded-[12px] shadow-sm z-30 p-3 w-56" onClick={e => e.stopPropagation()}>
              <p className="text-[12px] font-semibold text-text-gray mb-3">시간 설정</p>

              {/* 시작 시간 */}
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => setStartEnabled(v => !v)}
                  className={`w-8 h-4 rounded-full transition-colors relative flex-shrink-0 ${startEnabled ? 'bg-teal' : 'bg-border-def'}`}
                >
                  <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${startEnabled ? 'left-4' : 'left-0.5'}`} />
                </button>
                <span className="text-[11px] text-text-gray w-12 flex-shrink-0">시작</span>
                <input
                  type="text" inputMode="numeric" value={startVal}
                  onChange={handleTimeInput(setStartVal)}
                  disabled={!startEnabled}
                  placeholder="09:00" maxLength={5}
                  className={`flex-1 border rounded-[8px] px-2 py-1 text-[12px] outline-none transition-colors ${
                    !startEnabled ? 'bg-page-bg text-text-muted border-border-def' :
                    startVal && !isValidTime(startVal) ? 'border-error' : 'border-border-def focus:border-teal'
                  }`}
                />
              </div>

              {/* 끝 시간 */}
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => setEndEnabled(v => !v)}
                  className={`w-8 h-4 rounded-full transition-colors relative flex-shrink-0 ${endEnabled ? 'bg-teal' : 'bg-border-def'}`}
                >
                  <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${endEnabled ? 'left-4' : 'left-0.5'}`} />
                </button>
                <span className="text-[11px] text-text-gray w-12 flex-shrink-0">종료</span>
                <input
                  type="text" inputMode="numeric" value={endVal}
                  onChange={handleTimeInput(setEndVal)}
                  disabled={!endEnabled}
                  placeholder="18:00" maxLength={5}
                  className={`flex-1 border rounded-[8px] px-2 py-1 text-[12px] outline-none transition-colors ${
                    !endEnabled ? 'bg-page-bg text-text-muted border-border-def' :
                    endVal && !isValidTime(endVal) ? 'border-error' : 'border-border-def focus:border-teal'
                  }`}
                />
              </div>

              <div className="flex gap-2">
                <button onClick={clearTime} className="flex-1 py-1.5 rounded-[8px] bg-page-bg text-text-body text-[12px] font-medium">지우기</button>
                <button onClick={commitTime} className="flex-1 py-1.5 rounded-[8px] bg-teal text-white text-[12px] font-semibold">확인</button>
              </div>
            </div>
          )}
        </div>

        {/* 태그 */}
        <div className="relative flex-shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowTagDrop(v => !v)}
              className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-[8px] transition-colors ${
                parent.tag ? getTagColor(parent.tag, tagColors) : 'bg-page-bg text-text-gray hover:bg-border-def'
              }`}
            >
              {parent.tag ?? '태그'}
              <DropIcon size={10} />
            </button>
            {/* 툴팁 아이콘 */}
            <div className="relative">
              <button
                onMouseEnter={() => setShowTagTooltip(true)}
                onMouseLeave={() => setShowTagTooltip(false)}
                className="text-text-muted hover:text-text-gray text-[10px] leading-none"
              >
                ⓘ
              </button>
              {showTagTooltip && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 bg-text-dark text-white text-[11px] rounded-[8px] px-2 py-1 whitespace-nowrap z-40 pointer-events-none">
                  설정에서 태그를 추가할 수 있어요
                </div>
              )}
            </div>
          </div>

          {showTagDrop && (
            <div className="absolute left-0 top-full mt-1 bg-surface border border-border-def rounded-[10px] shadow-sm z-30 w-36 overflow-hidden" onClick={e => e.stopPropagation()}>
              {parent.tag && (
                <button
                  onMouseDown={() => { onUpdate(parent.id, { tag: undefined }); setShowTagDrop(false) }}
                  className="w-full text-left px-3 py-2 text-[12px] text-error hover:bg-error-bg flex items-center gap-1"
                >
                  <X size={11} /> 태그 제거
                </button>
              )}
              {tagList.length === 0 ? (
                <p className="text-[12px] text-text-gray px-3 py-2">설정에서 태그를 추가하세요</p>
              ) : (
                tagList.map(t => (
                  <button
                    key={t}
                    onMouseDown={() => { onUpdate(parent.id, { tag: t }); setShowTagDrop(false) }}
                    className="w-full text-left px-3 py-2 hover:bg-page-bg"
                  >
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-[6px] ${getTagColor(t, tagColors)}`}>{t}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* 제목 */}
        <div className="flex-1 min-w-0" onClick={() => hasDetail && setExpanded(e => !e)}>
          {editingTitle ? (
            <input
              autoFocus
              value={titleVal}
              onChange={e => setTitleVal(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={e => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') { setTitleVal(parent.title); setEditingTitle(false) } }}
              onClick={e => e.stopPropagation()}
              className="w-full font-semibold text-text-dark bg-transparent border-b border-teal outline-none text-[14px]"
            />
          ) : (
            <span
              onDoubleClick={e => { e.stopPropagation(); setEditingTitle(true) }}
              className={`font-semibold text-[14px] leading-snug block truncate ${done ? 'line-through text-text-gray' : 'text-text-dark'}`}
            >
              {parent.title}
            </span>
          )}
        </div>

        {/* 완료 체크 */}
        <button
          onClick={() => onToggle(parent.id)}
          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
            done ? 'bg-teal border-teal' : 'border-border-def hover:border-teal'
          }`}
        >
          {done && <Check size={11} className="text-white" strokeWidth={3} />}
        </button>

        {hasDetail && (
          <button onClick={() => setExpanded(e => !e)} className="p-0.5 flex-shrink-0">
            {expanded ? <ChevronDown size={15} className="text-text-gray" /> : <ChevronRight size={15} className="text-text-gray" />}
          </button>
        )}
        <button onClick={() => onEdit(parent)} className="p-1 rounded-full hover:bg-page-bg flex-shrink-0">
          <Pencil size={14} className="text-text-gray" style={{ opacity: 0.6 }} />
        </button>
        <button onClick={() => onDelete(parent.id)} className="p-1 rounded-full hover:bg-error-bg flex-shrink-0">
          <Trash2 size={14} className="text-error" style={{ opacity: 0.5 }} />
        </button>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="pb-2 border-t border-border-def">
          <div className="px-4 py-2">
            {editingDesc ? (
              <textarea
                autoFocus value={descVal} onChange={e => setDescVal(e.target.value)} onBlur={commitDesc}
                placeholder="설명 입력..." rows={2}
                className="w-full text-[13px] text-text-body bg-page-bg rounded-[10px] px-3 py-2 outline-none resize-none border-[1.5px] border-border-def focus:border-teal transition-colors"
              />
            ) : parent.description ? (
              <p
                onClick={() => setEditingDesc(true)}
                className="text-[13px] text-text-body bg-page-bg rounded-[10px] px-3 py-2 cursor-pointer hover:bg-border-def whitespace-pre-wrap"
              >
                {parent.description}
              </p>
            ) : (
              <button onClick={() => setEditingDesc(true)} className="text-[12px] text-text-muted hover:text-text-gray">
                + 설명 추가
              </button>
            )}
          </div>

          {enableSubTodo && (
            <>
              {subs.map(sub => (
                <SubTodoItem key={sub.id} sub={sub} onToggle={onToggleSub} onDelete={onDeleteSub} onUpdate={onUpdateSub} />
              ))}
              {showAddSub ? (
                <div className="flex items-center gap-2 py-1.5 pl-9 pr-2">
                  <div className="w-4 h-4 rounded border-2 border-dashed border-border-def flex-shrink-0" />
                  <input
                    autoFocus value={addingSubTitle} onChange={e => setAddingSubTitle(e.target.value)}
                    onBlur={handleAddSub}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddSub(); if (e.key === 'Escape') setShowAddSub(false) }}
                    placeholder="서브 투두..."
                    className="flex-1 text-[13px] bg-transparent outline-none placeholder-text-muted text-text-dark"
                  />
                </div>
              ) : (
                <button onClick={() => setShowAddSub(true)} className="flex items-center gap-1 text-[12px] text-text-gray hover:text-teal pl-9 py-1">
                  <Plus size={13} /> 서브 투두 추가
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
