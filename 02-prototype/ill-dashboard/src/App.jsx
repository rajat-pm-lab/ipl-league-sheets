import { Routes, Route } from 'react-router-dom'
import { DataProvider } from './data/DataContext'
import Leaderboard from './pages/Leaderboard.jsx'
import PlayerProfile from './pages/PlayerProfile.jsx'

export default function App() {
  return (
    <DataProvider>
      <Routes>
        <Route path="/" element={<Leaderboard />} />
        <Route path="/player/:id" element={<PlayerProfile />} />
      </Routes>
    </DataProvider>
  )
}
