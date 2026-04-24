import { useState } from 'react'
import { Trash2, Check } from 'lucide-react'
import type { SubTodo } from '../types'

interface Props {
  sub: SubTodo
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, title: string) => void
}

export default function SubTodoItem({ sub, onToggle, onDelete, onUpdate }: Props) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(sub.title)
  const done = sub.status === 'done'

  const commit = () => {
    if (val.trim()) onUpdate(sub.id, val.trim())
    else setVal(sub.title)
    setEditing(false)
  }

  return (
    <div className="flex items-center gap-2 py-1.5 pl-9 pr-2 group hover:bg-page-bg rounded-[10px]">
      <button
        onClick={() => onToggle(sub.id)}
        className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          done ? 'bg-teal border-teal' : 'border-border-def hover:border-teal'
        }`}
      >
        {done && <Check size={10} className="text-white" strokeWidth={3} />}
      </button>

      {editing ? (
        <input
          autoFocus
          value={val}
          onChange={e => setVal(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setVal(sub.title); setEditing(false) } }}
          className="flex-1 text-[13px] bg-transparent border-b border-teal outline-none py-0.5 text-text-dark"
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          className={`flex-1 text-[13px] cursor-pointer ${done ? 'line-through text-text-gray' : 'text-text-body'}`}
        >
          {sub.title}
        </span>
      )}

      <button
        onClick={() => onDelete(sub.id)}
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-error-bg transition-all"
      >
        <Trash2 size={13} className="text-error" />
      </button>
    </div>
  )
}
