import type { Metadata } from "next";
import { Suspense } from "react";
import LocalDiscoveryTracker from "@/components/LocalDiscoveryTracker";

type FeaturedBusiness = {
  name: string;
  category: string;
  description: string;
  offer: string;
  cta: string;
  href: string;
  tone: string;
};

type Category = {
  name: string;
  href: string;
  description: string;
};

type BusinessListing = {
  name: string;
  description: string;
  offer?: string;
  cta: string;
  href: string;
};

type ListingSection = {
  id: string;
  title: string;
  listings: BusinessListing[];
};

const featuredBusinesses: FeaturedBusiness[] = [
  {
    name: "Island Bites Restaurant",
    category: "Food & Restaurants",
    description: "Caribbean plates, quick lunches, and late-afternoon comfort food near the city core.",
    offer: "Show this page for 10% off your first order.",
    cta: "Get Offer",
    href: "#island-bites",
    tone: "from-cyan-500/18 to-emerald-500/12",
  },
  {
    name: "QuickFix Phone Repair",
    category: "Local Service",
    description: "Fast screen repairs, battery swaps, and device help while you are on the move.",
    offer: "Same-day diagnostics available.",
    cta: "Call",
    href: "tel:+13055550142",
    tone: "from-amber-400/20 to-cyan-500/10",
  },
  {
    name: "The Compere Touch",
    category: "Care & Recovery",
    description: "Concierge care, recovery support, companion care, and personalized help at home.",
    offer: "Ask about visitor and post-procedure support.",
    cta: "Book",
    href: "#the-compere-touch",
    tone: "from-rose-400/18 to-cyan-500/10",
  },
];

const categories: Category[] = [
  {
    name: "Food & Restaurants",
    href: "#food-restaurants",
    description: "Meals, coffee, quick bites",
  },
  {
    name: "Beauty / Barber",
    href: "#beauty-barber",
    description: "Grooming and appointments",
  },
  {
    name: "Auto / Mechanic",
    href: "#auto-mechanic",
    description: "Repairs, detailing, roadside help",
  },
  {
    name: "Tax / Legal",
    href: "#tax-legal",
    description: "Useful professional services",
  },
  {
    name: "Care & Recovery",
    href: "#care-recovery",
    description: "Home, family, and recovery support",
  },
  {
    name: "Events / Attractions",
    href: "#events-attractions",
    description: "Things to do nearby",
  },
];

const listingSections: ListingSection[] = [
  {
    id: "food-restaurants",
    title: "Food & Restaurants",
    listings: [
      {
        name: "Island Bites Restaurant",
        description: "Fresh Caribbean bowls, jerk chicken, patties, and family plates.",
        offer: "10% off your first order when you mention the rider guide.",
        cta: "Get Offer",
        href: "#island-bites",
      },
      {
        name: "Biscayne Coffee Stop",
        description: "Coffee, breakfast sandwiches, and grab-and-go pastries for busy mornings.",
        offer: "Free flavor shot with any iced latte.",
        cta: "Visit",
        href: "#biscayne-coffee-stop",
      },
      {
        name: "Magic City Tacos",
        description: "Street tacos, rice bowls, and quick dinner combos near nightlife stops.",
        cta: "Learn More",
        href: "#magic-city-tacos",
      },
    ],
  },
  {
    id: "beauty-barber",
    title: "Beauty / Barber",
    listings: [
      {
        name: "Fresh Line Barber Studio",
        description: "Clean cuts, beard trims, and walk-in grooming appointments.",
        offer: "Ask about same-day openings.",
        cta: "Book",
        href: "#fresh-line-barber-studio",
      },
      {
        name: "Glow Miami Beauty Bar",
        description: "Brows, lashes, makeup touchups, and quick beauty appointments.",
        cta: "Learn More",
        href: "#glow-miami-beauty-bar",
      },
    ],
  },
  {
    id: "auto-mechanic",
    title: "Auto / Mechanic",
    listings: [
      {
        name: "DriveReady Mobile Mechanic",
        description: "Mobile diagnostics, brakes, batteries, and basic repair support.",
        offer: "Driver-friendly scheduling available.",
        cta: "Call",
        href: "tel:+13055550166",
      },
      {
        name: "Sunshine Auto Detail",
        description: "Interior refreshes, wash packages, and odor treatment for busy vehicles.",
        cta: "Book",
        href: "#sunshine-auto-detail",
      },
    ],
  },
  {
    id: "tax-legal",
    title: "Tax / Legal",
    listings: [
      {
        name: "Beacon Tax Prep",
        description: "Tax prep, 1099 support, bookkeeping setup, and document review.",
        offer: "Free 15-minute intro call for new clients.",
        cta: "Learn More",
        href: "#beacon-tax-prep",
      },
      {
        name: "North River Notary",
        description: "Mobile notary, document signing, and appointment-based paperwork help.",
        cta: "Call",
        href: "tel:+13055550188",
      },
    ],
  },
  {
    id: "care-recovery",
    title: "Care & Recovery",
    listings: [
      {
        name: "The Compere Touch",
        description:
          "Concierge care, recovery support, companion care, and personalized help for families and clients needing support at home or after procedures.",
        offer: "Helpful for post-procedure visits, family check-ins, and at-home support.",
        cta: "Book",
        href: "#the-compere-touch",
      },
      {
        name: "RestEasy Recovery Rides",
        description: "Coordinated ride support for appointments, pharmacy stops, and follow-up visits.",
        cta: "Learn More",
        href: "#resteasy-recovery-rides",
      },
    ],
  },
  {
    id: "events-attractions",
    title: "Events / Attractions",
    listings: [
      {
        name: "Little Havana Walk",
        description: "A simple starter route for food, music, shops, and culture stops.",
        offer: "Great for visitors with 1-2 hours free.",
        cta: "Visit",
        href: "#little-havana-walk",
      },
      {
        name: "Bayfront Weekend Picks",
        description: "Nearby markets, waterfront events, and low-effort local plans.",
        cta: "Learn More",
        href: "#bayfront-weekend-picks",
      },
    ],
  },
];

