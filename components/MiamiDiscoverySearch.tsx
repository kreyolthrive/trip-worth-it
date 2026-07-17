"use client";

import { useMemo, useState, type FormEvent } from "react";

const quickFilters = [
  { label: "All", value: "" },
  { label: "Food", value: "food restaurants" },
  { label: "Beauty", value: "beauty barber" },
  { label: "Auto", value: "auto mechanic" },
  { label: "Care", value: "care recovery" },
  { label: "Events", value: "events attractions" },
];

function applyDiscoveryFilter(value: string) {
  const normalize = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const normalized = normalize(value);
  const cards = Array.from(
    document.querySelectorAll<HTMLElement>("[data-discovery-card]")
  );

  let visibleCount = 0;

  cards.forEach((card) => {
    const searchable = normalize(card.dataset.discoverySearch ?? "");
    const visible = !normalized || searchable.includes(normalized);
    card.hidden = !visible;
    if (visible) visibleCount += 1;
  });

  document
    .querySelectorAll<HTMLElement>("[data-discovery-section]")
    .forEach((section) => {
      const hasVisibleCard = Boolean(
        section.querySelector("[data-discovery-card]:not([hidden])")
      );
      section.hidden = !hasVisibleCard;
    });

  return visibleCount;
}

export default function MiamiDiscoverySearch() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [resultCount, setResultCount] = useState<number | null>(null);

  const status = useMemo(() => {
    if (resultCount === null) return "Search Miami businesses and experiences";
    if (resultCount === 0) return "No matches yet—try another category";
    return `${resultCount} local ${resultCount === 1 ? "match" : "matches"}`;
  }, [resultCount]);

  function runSearch(value: string, shouldScroll = true) {
    const count = applyDiscoveryFilter(value);
    setResultCount(count);

    if (shouldScroll && count > 0) {
      document
        .querySelector<HTMLElement>("[data-discovery-card]:not([hidden])")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActiveFilter("");
    runSearch(query);
  }

  function handleQuickFilter(value: string) {
    setActiveFilter(value);
    setQuery("");
    runSearch(value);
  }

  return (
    <div className="mt-8 max-w-3xl rounded-[1.75rem] border border-white/20 bg-slate-950/45 p-3 shadow-2xl backdrop-blur-xl sm:p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="miami-discovery-search">
          Search Miami businesses and experiences
        </label>
        <input
          id="miami-discovery-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Food, barber, mechanic, recovery care…"
          className="min-h-12 flex-1 rounded-full border border-white/20 bg-white px-5 text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/40"
        />
        <button
          type="submit"
          className="min-h-12 rounded-full bg-cyan-400 px-6 text-sm font-black text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-200"
        >
          Search Miami
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2" aria-label="Quick filters">
        {quickFilters.map((filter) => (
          <button
            key={filter.label}
            type="button"
            aria-pressed={activeFilter === filter.value}
            onClick={() => handleQuickFilter(filter.value)}
            className={`rounded-full border px-3 py-2 text-xs font-black transition ${
              activeFilter === filter.value
                ? "border-cyan-300 bg-cyan-300 text-slate-950"
                : "border-white/25 bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <p className="mt-3 px-1 text-xs font-semibold text-white/70" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
