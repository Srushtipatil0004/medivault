import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Heart,
  HeartPulse,
  Droplet,
  Thermometer,
  Weight,
  Calendar,
  Clock,
  Plus,
  Trash2,
  X,
  Search,
} from "lucide-react";
import { fetchHealthReadings, addHealthReading, deleteHealthReading } from "../services/healthMonitoring";
import { ConfirmModal } from "../components/ConfirmModal";

function HealthMonitoring() {
  const { user, loading: authLoading } = useAuth();
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalError, setModalError] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [readingToDelete, setReadingToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    date: "",
    time: "",
    systolic: "",
    diastolic: "",
    heartRate: "",
    bloodSugar: "",
    spo2: "",
    temperature: "",
    weight: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // fetch readings when user is ready
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setReadings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = fetchHealthReadings(
      user.uid,
      (data) => {
        setReadings(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Failed to load health readings");
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [user, authLoading]);

  const handleAddReading = async (e) => {
    e.preventDefault();
    if (!user) return;
    const missing = [];
    if (!form.date) missing.push("Date");
    if (!form.time) missing.push("Time");
    // at least one reading field required
    const hasReading = form.systolic || form.diastolic || form.heartRate || form.bloodSugar || form.spo2 || form.temperature || form.weight;
    if (!hasReading) missing.push("at least one reading value");
    if (missing.length) {
      setModalError(`Missing required fields: ${missing.join(", ")}`);
      return;
    }
    setSubmitting(true);
    setError("");
    setModalError("");
    try {
      await addHealthReading(user.uid, form);
      setModalOpen(false);
      setForm({
        date: "",
        time: "",
        systolic: "",
        diastolic: "",
        heartRate: "",
        bloodSugar: "",
        spo2: "",
        temperature: "",
        weight: "",
        notes: "",
      });
    } catch (err) {
      const msg = err.message || "Failed to add health reading";
      setError(msg);
      setModalError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (reading) => {
    setReadingToDelete(reading);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!readingToDelete) return;
    setDeleting(true);
    setError("");
    try {
      await deleteHealthReading(user.uid, readingToDelete.id);
      setDeleteModalOpen(false);
      setReadingToDelete(null);
    } catch (err) {
      setError(err.message || "Failed to delete health reading");
    } finally {
      setDeleting(false);
    }
  };

  const filteredReadings = readings
    .filter((r) => {
      if (search && !r.notes?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const latest = readings[0] || null;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <header className="page-header">
        <div className="header-text">
          <h1>Health Monitoring</h1>
          <p className="subtitle">Track your vital signs and health metrics</p>
        </div>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search notes..."
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="primary-button" onClick={() => { setModalError(""); setSubmitting(false); setModalOpen(true); }}>
            <Plus className="icon" /> Add Reading
          </button>
        </div>
      </header>

      {error && <div className="auth-error" style={{margin:'16px 0'}}>{error}</div>}

      {/* Summary Dashboard */}
      {latest && (
        <section className="overview-grid" style={{marginBottom:'24px'}}>
          <article className="glass-card stat-card">
            <HeartPulse className="stat-icon" />
            <span>Heart Rate</span>
            <strong>{latest.heartRate ? `${latest.heartRate} bpm` : "—"}</strong>
          </article>
          <article className="glass-card stat-card">
            <Heart className="stat-icon" />
            <span>Blood Pressure</span>
            <strong>{latest.systolic && latest.diastolic ? `${latest.systolic}/${latest.diastolic} mmHg` : "—"}</strong>
          </article>
          <article className="glass-card stat-card">
            <Droplet className="stat-icon" />
            <span>SpO₂</span>
            <strong>{latest.spo2 ? `${latest.spo2}%` : "—"}</strong>
          </article>
          <article className="glass-card stat-card">
            <Droplet className="stat-icon" />
            <span>Blood Sugar</span>
            <strong>{latest.bloodSugar ? `${latest.bloodSugar} mg/dL` : "—"}</strong>
          </article>
          <article className="glass-card stat-card">
            <Thermometer className="stat-icon" />
            <span>Temperature</span>
            <strong>{latest.temperature ? `${latest.temperature}°C` : "—"}</strong>
          </article>
          <article className="glass-card stat-card">
            <Weight className="stat-icon" />
            <span>Weight</span>
            <strong>{latest.weight ? `${latest.weight} kg` : "—"}</strong>
          </article>
        </section>
      )}

      {/* Readings Grid */}
      <section className="records-grid">
        {loading ? (
          <p style={{gridColumn:'1/-1',textAlign:'center',color:'#6b7c93'}}>Loading readings…</p>
        ) : filteredReadings.length === 0 ? (
          <p style={{gridColumn:'1/-1',textAlign:'center',color:'#6b7c93'}}>No readings recorded. Click “Add Reading” to create one.</p>
        ) : (
          filteredReadings.map((r) => (
            <article key={r.id} className="glass-card record-card">
              <div className="card-heading">
                <div className="record-title-row">
                  <span className="record-icon"><HeartPulse className="icon" /></span>
                  <h2>{formatDate(r.date)} • {r.time}</h2>
                </div>
              </div>

              <div className="record-meta">
                {r.systolic && r.diastolic && <p><strong>BP:</strong> {r.systolic}/{r.diastolic} mmHg</p>}
                {r.heartRate && <p><strong>HR:</strong> {r.heartRate} bpm</p>}
                {r.bloodSugar && <p><strong>Blood Sugar:</strong> {r.bloodSugar} mg/dL</p>}
                {r.spo2 && <p><strong>SpO₂:</strong> {r.spo2}%</p>}
                {r.temperature && <p><strong>Temp:</strong> {r.temperature}°C</p>}
                {r.weight && <p><strong>Weight:</strong> {r.weight} kg</p>}
                {r.notes && <p><strong>Notes:</strong> {r.notes}</p>}
              </div>

              <div className="record-actions">
                <button className="secondary-button delete-button" onClick={() => handleDelete(r)}>
                  <Trash2 className="icon" /> Delete
                </button>
              </div>
            </article>
          ))
        )}
      </section>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteModalOpen}
        title="Delete Health Reading?"
        message={readingToDelete ? `Are you sure you want to delete this reading?` : ''}
        onCancel={() => { setDeleteModalOpen(false); setReadingToDelete(null); }}
        onConfirm={confirmDelete}
        loading={deleting}
      />

      {/* Add Reading Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Health Reading</h2>
              <button className="icon-button" onClick={() => setModalOpen(false)}><X className="icon" /></button>
            </div>
            <form onSubmit={handleAddReading} className="auth-form" noValidate style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <div className="form-field">
                <label htmlFor="date">Date</label>
                <input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({...form, date:e.target.value})}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="time">Time</label>
                <input
                  id="time"
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({...form, time:e.target.value})}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="systolic">Systolic (mmHg)</label>
                <input
                  id="systolic"
                  type="number"
                  placeholder="e.g. 120"
                  value={form.systolic}
                  onChange={(e) => setForm({...form, systolic:e.target.value})}
                />
              </div>
              <div className="form-field">
                <label htmlFor="diastolic">Diastolic (mmHg)</label>
                <input
                  id="diastolic"
                  type="number"
                  placeholder="e.g. 80"
                  value={form.diastolic}
                  onChange={(e) => setForm({...form, diastolic:e.target.value})}
                />
              </div>
              <div className="form-field">
                <label htmlFor="heartRate">Heart Rate (bpm)</label>
                <input
                  id="heartRate"
                  type="number"
                  placeholder="e.g. 72"
                  value={form.heartRate}
                  onChange={(e) => setForm({...form, heartRate:e.target.value})}
                />
              </div>
              <div className="form-field">
                <label htmlFor="bloodSugar">Blood Sugar (mg/dL)</label>
                <input
                  id="bloodSugar"
                  type="number"
                  placeholder="e.g. 95"
                  value={form.bloodSugar}
                  onChange={(e) => setForm({...form, bloodSugar:e.target.value})}
                />
              </div>
              <div className="form-field">
                <label htmlFor="spo2">SpO₂ (%)</label>
                <input
                  id="spo2"
                  type="number"
                  placeholder="e.g. 98"
                  value={form.spo2}
                  onChange={(e) => setForm({...form, spo2:e.target.value})}
                />
              </div>
              <div className="form-field">
                <label htmlFor="temperature">Temperature (°C)</label>
                <input
                  id="temperature"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 36.6"
                  value={form.temperature}
                  onChange={(e) => setForm({...form, temperature:e.target.value})}
                />
              </div>
              <div className="form-field">
                <label htmlFor="weight">Weight (kg)</label>
                <input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 70.5"
                  value={form.weight}
                  onChange={(e) => setForm({...form, weight:e.target.value})}
                />
              </div>
              <div className="form-field">
                <label htmlFor="notes">Notes (optional)</label>
                <textarea
                  id="notes"
                  rows={3}
                  placeholder="Any additional details..."
                  value={form.notes}
                  onChange={(e) => setForm({...form, notes:e.target.value})}
                />
              </div>
              {modalError && <div className="auth-error" style={{marginBottom:'12px'}}>{modalError}</div>}
              <div className="modal-actions">
                <button type="submit" className="primary-button" disabled={submitting}>
                  {submitting ? "Saving…" : "Save Reading"}
                </button>
                <button type="button" className="secondary-button cancel-button" onClick={() => setModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default HealthMonitoring;