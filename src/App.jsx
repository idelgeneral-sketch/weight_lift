import { useState } from 'react'
import Home from './screens/Home.jsx'
import WorkoutTypes from './screens/WorkoutTypes.jsx'
import ExerciseList from './screens/ExerciseList.jsx'
import Session from './screens/Session.jsx'
import Calendar from './screens/Calendar.jsx'
import DayDetail from './screens/DayDetail.jsx'
import { APP_VERSION } from './version.js'

export default function App() {
  const [screen, setScreen] = useState('home') // 'home' | 'types' | 'list' | 'session' | 'calendar' | 'day'
  const [workoutType, setWorkoutType] = useState(null)
  const [sessionInfo, setSessionInfo] = useState(null) // { sessionId, date, workoutType }
  const [selectedDate, setSelectedDate] = useState(null)

  return (
    <div className="app-shell">
      {screen === 'home' && (
        <Home
          onEnter={() => setScreen('types')}
          onOpenCalendar={() => setScreen('calendar')}
        />
      )}

      {screen === 'types' && (
        <WorkoutTypes
          onBack={() => setScreen('home')}
          onSelect={(t) => { setWorkoutType(t); setScreen('list') }}
        />
      )}

      {screen === 'list' && workoutType && (
        <ExerciseList
          workoutType={workoutType}
          onBack={() => setScreen('types')}
          onStart={(info) => { setSessionInfo(info); setScreen('session') }}
        />
      )}

      {screen === 'session' && sessionInfo && (
        <Session
          sessionId={sessionInfo.sessionId}
          date={sessionInfo.date}
          workoutType={sessionInfo.workoutType}
          onFinish={() => setScreen('home')}
        />
      )}

      {screen === 'calendar' && (
        <Calendar
          onBack={() => setScreen('home')}
          onSelectDay={(date) => { setSelectedDate(date); setScreen('day') }}
        />
      )}

      {screen === 'day' && selectedDate && (
        <DayDetail
          date={selectedDate}
          onBack={() => setScreen('home')}
        />
      )}

      {screen === 'home' && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 11, paddingBottom: 14 }}>
          גרסה {APP_VERSION}
        </div>
      )}
    </div>
  )
}
