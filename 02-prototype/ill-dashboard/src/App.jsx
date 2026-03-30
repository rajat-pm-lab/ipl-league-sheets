import { Routes, Route } from 'react-router-dom'
import Leaderboard from './pages/Leaderboard.jsx'
import PlayerProfile from './pages/PlayerProfile.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Leaderboard />} />
      <Route path="/player/:id" element={<PlayerProfile />} />
    </Routes>
  )
}
