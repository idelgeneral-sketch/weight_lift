import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'

export default function Session({ sessionId, date, workoutType, onFinish }) {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([]) // { id, exercise_id, weight, completed, exercises: {...} }

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('session_items')
        .select('*, exercises(name, slot_order, muscle_group)')
        .eq('session_id', sessionId)
      if (!error) {
        const sorted = (data || []).sort(
          (a, b) => (a.exercises?.slot_order ?? 0) - (b.exercises?.slot_order ?? 0)
        )
        setItems(sorted)
      }
      setLoading(false)
    }
    load()
  }, [sessionId])

  async function toggle(item) {
    const next = !item.completed
    setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, completed: next } : it)))
    await supabase.from('session_items').update({ completed: next }).eq('id', item.id)
  }

  const doneCount = items.filter((i) => i.completed).length
  const total = items.length || 1
  const pct = Math.round((doneCount / total) * 100)

  return (
    <div className="screen-flex">
      <div className="workout-header">
        <div className="spacer-40" />
        <div className="workout-title-block">
          <h1>אימון · {workoutType.name}</h1>
          <div className="date">{date}</div>
        </div>
        <div className="spacer-40" />
      </div>

      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>

      {loading ? (
        <div className="loading-screen">טוען...</div>
      ) : (
        <div className="exercise-list">
          {items.map((item) => (
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

              <button
                className={`plate-check${item.completed ? ' checked' : ''}`}
                onClick={() => toggle(item)}
                aria-label="בוצע"
              />
            </div>
          ))}
        </div>
      )}

      <div className="save-bar">
        <button className="primary-btn" onClick={onFinish}>סיום</button>
      </div>
    </div>
  )
}
