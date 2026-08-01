export default function Home({ onEnter, onOpenCalendar }) {
  return (
    <div className="home-screen">
      <h1 className="home-title display">ברזל</h1>
      <p className="home-subtitle">יומן אימוני התנגדות</p>

      <div className="variant-grid">
        <button className="variant-btn" onClick={onEnter}>
          אימונים
          <span className="variant-letter">›</span>
        </button>
        <button className="variant-btn" onClick={onOpenCalendar}>
          לוח אימונים
          <span className="variant-letter">📅</span>
        </button>
      </div>
    </div>
  )
}
