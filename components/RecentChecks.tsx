import { HistoryIcon } from "@/components/ui/Icons";
import { RecentTripCheck } from "@/types/trip";

interface RecentChecksProps {
  items: RecentTripCheck[];
  onLoad: (item: RecentTripCheck) => void;
}

function verdictConfig(verdict: RecentTripCheck["verdict"]) {
  switch (verdict) {
    case "WORTH_TAKING":
      return { dot: "bg-emerald-500", chip: "border-emerald-200 bg-emerald-50 text-emerald-700", label: "Worth Taking" };
    case "BORDERLINE":
      return { dot: "bg-amber-500", chip: "border-amber-200 bg-amber-50 text-amber-700", label: "Borderline" };
    case "NOT_WORTH_IT":
      return { dot: "bg-rose-500", chip: "border-rose-200 bg-rose-50 text-rose-700", label: "Not Worth It" };
    default:
      return { dot: "bg-slate-400", chip: "border-slate-200 bg-slate-100 text-slate-600", label: verdict };
  }
}

function timeLabel(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  if (diffMs < 60_000) return "just now";
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export default function RecentChecks({ items, onLoad }: RecentChecksProps) {
  if (items.length === 0) return null;

  return (
    <section className="card-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_4px_rgba(15,23,42,0.06),0_8px_20px_-4px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <h3 className="flex items-center gap-2 text-[15px] font-bold tracking-tight text-slate-800">
          <HistoryIcon className="h-4 w-4 text-slate-400" />
          Recent Checks
        </h3>
        <p className="mt-0.5 text-[12px] text-slate-400">
          Load a previous trip to recheck with updated settings
        </p>
      </div>

      <ul className="divide-y divide-slate-100">
        {items.map((item) => {
          const cfg = verdictConfig(item.verdict);
          return (
            <li key={item.id} className="flex items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-slate-50 sm:px-6">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`h-2 w-2 flex-shrink-0 rounded-full ${cfg.dot}`} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cfg.chip}`}
                    >
                      {cfg.label}
                    </span>
                    <span className="text-[13px] font-semibold text-slate-800">
                      ${item.estimatedNet.toFixed(2)} net
                    </span>
                    <span className="text-[12px] text-slate-400 capitalize">{item.tripType}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-400">{timeLabel(item.createdAt)}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onLoad(item)}
                className="btn-press flex-shrink-0 inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                Load
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
