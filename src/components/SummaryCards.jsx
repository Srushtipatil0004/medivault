function SummaryCards() {
  return (
    <section className="overview-grid">
      <div className="stat-card blue-card">
        <div className="stat-icon">▣</div>
        <div>
          <span>Medical Records</span>
          <strong>12</strong>
        </div>
      </div>

      <div className="stat-card purple-card">
        <div className="stat-icon">💊</div>
        <div>
          <span>Active Medicines</span>
          <strong>4</strong>
        </div>
      </div>

      <div className="stat-card green-card">
        <div className="stat-icon">📅</div>
        <div>
          <span>Appointments</span>
          <strong>2</strong>
        </div>
      </div>

      <div className="stat-card orange-card">
        <div className="stat-icon">❤️</div>
        <div>
          <span>Health Status</span>
          <strong>Good</strong>
        </div>
      </div>
    </section>
  );
}

export default SummaryCards;