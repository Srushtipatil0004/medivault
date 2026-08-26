import { useNavigate } from "react-router-dom";

function HealthCard() {
  const navigate = useNavigate();
  return (
    <div className="glass-card">
      <div className="card-heading">
        <div>
          <span className="section-label">HEALTH</span>
          <h2>Health Monitoring</h2>
        </div>
      </div>

      <p>No health device connected</p>
      <p>Connect a wearable or add a health measurement to start tracking your health.</p>

      <button className="primary-button" onClick={() => navigate("/health-monitoring")}>View More</button>
    </div>
  );
}

export default HealthCard;