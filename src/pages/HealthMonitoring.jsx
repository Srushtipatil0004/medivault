import { useState } from "react";

const history = [
  { date: "20 Aug 2026", items: [{ label: "Weight", value: "44 kg" }] },
  { date: "18 Aug 2026", items: [{ label: "Blood Pressure", value: "118/78" }] },
  { date: "16 Aug 2026", items: [{ label: "Heart Rate", value: "76 BPM" }] },
];

const futureIntegrations = ["Apple Health", "Google Fit", "Fitbit", "Garmin", "Samsung Health"];

function HealthMonitoring() {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [bp, setBp] = useState("");
  const [hr, setHr] = useState("");
  const [spo2, setSpo2] = useState("");

  return (
    <div className="page-container">
      {/* Page Header */}
      <header className="page-header">
        <div className="header-text">
          <h1>Health Monitoring</h1>
          <p className="subtitle">Track your health using wearable devices or manual measurements</p>
        </div>
      </header>

      <section className="health-layout">
        {/* Section 1 – Device Status */}
        <article className="glass-card">
          <div className="card-heading">
            <h2>⌚ Wearable Device</h2>
          </div>
          <div className="device-status">
            <p><strong>Status:</strong> <span className="status-badge disconnected">Not Connected</span></p>
            <p>Connect a smartwatch or fitness band to automatically sync your health data.</p>
            <button className="primary-button">Connect Device</button>
          </div>
        </article>

        {/* Section 2 – Manual Health Entry */}
        <article className="glass-card">
          <div className="card-heading">
            <h2>✍️ Manual Health Entry</h2>
          </div>
          <form className="manual-form" onSubmit={(e)=>e.preventDefault()}>
            <div className="form-row">
              <div className="form-field">
                <label>Weight (kg)</label>
                <input type="number" step="0.1" placeholder="e.g. 70" value={weight} onChange={e=>setWeight(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Height (cm)</label>
                <input type="number" placeholder="e.g. 175" value={height} onChange={e=>setHeight(e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Blood Pressure</label>
                <input type="text" placeholder="e.g. 120/80" value={bp} onChange={e=>setBp(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Heart Rate (BPM)</label>
                <input type="number" placeholder="e.g. 72" value={hr} onChange={e=>setHr(e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>SpO₂ (%)</label>
                <input type="number" min="0" max="100" placeholder="e.g. 98" value={spo2} onChange={e=>setSpo2(e.target.value)} />
              </div>
            </div>
            <button type="submit" className="primary-button">Save Measurement</button>
          </form>
        </article>

        {/* Section 3 – Health History */}
        <article className="glass-card">
          <div className="card-heading">
            <h2>📜 Health History</h2>
          </div>
          <div className="history-list">
            {history.map((entry, idx) => (
              <div key={idx} className="history-entry">
                <div className="history-date">{entry.date}</div>
                <ul>
                  {entry.items.map((it, i) => (
                    <li key={i}><strong>{it.label}:</strong> {it.value}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </article>

        {/* Section 4 – Future Integrations */}
        <article className="glass-card">
          <div className="card-heading">
            <h2>🔮 Future Integrations</h2>
          </div>
          <div className="chips">
            {futureIntegrations.map((name, idx) => (
              <span key={idx} className="chip inactive">{name}</span>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

export default HealthMonitoring;