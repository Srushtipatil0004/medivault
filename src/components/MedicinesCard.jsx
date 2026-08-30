import { useNavigate } from "react-router-dom";
import { Pill, Clock } from "lucide-react";

function MedicinesCard({ reminders }) {
  const navigate = useNavigate();

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatRelative = (trigger) => {
    const diff = trigger - Date.now();
    if (diff <= 0) return "Now";
    const mins = Math.round(diff / 60000);
    if (mins < 60) return `in ${mins} min`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem ? `in ${hrs}h ${rem}m` : `in ${hrs}h`;
  };

  const remList = reminders || [];

  return (
    <div className="glass-card">
      <div className="card-heading">
        <h2><Pill className="icon" /> Upcoming Medicine Doses</h2>
      </div>

      {remList.length === 0 ? (
        <p style={{ color: "#6b7c93", textAlign: "center", padding: "16px 0" }}>
          No upcoming medicine doses.
        </p>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
          {remList.map((rem) => (
            <div key={`${rem.id}-${rem.timeIndex}`} style={{padding:'8px 0',borderBottom:'1px solid #e8eef7',display:'flex',flexDirection:'column',gap:'2px'}}>
              <p style={{margin:0}}><strong>{rem.medicineName}</strong></p>
              <p style={{margin:0,fontSize:'0.85rem',color:'#6b7c93'}}>{rem.dosage}</p>
              <p style={{margin:0,fontSize:'0.85rem'}}>Due {formatRelative(rem.triggerTime)} • {formatTime(rem.scheduledTime)}</p>
            </div>
          ))}
        </div>
      )}

      <button className="primary-button" style={{marginTop:'12px',width:'100%'}} onClick={() => navigate("/medicines")}>Manage Medicines</button>
    </div>
  );
}

export default MedicinesCard;