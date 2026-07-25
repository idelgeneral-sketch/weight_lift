import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'

export default function WorkoutTypes({ onBack, onSelect }) {
  const [loading, setLoading] = useState(true)
  const [types, setTypes] = useState([])

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('workout_types')
        .select('*')
        .order('sort_order', { ascending: true })
      if (!error) setTypes(data || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div className="workout-header">
        <div className="spacer-40" />
        <div className="workout-title-block">
          <h1>אימונים</h1>
        </div>
        <button className="icon-btn" onClick={onBack} aria-label="חזרה">✕</button>
      </div>

      {loading ? (
        <div className="loading-screen">טוען...</div>
      ) : (
        <div className="home-screen" style={{ justifyContent: 'flex-start', paddingTop: 30 }}>
          <div className="variant-grid">
            {types.map((t) => (
              <button key={t.id} className="variant-btn" onClick={() => onSelect(t)}>
                {t.name}
                <span className="variant-letter">{t.sort_order}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