const leadTargets = listingSections.flatMap((section) =>
  section.listings.map((listing) => ({
    businessName: listing.name,
    category: section.title,
  }))
);

export const metadata: Metadata = {
  title: "Miami Local Deals & Useful Services | Trip Worth-It",
  description:
    "Discover nearby Miami food, services, recovery support, events, and local offers from one rider-friendly page.",
};

function TrackingLink({
  href,
  children,
  className,
  event,
  category,
  business,
}: {
  href: string;
  children: React.ReactNode;
  className: string;
  event: string;
  category?: string;
  business?: string;
}) {
  return (
    <a
      href={href}
      className={className}
      data-track-event={event}
      data-track-category={category}
      data-track-business={business}
    >
      {children}
    </a>
  );
}

export default function MiamiPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#eef1f7] text-slate-950">
      <div className="pointer-events-none fixed inset-0 panel-grid opacity-35" />
      <div className="relative">
        <section className="relative overflow-hidden bg-slate-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(6,182,212,0.26),transparent_34%),radial-gradient(circle_at_85%_5%,rgba(244,114,182,0.18),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(15,23,42,0.88))]" />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#eef1f7] to-transparent" />

          <div className="relative mx-auto flex min-h-[92svh] w-full max-w-6xl flex-col px-4 pb-12 pt-7 sm:px-6 lg:px-8">
            <div className="card-enter flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-300">
                  Trip Worth-It Local
                </p>
                <p className="mt-1 text-xs text-slate-300">Miami rider guide</p>
              </div>
              <TrackingLink
                href="#featured"
                event="hero_primary_cta"
                className="btn-press rounded-full bg-cyan-400 px-4 py-2 text-sm font-black text-slate-950 shadow-[0_14px_30px_-16px_rgba(34,211,238,0.9)] hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                Browse
              </TrackingLink>
            </div>

            <div className="grid flex-1 items-center gap-8 py-12 lg:grid-cols-[minmax(0,1fr)_390px] lg:py-16">
              <div className="max-w-3xl">
                <div className="fade-enter mb-5 inline-flex rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur">
                  One QR code. Useful local finds.
                </div>
                <h1 className="card-enter text-[3rem] font-black leading-[0.98] tracking-tight text-white sm:text-6xl lg:text-7xl">
                  Local Deals & Useful Services Near You
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
                  Discover nearby food, services, recovery support, events, and local offers in one place.
                </p>
                <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-cyan-100/85">
                  Built for riders, visitors, and locals looking for something useful nearby.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <TrackingLink
                    href="#featured"
                    event="hero_featured_cta"
                    className="btn-press inline-flex min-h-12 items-center justify-center rounded-full bg-cyan-400 px-6 text-sm font-black text-slate-950 shadow-[0_18px_35px_-18px_rgba(34,211,238,0.95)] hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:ring-offset-2 focus:ring-offset-slate-950"
                  >
                    See Featured Offers
                  </TrackingLink>
                  <TrackingLink
                    href="#categories"
                    event="hero_category_cta"
                    className="btn-press inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] px-6 text-sm font-bold text-white backdrop-blur hover:bg-white/[0.12] focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:ring-offset-2 focus:ring-offset-slate-950"
                  >
                    Browse Categories
                  </TrackingLink>
                </div>
              </div>

              <div className="card-enter rounded-[2rem] border border-white/10 bg-white/[0.08] p-4 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] backdrop-blur-md">
                <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                      Near You
                    </p>
                    <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-bold text-emerald-200">
                      Pilot
                    </span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {featuredBusinesses.map((business) => (
                      <div
                        key={business.name}
                        className={`rounded-[1.25rem] border border-white/10 bg-gradient-to-br ${business.tone} p-4`}
                      >
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-300">
                          {business.category}
                        </p>
                        <p className="mt-2 text-lg font-black text-white">{business.name}</p>
                        <p className="mt-1 text-sm leading-5 text-slate-300">{business.offer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <section id="featured" className="-mt-8 scroll-mt-6">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
                  Local picks
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                  Featured This Week
                </h2>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {featuredBusinesses.map((business) => (
                <article
                  key={business.name}
                  className="card-enter flex min-h-[19rem] flex-col rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.55)] backdrop-blur"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">
                    {business.category}
                  </p>
                  <h3 className="mt-3 text-2xl font-black leading-tight text-slate-950">
                    {business.name}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{business.description}</p>
                  <p className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold leading-5 text-slate-800">
                    {business.offer}
                  </p>
                  <TrackingLink
                    href={business.href}
                    event="featured_business_cta"
                    category={business.category}
                    business={business.name}
                    className="btn-press mt-auto inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-black text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                  >
                    {business.cta}
                  </TrackingLink>
                  <a
                    href="#request-info"
                    data-lead-business={business.name}
                    data-lead-category={business.category}
                    data-track-event="lead_intent"
                    data-track-category={business.category}
                    data-track-business={business.name}
                    className="btn-press mt-3 inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-black text-slate-900 hover:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                  >
                    Request Info
                  </a>
                </article>
              ))}
            </div>
          </section>

          <section id="categories" className="mt-12 scroll-mt-6">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
                Quick scan
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Browse by Category
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <TrackingLink
                  key={category.name}
                  href={category.href}
                  event="category_tap"
                  category={category.name}
                  className="btn-press group rounded-[1.5rem] border border-slate-200 bg-white/80 p-4 shadow-[0_14px_40px_-30px_rgba(15,23,42,0.45)] hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                >
                  <span className="block text-base font-black text-slate-950">{category.name}</span>
                  <span className="mt-1 block text-sm leading-5 text-slate-600">{category.description}</span>
                </TrackingLink>
              ))}
            </div>
          </section>

          <div className="mt-12 space-y-8">
            {listingSections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-6">
                <div className="mb-4 flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">
                    {section.title}
                  </h2>
                  <TrackingLink
                    href="#categories"
                    event="back_to_categories"
                    category={section.title}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-cyan-300 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                  >
                    Categories
                  </TrackingLink>
                </div>
                <div className="grid gap-3 lg:grid-cols-3">
                  {section.listings.map((listing) => (
                    <article
                      key={listing.name}
                      className="rounded-[1.5rem] border border-slate-200 bg-white/90 p-4 shadow-[0_16px_45px_-34px_rgba(15,23,42,0.5)]"
                    >
                      <h3 className="text-lg font-black leading-tight text-slate-950">{listing.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{listing.description}</p>
                      {listing.offer ? (
                        <p className="mt-3 rounded-2xl bg-cyan-50 px-3 py-2 text-sm font-bold leading-5 text-cyan-950">
                          {listing.offer}
                        </p>
                      ) : null}
                      <TrackingLink
                        href={listing.href}
                        event="listing_business_cta"
                        category={section.title}
                        business={listing.name}
                        className="btn-press mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-full border border-slate-200 bg-slate-950 px-4 text-sm font-black text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                      >
                        {listing.cta}
                      </TrackingLink>
                      <a
                        href="#request-info"
                        data-lead-business={listing.name}
                        data-lead-category={section.title}
                        data-track-event="lead_intent"
                        data-track-category={section.title}
                        data-track-business={listing.name}
                        className="btn-press mt-2 inline-flex min-h-10 w-full items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-900 hover:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                      >
                        Get This Offer
                      </a>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <Suspense fallback={null}>
            <LocalDiscoveryTracker leadTargets={leadTargets} />
          </Suspense>

          <section className="mt-12 overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_24px_70px_-38px_rgba(15,23,42,0.75)] sm:p-8">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                Helpful for Visitors
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Find what is useful while moving around Miami.</h2>
              <p className="mt-4 text-sm leading-6 text-slate-300 sm:text-base">
                This page helps riders find useful local services, food, care support, and offers while visiting,
                commuting, or moving around the city.
              </p>
              <TrackingLink
                href="#featured"
                event="visitor_block_cta"
                className="btn-press mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-cyan-400 px-5 text-sm font-black text-slate-950 hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                Explore Picks
              </TrackingLink>
            </div>
          </section>

          <footer className="py-8 text-center text-sm font-semibold text-slate-500">
            <p>Local businesses and useful services featured for riders and visitors.</p>
            <p className="mx-auto mt-3 max-w-2xl text-xs leading-5 text-slate-500">
              Clicks and scans may be measured to help local businesses and participating drivers understand what riders find useful. We do not sell personal information.
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}
