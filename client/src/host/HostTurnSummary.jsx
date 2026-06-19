export default function HostTurnSummary({ turnEnd, onAdvanceTurn }) {
  return (
    <div className={`host-screen host-turn-summary ${turnEnd.free ? 'summary-free' : 'summary-drink'}`}>
      {turnEnd.free ? (
        <>
          <div className="summary-headline">{turnEnd.playerName} IS FREE!</div>
          <div className="summary-emoji">🎉🙌🎉</div>
        </>
      ) : (
        <>
          <div className="summary-headline">DRINK UP, {turnEnd.playerName}!</div>
          <div className="summary-amount">
            {turnEnd.drink.amount} {turnEnd.drink.unit}
            {turnEnd.drink.amount === 1 ? '' : 's'}
          </div>
          <div className="summary-emoji">{turnEnd.drink.unit === 'shot' ? '🥃' : '🍺'}</div>
        </>
      )}

      <button className="host-btn host-btn-primary" onClick={onAdvanceTurn}>
        {turnEnd.isLastTurn ? 'See Final Results' : 'Next Player'}
      </button>
    </div>
  )
}
