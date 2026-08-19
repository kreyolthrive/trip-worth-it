import {
  AlertIcon,
  CheckIcon,
  ClockIcon,
  DollarIcon,
  GaugeIcon,
  RouteIcon,
  SparkIcon,
  TargetIcon,
  XCircleIcon,
} from "@/components/ui/Icons";
import { smartVerdictCopy, weeklyMeaningCopy, WeeklyMeaningContext } from "@/lib/smartVerdict";
import { DriverDefaults, TripResult } from "@/types/trip";

interface ResultsCardProps {
  result: TripResult | null;
  assumptions: DriverDefaults;
  weeklyContext: WeeklyMeaningContext;
}

function fmt(value: number) {
  return `$${value.toFixed(2)}`;
}

function verdictConfig(verdict: TripResult["verdict"]) {
  switch (verdict) {
    case "WORTH_TAKING":
      return {
        label: "Worth Taking",
        icon: <CheckIcon className="h-4 w-4" />,
        heroBg: "bg-gradient-to-br from-emerald-600 to-teal-600",
        heroBorder: "border-emerald-500/30",
        chipBg: "border-emerald-400/40 bg-emerald-500/25 text-emerald-100",
        accentText: "text-emerald-200",
        pulse: "bg-emerald-400",
        metricBorder: "border-emerald-100",
        metricBg: "bg-emerald-50",
        recBg: "bg-emerald-50 border-emerald-200",
        recLabel: "text-emerald-700",
      };
    case "BORDERLINE":
      return {
        label: "Borderline",
        icon: <AlertIcon className="h-4 w-4" />,
        heroBg: "bg-gradient-to-br from-amber-500 to-orange-500",
        heroBorder: "border-amber-400/30",
        chipBg: "border-amber-300/40 bg-amber-400/25 text-amber-100",
        accentText: "text-amber-200",
        pulse: "bg-amber-400",
        metricBorder: "border-amber-100",
        metricBg: "bg-amber-50",
        recBg: "bg-amber-50 border-amber-200",
        recLabel: "text-amber-700",
      };
    case "NOT_WORTH_IT":
      return {
        label: "Not Worth It",
        icon: <XCircleIcon className="h-4 w-4" />,
        heroBg: "bg-gradient-to-br from-rose-600 to-red-600",
        heroBorder: "border-rose-500/30",
        chipBg: "border-rose-400/40 bg-rose-500/25 text-rose-100",
        accentText: "text-rose-200",
        pulse: "bg-rose-400",
        metricBorder: "border-rose-100",
        metricBg: "bg-rose-50",
        recBg: "bg-rose-50 border-rose-200",
        recLabel: "text-rose-700",
      };
    default:
      return {
        label: "Unknown",
        icon: <GaugeIcon className="h-4 w-4" />,
        heroBg: "bg-gradient-to-br from-slate-600 to-slate-700",
        heroBorder: "border-slate-400/30",
        chipBg: "border-slate-300/40 bg-slate-400/25 text-slate-100",
        accentText: "text-slate-300",
        pulse: "bg-slate-400",
        metricBorder: "border-slate-100",
        metricBg: "bg-slate-50",
        recBg: "bg-slate-50 border-slate-200",
        recLabel: "text-slate-700",
      };
  }
}

function verdictSubtitle(verdict: TripResult["verdict"]) {
  switch (verdict) {
    case "WORTH_TAKING":
      return "This offer clears your targets and looks worth taking.";
    case "BORDERLINE":
      return "This may only make sense if it helps your direction or weekly target.";
    case "NOT_WORTH_IT":
      return "This trip looks weak for profit after time, distance, and costs.";
    default:
      return "";
  }
}

