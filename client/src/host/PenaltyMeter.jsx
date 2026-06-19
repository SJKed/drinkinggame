export default function PenaltyMeter({ penalty }) {
  if (!penalty) return null
  if (penalty.amount === 0) {
    return <div className="penalty-meter penalty-free">FREE! 🎉</div>
  }
  const icon = penalty.unit === 'shot' ? '🥃' : '🍺'
  const label = penalty.unit === 'shot' ? 'SHOT' : 'SIP'
  const plural = penalty.amount === 1 ? '' : 'S'
  return (
    <div className="penalty-meter">
      <div className="penalty-icons">{icon.repeat(penalty.amount)}</div>
      <div className="penalty-label">
        {penalty.amount} {label}
        {plural}
      </div>
    </div>
  )
}
