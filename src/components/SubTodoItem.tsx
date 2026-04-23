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
    <div className="flex items-center gap-2 py-1.5 pl-9 pr-2 group hover:bg-gray-50 rounded-lg">
      <button
        onClick={() => onToggle(sub.id)}
        className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          done ? 'bg-gray-300 border-gray-300' : 'border-gray-300 hover:border-primary'
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
          className="flex-1 text-sm bg-transparent border-b border-primary outline-none py-0.5"
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          className={`flex-1 text-sm cursor-pointer ${done ? 'line-through text-gray-400' : 'text-gray-700'}`}
        >
          {sub.title}
        </span>
      )}

      <button
        onClick={() => onDelete(sub.id)}
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 transition-all"
      >
        <Trash2 size={13} className="text-red-400" />
      </button>
    </div>
  )
}
