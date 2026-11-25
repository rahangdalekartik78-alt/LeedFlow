// Delete confirmation modal.
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function ConfirmDialog({ title, message, busy, onConfirm, onCancel }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onCancel]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4" onClick={onCancel}>
      <div role="alertdialog" aria-modal="true" className="w-full max-w-sm rounded-xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn bg-red-600 text-white hover:bg-red-700" disabled={busy} onClick={onConfirm}>{busy && <Loader2 className="animate-spin" size={16} />}Delete</button>
        </div>
      </div>
    </div>
  );
}
