import { useState } from "react";

const records = [
  {
    icon: "🧪",
    title: "Blood Test Report",
    date: "20 Aug 2026",
    hospital: "Ramaiah Hospital",
    doctor: "Dr. Meera Nair",
    status: "Completed",
  },
  {
    icon: "🩻",
    title: "Chest X-Ray",
    date: "18 Aug 2026",
    hospital: "City Medical Center",
    doctor: "Dr. Arjun Patel",
    status: "Completed",
  },
  {
    icon: "🧠",
    title: "MRI Brain Scan",
    date: "15 Aug 2026",
    hospital: "NeuroCare Institute",
    doctor: "Dr. Sneha Rao",
    status: "Pending",
  },
  {
    icon: "📄",
    title: "Prescription",
    date: "12 Aug 2026",
    hospital: "Family Clinic",
    doctor: "Dr. Rajesh Kumar",
    status: "Completed",
  },
  {
    icon: "💉",
    title: "Vaccination Certificate",
    date: "10 Aug 2026",
    hospital: "Public Health Dept.",
    doctor: "Dr. Anjali Desai",
    status: "Completed",
  },
  {
    icon: "❤️",
    title: "ECG Report",
    date: "08 Aug 2026",
    hospital: "HeartCare Hospital",
    doctor: "Dr. Vikram Singh",
    status: "Completed",
  },
];

function MedicalRecords() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All Records");

  const filters = [
    "All Records",
    "Blood Test",
    "Prescription",
    "X-Ray",
    "MRI",
    "Vaccination",
  ];

  return (
    <div className="page-container">
      {/* Page Header */}
      <header className="page-header">
        <div className="header-text">
          <h1>Medical Records</h1>
          <p className="subtitle">Securely manage all your medical history</p>
        </div>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search records..."
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            {filters.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <button className="primary-button">+ Add Record</button>
        </div>
      </header>

      {/* Records Grid */}
      <section className="records-grid">
        {records.map((rec, idx) => (
          <article key={idx} className="glass-card record-card">
            <div className="card-heading">
              <div className="record-title-row">
                <span className="record-icon">{rec.icon}</span>
                <h2>{rec.title}</h2>
              </div>
            </div>

            <div className="record-meta">
              <p><strong>Date:</strong> {rec.date}</p>
              <p><strong>Hospital:</strong> {rec.hospital}</p>
              <p><strong>Doctor:</strong> {rec.doctor}</p>
              <p>
                <strong>Status:</strong>
                <span className={`status-badge ${rec.status.toLowerCase()}`}>{rec.status}</span>
              </p>
            </div>

            <div className="record-actions">
              <button className="primary-button">View</button>
              <button className="secondary-button">Download</button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default MedicalRecords;