// Dashboard: stats, toolbar, list, pagination and modals.
import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar.jsx';
import StatCard from '../components/StatCard.jsx';
import LeadTable from '../components/LeadTable.jsx';
import LeadForm from '../components/LeadForm.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { errorInfo, leadApi } from '../api.js';
import { SORTS, SOURCES, STATUSES } from '../constants.js';

const LIMIT = 10;
const CARDS = [['Total', 'total'], ['New', 'NEW'], ['Contacted', 'CONTACTED'], ['Interested', 'INTERESTED'], ['Converted', 'CONVERTED'], ['Lost', 'LOST']];
const norm = (s) => (s ? { total: s.total, NEW: s.new, CONTACTED: s.contacted, INTERESTED: s.interested, CONVERTED: s.converted, LOST: s.lost } : {});

export default function Dashboard() {
  const [filters, setFilters] = useState({ search: '', status: '', source: '', sort: 0 });
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], meta: { total: 0, total_pages: 0 } });
  const [stats, setStats] = useState(null);
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // {lead?} for form
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => { const t = setTimeout(() => { setDebounced(filters.search); setPage(1); }, 400); return () => clearTimeout(t); }, [filters.search]);

  const loadStats = useCallback(() => leadApi.stats().then(setStats).catch(() => {}), []);
  useEffect(() => { loadStats(); }, [loadStats, tick]);

  useEffect(() => {
    const ctrl = new AbortController();
    const s = SORTS[filters.sort];
    setState('loading');
    leadApi.list({ search: debounced || undefined, status: filters.status || undefined, source: filters.source || undefined,
      page, limit: LIMIT, sort_by: s.sort_by, order: s.order }, ctrl.signal)
      .then((r) => {
        if (r.meta.total_pages && page > r.meta.total_pages) return setPage(r.meta.total_pages);
        setData({ items: r.data, meta: r.meta }); setState('ready');
      })
      .catch((e) => { if (e.code === 'ERR_CANCELED') return; setError(errorInfo(e).message); setState('error'); });
    return () => ctrl.abort();
  }, [debounced, filters.status, filters.source, filters.sort, page, tick]);

  const refresh = () => setTick((t) => t + 1);
  const setF = (k) => (e) => { setFilters({ ...filters, [k]: e.target.value }); setPage(1); };
  const hasFilters = filters.search || filters.status || filters.source || filters.sort;
  const clear = () => { setFilters({ search: '', status: '', source: '', sort: 0 }); setPage(1); };

  const changeStatus = async (lead, status) => {
    const prev = data;
    setData({ ...data, items: data.items.map((l) => (l.id === lead.id ? { ...l, status } : l)) });
    try { await leadApi.setStatus(lead.id, status); toast.success('Status updated'); loadStats(); }
    catch (e) { setData(prev); toast.error(errorInfo(e).message); }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await leadApi.remove(toDelete.id);
      toast.success('Lead deleted');
      if (data.items.length === 1 && page > 1) setPage(page - 1);
      setToDelete(null); refresh();
    } catch (e) { toast.error(errorInfo(e).message); } finally { setDeleting(false); }
  };

  const { total } = data.meta;
  const from = total ? (page - 1) * LIMIT + 1 : 0;
  const to = Math.min(page * LIMIT, total);
  const n = norm(stats);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {CARDS.map(([label, key]) => <StatCard key={key} label={label} value={n[key]} loading={!stats} />)}
        </section>

        <section className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input aria-label="Search leads" placeholder="Search name, email or company" className="input pl-9" value={filters.search} onChange={setF('search')} />
          </div>
          <select aria-label="Filter by status" className="input !w-auto" value={filters.status} onChange={setF('status')}>
            <option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
          <select aria-label="Filter by source" className="input !w-auto" value={filters.source} onChange={setF('source')}>
            <option value="">All sources</option>{SOURCES.map((s) => <option key={s}>{s}</option>)}</select>
          <select aria-label="Sort" className="input !w-auto" value={filters.sort} onChange={(e) => { setFilters({ ...filters, sort: Number(e.target.value) }); setPage(1); }}>
            {SORTS.map((s, i) => <option key={s.label} value={i}>{s.label}</option>)}</select>
          {hasFilters ? <button className="btn-ghost" onClick={clear}><X size={16} />Clear</button> : null}
          <button className="btn-primary" onClick={() => setModal({})}><Plus size={16} />Add lead</button>
        </section>

        <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          {state === 'loading' && <div className="space-y-3 p-4">{[...Array(5)].map((_, i) => <div key={i} className="h-10 animate-pulse rounded bg-slate-100" />)}</div>}
          {state === 'error' && (
            <div className="p-10 text-center"><p className="text-red-600">{error}</p><button className="btn-primary mt-3" onClick={refresh}>Retry</button></div>)}
          {state === 'ready' && data.items.length === 0 && (
            <div className="p-10 text-center">
              <p className="font-medium">{hasFilters ? 'No leads match your filters' : 'No leads yet'}</p>
              <p className="mt-1 text-sm text-slate-500">{hasFilters ? 'Try clearing filters.' : 'Add your first lead to get started.'}</p>
              {!hasFilters && <button className="btn-primary mt-3" onClick={() => setModal({})}><Plus size={16} />Add lead</button>}
            </div>)}
          {state === 'ready' && data.items.length > 0 && (
            <LeadTable leads={data.items} onStatus={changeStatus} onEdit={(lead) => setModal({ lead })} onDelete={setToDelete} />)}
          {state === 'ready' && total > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm">
              <span className="text-slate-500">Showing {from}–{to} of {total}</span>
              <div className="flex gap-2">
                <button aria-label="Previous page" className="btn-ghost !px-2" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></button>
                <button aria-label="Next page" className="btn-ghost !px-2" disabled={page >= data.meta.total_pages} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></button>
              </div>
            </div>)}
        </section>
      </main>

      {modal && <LeadForm lead={modal.lead} onClose={() => setModal(null)} onSaved={(msg) => { toast.success(msg); setModal(null); refresh(); }} />}
      {toDelete && <ConfirmDialog title="Delete lead?" message={`${toDelete.full_name} will be permanently removed.`} busy={deleting} onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />}
    </div>
  );
}
