import { useState } from "react";

const appointments = [
  {
    doctor: "Dr. Rahul Sharma",
    specialization: "General Physician",
    hospital: "City Medical Center",
    date: "28 Aug 2026",
    time: "10:30 AM",
    type: "In-person",
    status: "Upcoming",
  },
  {
    doctor: "Dr. Meera Nair",
    specialization: "Cardiologist",
    hospital: "HeartCare Hospital",
    date: "30 Aug 2026",
    time: "02:00 PM",
    type: "Online",
    status: "Upcoming",
  },
  {
    doctor: "Dr. Arjun Patel",
    specialization: "Dermatologist",
    hospital: "SkinWell Clinic",
    date: "25 Aug 2026",
    time: "11:00 AM",
    type: "In-person",
    status: "Completed",
  },
  {
    doctor: "Dr. Sneha Rao",
    specialization: "Neurologist",
    hospital: "NeuroCare Institute",
    date: "20 Aug 2026",
    time: "04:00 PM",
    type: "Online",
    status: "Completed",
  },
  {
    doctor: "Dr. Vikram Singh",
    specialization: "Orthopedic",
    hospital: "Bone & Joint Hospital",
    date: "18 Aug 2026",
    time: "09:00 AM",
    type: "In-person",
    status: "Cancelled",
  },
  {
    doctor: "Dr. Anjali Desai",
    specialization: "Pediatrician",
    hospital: "Children's Health Center",
    date: "15 Aug 2026",
    time: "10:00 AM",
    type: "Online",
    status: "Cancelled",
  },
];

function Appointments() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filters = ["All", "Upcoming", "Completed", "Cancelled"];

  return (
    <div className="page-container">
      {/* Page Header */}
      <header className="page-header">
        <div className="header-text">
          <h1>Appointments</h1>
          <p className="subtitle">Manage your upcoming and past consultations</p>
        </div>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search appointments..."
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            {filters.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <button className="primary-button">+ Book Appointment</button>
        </div>
      </header>

      {/* Appointments Grid */}
      <section className="records-grid">
        {appointments.map((appt, idx) => (
          <article key={idx} className="glass-card record-card">
            <div className="card-heading">
              <div className="record-title-row">
                <div className="doctor-avatar">{appt.doctor.charAt(4)}</div>
                <div>
                  <h2>{appt.doctor}</h2>
                  <p className="record-sub">{appt.specialization}</p>
                </div>
              </div>
            </div>

            <div className="record-meta">
              <p><strong>Hospital:</strong> {appt.hospital}</p>
              <p><strong>Date:</strong> {appt.date}</p>
              <p><strong>Time:</strong> {appt.time}</p>
              <p><strong>Type:</strong> {appt.type}</p>
              <p>
                <strong>Status:</strong>
                <span className={`status-badge ${appt.status.toLowerCase()}`}>{appt.status}</span>
              </p>
            </div>

            <div className="record-actions">
              <button className="primary-button">View Details</button>
              <button className="secondary-button">Reschedule</button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default Appointments;