import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Pill,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { fetchMedicines, addMedicine, deleteMedicine, takeDose } from "../services/medicines";
import { fetchPreferences, updatePreference } from "../services/preferences";
import { app } from "../firebase";
import { ConfirmModal } from "../components/ConfirmModal";

const TIMING_OPTIONS = [
  { value: "before_breakfast", label: "Before breakfast" },
  { value: "after_breakfast", label: "After breakfast" },
  { value: "before_lunch", label: "Before lunch" },
  { value: "after_lunch", label: "After lunch" },
  { value: "before_dinner", label: "Before dinner" },
  { value: "after_dinner", label: "After dinner" },
  { value: "at_bedtime", label: "At bedtime" },
  { value: "other", label: "Other / Doctor's instruction" },
];

const REMINDER_LEAD_OPTIONS = [15, 30, 60, 120];

const DEFAULT_MEAL_REFERENCE = {
  before_breakfast: "08:00",
  after_breakfast: "08:30",
  before_lunch: "13:00",
  after_lunch: "13:30",
  before_dinner: "20:00",
  after_dinner: "20:30",
  at_bedtime: "22:00",
};

function getMealFromTiming(timing) {
  if (!timing) return null;
  if (timing.includes("breakfast")) return "breakfast";
  if (timing.includes("lunch")) return "lunch";
  if (timing.includes("dinner")) return "dinner";
  return null;
}

