import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'
import { getCached, setCached } from '../dataCache.js'

function todayStr() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function weightsFromExercises(list) {
  const w = {}
  list.forEach((ex) => { w[ex.id] = ex.weight != null ? String(ex.weight) : '' })
  return w
}

function namesFromExercises(list) {
  const n = {}
  list.forEach((ex) => { n[ex.id] = ex.name || '' })
  return n
}

function musclesFromExercises(list) {
  const m = {}
  list.forEach((ex) => { m[ex.id] = ex.muscle_group || '' })
  return m
}

export default function ExerciseList({ workoutType, onBack, onStart }) {
  const cacheKey = `exercises:${workoutType.id}`
  const cached = getCached(cacheKey)
  const [loading, setLoading] = useState(!cached)
  const [exercises, setExercises] = useState(cached || [])
  const [weights, setWeights] = useState(cached ? weightsFromExercises(cached) : {})
  const [names, setNames] = useState({})
  const [muscles, setMuscles] = useState({})
  const [editMode, setEditMode] = useState(false) // עריכת משקלים בלבד
  const [fullEditMode, setFullEditMode] = useState(false) // עריכת תרגילים מלאה
  const [deletedIds, setDeletedIds] = useState([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('workout_type_id', workoutType.id)
        .eq('active', true)
        .order('slot_order', { ascending: true })
      if (!error) {
        setExercises(data || [])
        setCached(cacheKey, data || [])
        // לא דורסים ערכים שהמשתמש כרגע עורך במסך
        if (!editMode && !fullEditMode) setWeights(weightsFromExercises(data || []))
      }
      setLoading(false)
    }
    load()
  }, [workoutType.id])

  function updateWeight(id, value) {
    setWeights((w) => ({ ...w, [id]: value }))
  }

  function updateName(id, value) {
    setNames((n) => ({ ...n, [id]: value }))
  }

  function updateMuscle(id, value) {
    setMuscles((m) => ({ ...m, [id]: value }))
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

  function openFullEdit() {
    setNames(namesFromExercises(exercises))
    setMuscles(musclesFromExercises(exercises))
    setEditMode(false)
    setFullEditMode(true)
    setMenuOpen(false)
  }

  function addNewRow() {
    const nextSlot = exercises.length ? Math.max(...exercises.map((e) => e.slot_order)) + 1 : 1
    const tempId = `new-${Date.now()}`
    setExercises((prev) => [...prev, { id: tempId, slot_order: nextSlot, _isNew: true }])
    setNames((n) => ({ ...n, [tempId]: '' }))
    setMuscles((m) => ({ ...m, [tempId]: '' }))
    setWeights((w) => ({ ...w, [tempId]: '' }))
  }

  function removeRow(ex) {
    if (!ex._isNew) {
      if (!window.confirm(`למחוק את "${names[ex.id] || ex.name}"?`)) return
      setDeletedIds((prev) => [...prev, ex.id])
    }
    setExercises((prev) => prev.filter((e) => e.id !== ex.id))
    setNames((n) => { const c = { ...n }; delete c[ex.id]; return c })
    setMuscles((m) => { const c = { ...m }; delete c[ex.id]; return c })
    setWeights((w) => { const c = { ...w }; delete c[ex.id]; return c })
  }

  async function saveFullEdit() {
    setSaving(true)
    try {
      for (const ex of exercises) {
        const raw = weights[ex.id]
        const num = raw === '' ? null : Number(raw)
        const payload = {
          workout_type_id: workoutType.id,
          slot_order: ex.slot_order,
          name: names[ex.id] || '',
          muscle_group: muscles[ex.id] || null,
          weight: Number.isFinite(num) ? num : null,
          active: true,
        }
        if (ex._isNew) {
          await supabase.from('exercises').insert(payload)
        } else {
          await supabase.from('exercises').update(payload).eq('id', ex.id)
        }
      }

      for (const id of deletedIds) {
        await supabase.from('exercises').update({ active: false }).eq('id', id)
      }

      const { data } = await supabase
        .from('exercises')
        .select('*')
        .eq('workout_type_id', workoutType.id)
        .eq('active', true)
        .order('slot_order', { ascending: true })

      setExercises(data || [])
      setWeights(weightsFromExercises(data || []))
      setNames(namesFromExercises(data || []))
      setMuscles(musclesFromExercises(data || []))
      setCached(cacheKey, data || [])
      setDeletedIds([])
      setFullEditMode(false)
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
                onClick={() => { setEditMode(true); setFullEditMode(false); setMenuOpen(false) }}
              >
                שינוי משקלים
              </button>
              <button className="dropdown-item" onClick={openFullEdit}>
                עריכת תרגילים
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
            <div key={ex.id} className={`exercise-row list-view${fullEditMode ? ' editing' : ''}`}>
              <div className="exercise-info">
                {fullEditMode ? (
                  <input
                    className="inline-edit-input name"
                    value={names[ex.id] ?? ''}
                    placeholder="שם התרגיל"
                    onChange={(e) => updateName(ex.id, e.target.value)}
                  />
                ) : (
                  <div className="ex-name">{ex.name}</div>
                )}

                {fullEditMode ? (
                  <input
                    className="inline-edit-input muscle"
                    value={muscles[ex.id] ?? ''}
                    placeholder="קבוצת שריר"
                    onChange={(e) => updateMuscle(ex.id, e.target.value)}
                  />
                ) : (
                  ex.muscle_group && <div className="ex-muscle">{ex.muscle_group}</div>
                )}
              </div>

              <div className="weight-input-wrap">
                <input
                  className="weight-input mono"
                  type="number"
                  inputMode="decimal"
                  disabled={!editMode && !fullEditMode}
                  value={weights[ex.id] ?? ''}
                  placeholder="—"
                  onChange={(e) => updateWeight(ex.id, e.target.value)}
                />
                <span className="weight-unit">ק"ג</span>
              </div>

              {fullEditMode && (
                <button
                  className="row-delete-btn"
                  onClick={() => removeRow(ex)}
                  aria-label="מחיקת תרגיל"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!fullEditMode && (
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
      )}

      {fullEditMode && (
        <>
          <button className="fab-confirm" onClick={saveFullEdit} disabled={saving}>
            {saving ? 'שומר...' : '✓ אישור'}
          </button>
          <button className="fab-add" onClick={addNewRow} aria-label="הוספת תרגיל">+</button>
        </>
      )}
    </div>
  )
}
