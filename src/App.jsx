import { useState } from 'react'
import Home from './screens/Home.jsx'
import WorkoutTypes from './screens/WorkoutTypes.jsx'
import ExerciseList from './screens/ExerciseList.jsx'
import Session from './screens/Session.jsx'
import { APP_VERSION } from './version.js'

export default function App() {
  const [screen, setScreen] = useState('home') // 'home' | 'types' | 'list' | 'session'
  const [workoutType, setWorkoutType] = useState(null)
  const [sessionInfo, setSessionInfo] = useState(null) // { sessionId, date, workoutType }

  return (
    <div className="app-shell">
      {screen === 'home' && <Home onEnter={() => setScreen('types')} />}

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

      {screen === 'home' && (
        <div style={{ textAlign: 'center', color: '#565b6b', fontSize: 11, paddingBottom: 14 }}>
          גרסה {APP_VERSION}
        </div>
      )}
    </div>
  )
}
