import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  TestTube,
  Scan,
  Brain,
  FileText,
  Syringe,
  HeartPulse,
  Plus,
  Trash2,
  Eye,
  Download,
  X,
} from "lucide-react";
import { fetchRecords, addRecord, deleteRecord } from "../services/medicalRecords";
import { ConfirmModal } from "../components/ConfirmModal";

const typeIcons = {
  "Blood Test": <TestTube className="icon" />,
  "X-Ray": <Scan className="icon" />,
  MRI: <Brain className="icon" />,
  Prescription: <FileText className="icon" />,
  Vaccination: <Syringe className="icon" />,
  ECG: <HeartPulse className="icon" />,
};

const recordTypes = Object.keys(typeIcons);

function MedicalRecords() {
  const { user, loading: authLoading } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All Records");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalError, setModalError] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    type: "Blood Test",
    date: "",
    hospital: "",
    doctor: "",
  });
  const [file, setFile] = useState(null);
  const [fileInfo, setFileInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // fetch records when user is ready
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setRecords([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = fetchRecords(
      user.uid,
      (data) => {
        setRecords(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Failed to load medical records");
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [user, authLoading]);

  const filters = ["All Records", ...recordTypes];

  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!user) return;
    // explicit required-field validation
    const missing = [];
    if (!form.title.trim()) missing.push("Record Title");
    if (!form.date) missing.push("Date");
    if (!form.hospital.trim()) missing.push("Hospital / Clinic");
    if (!form.doctor.trim()) missing.push("Doctor");
    if (missing.length) {
      setModalError(`Missing required fields: ${missing.join(", ")}`);
      return;
    }
    setSubmitting(true);
    setError("");
    setModalError("");
    try {
      await addRecord(user.uid, form, file);
      setModalOpen(false);
      setForm({ title: "", type: "Blood Test", date: "", hospital: "", doctor: "" });
      setFile(null);
    } catch (err) {
      const msg = err.message || "Failed to add record";
      setError(msg);
      setModalError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (record) => {
    setRecordToDelete(record);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    setDeleting(true);
    setError("");
    try {
      await deleteRecord(user.uid, recordToDelete.id, recordToDelete.filePath || "");
      setDeleteModalOpen(false);
      setRecordToDelete(null);
    } catch (err) {
      setError(err.message || "Failed to delete record");
    } finally {
      setDeleting(false);
    }
  };

  const filteredRecords = records
    .filter((r) => {
      if (filter !== "All Records" && r.type !== filter) return false;
      if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

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
          <button className="primary-button" onClick={() => { setModalError(""); setModalOpen(true); }}>
            <Plus className="icon" /> Add Record
          </button>
        </div>
      </header>

      {error && <div className="auth-error" style={{margin:'16px 0'}}>{error}</div>}

      {/* Records Grid */}
      <section className="records-grid">
        {loading ? (
          <p style={{gridColumn:'1/-1',textAlign:'center',color:'#6b7c93'}}>Loading records…</p>
        ) : filteredRecords.length === 0 ? (
          <p style={{gridColumn:'1/-1',textAlign:'center',color:'#6b7c93'}}>No records found. Click “Add Record” to create one.</p>
        ) : (
          filteredRecords.map((rec) => (
            <article key={rec.id} className="glass-card record-card">
              <div className="card-heading">
                <div className="record-title-row">
                  <span className="record-icon">{typeIcons[rec.type] || <FileText className="icon" />}</span>
                  <h2>{rec.title}</h2>
                </div>
              </div>

              <div className="record-meta">
                <p><strong>Date:</strong> {(d => { const dt = new Date(d); return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-GB'); })(rec.date)}</p>
                <p><strong>Type:</strong> {rec.type}</p>
                <p><strong>Hospital:</strong> {rec.hospital}</p>
                <p><strong>Doctor:</strong> {rec.doctor}</p>
              </div>

              <div className="record-actions">
                {rec.fileUrl && (
                  <>
                    <a href={rec.fileUrl} target="_blank" rel="noopener noreferrer" className="primary-button">
                      <Eye className="icon" /> View
                    </a>
                    <a href={rec.fileUrl} download className="secondary-button">
                      <Download className="icon" /> Download
                    </a>
                  </>
                )}
                <button className="secondary-button delete-button" onClick={() => handleDelete(rec)}>
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
        title="Delete Medical Record?"
        message={recordToDelete ? `Are you sure you want to delete ${recordToDelete.title}?` : ''}
        onCancel={() => { setDeleteModalOpen(false); setRecordToDelete(null); }}
        onConfirm={confirmDelete}
        loading={deleting}
      />

      {/* Add Record Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Medical Record</h2>
              <button className="icon-button" onClick={() => setModalOpen(false)}><X className="icon" /></button>
            </div>
            <form onSubmit={handleAddRecord} className="auth-form" noValidate style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <div className="form-field">
                <label htmlFor="title">Record Title</label>
                <input
                  id="title"
                  type="text"
                  placeholder="e.g. Blood Test Report"
                  value={form.title}
                  onChange={(e) => setForm({...form, title:e.target.value})}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="type">Record Type</label>
                <select
                  id="type"
                  className="filter-select"
                  value={form.type}
                  onChange={(e) => setForm({...form, type:e.target.value})}
                >
                  {recordTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
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
                <label htmlFor="hospital">Hospital / Clinic</label>
                <input
                  id="hospital"
                  type="text"
                  placeholder="Hospital name"
                  value={form.hospital}
                  onChange={(e) => setForm({...form, hospital:e.target.value})}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="doctor">Doctor</label>
                <input
                  id="doctor"
                  type="text"
                  placeholder="Doctor name"
                  value={form.doctor}
                  onChange={(e) => setForm({...form, doctor:e.target.value})}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="file">Attach PDF / Image (optional)</label>
                <input
                  id="file"
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => {
                    const chosen = e.target.files[0];
                    if (chosen) {
                      setFileInfo("Attachment upload is currently unavailable. The record will be saved without a file.");
                      setFile(null);
                      e.target.value = "";
                    }
                  }}
                />
                {fileInfo && <p style={{marginTop:6,color:'#2563eb',fontSize:'0.85rem'}}>{fileInfo}</p>}
              </div>
              {modalError && <div className="auth-error" style={{marginBottom:'12px'}}>{modalError}</div>}
              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button" disabled={submitting}>
                  {submitting ? "Saving…" : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MedicalRecords;