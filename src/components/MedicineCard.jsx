function MedicineCard() {
  return (
    <div className="glass-card">
      <div className="card-heading">
        <div>
          <span className="section-label">MEDICATION</span>
          <h2>Medicine Reminder</h2>
        </div>
      </div>

      <p>💊 Daily Medicine</p>
      <p>1 tablet • 08:00 AM</p>

      <button className="primary-button">Take Medicine</button>
    </div>
  );
}

export default MedicineCard;