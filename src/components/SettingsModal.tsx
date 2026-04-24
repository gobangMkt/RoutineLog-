import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Tag, ChevronRight, ChevronLeft, Check, Pencil } from 'lucide-react'
import type { UserSettings, CompletionMode, ViewMode } from '../types'
import { getTagColor, TAG_COLORS } from './TagManageModal'

interface Props {
  settings: UserSettings
  tagList: string[]
  tagColors: Record<string, string>
  onClose: () => void
  onUpdate: (s: UserSettings) => void
  onAddTag: (name: string) => void
  onDeleteTag: (name: string) => void
  onSetTagColor: (name: string, colorId: string) => void
  onRenameTag: (oldName: string, newName: string) => void
}

const modes: { value: CompletionMode; label: string; desc: string }[] = [
  { value: 'keep', label: '유지 (기본)', desc: '완료해도 리스트에 남아요. 취소선으로 표시.' },
  { value: 'hide', label: '숨김', desc: '완료 항목을 화면에서 숨깁니다. 데이터는 유지.' },
  { value: 'delete', label: '삭제', desc: '완료 즉시 항목이 삭제됩니다.' },
]

const viewModes: { value: ViewMode; label: string; desc: string }[] = [
  { value: 'default', label: '추가순', desc: 'TO-DO를 추가한 순서로 표시합니다.' },
  { value: 'time', label: '시간순', desc: '이른 시간 → 늦은 시간 순으로 정렬합니다.' },
  { value: 'tag', label: '태그별', desc: '같은 태그끼리 묶어서 표시합니다.' },
]

type View = 'main' | 'tags'

