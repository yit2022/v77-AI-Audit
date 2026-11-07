export default function AppLoading() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading workspace view">
      <div className="h-7 w-64 rounded-lg bg-slate-200/70" />
      <div className="h-4 w-96 max-w-full rounded bg-slate-100" />
      <div className="grid gap-4 pt-2 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-28 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm" />
        <div className="h-28 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm" />
        <div className="h-28 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm" />
      </div>
      <div className="h-64 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm" />
    </div>
  );
}
