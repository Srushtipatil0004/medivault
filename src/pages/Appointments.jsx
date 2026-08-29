import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Calendar,
  Clock,
  User,
  Building,
  FileText,
  Plus,
  Trash2,
  X,
  Search,
  Edit,
} from "lucide-react";
import { fetchAppointments, addAppointment, deleteAppointment, updateAppointment } from "../services/appointments";
import { ConfirmModal } from "../components/ConfirmModal";

function Appointments() {
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editAppointment, setEditAppointment] = useState(null);
  const [modalError, setModalError] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    doctorName: "",
    hospital: "",
    appointmentDate: "",
    appointmentTime: "",
    reason: "",
    notes: "",
    status: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [dateError, setDateError] = useState("");
  const [timeError, setTimeError] = useState("");

  // today's date in YYYY-MM-DD for min attribute and validation
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const validateDate = (dateStr) => {
    if (!dateStr) return "Appointment Date is required";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return "Invalid date format";
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    if (isNaN(year) || parts[0].length !== 4) {
      return "Invalid year";
    }
    if (isNaN(month) || month < 1 || month > 12) {
      return "Month must be 01-12";
    }
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return "Invalid day for the selected month/year";
    }
    return null;
  };

  const validateTime = (timeStr) => {
    if (!timeStr) return "Appointment Time is required";
    const parts = timeStr.split(":");
    if (parts.length !== 2) return "Invalid time format";
    const hour = parseInt(parts[0], 10);
    const minute = parseInt(parts[1], 10);
    if (isNaN(hour) || hour < 0 || hour > 23) return "Hour must be 00-23";
    if (isNaN(minute) || minute < 0 || minute > 59) return "Minute must be 00-59";
    return null;
  };

  const formatDisplayDate = (dateStr) => {
    const dt = new Date(dateStr);
    if (isNaN(dt.getTime())) return dateStr;
    return dt.toLocaleDateString('en-GB'); // DD/MM/YYYY
  };

  const filters = ["All", "Upcoming", "Completed", "Cancelled"];

  // fetch appointments when user is ready
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setAppointments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = fetchAppointments(
      user.uid,
      (data) => {
        setAppointments(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Failed to load appointments");
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [user, authLoading]);

  const handleAddAppointment = async (e) => {
    e.preventDefault();
    if (!user) return;

    // Validate date and time format
    const dErr = validateDate(form.appointmentDate);
    const tErr = validateTime(form.appointmentTime);
    if (dErr) { setDateError(dErr); }
    if (tErr) { setTimeError(tErr); }
    if (dErr || tErr) { return; }

    // Future date / time validation
    const now = new Date();
    const nowTimeStr = now.toTimeString().slice(0,5); // HH:mm
    if (form.appointmentDate === todayStr) {
      if (form.appointmentTime <= nowTimeStr) {
        setTimeError("Please select a future time.");
        return;
      }
    } else if (form.appointmentDate < todayStr) {
      setDateError("Please select a valid future date.");
      return;
    }

    const missing = [];
    if (!form.doctorName.trim()) missing.push("Doctor Name");
    if (!form.hospital.trim()) missing.push("Hospital/Clinic");
    if (!form.appointmentDate) missing.push("Appointment Date");
    if (!form.appointmentTime) missing.push("Appointment Time");
    if (!form.reason.trim()) missing.push("Reason");
    if (missing.length) {
      setModalError(`Missing required fields: ${missing.join(", ")}`);
      return;
    }
    setSubmitting(true);
    setError("");
    setModalError("");
    setDateError("");
    setTimeError("");
    try {
      if (editAppointment) {
        console.log('[Appointments.jsx] calling updateAppointment', { appointmentId: editAppointment.id, form });
        await updateAppointment(user.uid, editAppointment.id, form);
        console.log('[Appointments.jsx] updateAppointment returned');
      } else {
        await addAppointment(user.uid, form);
      }
      setModalOpen(false);
      setEditAppointment(null);
      setForm({
        doctorName: "",
        hospital: "",
        appointmentDate: "",
        appointmentTime: "",
        reason: "",
        notes: "",
        status: "",
      });
    } catch (err) {
      console.error('[Appointments.jsx] error saving appointment', err);
      const msg = err.message || "Failed to save appointment";
      setError(msg);
      setModalError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (appointment) => {
    setEditAppointment(appointment);
    setForm({
      doctorName: appointment.doctorName || "",
      hospital: appointment.hospital || "",
      appointmentDate: appointment.appointmentDate || "",
      appointmentTime: appointment.appointmentTime || "",
      reason: appointment.reason || "",
      notes: appointment.notes || "",
      status: appointment.status || "",
    });
    setModalError("");
    setSubmitting(false);
    setModalOpen(true);
  };

  const handleDelete = (appointment) => {
    setAppointmentToDelete(appointment);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!appointmentToDelete) return;
    setDeleting(true);
    setError("");
    try {
      await deleteAppointment(user.uid, appointmentToDelete.id);
      setDeleteModalOpen(false);
      setAppointmentToDelete(null);
    } catch (err) {
      setError(err.message || "Failed to delete appointment");
    } finally {
      setDeleting(false);
    }
  };

  const filteredAppointments = appointments
    .filter((a) => {
      if (filter !== "All" && a.status !== filter) return false;
      if (search && !a.doctorName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));

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
          <button className="primary-button" onClick={() => { setModalError(""); setSubmitting(false); setModalOpen(true); }}>
            <Plus className="icon" /> Book Appointment
          </button>
        </div>
      </header>

      {error && <div className="auth-error" style={{margin:'16px 0'}}>{error}</div>}

      {/* Appointments Grid */}
      <section className="records-grid">
        {loading ? (
          <p style={{gridColumn:'1/-1',textAlign:'center',color:'#6b7c93'}}>Loading appointments…</p>
        ) : filteredAppointments.length === 0 ? (
          <p style={{gridColumn:'1/-1',textAlign:'center',color:'#6b7c93'}}>No appointments found. Click “Book Appointment” to create one.</p>
        ) : (
          filteredAppointments.map((appt) => (
            <article key={appt.id} className="glass-card record-card">
              <div className="card-heading">
                <div className="record-title-row">
                  <div className="doctor-avatar">{appt.doctorName.charAt(0)}</div>
                  <div>
                    <h2>{appt.doctorName}</h2>
                    <p className="record-sub">{appt.hospital}</p>
                  </div>
                </div>
              </div>

              <div className="record-meta">
                <p><strong>Date:</strong> {formatDisplayDate(appt.appointmentDate)}</p>
                <p><strong>Time:</strong> {appt.appointmentTime}</p>
                <p><strong>Reason:</strong> {appt.reason}</p>
                {appt.notes && <p><strong>Notes:</strong> {appt.notes}</p>}
                {appt.status && (
                  <span className={`status-badge ${appt.status.toLowerCase()}`}>
                    {appt.status}
                  </span>
                )}
              </div>

              <div className="record-actions" style={{display:'flex',gap:'8px'}}>
                <button
                  style={{
                    flex: 1,
                    height: '44px',
                    padding: 0,
                    fontSize: '16px',
                    fontWeight: 600,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleEdit(appt)}
                >
                  <Edit style={{width:'18px',height:'18px'}} /> Edit
                </button>
                <button
                  className="secondary-button delete-button"
                  onClick={() => handleDelete(appt)}
                >
                  <Trash2 style={{width:'18px',height:'18px'}} /> Delete
                </button>
              </div>
            </article>
          ))
        )}
      </section>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteModalOpen}
        title="Delete Appointment?"
        message={appointmentToDelete ? `Are you sure you want to delete ${appointmentToDelete.doctorName}?` : ''}
        onCancel={() => { setDeleteModalOpen(false); setAppointmentToDelete(null); }}
        onConfirm={confirmDelete}
        loading={deleting}
      />

      {/* Add Appointment Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editAppointment ? "Edit Appointment" : "Book Appointment"}</h2>
              <button className="icon-button" onClick={() => { setModalOpen(false); setEditAppointment(null); }}><X className="icon" /></button>
            </div>
            <form onSubmit={handleAddAppointment} className="auth-form" noValidate style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <div className="form-field">
                <label htmlFor="doctorName">Doctor Name</label>
                <input
                  id="doctorName"
                  type="text"
                  placeholder="e.g. Dr. Rahul Sharma"
                  value={form.doctorName}
                  onChange={(e) => setForm({...form, doctorName:e.target.value})}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="hospital">Hospital / Clinic</label>
                <input
                  id="hospital"
                  type="text"
                  placeholder="e.g. City Medical Center"
                  value={form.hospital}
                  onChange={(e) => setForm({...form, hospital:e.target.value})}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="appointmentDate">Appointment Date</label>
                <input
                  id="appointmentDate"
                  type="date"
                  min={todayStr}
                  value={form.appointmentDate}
                  onChange={(e) => { setForm({...form, appointmentDate:e.target.value}); setDateError(""); }}
                  required
                />
                {dateError && <div className="auth-error" style={{marginTop:4}}>{dateError}</div>}
              </div>
              <div className="form-field">
                <label htmlFor="appointmentTime">Appointment Time</label>
                <input
                  id="appointmentTime"
                  type="time"
                  value={form.appointmentTime}
                  onChange={(e) => { setForm({...form, appointmentTime:e.target.value}); setTimeError(""); }}
                  required
                />
                {timeError && <div className="auth-error" style={{marginTop:4}}>{timeError}</div>}
              </div>
              <div className="form-field">
                <label htmlFor="reason">Reason / Purpose</label>
                <input
                  id="reason"
                  type="text"
                  placeholder="e.g. Routine check-up"
                  value={form.reason}
                  onChange={(e) => setForm({...form, reason:e.target.value})}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="notes">Notes (optional)</label>
                <textarea
                  id="notes"
                  rows={3}
                  placeholder="Any additional information..."
                  value={form.notes}
                  onChange={(e) => setForm({...form, notes:e.target.value})}
                />
              </div>
              {editAppointment && (
                <div className="form-field">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    value={form.status}
                    onChange={(e) => setForm({...form, status:e.target.value})}
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              )}
              {modalError && <div className="auth-error" style={{marginBottom:'12px'}}>{modalError}</div>}
              <div className="modal-actions" style={{display:'flex',gap:'8px',justifyContent:'space-between'}}>
                <button type="submit" className="primary-button" disabled={submitting} style={{flex:1}}>
                  {submitting ? "Saving…" : (editAppointment ? "Update Appointment" : "Save Appointment")}
                </button>
                <button type="button" className="secondary-button cancel-button" onClick={() => { setModalOpen(false); setEditAppointment(null); }} style={{flex:1,background:'#e53935',color:'#fff',borderColor:'#e53935'}}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Appointments;