function TagEditRow({
  tag, tagColors, onDelete, onSetColor, onRename,
}: {
  tag: string
  tagColors: Record<string, string>
  onDelete: () => void
  onSetColor: (colorId: string) => void
  onRename: (newName: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState(tag)
  const [showColors, setShowColors] = useState(false)

  const commitRename = () => {
    if (editVal.trim() && editVal.trim() !== tag) onRename(editVal.trim())
    else setEditVal(tag)
    setEditing(false)
  }

  const cancelEdit = () => {
    setEditVal(tag)
    setEditing(false)
  }

  const dotColor = TAG_COLORS.find(c => c.id === tagColors[tag])?.dot
    ?? TAG_COLORS[Math.abs(Array.from(tag).reduce((h, c) => c.charCodeAt(0) + ((h << 5) - h), 0)) % TAG_COLORS.length].dot

  return (
    <div className="rounded-[10px] bg-page-bg border-[1.5px] border-border-def mb-2 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Color dot */}
        <button
          onClick={() => setShowColors(v => !v)}
          className="flex-shrink-0 w-5 h-5 rounded-full"
          style={{ backgroundColor: dotColor }}
        />

        {/* Name / edit input */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              autoFocus
              value={editVal}
              onChange={e => setEditVal(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') cancelEdit()
              }}
              className="w-full text-[14px] font-semibold text-text-dark bg-transparent border-b-[1.5px] border-teal outline-none py-0.5"
            />
          ) : (
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-[6px] ${getTagColor(tag, tagColors)}`}>{tag}</span>
          )}
        </div>

        {/* 수정완료 or 편집/삭제 버튼 */}
        {editing ? (
          <>
            <button
              onClick={commitRename}
              className="flex-shrink-0 px-2.5 py-1 rounded-[6px] bg-teal text-white text-[12px] font-semibold"
            >
              수정완료
            </button>
            <button
              onClick={cancelEdit}
              className="flex-shrink-0 p-1.5 hover:bg-border-def rounded-[6px] transition-colors"
            >
              <X size={13} className="text-text-gray" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => { setEditing(true); setEditVal(tag) }}
              className="flex-shrink-0 p-1.5 hover:bg-border-def rounded-[6px] transition-colors"
            >
              <Pencil size={13} className="text-text-gray" />
            </button>
            <button
              onClick={onDelete}
              className="flex-shrink-0 p-1.5 hover:bg-error-bg rounded-[6px] transition-colors"
            >
              <Trash2 size={13} className="text-error" />
            </button>
          </>
        )}
      </div>

      {/* Color picker */}
      {showColors && (
        <div className="px-4 pb-3 flex gap-2 flex-wrap border-t border-border-def pt-3">
          {TAG_COLORS.map(c => {
            const active = (tagColors[tag] === c.id)
              || (!tagColors[tag] && TAG_COLORS[Math.abs(Array.from(tag).reduce((h, ch) => ch.charCodeAt(0) + ((h << 5) - h), 0)) % TAG_COLORS.length].id === c.id)
            return (
              <button
                key={c.id}
                onClick={() => { onSetColor(c.id); setShowColors(false) }}
                className="relative w-7 h-7 rounded-full transition-transform hover:scale-110"
                style={{ backgroundColor: c.dot }}
              >
                {active && <Check size={12} className="text-white absolute inset-0 m-auto" strokeWidth={3} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function SettingsModal({ settings, tagList, tagColors, onClose, onUpdate, onAddTag, onDeleteTag, onSetTagColor, onRenameTag }: Props) {
  const [view, setView] = useState<View>('main')
  const [tagInput, setTagInput] = useState('')

  // 배경 스크롤 잠금
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const handleAddTag = () => {
    const t = tagInput.trim()
    if (t && !tagList.includes(t)) { onAddTag(t); setTagInput('') }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-[480px] bg-surface rounded-t-[20px] slide-up flex flex-col"
        style={{ maxHeight: '90dvh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-border-def rounded-full mx-auto mt-5 flex-shrink-0" />

        {view === 'main' ? (
          <>
            <div className="flex items-center justify-between px-6 pt-4 pb-0 flex-shrink-0">
              <h2 className="text-[20px] font-bold text-text-dark">설정</h2>
              <button onClick={onClose} className="p-1 rounded-[8px] hover:bg-page-bg">
                <X size={20} className="text-text-gray" />
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain flex-1 px-6 pt-4 pb-8">
              {/* Sub TO-DO */}
              <div className="flex items-center justify-between px-4 py-4 rounded-[10px] border-[1.5px] border-border-def bg-page-bg mb-5">
                <div>
                  <p className="text-[14px] font-semibold text-text-dark">서브 TO-DO</p>
                  <p className="text-[13px] text-text-gray mt-0.5">TO-DO 안에 세부 항목을 추가할 수 있어요</p>
                </div>
                <button
                  onClick={() => onUpdate({ ...settings, enableSubTodo: !settings.enableSubTodo })}
                  className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${settings.enableSubTodo ? 'bg-teal' : 'bg-border-def'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${settings.enableSubTodo ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              {/* View mode */}
              <p className="text-[13px] font-semibold text-text-gray mb-2 tracking-[0.3px]">TO-DO 보기 방식</p>
              <div className="space-y-2 mb-5">
                {viewModes.map(m => (
                  <button
                    key={m.value}
                    onClick={() => onUpdate({ ...settings, viewMode: m.value })}
                    className={`w-full px-4 py-3 rounded-[10px] border-[1.5px] text-left transition-colors ${
                      (settings.viewMode ?? 'default') === m.value
                        ? 'border-teal bg-teal-sel'
                        : 'border-border-def bg-page-bg hover:border-text-gray'
                    }`}
                  >
                    <p className={`text-[14px] font-semibold ${(settings.viewMode ?? 'default') === m.value ? 'text-teal' : 'text-text-dark'}`}>{m.label}</p>
                    <p className="text-[13px] text-text-gray mt-0.5">{m.desc}</p>
                  </button>
                ))}
              </div>

              {/* Completion mode */}
              <p className="text-[13px] font-semibold text-text-gray mb-2 tracking-[0.3px]">완료 처리 방식</p>
              <div className="space-y-2 mb-5">
                {modes.map(m => (
                  <button
                    key={m.value}
                    onClick={() => onUpdate({ ...settings, completionMode: m.value })}
                    className={`w-full px-4 py-3 rounded-[10px] border-[1.5px] text-left transition-colors ${
                      settings.completionMode === m.value
                        ? 'border-teal bg-teal-sel'
                        : 'border-border-def bg-page-bg hover:border-text-gray'
                    }`}
                  >
                    <p className={`text-[14px] font-semibold ${settings.completionMode === m.value ? 'text-teal' : 'text-text-dark'}`}>{m.label}</p>
                    <p className="text-[13px] text-text-gray mt-0.5">{m.desc}</p>
                  </button>
                ))}
              </div>

              {settings.completionMode === 'delete' && (
                <div className="bg-error-bg border-[1.5px] border-error rounded-[10px] px-4 py-3 mb-5">
                  <p className="text-[13px] text-error">⚠️ 삭제 모드에서는 완료 즉시 항목이 제거됩니다.</p>
                </div>
              )}

              {/* Tag management */}
              <p className="text-[13px] font-semibold text-text-gray mb-2 tracking-[0.3px]">기타</p>
              <button
                onClick={() => setView('tags')}
                className="w-full flex items-center justify-between px-4 py-4 rounded-[10px] border-[1.5px] border-border-def bg-page-bg hover:border-teal hover:bg-teal-sel transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Tag size={16} className="text-teal" />
                  <div className="text-left">
                    <p className="text-[14px] font-semibold text-text-dark">태그 관리</p>
                    <p className="text-[13px] text-text-gray mt-0.5">
                      {tagList.length > 0 ? `${tagList.length}개의 태그` : '태그 없음'}
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-text-gray" />
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 px-6 pt-4 pb-0 flex-shrink-0">
              <button onClick={() => setView('main')} className="p-1 rounded-[8px] hover:bg-page-bg">
                <ChevronLeft size={20} className="text-text-gray" />
              </button>
              <h2 className="text-[20px] font-bold text-text-dark flex-1">태그 관리</h2>
              <button onClick={onClose} className="p-1 rounded-[8px] hover:bg-page-bg">
                <X size={20} className="text-text-gray" />
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain flex-1 px-6 pt-4 pb-8">
              <div className="flex gap-2 mb-4">
                <input
                  autoFocus
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                  placeholder="새 태그 이름"
                  className="flex-1 px-4 py-[14px] border-[1.5px] border-border-def focus:border-teal rounded-[10px] text-[15px] text-text-dark outline-none transition-colors placeholder:text-text-muted"
                />
                <button
                  onClick={handleAddTag}
                  disabled={!tagInput.trim() || tagList.includes(tagInput.trim())}
                  className="px-4 py-[14px] rounded-[10px] bg-teal text-white text-[14px] font-semibold disabled:bg-disabled-bg disabled:text-text-muted flex items-center gap-1 transition-colors"
                >
                  <Plus size={15} /> 추가
                </button>
              </div>

              {tagList.length === 0 ? (
                <div className="flex flex-col items-center py-8">
                  <Tag size={32} className="text-border-def mb-3" />
                  <p className="text-[14px] font-semibold text-text-dark">태그가 없어요</p>
                  <p className="text-[13px] text-text-gray mt-1">위에서 태그를 추가해보세요</p>
                </div>
              ) : (
                <div>
                  <p className="text-[12px] text-text-gray mb-3">색상 점을 눌러 색상을 변경하고, ✏️ 버튼으로 이름을 수정하세요</p>
                  {tagList.map(tag => (
                    <TagEditRow
                      key={tag}
                      tag={tag}
                      tagColors={tagColors}
                      onDelete={() => onDeleteTag(tag)}
                      onSetColor={colorId => onSetTagColor(tag, colorId)}
                      onRename={newName => onRenameTag(tag, newName)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
