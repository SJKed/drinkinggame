import { Routes, Route } from 'react-router-dom'
import PlayerEntry from './player/PlayerEntry.jsx'
import HostView from './host/HostView.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PlayerEntry />} />
      <Route path="/host" element={<HostView />} />
    </Routes>
  )
}
