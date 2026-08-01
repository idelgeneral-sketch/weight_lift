import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'

const WEEKDAY_LABELS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
const MONTH_NAMES = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]

function pad(n) { return String(n).padStart(2, '0') }

function dateStr(y, m, d) { return `${y}-${pad(m + 1)}-${pad(d)}` }

function buildGrid(year, month) {
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export default function Calendar({ onBack, onSelectDay }) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth()) // 0-11
  const [doneDates, setDoneDates] = useState(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const start = dateStr(viewYear, viewMonth, 1)
      const lastDay = new Date(viewYear, viewMonth + 1, 0).getDate()
      const end = dateStr(viewYear, viewMonth, lastDay)

      const { data, error } = await supabase
        .from('workout_sessions')
        .select('session_date')
        .gte('session_date', start)
        .lte('session_date', end)

      if (!cancelled && !error) {
        setDoneDates(new Set((data || []).map((r) => r.session_date)))
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [viewYear, viewMonth])

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else setViewMonth((m) => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else setViewMonth((m) => m + 1)
  }

  const cells = buildGrid(viewYear, viewMonth)
  const todayStr = dateStr(today.getFullYear(), today.getMonth(), today.getDate())

  return (
    <div className="screen-flex">
      <div className="workout-header">
        <div className="spacer-40" />
        <div className="workout-title-block">
          <h1>לוח אימונים</h1>
        </div>
        <button className="icon-btn" onClick={onBack} aria-label="חזרה">✕</button>
      </div>

      <div className="cal-nav">
        <button className="cal-nav-btn" onClick={prevMonth} aria-label="חודש קודם">‹</button>
        <div className="cal-month-label">{MONTH_NAMES[viewMonth]} {viewYear}</div>
        <button className="cal-nav-btn" onClick={nextMonth} aria-label="חודש הבא">›</button>
      </div>

      <div className="cal-weekday-row">
        {WEEKDAY_LABELS.map((w) => <div key={w} className="cal-weekday">{w}</div>)}
      </div>

      {loading ? (
        <div className="loading-screen">טוען...</div>
      ) : (
        <div className="cal-grid">
          {cells.map((day, i) => {
            if (day == null) return <div key={i} className="cal-cell empty" />
            const ds = dateStr(viewYear, viewMonth, day)
            const done = doneDates.has(ds)
            const isToday = ds === todayStr
            return (
              <button
                key={i}
                className={`cal-cell${done ? ' done' : ''}${isToday ? ' today' : ''}`}
                onClick={() => done && onSelectDay(ds)}
                disabled={!done}
              >
                <span className="cal-day-num">{day}</span>
                {done && <span className="cal-dot" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
