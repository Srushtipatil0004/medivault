import { X } from "lucide-react";

export function ConfirmModal({
  open,
  title,
  message,
  onCancel,
  onConfirm,
  confirmText = "Delete",
  cancelText = "Cancel",
  loading = false,
}) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
        <div className="modal-header">
          <h2 id="confirm-modal-title">{title}</h2>
          <button className="icon-button" onClick={onCancel}><X className="icon" /></button>
        </div>
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <p>{message}</p>
        </div>
        <div className="modal-actions" style={{ justifyContent: 'flex-end', gap: '8px', padding: '16px' }}>
          <button type="button" className="secondary-button cancel-button" onClick={onCancel} disabled={loading}>
            {cancelText}
          </button>
          <button type="button" className="primary-button" style={{ background: '#e53935' }} onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}