import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'
import { getCached, setCached } from '../dataCache.js'

const CACHE_KEY = 'workout_types'

export default function WorkoutTypes({ onBack, onSelect }) {
  const cached = getCached(CACHE_KEY)
  const [loading, setLoading] = useState(!cached)
  const [types, setTypes] = useState(cached || [])

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('workout_types')
        .select('*')
        .order('sort_order', { ascending: true })
      if (!error) {
        setTypes(data || [])
        setCached(CACHE_KEY, data || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="screen-flex">
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
