import { useNavigate } from "react-router-dom";

function MedicinesCard() {
  const navigate = useNavigate();
  return (
    <div className="glass-card">
      <div className="card-heading">
        <h2>💊 Medicine Reminder</h2>
      </div>

      <p>💊 Daily Medicine</p>
      <p>1 tablet • 08:00 AM</p>

      <button className="primary-button" onClick={() => navigate("/medicines")}>Take Medicine</button>
    </div>
  );
}

export default MedicinesCard;