import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import {
  LogOut,
  HelpCircle,
  MessageSquare,
  Info,
  X,
  Check,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showHelp, setShowHelp] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSubject, setFeedbackSubject] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState(null); // 'submitting' | 'success' | 'error'

  const handleSwitchAccount = async () => {
    await logout();
    navigate("/login");
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackSubject.trim() || !feedbackMessage.trim()) return;
    setFeedbackStatus("submitting");
    try {
      await addDoc(collection(db, "feedback"), {
        uid: user?.uid || null,
        subject: feedbackSubject,
        message: feedbackMessage,
        createdAt: serverTimestamp(),
      });
      setFeedbackStatus("success");
      setFeedbackSubject("");
      setFeedbackMessage("");
      setTimeout(() => {
        setFeedbackStatus(null);
        setShowFeedback(false);
      }, 2000);
    } catch (err) {
      console.error(err);
      setFeedbackStatus("error");
    }
  };

  const rows = [
    {
      key: "switchAccount",
      icon: LogOut,
      title: "Switch Account",
      description: "Sign out and log in with another account",
      action: handleSwitchAccount,
      danger: true,
    },
    {
      key: "help",
      icon: HelpCircle,
      title: "Help & User Guide",
      description: "Learn how to use MediVault",
      action: () => setShowHelp(true),
    },
    {
      key: "feedback",
      icon: MessageSquare,
      title: "Send Feedback",
      description: "Share your thoughts with us",
      action: () => setShowFeedback(true),
    },
    {
      key: "about",
      icon: Info,
      title: "About App",
      description: "Version 1.0.0 • MediVault",
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-text">
          <h1>Settings</h1>
          <p className="subtitle">Manage your preferences and account</p>
        </div>
      </div>

      <div className="settings-list">
        {rows.map((row) => (
          <div key={row.key} className="settings-row glass-card">
            <div className="settings-row-left">
              <div className="settings-icon">
                <row.icon className="icon" size={20} />
              </div>
              <div className="settings-info">
                <h4>{row.title}</h4>
                <p>{row.description}</p>
              </div>
            </div>
            <div className="settings-row-right">
              {row.action ? (
                <button
                  className={`settings-btn ${row.danger ? "danger" : ""}`}
                  onClick={row.action}
                  style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px" }}
                >
                  {row.danger ? "Switch" : "Open"}
                  <ChevronRight className="icon" size={16} />
                </button>
              ) : (
                <ChevronRight className="icon chevron" size={20} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Help & User Guide</h2>
              <button className="icon-button" onClick={() => setShowHelp(false)}>
                <X className="icon" size={20} />
              </button>
            </div>
            <div className="help-content">
              <ul>
                <li><strong>Add Medicines:</strong> Go to Medicines → "Add Medicine" and fill name, dosage, schedule.</li>
                <li><strong>Reminders:</strong> Enable notifications; reminders fire at scheduled times.</li>
                <li><strong>Appointments:</strong> Use Appointments → "Add Appointment" to store doctor visits.</li>
                <li><strong>AI Assistant:</strong> Open AI Assistant from sidebar; ask health‑related questions.</li>
                <li><strong>Health Readings:</strong> In Health Monitoring, tap "Add Reading" to log vitals.</li>
              </ul>
            </div>
            <div className="modal-actions">
              <button className="primary-button" onClick={() => setShowHelp(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="modal-overlay" onClick={() => setShowFeedback(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Send Feedback</h2>
              <button className="icon-button" onClick={() => setShowFeedback(false)}>
                <X className="icon" size={20} />
              </button>
            </div>
            <form onSubmit={handleFeedbackSubmit} className="feedback-form">
              {feedbackStatus === "success" && (
                <div className="feedback-success">
                  <Check className="icon" size={20} /> Thanks! Your feedback has been sent.
                </div>
              )}
              {feedbackStatus === "error" && (
                <div className="feedback-error">Failed to send. Please try again.</div>
              )}
              <div className="form-field">
                <label>Subject</label>
                <input
                  type="text"
                  value={feedbackSubject}
                  onChange={(e) => setFeedbackSubject(e.target.value)}
                  placeholder="Subject"
                  disabled={feedbackStatus === "submitting"}
                />
              </div>
              <div className="form-field">
                <label>Message</label>
                <textarea
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder="Your feedback..."
                  rows={4}
                  disabled={feedbackStatus === "submitting"}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowFeedback(false)}
                  disabled={feedbackStatus === "submitting"}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={feedbackStatus === "submitting" || !feedbackSubject.trim() || !feedbackMessage.trim()}
                >
                  {feedbackStatus === "submitting" ? "Sending…" : "Send"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;