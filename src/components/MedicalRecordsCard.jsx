import { useNavigate } from "react-router-dom";
import { TestTube, FileText, Scan } from "lucide-react";

function MedicalRecordsCard() {
  const navigate = useNavigate();
  return (
    <div className="glass-card">
      <div className="card-heading">
        <div>
          <span className="section-label">MEDICAL RECORDS</span>
          <h2>Medical Records <span style={{fontWeight:400,fontSize:'1rem',color:'#6b7c93'}}>(12)</span></h2>
        </div>
      </div>

      <p><TestTube className="icon" /> Blood Test Report</p>
      <p><FileText className="icon" /> Doctor Prescription</p>
      <p><Scan className="icon" /> Chest X-Ray</p>

      <button className="primary-button" onClick={() => navigate("/medical-records")}>View All Records</button>
    </div>
  );
}

export default MedicalRecordsCard;