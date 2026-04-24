import { useState } from 'react'
import { ChevronDown, ChevronRight, Trash2, Check, Plus, Clock, X, ChevronDown as DropIcon, Pencil, GripVertical } from 'lucide-react'
import type { ParentTodo, SubTodo } from '../types'
import { formatTime } from '../types'
import SubTodoItem from './SubTodoItem'
import { getTagColor } from './TagManageModal'

interface Props {
  parent: ParentTodo
  subs: SubTodo[]
  tagList: string[]
  tagColors: Record<string, string>
  enableSubTodo: boolean
  isDragging?: boolean
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
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
  parent, subs, tagList, tagColors, enableSubTodo, isDragging, dragHandleProps,
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
  const [showTagDrop, setShowTagDrop] = useState(false)

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

  const handleAddSub = () => {
    if (addingSubTitle.trim()) onAddSub(parent.id, addingSubTitle.trim())
    setAddingSubTitle(''); setShowAddSub(false)
  }

  return (
    <div className={`transition-opacity ${done ? 'opacity-55' : ''} ${isDragging ? 'shadow-lg' : ''}`}>
      {/* Main row */}
      <div className="flex items-center gap-2 px-4 py-3">

        {/* 드래그 핸들 (dragHandleProps 있을 때만) */}
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none p-1"
          >
            <GripVertical size={15} className="text-border-def" />
          </div>
        )}

        {/* 시간 — 클릭 시 수정 모달 열기 */}
        <button
          onClick={() => onEdit(parent)}
          className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-[8px] transition-colors flex-shrink-0 ${
            timeLabel ? 'bg-teal-light text-teal' : 'bg-page-bg text-text-gray hover:bg-border-def'
          }`}
        >
          <Clock size={11} />
          <span className="whitespace-nowrap">{timeLabel ?? '시간'}</span>
        </button>

        {/* 태그 드롭다운 */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowTagDrop(v => !v)}
            className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-[8px] transition-colors ${
              parent.tag ? getTagColor(parent.tag, tagColors) : 'bg-page-bg text-text-gray hover:bg-border-def'
            }`}
          >
            {parent.tag ?? '태그'}
            <DropIcon size={10} />
          </button>

          {showTagDrop && (
            <div
              className="fixed z-50 bg-surface border border-border-def rounded-[10px] w-36 overflow-hidden"
              style={{ top: 'auto', left: 'auto' }}
              onClick={e => e.stopPropagation()}
            >
              {parent.tag && (
                <button
                  onMouseDown={() => { onUpdate(parent.id, { tag: undefined }); setShowTagDrop(false) }}
                  onTouchEnd={() => { onUpdate(parent.id, { tag: undefined }); setShowTagDrop(false) }}
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
                    onTouchEnd={() => { onUpdate(parent.id, { tag: t }); setShowTagDrop(false) }}
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
        <div className="flex-1 min-w-0" onClick={() => !editingTitle && hasDetail && setExpanded(e => !e)}>
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

      {/* Expanded section */}
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
                    placeholder="서브 TO-DO..."
                    className="flex-1 text-[13px] bg-transparent outline-none placeholder-text-muted text-text-dark"
                  />
                </div>
              ) : (
                <button onClick={() => setShowAddSub(true)} className="flex items-center gap-1 text-[12px] text-text-gray hover:text-teal pl-9 py-1">
                  <Plus size={13} /> 서브 TO-DO 추가
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
