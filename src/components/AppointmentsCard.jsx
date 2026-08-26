import { useNavigate } from "react-router-dom";

function AppointmentsCard() {
  const navigate = useNavigate();
  return (
    <div className="glass-card">
      <div className="card-heading">
        <h2>📅 Upcoming Appointment</h2>
      </div>

      <p><strong>Dr. Rahul Sharma</strong></p>
      <p>General Physician</p>
      <p>28 Aug 2026 • 10:30 AM</p>

      <button className="primary-button" onClick={() => navigate("/appointments")}>View Appointment</button>
    </div>
  );
}

export default AppointmentsCard;