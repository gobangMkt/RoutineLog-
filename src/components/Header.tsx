import { Settings, BookTemplate } from 'lucide-react'

interface Props {
  currentDate: string
  onToday: () => void
  onOpenSettings: () => void
  onOpenTemplate: () => void
}

export default function Header({ onToday, onOpenSettings, onOpenTemplate }: Props) {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        <button onClick={onToday} className="text-xl font-black text-gray-900 tracking-tight">
          루틴로그
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenTemplate}
            className="flex items-center gap-1 text-sm text-primary font-medium px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <BookTemplate size={15} />
            템플릿
          </button>
          <button onClick={onOpenSettings} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <Settings size={20} className="text-gray-500" />
          </button>
        </div>
      </div>
    </header>
  )
}
