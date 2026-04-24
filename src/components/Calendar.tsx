import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface Props {
  currentDate: string
  markedDates: Record<string, { total: number; done: number }>
  onSelectDate: (date: string) => void
}

// 일요일 시작
const DAYS_WEEK = ['일', '월', '화', '수', '목', '금', '토']

function toLocalYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function toYMD(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function getWeekDays(dateStr: string): string[] {
  const d = new Date(dateStr + 'T00:00:00')
  const dow = d.getDay() // 0=일, 1=월, ... 6=토
  const sunday = new Date(d)
  sunday.setDate(d.getDate() - dow) // 해당 주 일요일로 이동
  return Array.from({ length: 7 }, (_, i) => {
    const wd = new Date(sunday)
    wd.setDate(sunday.getDate() + i)
    return toLocalYMD(wd) // UTC 변환 없이 로컬 날짜 사용
  })
}

export default function Calendar({ currentDate, markedDates, onSelectDate }: Props) {
  const now = new Date()
  const today = toLocalYMD(now)
  const [isExpanded, setIsExpanded] = useState(false)
  const [viewYear, setViewYear] = useState(() => parseInt(currentDate.slice(0, 4)))
  const [viewMonth, setViewMonth] = useState(() => parseInt(currentDate.slice(5, 7)) - 1)

  const weekDays = getWeekDays(currentDate)

  const prevWeek = () => {
    const d = new Date(currentDate + 'T00:00:00')
    d.setDate(d.getDate() - 7)
    onSelectDate(toLocalYMD(d))
  }
  const nextWeek = () => {
    const d = new Date(currentDate + 'T00:00:00')
    d.setDate(d.getDate() + 7)
    onSelectDate(toLocalYMD(d))
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const expandMonth = () => {
    setViewYear(parseInt(currentDate.slice(0, 4)))
    setViewMonth(parseInt(currentDate.slice(5, 7)) - 1)
    setIsExpanded(true)
  }

  const goToToday = () => {
    setViewYear(now.getFullYear())
    setViewMonth(now.getMonth())
    onSelectDate(today)
    setIsExpanded(false)
  }

  // 주간 헤더 라벨
  const firstDay = weekDays[0]
  const lastDay = weekDays[6]
  const fy = parseInt(firstDay.slice(0, 4))
  const fm = parseInt(firstDay.slice(5, 7))
  const lm = parseInt(lastDay.slice(5, 7))
  const weekLabel = fm === lm ? `${fy}년 ${fm}월` : `${fy}년 ${fm}월 - ${lm}월`

  const isCurrentWeek = weekDays.includes(today)
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth()
  const showTodayBtn = isExpanded ? !isCurrentMonth : !isCurrentWeek

  const DayDot = ({ dateStr, isSelected }: { dateStr: string; isSelected: boolean }) => {
    const mark = markedDates[dateStr]
    if (!mark || mark.total === 0) return null
    const allDone = mark.done === mark.total
    return (
      <span className={`w-1.5 h-1.5 rounded-full ${
        isSelected ? 'bg-white/70' : allDone ? 'bg-teal' : 'bg-gray-300'
      }`} />
    )
  }

  // 월간 그리드 (일요일 시작)
  const firstDaySun = new Date(viewYear, viewMonth, 1).getDay() // 0=일 그대로
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const monthCells: (number | null)[] = [
    ...Array(firstDaySun).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (monthCells.length % 7 !== 0) monthCells.push(null)

  return (
    <div className="px-5 pt-4 pb-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={isExpanded ? prevMonth : prevWeek}
          className="p-1.5 rounded-[10px] hover:bg-page-bg transition-colors"
        >
          <ChevronLeft size={18} className="text-text-gray" />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={isExpanded ? () => setIsExpanded(false) : expandMonth}
            className="flex items-center gap-1 text-[16px] font-bold text-text-dark hover:text-teal transition-colors"
          >
            {isExpanded ? `${viewYear}년 ${viewMonth + 1}월` : weekLabel}
            {isExpanded
              ? <ChevronUp size={14} className="text-text-gray" />
              : <ChevronDown size={14} className="text-text-gray" />
            }
          </button>
          {showTodayBtn && (
            <button
              onClick={goToToday}
              className="text-[11px] font-semibold text-teal px-2 py-0.5 rounded-[6px] bg-teal-light hover:bg-teal-border transition-colors"
            >
              오늘
            </button>
          )}
        </div>

        <button
          onClick={isExpanded ? nextMonth : nextWeek}
          className="p-1.5 rounded-[10px] hover:bg-page-bg transition-colors"
        >
          <ChevronRight size={18} className="text-text-gray" />
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_WEEK.map((d, i) => (
          <div key={d} className={`text-center text-[11px] font-semibold py-0.5 ${
            i === 0 ? 'text-error' : i === 6 ? 'text-[#4A90E2]' : 'text-text-gray'
          }`}>
            {d}
          </div>
        ))}
      </div>

      {!isExpanded ? (
        /* 주간 행 */
        <div className="grid grid-cols-7">
          {weekDays.map((dateStr, i) => {
            const isSelected = dateStr === currentDate
            const isToday = dateStr === today
            const dayNum = parseInt(dateStr.slice(8))
            const isSun = i === 0
            const isSat = i === 6

            return (
              <button
                key={dateStr}
                onClick={() => onSelectDate(dateStr)}
                className="flex flex-col items-center py-1 rounded-[10px] hover:bg-page-bg transition-colors"
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                  isSelected ? 'bg-teal' : isToday ? 'bg-teal-light' : ''
                }`}>
                  <span className={`text-[15px] font-semibold leading-none ${
                    isSelected ? 'text-white' :
                    isToday   ? 'text-teal font-bold' :
                    isSun     ? 'text-error' :
                    isSat     ? 'text-[#4A90E2]' :
                    'text-text-dark'
                  }`}>
                    {dayNum}
                  </span>
                </div>
                <div className="flex items-center justify-center h-1.5 mt-0.5">
                  <DayDot dateStr={dateStr} isSelected={isSelected} />
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        /* 월간 그리드 */
        <div className="grid grid-cols-7 gap-y-1">
          {monthCells.map((day, idx) => {
            if (!day) return <div key={idx} />
            const dateStr = toYMD(viewYear, viewMonth, day)
            const isSelected = dateStr === currentDate
            const isToday = dateStr === today
            const mark = markedDates[dateStr]
            const col = idx % 7
            const allDone = mark && mark.done === mark.total && mark.total > 0
            const hasTodo = mark && mark.total > 0

            return (
              <button
                key={idx}
                onClick={() => { onSelectDate(dateStr); setIsExpanded(false) }}
                className={`flex flex-col items-center py-1.5 rounded-[10px] transition-colors ${
                  isSelected ? 'bg-teal' : isToday ? 'bg-teal-light' : 'hover:bg-page-bg'
                }`}
              >
                <span className={`text-[13px] font-semibold leading-none ${
                  isSelected ? 'text-white' :
                  isToday   ? 'text-teal font-bold' :
                  col === 0  ? 'text-error' :
                  col === 6  ? 'text-[#4A90E2]' :
                  'text-text-dark'
                }`}>
                  {day}
                </span>
                <div className="flex gap-0.5 mt-1 h-1.5">
                  {hasTodo && (
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-white/70' : allDone ? 'bg-teal' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
