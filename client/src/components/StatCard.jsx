// Single dashboard metric with skeleton state.
export default function StatCard({ label, value, loading }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm text-slate-500">{label}</p>
      {loading ? <div className="mt-2 h-7 w-12 animate-pulse rounded bg-slate-200" /> : <p className="mt-1 text-2xl font-semibold">{value ?? 0}</p>}
    </div>
  );
}