function gapSignal(result: TripResult, driver: DriverDefaults) {
  const hourGap = result.metrics.netPerHour - driver.minNetPerHour;
  const mileGap = result.metrics.netPerMile - driver.minNetPerMile;
  const sign = (n: number) => (n >= 0 ? "+" : "");
  return `${sign(hourGap)}${fmt(hourGap)}/hr · ${sign(mileGap)}${fmt(mileGap)}/mi vs. target`;
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <section className="card-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_6px_-1px_rgba(15,23,42,0.08),0_20px_50px_-8px_rgba(15,23,42,0.14)]">
      {/* Header */}
      <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-[11px] font-black tracking-tight text-slate-400">
            02
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Trip Verdict</h2>
            <p className="text-[13px] text-slate-500">Run a trip check to see results</p>
          </div>
        </div>
      </div>

      {/* Placeholder body */}
      <div className="px-6 py-8 sm:px-7">
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg">
            <SparkIcon className="h-5 w-5" />
          </div>
          <p className="text-[15px] font-semibold text-slate-800">
            Your verdict will appear here
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[13px] leading-5 text-slate-500">
            Upload a trip screenshot or fill in the trip details. The result shows net pay,
            net per hour, and what the offer means for your week.
          </p>
        </div>

        <ul className="mt-5 space-y-2.5">
          {[
            "Estimated net earnings after operating costs",
            "Net per mile and net per hour vs. your targets",
            "Smart Verdict copy plus weekly and reserve context",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-[13px] text-slate-600">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ─── Result state ─────────────────────────────────────────────────────────────

export default function ResultsCard({ result, assumptions, weeklyContext }: ResultsCardProps) {
  if (!result) return <EmptyState />;

  const cfg = verdictConfig(result.verdict);
  const weeklyMeaning = weeklyMeaningCopy(result, weeklyContext);

  const metrics = [
    { label: "Net / Mile", value: fmt(result.metrics.netPerMile), icon: <RouteIcon className="h-3.5 w-3.5" /> },
    { label: "Net / Hour", value: fmt(result.metrics.netPerHour), icon: <ClockIcon className="h-3.5 w-3.5" /> },
    { label: "Est. Cost", value: fmt(result.metrics.totalCost), icon: <DollarIcon className="h-3.5 w-3.5" /> },
    { label: "Total Miles", value: result.metrics.totalMiles.toFixed(1), icon: <RouteIcon className="h-3.5 w-3.5" /> },
    { label: "Pickup Ratio", value: `${(result.metrics.pickupRatio * 100).toFixed(0)}%`, icon: <GaugeIcon className="h-3.5 w-3.5" /> },
    { label: "Net Earnings", value: fmt(result.metrics.netEarnings), icon: <DollarIcon className="h-3.5 w-3.5" /> },
  ];

  return (
    <section className="card-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_6px_-1px_rgba(15,23,42,0.08),0_20px_50px_-8px_rgba(15,23,42,0.14)]">
      {/* Card header */}
      <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-black tracking-tight text-white">
            02
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Trip Verdict</h2>
            <p className="text-[13px] text-slate-500">Based on your current driver settings</p>
          </div>
        </div>
      </div>

      {/* Verdict hero */}
      <div className={`verdict-reveal relative overflow-hidden px-6 py-7 sm:px-7 ${cfg.heroBg}`}>
        {/* Subtle texture overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_60%)]" />

        <div className="relative">
          {/* Verdict badge row */}
          <div className="mb-4 flex items-center justify-between gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-widest ${cfg.chipBg}`}
            >
              {cfg.icon}
              {cfg.label}
            </span>
            <div className="text-right">
              <p className={`text-[10px] font-semibold uppercase tracking-widest ${cfg.accentText}`}>
                Net / Hour
              </p>
              <p className="text-lg font-bold text-white">
                {fmt(result.metrics.netPerHour)}
              </p>
            </div>
          </div>

          {/* Big net earnings */}
          <div>
            <p className={`text-[11px] font-semibold uppercase tracking-widest ${cfg.accentText}`}>
              Estimated Net
            </p>
            <p className="mt-1 text-[3.5rem] font-black leading-none tracking-tight text-white">
              {fmt(result.metrics.netEarnings)}
            </p>
          </div>

          {/* Signal line */}
          <p className={`mt-3 text-[12px] font-semibold ${cfg.accentText}`}>
            {gapSignal(result, assumptions)}
          </p>

          {/* Subtitle */}
          <p className="mt-1.5 text-[13px] font-medium leading-5 text-white/75">
            {verdictSubtitle(result.verdict)}
          </p>
        </div>
      </div>

      {/* Recommendation */}
      <div className={`mx-6 mt-5 rounded-xl border p-4 sm:mx-7 ${cfg.recBg}`}>
        <p className={`mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest ${cfg.recLabel}`}>
          <TargetIcon className="h-3.5 w-3.5" />
          Smart Verdict
        </p>
        <p className="text-[14px] leading-6 text-slate-700">
          {smartVerdictCopy(result, assumptions)}
        </p>
      </div>

      {/* Weekly meaning */}
      <div className="mx-6 mt-3 rounded-xl border border-cyan-100 bg-cyan-50 p-4 sm:mx-7">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-cyan-700">
          <TargetIcon className="h-3.5 w-3.5" />
          What This Means For Your Week
        </p>
        <ul className="space-y-2">
          {weeklyMeaning.map((line) => (
            <li key={line} className="flex items-start gap-2 text-[13px] leading-5 text-slate-700">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-500" />
              {line}
            </li>
          ))}
        </ul>
      </div>

      {/* Metrics grid */}
      <div className="px-6 pt-5 sm:px-7">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
          Key Metrics
        </p>
        <div className="grid grid-cols-3 gap-2.5">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 transition hover:border-slate-200 hover:bg-white"
            >
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {m.icon}
                {m.label}
              </p>
              <p className="mt-1.5 text-[15px] font-bold tabular-nums text-slate-900">{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Why this result */}
      <div className="mx-6 mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:mx-7">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500">
          <SparkIcon className="h-3.5 w-3.5" />
          Why This Result
        </p>
        <ul className="space-y-2">
          {result.explanationLines.map((line) => (
            <li key={line} className="flex items-start gap-2 text-[13px] leading-5 text-slate-700">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400" />
              {line}
            </li>
          ))}
        </ul>
      </div>

      {/* Assumptions */}
      <div className="mx-6 mt-3 rounded-xl border border-slate-100 bg-white px-4 py-3.5 sm:mx-7">
        <p className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
          Assumptions Used
        </p>
        <div className="grid grid-cols-3 gap-2 text-[12px]">
          <div className="text-slate-600">
            Cost/mi
            <span className="ml-1.5 font-bold text-slate-900">{fmt(assumptions.costPerMile)}</span>
          </div>
          <div className="text-slate-600">
            Min/mi
            <span className="ml-1.5 font-bold text-slate-900">{fmt(assumptions.minNetPerMile)}</span>
          </div>
          <div className="text-slate-600">
            Min/hr
            <span className="ml-1.5 font-bold text-slate-900">{fmt(assumptions.minNetPerHour)}</span>
          </div>
        </div>
      </div>

      {/* Planner CTA */}
      <div className="mx-6 mb-6 mt-3 sm:mx-7">
        <a
          href="/planner"
          className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3.5 transition hover:border-indigo-200 hover:bg-indigo-100"
        >
          <div>
            <p className="text-[12px] font-bold uppercase tracking-widest text-indigo-500">
              Plan what this earns
            </p>
            <p className="mt-0.5 text-[13px] font-medium text-slate-700">
              Set reserves, hit your monthly target, save for a goal →
            </p>
          </div>
          <TargetIcon className="h-5 w-5 flex-shrink-0 text-indigo-400" />
        </a>
      </div>
    </section>
  );
}
