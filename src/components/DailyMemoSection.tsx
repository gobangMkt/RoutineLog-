import { useState } from 'react'
import { Plus, Trash2, StickyNote } from 'lucide-react'
import type { MemoItem } from '../types'

interface Props {
  date: string
  memos: MemoItem[]
  onAdd: (date: string, content: string) => void
  onUpdate: (id: string, content: string) => void
  onDelete: (id: string) => void
}

function MemoCard({ memo, onUpdate, onDelete }: { memo: MemoItem; onUpdate: (id: string, content: string) => void; onDelete: (id: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(memo.content)

  const commit = () => {
    if (val.trim()) onUpdate(memo.id, val.trim())
    else setVal(memo.content)
    setEditing(false)
  }

  return (
    <div className="bg-teal-light border-[1.5px] border-teal-border rounded-[10px] px-4 py-3 mb-2 group">
      <div className="flex items-start gap-2">
        <StickyNote size={16} className="text-teal flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          {editing ? (
            <textarea
              autoFocus value={val} onChange={e => setVal(e.target.value)} onBlur={commit}
              onKeyDown={e => e.key === 'Escape' && commit()}
              rows={3}
              className="w-full bg-transparent outline-none text-[14px] text-text-body resize-none border-b border-teal-border leading-relaxed"
            />
          ) : (
            <p onClick={() => setEditing(true)} className="text-[14px] text-text-body whitespace-pre-wrap leading-relaxed cursor-pointer">
              {memo.content}
            </p>
          )}
          <p className="text-[11px] text-teal mt-1">
            {new Date(memo.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button
          onClick={() => onDelete(memo.id)}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-[6px] hover:bg-error-bg flex-shrink-0 transition-all"
        >
          <Trash2 size={16} className="text-error" />
        </button>
      </div>
    </div>
  )
}

export default function DailyMemoSection({ date, memos, onAdd, onUpdate, onDelete }: Props) {
  const [adding, setAdding] = useState(false)
  const [newContent, setNewContent] = useState('')

  const handleAdd = () => {
    if (newContent.trim()) {
      onAdd(date, newContent.trim())
      setNewContent('')
    }
    setAdding(false)
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div>
      {memos.length === 0 && !adding && (
        <div className="flex flex-col items-center py-8 text-text-gray">
          <StickyNote size={36} className="text-border-def mb-3" />
          <p className="text-[14px] font-semibold text-text-dark">{date === today ? '오늘의 메모가 없어요' : '이 날의 메모가 없어요'}</p>
          <p className="text-[13px] text-text-gray mt-1">아래 버튼으로 메모를 추가해보세요</p>
        </div>
      )}

      {memos.map(memo => (
        <MemoCard key={memo.id} memo={memo} onUpdate={onUpdate} onDelete={onDelete} />
      ))}

      {adding ? (
        <div className="bg-teal-light border-[1.5px] border-teal rounded-[10px] px-4 py-3 mb-2">
          <textarea
            autoFocus
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') { setAdding(false); setNewContent('') } }}
            placeholder="메모 내용을 입력하세요..."
            rows={4}
            className="w-full bg-transparent outline-none text-[14px] text-text-body resize-none placeholder:text-teal/50 leading-relaxed"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => { setAdding(false); setNewContent('') }}
              className="flex-1 py-2 rounded-[10px] bg-cancel-bg text-cancel-text text-[14px] font-semibold"
            >
              취소
            </button>
            <button
              onClick={handleAdd}
              disabled={!newContent.trim()}
              className="flex-1 py-2 rounded-[10px] bg-teal text-white text-[14px] font-bold disabled:opacity-40"
            >
              저장
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px] border-[1.5px] border-dashed border-teal-border text-teal hover:bg-teal-light text-[14px] font-semibold transition-colors"
        >
          <Plus size={16} /> 메모 추가
        </button>
      )}
    </div>
  )
}
