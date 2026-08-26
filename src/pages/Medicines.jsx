import { useState } from "react";

const medicines = [
  {
    name: "Metformin",
    dosage: "500 mg",
    timing: "Morning",
    food: "After food",
    remainingDays: 12,
    status: "Upcoming",
  },
  {
    name: "Atorvastatin",
    dosage: "10 mg",
    timing: "Night",
    food: "After food",
    remainingDays: 30,
    status: "Upcoming",
  },
  {
    name: "Lisinopril",
    dosage: "5 mg",
    timing: "Morning",
    food: "Before food",
    remainingDays: 5,
    status: "Completed",
  },
  {
    name: "Levothyroxine",
    dosage: "75 mcg",
    timing: "Morning",
    food: "Before food",
    remainingDays: 20,
    status: "Upcoming",
  },
  {
    name: "Omeprazole",
    dosage: "20 mg",
    timing: "Afternoon",
    food: "Before food",
    remainingDays: 0,
    status: "Missed",
  },
  {
    name: "Amlodipine",
    dosage: "5 mg",
    timing: "Night",
    food: "After food",
    remainingDays: 15,
    status: "Upcoming",
  },
];

function Medicines() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filters = ["All", "Morning", "Afternoon", "Night", "Completed"];

  return (
    <div className="page-container">
      {/* Page Header */}
      <header className="page-header">
        <div className="header-text">
          <h1>Medicines</h1>
          <p className="subtitle">Track and manage your medications</p>
        </div>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search medicines..."
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            {filters.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <button className="primary-button">+ Add Medicine</button>
        </div>
      </header>

      {/* Medicines Grid */}
      <section className="records-grid">
        {medicines.map((med, idx) => (
          <article key={idx} className="glass-card record-card">
            <div className="card-heading">
              <div className="record-title-row">
                <span className="record-icon">💊</span>
                <h2>{med.name}</h2>
              </div>
            </div>

            <div className="record-meta">
              <p><strong>Dosage:</strong> {med.dosage}</p>
              <p><strong>Timing:</strong> {med.timing}</p>
              <p><strong>Food:</strong> {med.food}</p>
              <p><strong>Remaining:</strong> {med.remainingDays} day{med.remainingDays !== 1 ? "s" : ""}</p>
              <p>
                <strong>Status:</strong>
                <span className={`status-badge ${med.status.toLowerCase()}`}>{med.status}</span>
              </p>
            </div>

            <div className="record-actions">
              <button className="primary-button">Take Medicine</button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default Medicines;