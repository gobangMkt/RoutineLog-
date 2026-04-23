import { useState } from 'react'
import { ChevronDown, ChevronRight, Trash2, Check, Plus, Clock } from 'lucide-react'
import type { ParentTodo, SubTodo } from '../types'
import SubTodoItem from './SubTodoItem'

interface Props {
  parent: ParentTodo
  subs: SubTodo[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, patch: Partial<ParentTodo>) => void
  onAddSub: (parentId: string, title: string) => void
  onToggleSub: (id: string) => void
  onDeleteSub: (id: string) => void
  onUpdateSub: (id: string, title: string) => void
}

export default function ParentCard({
  parent, subs,
  onToggle, onDelete, onUpdate,
  onAddSub, onToggleSub, onDeleteSub, onUpdateSub,
}: Props) {
  const [expanded, setExpanded] = useState(true)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleVal, setTitleVal] = useState(parent.title)
  const [addingSubTitle, setAddingSubTitle] = useState('')
  const [showAddSub, setShowAddSub] = useState(false)
  const done = parent.status === 'done'
  const doneCount = subs.filter(s => s.status === 'done').length

  const commitTitle = () => {
    if (titleVal.trim()) onUpdate(parent.id, { title: titleVal.trim() })
    else setTitleVal(parent.title)
    setEditingTitle(false)
  }

  const handleAddSub = () => {
    if (addingSubTitle.trim()) {
      onAddSub(parent.id, addingSubTitle.trim())
      setAddingSubTitle('')
    }
    setShowAddSub(false)
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 mb-3 overflow-hidden transition-opacity ${done ? 'opacity-60' : ''}`}>
      {/* Parent row */}
      <div className="flex items-start gap-2 px-4 py-3">
        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-0.5 p-0.5 rounded hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          {expanded
            ? <ChevronDown size={16} className="text-gray-400" />
            : <ChevronRight size={16} className="text-gray-400" />}
        </button>

        {/* Checkbox */}
        <button
          onClick={() => onToggle(parent.id)}
          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors ${
            done ? 'bg-primary border-primary' : 'border-gray-300 hover:border-primary'
          }`}
        >
          {done && <Check size={11} className="text-white" strokeWidth={3} />}
        </button>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          {editingTitle ? (
            <input
              autoFocus
              value={titleVal}
              onChange={e => setTitleVal(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={e => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') { setTitleVal(parent.title); setEditingTitle(false) } }}
              className="w-full font-semibold text-gray-900 bg-transparent border-b border-primary outline-none text-[15px]"
            />
          ) : (
            <span
              onClick={() => setEditingTitle(true)}
              className={`font-semibold text-[15px] cursor-pointer leading-snug block ${done ? 'line-through text-gray-400' : 'text-gray-900'}`}
            >
              {parent.title}
            </span>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            {parent.time && (
              <span className="flex items-center gap-1 text-xs text-primary font-medium">
                <Clock size={11} /> {parent.time}
              </span>
            )}
            {subs.length > 0 && (
              <span className="text-xs text-gray-400">{doneCount}/{subs.length}</span>
            )}
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={() => onDelete(parent.id)}
          className="p-1.5 rounded-full hover:bg-red-50 transition-colors flex-shrink-0"
        >
          <Trash2 size={15} className="text-red-300 hover:text-red-500" />
        </button>
      </div>

      {/* Sub todos */}
      {expanded && (
        <div className="pb-2">
          {subs.map(sub => (
            <SubTodoItem
              key={sub.id}
              sub={sub}
              onToggle={onToggleSub}
              onDelete={onDeleteSub}
              onUpdate={onUpdateSub}
            />
          ))}

          {showAddSub ? (
            <div className="flex items-center gap-2 py-1.5 pl-9 pr-2">
              <div className="w-4 h-4 rounded border-2 border-dashed border-gray-300 flex-shrink-0" />
              <input
                autoFocus
                value={addingSubTitle}
                onChange={e => setAddingSubTitle(e.target.value)}
                onBlur={handleAddSub}
                onKeyDown={e => { if (e.key === 'Enter') handleAddSub(); if (e.key === 'Escape') setShowAddSub(false) }}
                placeholder="서브 투두 입력..."
                className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-300"
              />
            </div>
          ) : (
            <button
              onClick={() => setShowAddSub(true)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary pl-9 py-1 transition-colors"
            >
              <Plus size={13} /> 서브 투두 추가
            </button>
          )}
        </div>
      )}
    </div>
  )
}
