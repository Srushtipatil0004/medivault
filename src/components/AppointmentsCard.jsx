import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";

function AppointmentsCard({ appointments }) {
  const navigate = useNavigate();

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (timeStr) => {
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  const apptList = appointments || [];

  return (
    <div className="glass-card">
      <div className="card-heading">
        <h2><Calendar className="icon" /> Upcoming Appointments</h2>
      </div>

      {apptList.length === 0 ? (
        <p style={{ color: "#6b7c93", textAlign: "center", padding: "16px 0" }}>
          No upcoming appointments.
        </p>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
          {apptList.map((appt) => (
            <div key={appt.id} style={{padding:'8px 0',borderBottom:'1px solid #e8eef7',display:'flex',flexDirection:'column',gap:'2px'}}>
              <p style={{margin:0}}><strong>{appt.doctorName}</strong></p>
              <p style={{margin:0,color:'#6b7c93',fontSize:'0.85rem'}}>{appt.hospital}</p>
              <p style={{margin:0,fontSize:'0.85rem'}}>{formatDate(appt.appointmentDate)} • {formatTime(appt.appointmentTime)}</p>
            </div>
          ))}
        </div>
      )}

      <button className="primary-button" style={{marginTop:'12px',width:'100%'}} onClick={() => navigate("/appointments")}>View All Appointments</button>
    </div>
  );
}

export default AppointmentsCard;