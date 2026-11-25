// Add/edit lead modal with client validation mirroring the backend.
import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { SOURCES, STATUSES } from '../constants.js';
import { errorInfo, leadApi } from '../api.js';

const EMPTY = { full_name: '', email: '', phone: '', company: '', source: 'Website', status: 'New', notes: '' };

const validate = (f) => {
  const e = {};
  if (f.full_name.trim().length < 2) e.full_name = 'Name must be at least 2 characters';
  if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'Enter a valid email';
  const phone = f.phone.replace(/[\s\-()]/g, '');
  if (!/^(\+\d{1,3})?\d{10}$/.test(phone)) e.phone = 'Enter 10 digits, optionally with a country code (e.g. +91 9876543210)';
  if (!f.company.trim()) e.company = 'Company is required';
  if (f.notes.length > 1000) e.notes = 'Notes cannot exceed 1000 characters';
  return e;
};

export default function LeadForm({ lead, onClose, onSaved }) {
  const [form, setForm] = useState(lead ? { ...EMPTY, ...lead, notes: lead.notes || '' } : EMPTY);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) return;
    const body = { full_name: form.full_name, email: form.email, phone: form.phone, company: form.company,
      source: form.source, status: form.status, notes: form.notes || null };
    setBusy(true);
    try {
      lead ? await leadApi.update(lead.id, body) : await leadApi.create(body);
      onSaved(lead ? 'Lead updated' : 'Lead added');
    } catch (err) {
      const { message, fields } = errorInfo(err);
      setErrors(Object.keys(fields).length ? fields : { form: message });
    } finally { setBusy(false); }
  };

  const text = (id, label, type = 'text') => (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">{label}</label>
      <input id={id} type={type} className="input" value={form[id]} onChange={set(id)} />
      {errors[id] && <p className="mt-1 text-xs text-red-600">{errors[id]}</p>}
    </div>
  );
  const select = (id, label, opts) => (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">{label}</label>
      <select id={id} className="input" value={form[id]} onChange={set(id)}>{opts.map((o) => <option key={o}>{o}</option>)}</select>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/50 p-4" onClick={onClose}>
      <form role="dialog" aria-modal="true" noValidate onSubmit={submit} onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{lead ? 'Edit lead' : 'Add lead'}</h2>
          <button type="button" aria-label="Close" onClick={onClose}><X size={20} /></button>
        </div>
        {errors.form && <p role="alert" className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{errors.form}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          {text('full_name', 'Full name')}{text('email', 'Email', 'email')}
          {text('phone', 'Phone', 'tel')}{text('company', 'Company')}
          {select('source', 'Source', SOURCES)}{select('status', 'Status', STATUSES)}
        </div>
        <div>
          <label htmlFor="notes" className="mb-1 block text-sm font-medium">Notes</label>
          <textarea id="notes" rows={3} className="input" value={form.notes} onChange={set('notes')} />
          <p className={`mt-1 text-right text-xs ${form.notes.length > 1000 ? 'text-red-600' : 'text-slate-400'}`}>{form.notes.length}/1000</p>
          {errors.notes && <p className="text-xs text-red-600">{errors.notes}</p>}
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy && <Loader2 className="animate-spin" size={16} />}{lead ? 'Save changes' : 'Add lead'}</button>
        </div>
      </form>
    </div>
  );
}
