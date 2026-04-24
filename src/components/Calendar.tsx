import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

interface Props {
  currentDate: string
  markedDates: Record<string, { total: number; done: number }>
  onSelectDate: (date: string) => void
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

function toYMD(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function Calendar({ currentDate, markedDates, onSelectDate }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const [viewYear, setViewYear] = useState(() => parseInt(currentDate.slice(0, 4)))
  const [viewMonth, setViewMonth] = useState(() => parseInt(currentDate.slice(5, 7)) - 1)

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }
  const goToday = () => {
    const t = new Date()
    setViewYear(t.getFullYear())
    setViewMonth(t.getMonth())
    onSelectDate(today)
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="px-5 pt-4 pb-4">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1.5 rounded-[10px] hover:bg-page-bg transition-colors">
          <ChevronLeft size={18} className="text-text-gray" />
        </button>
        <button
          onClick={goToday}
          className="text-[16px] font-bold text-text-dark hover:text-teal transition-colors"
        >
          {viewYear}년 {viewMonth + 1}월
        </button>
        <button onClick={nextMonth} className="p-1.5 rounded-[10px] hover:bg-page-bg transition-colors">
          <ChevronRight size={18} className="text-text-gray" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d, i) => (
          <div
            key={d}
            className={`text-center text-[12px] font-semibold py-1 ${
              i === 0 ? 'text-error' : i === 6 ? 'text-[#4A90E2]' : 'text-text-gray'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />
          const dateStr = toYMD(viewYear, viewMonth, day)
          const isSelected = dateStr === currentDate
          const isToday = dateStr === today
          const mark = markedDates[dateStr]
          const col = idx % 7
          const allDone = mark && mark.done === mark.total && mark.total > 0

          return (
            <button
              key={idx}
              onClick={() => onSelectDate(dateStr)}
              className={`flex flex-col items-center py-1.5 rounded-[10px] transition-colors ${
                isSelected ? 'bg-teal' : isToday ? 'bg-teal-light' : 'hover:bg-page-bg'
              }`}
            >
              <span className={`text-[13px] font-semibold leading-none ${
                isSelected ? 'text-white' :
                isToday ? 'text-teal font-bold' :
                col === 0 ? 'text-error' :
                col === 6 ? 'text-[#4A90E2]' :
                'text-text-dark'
              }`}>
                {day}
              </span>
              <div className="flex gap-0.5 mt-1 h-1.5">
                {mark && mark.total > 0 && (
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isSelected ? 'bg-white/70' : allDone ? 'bg-valid' : 'bg-teal'
                  }`} />
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
