import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Utensils,
  Plus,
  Trash2,
  X,
  Search,
  Calendar,
  Clock,
} from "lucide-react";
import { fetchDiet, addDiet, deleteDiet } from "../services/diet";
import { ConfirmModal } from "../components/ConfirmModal";

const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"];

function Diet() {
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalError, setModalError] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    mealType: "Breakfast",
    foodName: "",
    date: "",
    time: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const filters = ["All", ...mealTypes];

  // fetch diet entries when user is ready
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = fetchDiet(
      user.uid,
      (data) => {
        setEntries(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Failed to load diet entries");
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [user, authLoading]);

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!user) return;
    const missing = [];
    if (!form.mealType) missing.push("Meal Type");
    if (!form.foodName.trim()) missing.push("Food / Meal Name");
    if (!form.date) missing.push("Date");
    if (!form.time) missing.push("Time");
    if (missing.length) {
      setModalError(`Missing required fields: ${missing.join(", ")}`);
      return;
    }
    setSubmitting(true);
    setError("");
    setModalError("");
    try {
      await addDiet(user.uid, form);
      setModalOpen(false);
      setForm({
        mealType: "Breakfast",
        foodName: "",
        date: "",
        time: "",
        notes: "",
      });
    } catch (err) {
      const msg = err.message || "Failed to add diet entry";
      setError(msg);
      setModalError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (entry) => {
    setEntryToDelete(entry);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!entryToDelete) return;
    setDeleting(true);
    setError("");
    try {
      await deleteDiet(user.uid, entryToDelete.id);
      setDeleteModalOpen(false);
      setEntryToDelete(null);
    } catch (err) {
      setError(err.message || "Failed to delete diet entry");
    } finally {
      setDeleting(false);
    }
  };

  const filteredEntries = entries
    .filter((e) => {
      if (filter !== "All" && e.mealType !== filter) return false;
      if (search && !e.foodName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="page-container">
      {/* Page Header */}
      <header className="page-header">
        <div className="header-text">
          <h1>Diet Tracker</h1>
          <p className="subtitle">Log your meals and nutrition</p>
        </div>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search meals..."
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            {filters.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <button className="primary-button" onClick={() => { setModalError(""); setSubmitting(false); setModalOpen(true); }}>
            <Plus className="icon" /> Add Meal
          </button>
        </div>
      </header>

      {error && <div className="auth-error" style={{margin:'16px 0'}}>{error}</div>}

      {/* Diet Entries Grid */}
      <section className="records-grid">
        {loading ? (
          <p style={{gridColumn:'1/-1',textAlign:'center',color:'#6b7c93'}}>Loading meals…</p>
        ) : filteredEntries.length === 0 ? (
          <p style={{gridColumn:'1/-1',textAlign:'center',color:'#6b7c93'}}>No meals logged. Click “Add Meal” to create one.</p>
        ) : (
          filteredEntries.map((entry) => (
            <article key={entry.id} className="glass-card record-card">
              <div className="card-heading">
                <div className="record-title-row">
                  <span className="record-icon"><Utensils className="icon" /></span>
                  <h2>{entry.foodName}</h2>
                </div>
              </div>

              <div className="record-meta">
                <p><strong>Meal:</strong> {entry.mealType}</p>
                <p><strong>Date:</strong> {(d => { const dt = new Date(d); return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-GB'); })(entry.date)}</p>
                <p><strong>Time:</strong> {entry.time}</p>
                {entry.notes && <p><strong>Notes:</strong> {entry.notes}</p>}
              </div>

              <div className="record-actions">
                <button className="secondary-button delete-button" onClick={() => handleDelete(entry)}>
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
        title="Delete Diet Entry?"
        message={entryToDelete ? `Are you sure you want to delete ${entryToDelete.foodName}?` : ''}
        onCancel={() => { setDeleteModalOpen(false); setEntryToDelete(null); }}
        onConfirm={confirmDelete}
        loading={deleting}
      />

      {/* Add Meal Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Meal</h2>
              <button className="icon-button" onClick={() => setModalOpen(false)}><X className="icon" /></button>
            </div>
            <form onSubmit={handleAddEntry} className="auth-form" noValidate style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <div className="form-field">
                <label htmlFor="mealType">Meal Type</label>
                <select
                  id="mealType"
                  className="filter-select"
                  value={form.mealType}
                  onChange={(e) => setForm({...form, mealType:e.target.value})}
                >
                  {mealTypes.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="foodName">Food / Meal Name</label>
                <input
                  id="foodName"
                  type="text"
                  placeholder="e.g. Grilled Chicken Salad"
                  value={form.foodName}
                  onChange={(e) => setForm({...form, foodName:e.target.value})}
                  required
                />
              </div>
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
                  {submitting ? "Saving…" : "Save Meal"}
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

export default Diet;