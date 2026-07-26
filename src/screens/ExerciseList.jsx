import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'

function todayStr() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function ExerciseList({ workoutType, onBack, onStart }) {
  const [loading, setLoading] = useState(true)
  const [exercises, setExercises] = useState([])
  const [weights, setWeights] = useState({}) // id -> string
  const [editMode, setEditMode] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('workout_type_id', workoutType.id)
        .eq('active', true)
        .order('slot_order', { ascending: true })
      if (!error) {
        setExercises(data || [])
        const w = {}
        ;(data || []).forEach((ex) => { w[ex.id] = ex.weight != null ? String(ex.weight) : '' })
        setWeights(w)
      }
      setLoading(false)
    }
    load()
  }, [workoutType.id])

  function updateWeight(id, value) {
    setWeights((w) => ({ ...w, [id]: value }))
  }

  async function saveWeights() {
    setSaving(true)
    try {
      for (const ex of exercises) {
        const raw = weights[ex.id]
        const num = raw === '' ? null : Number(raw)
        await supabase
          .from('exercises')
          .update({ weight: Number.isFinite(num) ? num : null })
          .eq('id', ex.id)
      }
      setEditMode(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleStart() {
    setStarting(true)
    const date = todayStr()
    try {
      // מוצא או יוצר את האימון של היום עבור סוג האימון הזה
      let sessionId
      const { data: existing } = await supabase
        .from('workout_sessions')
        .select('id')
        .eq('workout_type_id', workoutType.id)
        .eq('session_date', date)
        .maybeSingle()

      if (existing) {
        sessionId = existing.id
      } else {
        const { data: created, error: createErr } = await supabase
          .from('workout_sessions')
          .insert({ workout_type_id: workoutType.id, session_date: date })
          .select('id')
          .single()
        if (createErr) throw createErr
        sessionId = created.id

        // יוצר שורת תיעוד לכל תרגיל, עם המשקל הנוכחי כתמונת מצב
        const items = exercises.map((ex) => ({
          session_id: sessionId,
          exercise_id: ex.id,
          weight: ex.weight,
          completed: false,
        }))
        if (items.length) {
          await supabase.from('session_items').insert(items)
        }
      }

      onStart({ sessionId, date, workoutType })
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="screen-flex">
      <div className="workout-header">
        <div style={{ position: 'relative' }}>
          <button className="icon-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="תפריט">☰</button>
          {menuOpen && (
            <div className="dropdown-menu">
              <button
                className="dropdown-item"
                onClick={() => { setEditMode(true); setMenuOpen(false) }}
              >
                שינוי משקלים
              </button>
            </div>
          )}
        </div>
        <div className="workout-title-block">
          <h1>{workoutType.name}</h1>
        </div>
        <button className="icon-btn" onClick={onBack} aria-label="חזרה">✕</button>
      </div>

      {loading ? (
        <div className="loading-screen">טוען...</div>
      ) : (
        <div className="exercise-list">
          {exercises.map((ex) => (
            <div key={ex.id} className="exercise-row list-view">
              <div className="exercise-info">
                <div className="slot-num">#{ex.slot_order}</div>
                <div className="ex-name">{ex.name}</div>
                {ex.muscle_group && <div className="ex-muscle">{ex.muscle_group}</div>}
              </div>

              <div className="weight-input-wrap">
                <input
                  className="weight-input mono"
                  type="number"
                  inputMode="decimal"
                  disabled={!editMode}
                  value={weights[ex.id] ?? ''}
                  placeholder="—"
                  onChange={(e) => updateWeight(ex.id, e.target.value)}
                />
                <span className="weight-unit">ק"ג</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="save-bar">
        {editMode ? (
          <button className="primary-btn" onClick={saveWeights} disabled={saving}>
            {saving ? 'שומר...' : 'שמור'}
          </button>
        ) : (
          <button className="primary-btn" onClick={handleStart} disabled={starting || loading}>
            {starting ? 'פותח...' : 'התחל'}
          </button>
        )}
      </div>
    </div>
  )
}
