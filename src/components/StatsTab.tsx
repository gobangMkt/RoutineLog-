import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { MemoItem } from '../types'

interface Props {
  markedDates: Record<string, { total: number; done: number }>
  memos: MemoItem[]
  today: string
}

const DAYS_WEEK = ['일', '월', '화', '수', '목', '금', '토']

function toYMD(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function StatsTab({ markedDates, memos, today }: Props) {
  // 로컬 날짜 기준으로 초기 월 설정 (UTC 기반 today prop 대신)
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth())

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDayMon = new Date(viewYear, viewMonth, 1).getDay() // 일요일 시작: 0=일 그대로

  const cells: (number | null)[] = [
    ...Array(firstDayMon).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  // 이번 달 통계
  let doneDays = 0
  let partialDays = 0
  let totalTodoDays = 0
  let totalDone = 0
  let totalAll = 0

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = toYMD(viewYear, viewMonth, d)
    const mark = markedDates[dateStr]
    if (mark && mark.total > 0) {
      totalTodoDays++
      totalDone += mark.done
      totalAll += mark.total
      if (mark.done === mark.total) doneDays++
      else if (mark.done > 0) partialDays++
    }
  }

  const monthRate = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0

  // 메모 기록일 (이번 달)
  const memoDays = new Set(
    memos
      .map(m => m.date)
      .filter(d => d.startsWith(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`))
  ).size

  return (
    <div className="px-5 py-5">
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={prevMonth} className="p-1.5 rounded-[10px] hover:bg-page-bg transition-colors">
          <ChevronLeft size={18} className="text-text-gray" />
        </button>
        <div className="flex items-center gap-2">
          <h3 className="text-[17px] font-bold text-text-dark">{viewYear}년 {viewMonth + 1}월</h3>
        </div>
        <button onClick={nextMonth} className="p-1.5 rounded-[10px] hover:bg-page-bg transition-colors">
          <ChevronRight size={18} className="text-text-gray" />
        </button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-teal-light rounded-[14px] px-3 py-4 flex flex-col items-center">
          <span className="text-[22px] font-bold text-teal leading-none">{doneDays}</span>
          <span className="text-[11px] text-teal mt-1.5 font-medium text-center">완료일</span>
        </div>
        <div className="bg-[#FFF7ED] rounded-[14px] px-3 py-4 flex flex-col items-center">
          <span className="text-[22px] font-bold text-[#D97706] leading-none">{totalTodoDays}</span>
          <span className="text-[11px] text-[#D97706] mt-1.5 font-medium text-center">기록일</span>
        </div>
        <div className="bg-[#EEF2FF] rounded-[14px] px-3 py-4 flex flex-col items-center">
          <span className="text-[22px] font-bold text-[#4F6AE6] leading-none">{memoDays}</span>
          <span className="text-[11px] text-[#4F6AE6] mt-1.5 font-medium text-center">메모일</span>
        </div>
      </div>

      {/* 달성률 바 */}
      <div className="bg-surface rounded-[14px] px-4 py-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[14px] font-semibold text-text-dark">이번 달 달성률</span>
          <span className={`text-[16px] font-bold ${
            monthRate >= 80 ? 'text-teal' : monthRate >= 50 ? 'text-[#F0A800]' : 'text-text-gray'
          }`}>
            {monthRate}%
          </span>
        </div>
        <div className="h-2.5 bg-border-def rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              monthRate >= 80 ? 'bg-teal' : monthRate >= 50 ? 'bg-[#F0A800]' : 'bg-gray-300'
            }`}
            style={{ width: `${monthRate}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-text-muted mt-1.5">
          <span>완료 {totalDone}개</span>
          <span>전체 {totalAll}개</span>
        </div>
      </div>

      {/* 달성 캘린더 */}
      <div className="bg-surface rounded-[14px] px-4 py-4">
        <h4 className="text-[14px] font-semibold text-text-dark mb-3">월간 달성 캘린더</h4>

        {/* 범례 */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-teal" />
            <span className="text-[11px] text-text-gray">전체 완료</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-teal-light border border-teal-border" />
            <span className="text-[11px] text-text-gray">일부 완료</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-200" />
            <span className="text-[11px] text-text-gray">미완료</span>
          </div>
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

        {/* 날짜 셀 */}
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, idx) => {
            if (!day) return <div key={idx} />
            const dateStr = toYMD(viewYear, viewMonth, day)
            const isToday = dateStr === today
            const isFuture = dateStr > today
            const mark = markedDates[dateStr]
            const col = idx % 7

            let circleBg = ''
            let textColor = ''
            if (!isFuture && mark && mark.total > 0) {
              if (mark.done === mark.total) {
                circleBg = 'bg-teal'
                textColor = 'text-white'
              } else if (mark.done > 0) {
                circleBg = 'bg-teal-light'
                textColor = 'text-teal'
              } else {
                circleBg = 'bg-gray-200'
                textColor = 'text-text-muted'
              }
            }

            const rateText = !isFuture && mark && mark.total > 0
              ? `${mark.done}/${mark.total}`
              : null

            return (
              <div key={idx} className="flex flex-col items-center py-0.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  circleBg || (isToday && !circleBg ? 'ring-2 ring-teal ring-offset-1' : '')
                }`}>
                  <span className={`text-[13px] font-semibold leading-none ${
                    textColor ||
                    (isToday ? 'text-teal font-bold' :
                    col === 0 ? 'text-error' :
                    col === 6 ? 'text-[#4A90E2]' :
                    isFuture ? 'text-text-muted' :
                    'text-text-dark')
                  }`}>
                    {day}
                  </span>
                </div>
                {rateText && (
                  <span className="text-[9px] text-text-muted leading-none mt-0.5">{rateText}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 달성 패턴 요약 */}
      {totalTodoDays > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-surface rounded-[14px] px-4 py-3">
            <p className="text-[11px] text-text-gray mb-1">전체 완료일</p>
            <p className="text-[18px] font-bold text-teal">{doneDays}일</p>
            <p className="text-[11px] text-text-muted">{totalTodoDays > 0 ? Math.round((doneDays / totalTodoDays) * 100) : 0}% of 기록일</p>
          </div>
          <div className="bg-surface rounded-[14px] px-4 py-3">
            <p className="text-[11px] text-text-gray mb-1">일부 완료일</p>
            <p className="text-[18px] font-bold text-[#F0A800]">{partialDays}일</p>
            <p className="text-[11px] text-text-muted">{totalTodoDays > 0 ? Math.round((partialDays / totalTodoDays) * 100) : 0}% of 기록일</p>
          </div>
        </div>
      )}
    </div>
  )
}
