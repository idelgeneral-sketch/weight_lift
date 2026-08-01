import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'

export default function DayDetail({ date, onBack }) {
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState([]) // [{ workoutType, items: [...] }]

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data: sessionRows, error } = await supabase
        .from('workout_sessions')
        .select('id, workout_types(name)')
        .eq('session_date', date)

      if (error || !sessionRows || cancelled) {
        setLoading(false)
        return
      }

      const results = []
      for (const s of sessionRows) {
        const { data: items } = await supabase
          .from('session_items')
          .select('*, exercises(name, slot_order, muscle_group)')
          .eq('session_id', s.id)

        const sorted = (items || []).sort(
          (a, b) => (a.exercises?.slot_order ?? 0) - (b.exercises?.slot_order ?? 0)
        )
        results.push({ workoutTypeName: s.workout_types?.name || 'אימון', items: sorted })
      }

      if (!cancelled) {
        setSessions(results)
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [date])

  return (
    <div className="screen-flex">
      <div className="workout-header">
        <div className="spacer-40" />
        <div className="workout-title-block">
          <h1>סיכום אימון</h1>
          <div className="date">{date}</div>
        </div>
        <div className="spacer-40" />
      </div>

      {loading ? (
        <div className="loading-screen">טוען...</div>
      ) : (
        <div className="exercise-list">
          {sessions.map((s, si) => (
            <div key={si}>
              {sessions.length > 1 && (
                <div className="day-session-title">{s.workoutTypeName}</div>
              )}
              {s.items.map((item) => (
                <div key={item.id} className={`exercise-row${item.completed ? ' done' : ''}`}>
                  <div className="exercise-info">
                    <div className="ex-name">{item.exercises?.name}</div>
                    {item.exercises?.muscle_group && (
                      <div className="ex-muscle">{item.exercises.muscle_group}</div>
                    )}
                  </div>

                  <div className="weight-input-wrap">
                    <span className="weight-readonly mono">{item.weight ?? '—'}</span>
                    <span className="weight-unit">ק"ג</span>
                  </div>

                  <div className={`status-dot${item.completed ? ' done' : ''}`} />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="save-bar">
        <button className="primary-btn" onClick={onBack}>חזרה למסך הראשי</button>
      </div>
    </div>
  )
}