function Medicines() {
  const { user, loading: authLoading } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalError, setModalError] = useState("");
  const [form, setForm] = useState({
    name: "",
    dosage: "",
    frequency: "Once",
    timingType: "after_breakfast",
    exactTime: "",
    reminderEnabled: true,
    reminderLeadMinutes: 60,
    doctorInstruction: "",
    startDate: "",
    endDate: "",
    notes: "",
    totalTablets: "",
    tabletsPerDose: 1,
  });
  const [submitting, setSubmitting] = useState(false);
  const [mealPrefs, setMealPrefs] = useState({ usualBreakfastTime: "", usualLunchTime: "", usualDinnerTime: "" });
  const [mealTimeValue, setMealTimeValue] = useState("");
  const [rememberMealTime, setRememberMealTime] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [medicineToDelete, setMedicineToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const frequencies = ["Once", "Twice", "Thrice"];

  // fetch medicines when user is ready
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setMedicines([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = fetchMedicines(
      user.uid,
      (data) => {
        setMedicines(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Failed to load medicines");
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [user, authLoading]);

  // fetch meal preferences
  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    const unsub = fetchPreferences(
      user.uid,
      (prefs) => setMealPrefs(prefs),
      (err) => console.error("Failed to load meal prefs", err)
    );
    return unsub;
  }, [user, authLoading]);

  // update mealTimeValue when timingType changes to a meal-related option
  useEffect(() => {
    const meal = getMealFromTiming(form.timingType);
    if (meal) {
      const saved = mealPrefs[`usual${meal.charAt(0).toUpperCase() + meal.slice(1)}Time`] || "";
      setMealTimeValue(saved);
      setRememberMealTime(!!saved);
    } else {
      setMealTimeValue("");
    }
  }, [form.timingType, mealPrefs]);

  const validateForm = () => {
    const missing = [];
    if (!form.name.trim()) missing.push("Medicine Name");
    if (!form.dosage.trim()) missing.push("Dosage");
    if (!form.timingType) missing.push("When to take");
    if (form.timingType === "other" && !form.doctorInstruction.trim()) missing.push("Doctor's instruction");
    if (!form.startDate) missing.push("Start Date");
    if (!form.totalTablets) missing.push("Total Tablets");
    if (!form.tabletsPerDose) missing.push("Tablets Per Dose");
    if (form.exactTime) {
      const parts = form.exactTime.split(":");
      if (parts.length !== 2) return "Invalid exact time format";
      const h = parseInt(parts[0],10), m = parseInt(parts[1],10);
      if (isNaN(h) || h<0 || h>23 || isNaN(m) || m<0 || m>59) return "Exact time must be HH:MM (00-23, 00-59)";
    }
    return missing.length ? `Missing required fields: ${missing.join(", ")}` : null;
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    if (!user) return;
    const validationErr = validateForm();
    if (validationErr) {
      setModalError(validationErr);
      return;
    }
    // Diagnostics
    console.log("[AI] Medicine save: starting", { uid: user.uid, projectId: app.options.projectId });
    // Determine scheduled time for the medicine
    let scheduledTime = form.exactTime;
    if (!scheduledTime) {
      const meal = getMealFromTiming(form.timingType);
      if (meal) {
        scheduledTime = mealTimeValue || DEFAULT_MEAL_REFERENCE[form.timingType] || "08:00";
      } else {
        scheduledTime = DEFAULT_MEAL_REFERENCE[form.timingType] || "08:00";
      }
    }
    const dataToSave = { ...form, times: [scheduledTime] };
    setSubmitting(true);
    setError("");
    setModalError("");
    try {
      console.log("[AI] Medicine save: medicine write starting");
      const medicineId = await addMedicine(user.uid, dataToSave);
      console.log("[AI] Medicine save: medicine write succeeded", { medicineId });

      // Attempt to persist meal-time preference (non-blocking)
      const meal = getMealFromTiming(form.timingType);
      if (meal && rememberMealTime && mealTimeValue) {
        const field = `usual${meal.charAt(0).toUpperCase() + meal.slice(1)}Time`;
        try {
          console.log("[AI] Medicine save: preference write starting", { field });
          await updatePreference(user.uid, field, mealTimeValue);
          console.log("[AI] Medicine save: preference write succeeded");
        } catch (prefErr) {
          console.log("[Preferences] save failed:", prefErr.code, prefErr.message);
          // Non‑blocking UI notice
          setError("Medicine saved. Your reminder preference could not be saved.");
        }
      }

      setModalOpen(false);
      setForm({
        name: "",
        dosage: "",
        frequency: "Once",
        timingType: "after_breakfast",
        exactTime: "",
        reminderEnabled: true,
        reminderLeadMinutes: 60,
        doctorInstruction: "",
        startDate: "",
        endDate: "",
        notes: "",
        totalTablets: "",
        tabletsPerDose: 1,
      });
      setMealTimeValue("");
      setRememberMealTime(true);
    } catch (err) {
      console.log("[AI] Medicine save error:", err.code, err.message);
      const msg = err.message || "Failed to add medicine";
      setError(msg);
      setModalError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (medicine) => {
    setMedicineToDelete(medicine);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!medicineToDelete) return;
    setDeleting(true);
    setError("");
    try {
      await deleteMedicine(user.uid, medicineToDelete.id);
      setDeleteModalOpen(false);
      setMedicineToDelete(null);
    } catch (err) {
      setError(err.message || "Failed to delete medicine");
    } finally {
      setDeleting(false);
    }
  };

  const handleTakeDose = async (medicine) => {
    const remaining = Number(medicine.remainingTablets ?? medicine.totalTablets) || 0;
    if (remaining <= 0) return;
    setError("");
    try {
      await takeDose(user.uid, medicine);
    } catch (err) {
      setError(err.message || "Failed to take dose");
    }
  };

  const freqMultiplier = { Once: 1, Twice: 2, Thrice: 3 };
  const getFinishDate = (startDateStr, days) => {
    const d = new Date(startDateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const filteredMedicines = medicines
    .filter((m) => {
      if (filter !== "All" && m.frequency !== filter) return false;
      if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt?.seconds * 1000 || 0) - new Date(a.createdAt?.seconds * 1000 || 0));

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
            {["All", ...frequencies].map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <button className="primary-button" onClick={() => {
              setModalError("");
              // initialize meal time from preferences
              const meal = getMealFromTiming(form.timingType);
              if (meal) {
                const saved = mealPrefs[`usual${meal.charAt(0).toUpperCase() + meal.slice(1)}Time`] || "";
                setMealTimeValue(saved);
                setRememberMealTime(!!saved);
              } else {
                setMealTimeValue("");
                setRememberMealTime(true);
              }
              setModalOpen(true);
            }}>
            <Plus className="icon" /> Add Medicine
          </button>
        </div>
      </header>

      {error && <div className="auth-error" style={{margin:'16px 0'}}>{error}</div>}

      {/* Medicines Grid */}
      <section className="records-grid">
        {loading ? (
          <p style={{gridColumn:'1/-1',textAlign:'center',color:'#6b7c93'}}>Loading medicines…</p>
        ) : filteredMedicines.length === 0 ? (
          <p style={{gridColumn:'1/-1',textAlign:'center',color:'#6b7c93'}}>No medicines found. Click “Add Medicine” to create one.</p>
        ) : (
          filteredMedicines.map((med) => {
              const total = Number(med.totalTablets) || 0;
              const perDose = Number(med.tabletsPerDose) || 1;
              const mult = freqMultiplier[med.frequency] || 1;
              const daily = perDose * mult;
              const remaining = Number(med.remainingTablets ?? med.totalTablets) || 0;
              const daysLeft = daily > 0 ? Math.ceil(remaining / daily) : 0;
              const finishDate = med.startDate ? getFinishDate(med.startDate, daysLeft) : "";
              const isCompleted = remaining <= 0;
              const timingLabel = TIMING_OPTIONS.find(o=>o.value===med.timingType)?.label || med.timingType || "—";
              return (
                <article key={med.id} className="glass-card record-card">
                  <div className="card-heading">
                    <div className="record-title-row">
                      <span className="record-icon"><Pill className="icon" /></span>
                      <h2>{med.name}</h2>
                      {isCompleted && <span className="status-badge completed">Completed</span>}
                    </div>
                  </div>

                  <div className="record-meta">
                    <p><strong>Dosage:</strong> {med.dosage}</p>
                    <p><strong>Remaining:</strong> {remaining} / {total} tablets</p>
                    <p><strong>Frequency:</strong> {med.frequency}</p>
                    <p><strong>When to take:</strong> {timingLabel}</p>
                    {med.exactTime && <p><strong>Exact time:</strong> {med.exactTime}</p>}
                    {med.doctorInstruction && <p><strong>Instruction:</strong> {med.doctorInstruction}</p>}
                    <p><strong>Finish Date:</strong> {finishDate || "—"}</p>
                    {med.notes && <p><strong>Notes:</strong> {med.notes}</p>}
                  </div>

                  <div className="record-actions">
                    <button
                      className="primary-button"
                      style={{flex:1}}
                      onClick={() => handleTakeDose(med)}
                      disabled={isCompleted}
                    >
                      Take Dose
                    </button>
                    <button className="secondary-button delete-button" style={{flex:1}} onClick={() => handleDelete(med)}>
                      <Trash2 className="icon" /> Delete
                    </button>
                  </div>
                </article>
              );
            })
        )}
      </section>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteModalOpen}
        title="Delete Medicine?"
        message={medicineToDelete ? `Are you sure you want to delete ${medicineToDelete.name}?` : ''}
        onCancel={() => { setDeleteModalOpen(false); setMedicineToDelete(null); }}
        onConfirm={confirmDelete}
        loading={deleting}
      />

      {/* Add Medicine Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Medicine</h2>
              <button className="icon-button" onClick={() => setModalOpen(false)}><X className="icon" /></button>
            </div>
            <form onSubmit={handleAddMedicine} className="auth-form" noValidate style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <div className="form-field">
                <label htmlFor="name">Medicine Name</label>
                <input
                  id="name"
                  type="text"
                  placeholder="e.g. Metformin"
                  value={form.name}
                  onChange={(e) => setForm({...form, name:e.target.value})}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="dosage">Dosage</label>
                <input
                  id="dosage"
                  type="text"
                  placeholder="e.g. 500 mg"
                  value={form.dosage}
                  onChange={(e) => setForm({...form, dosage:e.target.value})}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="frequency">Frequency</label>
                <select
                  id="frequency"
                  className="filter-select"
                  value={form.frequency}
                  onChange={(e) => setForm({...form, frequency:e.target.value})}
                >
                  {frequencies.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="timingType">When to take</label>
                <select
                  id="timingType"
                  className="filter-select"
                  value={form.timingType}
                  onChange={(e) => setForm({...form, timingType:e.target.value})}
                >
                  {TIMING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="exactTime">Exact time (optional)</label>
                <input
                  id="exactTime"
                  type="time"
                  value={form.exactTime}
                  onChange={(e) => setForm({...form, exactTime:e.target.value})}
                />
              </div>
              {(() => {
                const meal = getMealFromTiming(form.timingType);
                if (!meal) return null;
                const label = `Usual ${meal.charAt(0).toUpperCase() + meal.slice(1)} time`;
                const placeholder = `Enter your usual ${meal} time`;
                const saved = mealPrefs[`usual${meal.charAt(0).toUpperCase() + meal.slice(1)}Time`];
                return (
                  <div className="form-field">
                    <label htmlFor="mealTime">{label}</label>
                    <input
                      id="mealTime"
                      type="time"
                      value={mealTimeValue}
                      onChange={(e) => setMealTimeValue(e.target.value)}
                      placeholder={placeholder}
                    />
                    <div style={{display:"inline-flex",alignItems:"center",gap:"8px",marginTop:"4px",alignSelf:"flex-start"}}>
                      <input
                        type="checkbox"
                        id="rememberMealTime"
                        checked={rememberMealTime}
                        onChange={(e) => setRememberMealTime(e.target.checked)}
                      />
                      <label htmlFor="rememberMealTime" style={{fontSize:"0.85rem",cursor:"pointer",whiteSpace:"nowrap"}}>
                        Remember for next time
                      </label>
                    </div>
                  </div>
                );
              })()}
              <div className="form-field">
                <label htmlFor="doctorInstruction">Doctor's instruction (if Other)</label>
                <input
                  id="doctorInstruction"
                  type="text"
                  placeholder="e.g. Take with food"
                  value={form.doctorInstruction}
                  onChange={(e) => setForm({...form, doctorInstruction:e.target.value})}
                />
              </div>
              <div className="form-field">
                <label htmlFor="reminderEnabled">Enable reminder</label>
                <select
                  id="reminderEnabled"
                  className="filter-select"
                  value={form.reminderEnabled ? "true" : "false"}
                  onChange={(e) => setForm({...form, reminderEnabled: e.target.value === "true"})}
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="reminderLeadMinutes">Reminder lead time (minutes before)</label>
                <select
                  id="reminderLeadMinutes"
                  className="filter-select"
                  value={form.reminderLeadMinutes}
                  onChange={(e) => setForm({...form, reminderLeadMinutes: parseInt(e.target.value,10)})}
                >
                  {REMINDER_LEAD_OPTIONS.map((v) => <option key={v} value={v}>{v} min</option>)}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="startDate">Start Date</label>
                <input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({...form, startDate:e.target.value})}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="endDate">End Date (optional)</label>
                <input
                  id="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({...form, endDate:e.target.value})}
                />
              </div>
              <div className="form-field">
                <label htmlFor="totalTablets">Total Tablets</label>
                <input
                  id="totalTablets"
                  type="number"
                  min="1"
                  placeholder="e.g. 30"
                  value={form.totalTablets}
                  onChange={(e) => setForm({...form, totalTablets:e.target.value})}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="tabletsPerDose">Tablets Per Dose</label>
                <input
                  id="tabletsPerDose"
                  type="number"
                  min="1"
                  placeholder="e.g. 1"
                  value={form.tabletsPerDose}
                  onChange={(e) => setForm({...form, tabletsPerDose:e.target.value})}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="notes">Notes (optional)</label>
                <textarea
                  id="notes"
                  rows={3}
                  placeholder="Any additional instructions..."
                  value={form.notes}
                  onChange={(e) => setForm({...form, notes:e.target.value})}
                />
              </div>
              {modalError && <div className="auth-error" style={{marginBottom:'12px'}}>{modalError}</div>}
              <div className="modal-actions">
                <button type="submit" className="primary-button" disabled={submitting}>
                  {submitting ? "Saving…" : "Save Medicine"}
                </button>
                <button type="button" className="secondary-button cancel-button" onClick={() => { setMealTimeValue(""); setRememberMealTime(true); setModalOpen(false); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Medicines;