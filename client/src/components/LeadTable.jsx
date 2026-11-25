// Leads as a table on desktop and cards on mobile.
import { Pencil, Trash2 } from 'lucide-react';
import { BADGE, STATUSES } from '../constants.js';

const date = (d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

function StatusSelect({ lead, onStatus }) {
  return (
    <select aria-label={`Status for ${lead.full_name}`} value={lead.status} onChange={(e) => onStatus(lead, e.target.value)}
      className={`rounded-full border-0 px-2 py-1 text-xs font-medium focus:ring-2 focus:ring-indigo-500/40 ${BADGE[lead.status]}`}>
      {STATUSES.map((s) => <option key={s}>{s}</option>)}
    </select>
  );
}

function Actions({ lead, onEdit, onDelete }) {
  return (
    <div className="flex gap-1">
      <button aria-label="Edit lead" className="rounded p-1.5 text-slate-500 hover:bg-slate-100" onClick={() => onEdit(lead)}><Pencil size={16} /></button>
      <button aria-label="Delete lead" className="rounded p-1.5 text-red-500 hover:bg-red-50" onClick={() => onDelete(lead)}><Trash2 size={16} /></button>
    </div>
  );
}

export default function LeadTable({ leads, onStatus, onEdit, onDelete }) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>{['Name', 'Phone', 'Company', 'Source', 'Status', 'Created', 'Actions'].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="px-4 py-3"><div className="font-medium">{l.full_name}</div><div className="text-xs text-slate-500">{l.email}</div></td>
                <td className="px-4 py-3">{l.phone}</td><td className="px-4 py-3">{l.company}</td><td className="px-4 py-3">{l.source}</td>
                <td className="px-4 py-3"><StatusSelect lead={l} onStatus={onStatus} /></td>
                <td className="px-4 py-3 whitespace-nowrap">{date(l.created_at)}</td>
                <td className="px-4 py-3"><Actions lead={l} onEdit={onEdit} onDelete={onDelete} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-slate-100 md:hidden">
        {leads.map((l) => (
          <li key={l.id} className="space-y-2 p-4">
            <div className="flex items-start justify-between">
              <div className="min-w-0"><p className="font-medium">{l.full_name}</p><p className="truncate text-xs text-slate-500">{l.email}</p></div>
              <Actions lead={l} onEdit={onEdit} onDelete={onDelete} />
            </div>
            <p className="text-sm text-slate-600">{l.company} · {l.source} · {l.phone}</p>
            <div className="flex items-center justify-between"><StatusSelect lead={l} onStatus={onStatus} /><span className="text-xs text-slate-500">{date(l.created_at)}</span></div>
          </li>
        ))}
      </ul>
    </>
  );
}
