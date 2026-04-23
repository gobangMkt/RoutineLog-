import { useState } from 'react'
import { Trash2, Clock, StickyNote } from 'lucide-react'
import type { Note } from '../types'

interface Props {
  note: Note
  onDelete: (id: string) => void
  onUpdate: (id: string, patch: Partial<Note>) => void
}

export default function NoteCard({ note, onDelete, onUpdate }: Props) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(note.content)

  const commit = () => {
    if (val.trim()) onUpdate(note.id, { content: val.trim() })
    else setVal(note.content)
    setEditing(false)
  }

  return (
    <div className="bg-yellow-50 border border-yellow-100 rounded-2xl px-4 py-3 mb-3 flex items-start gap-3 group">
      <StickyNote size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {note.time && (
          <span className="flex items-center gap-1 text-xs text-yellow-500 font-medium mb-1">
            <Clock size={11} /> {note.time}
          </span>
        )}
        {editing ? (
          <textarea
            autoFocus
            value={val}
            onChange={e => setVal(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key === 'Escape') { setVal(note.content); setEditing(false) } }}
            rows={3}
            className="w-full text-sm text-gray-700 bg-transparent outline-none resize-none border-b border-yellow-300"
          />
        ) : (
          <p
            onClick={() => setEditing(true)}
            className="text-sm text-gray-700 whitespace-pre-wrap cursor-pointer leading-relaxed"
          >
            {note.content}
          </p>
        )}
      </div>
      <button
        onClick={() => onDelete(note.id)}
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 transition-all flex-shrink-0"
      >
        <Trash2 size={14} className="text-red-400" />
      </button>
    </div>
  )
}
