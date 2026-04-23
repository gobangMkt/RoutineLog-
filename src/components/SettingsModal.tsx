import { X } from 'lucide-react'
import type { UserSettings, CompletionMode } from '../types'

interface Props {
  settings: UserSettings
  onClose: () => void
  onUpdate: (s: UserSettings) => void
}

const modes: { value: CompletionMode; label: string; desc: string }[] = [
  { value: 'keep', label: '유지 (기본)', desc: '완료해도 리스트에 남아요. 취소선으로 표시됩니다.' },
  { value: 'hide', label: '숨김', desc: '완료 항목을 화면에서 숨깁니다. 데이터는 유지됩니다.' },
  { value: 'delete', label: '삭제', desc: '완료 즉시 항목이 삭제됩니다. 복구가 안됩니다.' },
]

export default function SettingsModal({ settings, onClose, onUpdate }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl p-5 pb-8 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg text-gray-900">설정</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

        <p className="text-sm font-semibold text-gray-700 mb-3">완료 처리 방식</p>
        <div className="space-y-2">
          {modes.map(m => (
            <button
              key={m.value}
              onClick={() => onUpdate({ ...settings, completionMode: m.value })}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-colors ${
                settings.completionMode === m.value
                  ? 'border-primary bg-blue-50'
                  : 'border-gray-100 bg-gray-50 hover:border-gray-200'
              }`}
            >
              <p className={`font-semibold text-sm ${settings.completionMode === m.value ? 'text-primary' : 'text-gray-800'}`}>
                {m.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
            </button>
          ))}
        </div>

        {settings.completionMode === 'delete' && (
          <p className="mt-3 text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">
            ⚠️ 삭제 모드에서는 완료 즉시 항목이 제거됩니다. 신중하게 사용하세요.
          </p>
        )}
      </div>
    </div>
  )
}
