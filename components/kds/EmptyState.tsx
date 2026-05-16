import { STATION_LABEL, STATION_COLOR, STATION_ORDER } from "./types";

type StationCounts = Partial<Record<keyof typeof STATION_LABEL, number>>;

// Empty state isn't dead space — it surfaces what the kitchen is doing
// *between* tickets: stations idle, today's totals so far, and a hint about
// the chime so a cook walking up to a quiet board knows the system is live.
export function EmptyState({
  servedToday,
  averageTicketMin,
  stationStatus,
}: {
  servedToday: number;
  averageTicketMin: number;
  stationStatus: StationCounts;
}) {
  return (
    <div className="rounded-3xl border border-slate-700/60 bg-slate-900/40 p-10">
      <div className="grid gap-8 md:grid-cols-[auto_1fr] md:items-center">
        <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/40">
          <svg viewBox="0 0 24 24" fill="none" className="h-14 w-14 text-emerald-400" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h2 className="text-3xl font-semibold text-white">All caught up</h2>
          <p className="mt-2 text-lg text-slate-300">
            No active tickets. New orders will chime and slide in here.
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-x-10 gap-y-3 text-sm md:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wider text-slate-400">Served today</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums text-white">{servedToday}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-slate-400">Avg ticket</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums text-white">
                {averageTicketMin > 0 ? `${averageTicketMin}m` : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-slate-400">Stations clear</dt>
              <dd className="mt-1 flex items-center gap-2 pt-1">
                {STATION_ORDER.map((s) => {
                  const c = STATION_COLOR[s];
                  const count = stationStatus[s] ?? 0;
                  return (
                    <span key={s} className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${c.bg} ${c.fg}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                      {STATION_LABEL[s]} · {count}
                    </span>
                  );
                })}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
