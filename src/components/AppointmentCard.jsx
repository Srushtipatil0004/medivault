function AppointmentCard() {
  return (
    <div className="glass-card">
      <div className="card-heading">
        <div>
          <span className="section-label">NEXT APPOINTMENT</span>
          <h2>Upcoming Appointment</h2>
        </div>
      </div>

      <p><strong>Dr. Rahul Sharma</strong></p>
      <p>General Physician</p>
      <p>28 Aug 2026 • 10:30 AM</p>

      <button className="primary-button">View Appointment</button>
    </div>
  );
}

export default AppointmentCard;