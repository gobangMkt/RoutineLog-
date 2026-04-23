import { useState } from 'react'
import { X } from 'lucide-react'

type Tab = 'todo' | 'note'

interface Props {
  onClose: () => void
  onAddParent: (title: string, time?: string) => void
  onAddNote: (content: string, time?: string) => void
}

export default function AddModal({ onClose, onAddParent, onAddNote }: Props) {
  const [tab, setTab] = useState<Tab>('todo')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [time, setTime] = useState('')

  const handleSubmit = () => {
    if (tab === 'todo' && title.trim()) {
      onAddParent(title.trim(), time || undefined)
      onClose()
    } else if (tab === 'note' && content.trim()) {
      onAddNote(content.trim(), time || undefined)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl p-5 pb-8 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

        {/* Tab */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('todo')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === 'todo' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            투두 추가
          </button>
          <button
            onClick={() => setTab('note')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === 'note' ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            메모 추가
          </button>
        </div>

        {tab === 'todo' ? (
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="투두 제목을 입력하세요"
            className="w-full text-[15px] font-medium outline-none border-b-2 border-gray-200 focus:border-primary pb-2 mb-4 transition-colors"
          />
        ) : (
          <textarea
            autoFocus
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="메모 내용을 입력하세요"
            rows={3}
            className="w-full text-[15px] outline-none border-b-2 border-gray-200 focus:border-yellow-400 pb-2 mb-4 transition-colors resize-none"
          />
        )}

        <div className="flex items-center gap-3 mb-5">
          <label className="text-sm text-gray-500 flex-shrink-0">시간 (선택)</label>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-primary"
          />
          {time && (
            <button onClick={() => setTime('')} className="text-xs text-gray-400 hover:text-red-400">
              <X size={14} />
            </button>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={tab === 'todo' ? !title.trim() : !content.trim()}
          className="w-full py-3 rounded-2xl bg-primary text-white font-semibold text-[15px] disabled:opacity-40 hover:bg-blue-600 transition-colors"
        >
          추가하기
        </button>
      </div>
    </div>
  )
}
