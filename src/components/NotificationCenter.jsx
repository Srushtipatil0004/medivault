import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Pill, Calendar, Check, X, Bell } from "lucide-react";
import { takeDose } from "../services/medicines";

function NotificationCenter({ notifications, medicines, onClose }) {
  const navigate = useNavigate();
  const [localNotifications, setLocalNotifications] = useState(notifications);

  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

  const handleTook = async (notif) => {
    // find full medicine object
    const med = medicines.find(m => m.id === notif.id);
    if (!med) return;
    try {
      await takeDose(med.uid, med);
      setLocalNotifications(prev => prev.filter(n => n.id !== notif.id));
    } catch (err) {
      console.error("Failed to mark dose taken", err);
    }
  };

  const handleNotYet = (id) => {
    // keep notification, just close panel
    onClose();
  };

  const handleViewAppointment = (appt) => {
    navigate("/appointments");
    onClose();
  };

  const handleViewMedicine = (med) => {
    navigate("/medicines");
    onClose();
  };

  if (localNotifications.length === 0) {
    return (
      <div className="notification-panel">
        <div className="notification-header">
          <h3>Notifications</h3>
          <button className="icon-button" onClick={onClose}><X className="icon" /></button>
        </div>
        <p style={{padding:"16px",textAlign:"center",color:"#6b7c93"}}>No notifications</p>
      </div>
    );
  }

  return (
    <div className="notification-panel">
      <div className="notification-header">
        <h3>Notifications <span className="badge">{localNotifications.length}</span></h3>
        <button className="icon-button" onClick={onClose}><X className="icon" /></button>
      </div>
      <div className="notification-list">
        {localNotifications.map((n) => (
          <div key={n.id} className="notification-item" style={{borderBottom:"1px solid #e0e0e0",padding:"12px"}}>
            {n.type === "medicine" && (
              <>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <p style={{fontWeight:600}}>💊 {n.medicineName}</p>
                    <p style={{fontSize:"0.9rem",color:"#333"}}>Due at {n.dueTime}</p>
                    {n.instruction && <p style={{fontSize:"0.85rem",color:"#666"}}>{n.instruction}</p>}
                  </div>
                  <span className="badge" style={{background:"#2563eb",color:"#fff",fontSize:"0.7rem"}}>MED</span>
                </div>
                <div style={{display:"flex",gap:"8px",marginTop:"8px"}}>
                  <button className="primary-button" style={{flex:1}} onClick={() => handleTook(n)}>Took</button>
                  <button className="secondary-button" style={{flex:1}} onClick={() => handleNotYet(n.id)}>Not yet</button>
                </div>
              </>
            )}
            {n.type === "appointment" && (
              <>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <p style={{fontWeight:600}}>📅 {n.doctorName}</p>
                    <p style={{fontSize:"0.9rem",color:"#333"}}>{n.date} at {n.time}</p>
                    {n.hospital && <p style={{fontSize:"0.85rem",color:"#666"}}>{n.hospital}</p>}
                  </div>
                  <span className="badge" style={{background:"#059669",color:"#fff",fontSize:"0.7rem"}}>APPT</span>
                </div>
                <div style={{marginTop:"8px"}}>
                  <button className="primary-button" onClick={() => handleViewAppointment(n)}>View Appointment</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default NotificationCenter;