import BusinessActionTracker from "@/components/BusinessActionTracker";
import LocalDiscoveryTracker from "@/components/LocalDiscoveryTracker";
import PilotClickTracker from "@/components/PilotClickTracker";
import PilotPageTracker from "@/components/PilotPageTracker";
import type { Metadata } from "next";
import Image from "next/image";
import { Suspense, type ReactNode } from "react";

type BusinessMedia = {
  slug: string;
  logoUrl?: string;
  imageUrl?: string;
  hoverImageUrl?: string;
  videoUrl?: string;
  hoverVideoUrl?: string;
  imageAlt?: string;
};

type FeaturedBusiness = BusinessMedia & {
  name: string;
  category: string;
  description: string;
  offer: string;
  cta: string;
  href: string;
  tone?: string;
};

type Category = {
  name: string;
  href: string;
  description: string;
  accent: string;
};

type BusinessListing = BusinessMedia & {
  name: string;
  category?: string;
  description: string;
  offer?: string;
  cta: string;
  href: string;
  tone?: string;
};

type ListingSection = {
  id: string;
  title: string;
  eyebrow: string;
  listings: BusinessListing[];
};

/*
  MEDIA RULES:

  Put images and videos inside /public, then reference them without "public".

  Image example:
  public/local-discovery/businesses/business-slug/cover.jpg

  Use:
  imageUrl: "/local-discovery/businesses/business-slug/cover.jpg"

  Video example:
  public/local-discovery/businesses/business-slug/cover.mp4

  Use:
  videoUrl: "/local-discovery/businesses/business-slug/cover.mp4"

  imageUrl = cover image / poster image
  hoverImageUrl = second image on hover
  videoUrl = optional cover video
  hoverVideoUrl = optional second video on hover
  logoUrl = small business logo
  href = business website, booking link, phone number, or offer page
*/

const featuredBusinesses: FeaturedBusiness[] = [
  {
    slug: "island-bites-restaurant",
    name: "Island Bites Restaurant",
    category: "Food & Restaurants",
    description:
      "Caribbean plates, quick lunches, and late-afternoon comfort food near the city core.",
    imageUrl: "/Restaurant-trip-worth-it.png",
    hoverImageUrl: "/restaurant3trip-worth-it.png",
    logoUrl: "/Restaurant-trip-worth-it.png",
    imageAlt: "Caribbean food plate with tropical Miami restaurant atmosphere",
    offer: "Show this page for 10% off your first order.",
    cta: "Visit Page",
    href: "#island-bites",
    tone: "from-orange-200 via-amber-100 to-cyan-100",
  },
  {
    slug: "quickfix-phone-repair",
    name: "QuickFix Phone Repair",
    category: "Local Service",
    description:
      "Fast screen repairs, battery swaps, and device help while you are on the move.",
    imageUrl: "/Phone-Repair-Trip-worth-it.png",
    hoverImageUrl: "/Phone-Repair-Trip-worth-it.png",
    logoUrl: "/Phone-Repair-Trip-worth-it.png",
    imageAlt: "Modern phone repair workspace with tools and disassembled phone",
    offer: "Same-day diagnostics available.",
    cta: "Call",
    href: "tel:+13055550142",
    tone: "from-sky-200 via-cyan-100 to-slate-100",
  },
  {
    slug: "the-compere-touch",
    name: "The Compere Touch",
    category: "Care & Recovery",
    description:
      "Concierge care, recovery support, companion care, and personalized help at home.",
    imageUrl: "/Thecomperetouch-4-trip-worth-it.png",
    hoverImageUrl: "/Recovery1-trip-worth-it.png",
    logoUrl: "/compere-touch-concierge-logo.png",
    imageAlt: "The Compere Touch concierge care and recovery support",
    offer: "Ask about visitor and post-procedure support.",
    cta: "Visit Page",
    href: "https://thecomperetouch.com",
    tone: "from-rose-200 via-pink-100 to-amber-100",
  },
];

const categories: Category[] = [
  {
    name: "Food & Restaurants",
    href: "#food-restaurants",
    description: "Meals, coffee, quick bites",
    accent: "border-orange-200 bg-orange-50 text-orange-950",
  },
  {
    name: "Beauty / Barber",
    href: "#beauty-barber",
    description: "Grooming and appointments",
    accent: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-950",
  },
  {
    name: "Auto / Mechanic",
    href: "#auto-mechanic",
    description: "Repairs, detailing, roadside help",
    accent: "border-sky-200 bg-sky-50 text-sky-950",
  },
  {
    name: "Tax / Legal",
    href: "#tax-legal",
    description: "Professional local help",
    accent: "border-indigo-200 bg-indigo-50 text-indigo-950",
  },
  {
    name: "Care & Recovery",
    href: "#care-recovery",
    description: "Home, family, and recovery support",
    accent: "border-rose-200 bg-rose-50 text-rose-950",
  },
  {
    name: "Events / Attractions",
    href: "#events-attractions",
    description: "Things to do nearby",
    accent: "border-emerald-200 bg-emerald-50 text-emerald-950",
  },
];

const listingSections: ListingSection[] = [
  {
    id: "food-restaurants",
    title: "Food & Restaurants",
    eyebrow: "Eat nearby",
    listings: [
      {
        slug: "island-bites-restaurant",
        name: "Island Bites Restaurant",
        category: "Food & Restaurants",
        description:
          "Fresh Caribbean bowls, jerk chicken, patties, and family plates.",
        imageUrl: "/restaurant3trip-worth-it.png",
        hoverImageUrl: "/Restaurant-trip-worth-it.png",
        logoUrl: "/restaurant3trip-worth-it.png",
        imageAlt: "Caribbean food plate with tropical Miami restaurant atmosphere",
        offer: "10% off your first order when you mention the rider guide.",
        cta: "Visit Page",
        href: "#island-bites",
      },
      {
        slug: "biscayne-coffee-stop",
        name: "Biscayne Coffee Stop",
        category: "Food & Restaurants",
        description:
          "Coffee, breakfast sandwiches, and grab-and-go pastries for busy mornings.",
        imageUrl: "/Coffee-shop-trip-worth-it.png",
        hoverImageUrl: "/restaurant3trip-worth-it.png",
        logoUrl: "/Coffee-shop-trip-worth-it.png",
        imageAlt: "Bright cafe style workspace with natural light",
        offer: "Free flavor shot with any iced latte.",
        cta: "Visit",
        href: "#biscayne-coffee-stop",
      },
      {
        slug: "magic-city-tacos",
        name: "Magic City Tacos",
        category: "Food & Restaurants",
        description:
          "Street tacos, rice bowls, and quick dinner combos near nightlife stops.",
        imageUrl: "/restaurat2-trip-worth-it.png",
        hoverImageUrl: "/restaurant3trip-worth-it.png",
        logoUrl: "/restaurat2-trip-worth-it.png",
        imageAlt: "Fresh food plate in a warm restaurant setting",
        cta: "Learn More",
        href: "#magic-city-tacos",
      },
    ],
  },
  {
    id: "beauty-barber",
    title: "Beauty / Barber",
    eyebrow: "Look sharp",
    listings: [
      {
        slug: "fresh-line-barber-studio",
        name: "Fresh Line Barber Studio",
        category: "Beauty / Barber",
        description:
          "Clean cuts, beard trims, and walk-in grooming appointments.",
        imageUrl: "/Barber-shop-trip-worth-it.png",
        hoverImageUrl: "/Women-Care-Trip-worth-it.png",
        imageAlt: "Stylish barber chair and grooming station",
        offer: "Get 10% discount your first day.",
        cta: "Call",
        href: "tel:+13055550142",
      },
      {
        slug: "glow-miami-beauty-bar",
        name: "Glow Miami Beauty Bar",
        category: "Beauty / Barber",
        description:
          "Brows, lashes, makeup touchups, and quick beauty appointments.",
        imageUrl: "/Women-Care-Trip-worth-it.png",
        hoverImageUrl: "/Barber-shop-trip-worth-it.png",
        logoUrl: "/Women-Care-Trip-worth-it.png",
        imageAlt: "Elegant beauty studio with makeup station and warm lighting",
        cta: "Learn More",
        href: "#glow-miami-beauty-bar",
      },
    ],
  },
  {
    id: "auto-mechanic",
    title: "Auto / Mechanic",
    eyebrow: "Vehicle help",
    listings: [
      {
        slug: "driveready-mobile-mechanic",
        name: "DriveReady Mobile Mechanic",
        category: "Auto / Mechanic",
        description:
          "Mobile diagnostics, brakes, batteries, and basic repair support.",
        imageUrl: "/Car-Repair-Trip-Worth-it.png",
        hoverImageUrl: "/Car-wash-trip-worth-it.png",
        logoUrl: "/Car-Repair-Trip-Worth-it.png",
        imageAlt: "Mobile mechanic repairing a car outside",
        offer: "Driver-friendly scheduling available.",
        cta: "Call",
        href: "tel:+13055550166",
      },
      {
        slug: "sunshine-auto-detail",
        name: "Sunshine Auto Detail",
        category: "Auto / Mechanic",
        description:
          "Interior refreshes, wash packages, and odor treatment for busy vehicles.",
        imageUrl: "/Car-wash-trip-worth-it.png",
        hoverImageUrl: "/Car-Repair-Trip-Worth-it.png",
        logoUrl: "/Car-wash-trip-worth-it.png",
        imageAlt: "Professional car detailing in a bright garage",
        cta: "Book",
        href: "#sunshine-auto-detail",
      },
    ],
  },
  {
    id: "tax-legal",
    title: "Tax / Legal",
    eyebrow: "Professional support",
    listings: [
      {
        slug: "beacon-tax-prep",
        name: "Beacon Tax Prep",
        category: "Tax / Legal",
        description:
          "Tax prep, 1099 support, bookkeeping setup, and document review.",
        imageUrl: "/Tax-Return-trip-worth-it.png",
        hoverImageUrl: "/Notary-trip-worth-it.png",
        imageAlt: "Professional office desk with tax paperwork and laptop",
        offer: "Free 15-minute intro call for new clients.",
        cta: "Learn More",
        href: "#beacon-tax-prep",
      },
      {
        slug: "north-river-notary",
        name: "North River Notary",
        category: "Tax / Legal",
        description:
          "Mobile notary, document signing, and appointment-based paperwork help.",
        imageUrl: "/Notary-trip-worth-it.png",
        hoverImageUrl: "/Tax-Return-trip-worth-it.png",
        logoUrl: "/Notary-trip-worth-it.png",
        imageAlt: "Professional signing paperwork at a desk",
        cta: "Call",
        href: "tel:+13055550188",
      },
    ],
  },
  {
    id: "care-recovery",
    title: "Care & Recovery",
    eyebrow: "Family and recovery help",
    listings: [
      {
        slug: "the-compere-touch",
        name: "The Compere Touch",
        category: "Care & Recovery",
        description:
          "Concierge care, recovery support, companion care, and personalized help for families and clients needing support at home or after procedures.",
        imageUrl: "/Thecomperetouch-4-trip-worth-it.png",
        hoverImageUrl: "/Recovery1-trip-worth-it.png",
        imageAlt: "The Compere Touch concierge care and recovery support",
        offer:
          "Helpful for post-procedure visits, family check-ins, and at-home support.",
        cta: "Visit Page",
        href: "https://thecomperetouch.com",
      },
      {
        slug: "resteasy-recovery-rides",
        name: "RestEasy Recovery Rides",
        category: "Care & Recovery",
        description:
          "Coordinated ride support for appointments, pharmacy stops, and follow-up visits.",
        imageUrl: "/Recovery1-trip-worth-it.png",
        hoverImageUrl: "/Thecomperetouch-4-trip-worth-it.png",
        logoUrl: "/Recovery1-trip-worth-it.png",
        imageAlt: "Recovery support and care coordination",
        cta: "Learn More",
        href: "#resteasy-recovery-rides",
      },
    ],
  },
  {
    id: "events-attractions",
    title: "Events / Attractions",
    eyebrow: "Explore Miami",
    listings: [
      {
        slug: "little-havana-walk",
        name: "Little Havana Walk",
        category: "Events / Attractions",
        description:
          "A simple starter route for food, music, shops, and culture stops.",
        imageUrl: "/event=trip-worth-it.png",
        hoverImageUrl: "/Liitle-havan-walk-trip-worth-it.png",
        logoUrl: "/event=trip-worth-it.png",
        imageAlt: "Miami food and culture experience",
        offer: "Great for visitors with 1-2 hours free.",
        cta: "Visit",
        href: "#little-havana-walk",
      },
      {
        slug: "bayfront-weekend-picks",
        name: "Bayfront Weekend Picks",
        category: "Events / Attractions",
        description:
          "Nearby markets, waterfront events, and low-effort local plans.",
        imageUrl: "/Liitle-havan-walk-trip-worth-it.png",
        hoverImageUrl: "/event=trip-worth-it.png",
        logoUrl: "/Liitle-havan-walk-trip-worth-it.png",
        imageAlt: "Miami waterfront visitor experience",
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

/*
  HERO MEDIA:

  Keep 3 to 5 items here. Each `src` can be an image or a video.
  Supported video extensions: .mp4, .webm, .mov, and .m4v.

  Video example:
  {
    src: "/local-discovery/miami/brickell-night.jpg.mp4",
    poster: "/local-discovery/miami/brickell-night.jpg",
    alt: "Brickell and Downtown Miami at night",
    position: "50% 50%",
  }
*/
const miamiHeroMedia: Array<{
  src: string;
  alt: string;
  poster?: string;
  position?: string;
}> = [
  {
    src: "/local-discovery/miami/brickell-night.jpg.mp4",
    poster: "/local-discovery/miami/brickell-night.jpg",
    alt: "Brickell and Downtown Miami at night",
    position: "50% 50%",
  },
  {
    src: "/local-discovery/miami/brickell-night1.jpg",
    alt: "Brickell skyline and Miami city atmosphere",
    position: "50% 50%",
  },
  {
    src: "/local-discovery/miami/little-havana.jpg",
    alt: "Little Havana street scene in Miami",
    position: "50% 50%",
  },
  {
    src: "/local-discovery/miami/wynwood.jpg",
    alt: "Colorful Wynwood-style Miami mural background",
    position: "50% 50%",
  },
  {
    src: "/local-discovery/miami/miami-food..jpg",
    alt: "Miami local food and late-night dining atmosphere",
    position: "50% 50%",
  },
];

export const metadata: Metadata = {
  title: "Miami Rider Local Guide | Curated Local Discovery",
  description:
    "A rider-friendly Miami local guide for food, care support, beauty, auto help, events, and useful local services. Take the driver survey at riderlocalguide.com/driver-survey.",
};

function isVideoSource(src?: string) {
  if (!src) return false;

  const cleanSrc = src.split("?")[0]?.toLowerCase() ?? "";

  return (
    cleanSrc.endsWith(".mp4") ||
    cleanSrc.endsWith(".webm") ||
    cleanSrc.endsWith(".mov") ||
    cleanSrc.endsWith(".m4v")
  );
}

function MiamiHeroGallery() {
  const mediaItems = miamiHeroMedia.slice(0, 5);
  const slideDuration = Math.max(mediaItems.length, 1) * 7;
  const slideShare = 100 / Math.max(mediaItems.length, 1);
  const fadeStart = Math.max(slideShare - 3, 1);

  return (
    <div className="absolute inset-0 bg-slate-950" aria-hidden="true">
      {mediaItems.map((media, index) => {
        const isVideo = isVideoSource(media.src);

        return (
          <div
            key={media.src}
            className="miami-hero-slide absolute inset-0 opacity-0"
            style={{
              animationDuration: `${slideDuration}s`,
              animationDelay: `${index * 7}s`,
            }}
          >
            {isVideo ? (
              <video
                className="h-full w-full object-cover"
                src={media.src}
                poster={media.poster}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
            ) : (
              <div
                className="h-full w-full bg-cover bg-center"
                style={{
                  backgroundImage: `url('${media.src}')`,
                  backgroundPosition: media.position ?? "50% 50%",
                }}
              />
            )}
          </div>
        );
      })}

      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/62 to-slate-950/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-slate-950/20" />

      <style>{`
        @keyframes miamiHeroFade {
          0% { opacity: 0; transform: scale(1.04); }
          3% { opacity: 1; }
          ${fadeStart}% { opacity: 1; }
          ${slideShare}% { opacity: 0; }
          100% { opacity: 0; transform: scale(1); }
        }

        .miami-hero-slide {
          animation-name: miamiHeroFade;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }

        .miami-hero-slide:first-child {
          opacity: 1;
        }

        @media (prefers-reduced-motion: reduce) {
          .miami-hero-slide { animation: none; }
          .miami-hero-slide:not(:first-child) { display: none; }
        }

        @keyframes businessPrimaryMobile {
          0%, 42% { opacity: 1; transform: scale(1); }
          50%, 92% { opacity: 0; transform: scale(1.04); }
          100% { opacity: 1; transform: scale(1); }
        }

        @keyframes businessSecondaryMobile {
          0%, 42% { opacity: 0; transform: scale(1.04); }
          50%, 92% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.04); }
        }

        @media (hover: none) and (pointer: coarse) {
          .business-media-has-alternate .business-primary-media {
            animation: businessPrimaryMobile 10s ease-in-out infinite;
          }

          .business-media-has-alternate .business-secondary-media {
            animation: businessSecondaryMobile 10s ease-in-out infinite;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .business-primary-media,
          .business-secondary-media {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function isExternalHref(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}

function getBusinessActionType(href: string, cta: string) {
  const lowerHref = href.toLowerCase();
  const lowerCta = cta.toLowerCase();

  if (lowerHref.startsWith("tel:")) return "call_click";

  if (lowerHref.includes("maps.google") || lowerCta.includes("direction")) {
    return "directions_click";
  }

  if (lowerHref.startsWith("http://") || lowerHref.startsWith("https://")) {
    return "website_click";
  }

  if (lowerCta.includes("offer")) return "offer_click";
  if (lowerCta.includes("save")) return "save_click";

  return "business_click";
}

function TrackingLink({
  href,
  children,
  className,
  event,
  category,
  business,
  action,
  businessSlug,
  businessName,
}: {
  href: string;
  children: ReactNode;
  className: string;
  event: string;
  category?: string;
  business?: string;
  action?: string;
  businessSlug?: string;
  businessName?: string;
}) {
  return (
    <a
      href={href}
      className={className}
      data-track-event={event}
      data-track-category={category}
      data-track-business={business}
      data-business-action={action}
      data-business-slug={businessSlug}
      data-business-name={businessName ?? business}
      data-business-category={category}
      target={isExternalHref(href) ? "_blank" : undefined}
      rel={isExternalHref(href) ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  );
}

function BusinessLogo({
  business,
  size = "md",
}: {
  business: Pick<BusinessMedia, "logoUrl" | "slug"> & { name: string };
  size?: "sm" | "md";
}) {
  const sizeClass = size === "sm" ? "h-12 w-12 text-sm" : "h-16 w-16 text-base";
  const backgroundImage = business.logoUrl
    ? `url("${business.logoUrl}")`
    : undefined;

  return (
    <div
      className={`${sizeClass} relative shrink-0 overflow-hidden rounded-2xl border border-white bg-white shadow-[0_18px_38px_-24px_rgba(15,23,42,0.65)]`}
      aria-label={`${business.name} logo`}
    >
      {business.logoUrl ? (
        <div
          className="h-full w-full bg-contain bg-center bg-no-repeat"
          style={{ backgroundImage }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-950 via-slate-800 to-cyan-700 font-black text-white">
          {getInitials(business.name)}
        </div>
      )}
    </div>
  );
}

function BusinessMediaPanel({
  business,
  compact = false,
  background = false,
}: {
  business: FeaturedBusiness | BusinessListing;
  compact?: boolean;
  background?: boolean;
}) {
  const height = background
    ? "absolute inset-0 h-full w-full"
    : compact
      ? "h-[300px] sm:h-[390px]"
      : "h-[340px] sm:h-[480px]";
  const hasPrimaryVideo = Boolean(business.videoUrl);
  const hasHoverVideo = Boolean(business.hoverVideoUrl);
  const hasAlternateMedia = Boolean(
    business.hoverImageUrl || business.hoverVideoUrl
  );

  const primaryBackgroundImage = business.imageUrl
    ? `linear-gradient(180deg, rgba(15,23,42,0.02), rgba(15,23,42,0.08)), url("${business.imageUrl}")`
    : undefined;

  const hoverBackgroundImage = business.hoverImageUrl
    ? `linear-gradient(180deg, rgba(15,23,42,0.05), rgba(15,23,42,0.18)), url("${business.hoverImageUrl}")`
    : undefined;

  return (
    <div
      className={`group/media overflow-hidden ${hasAlternateMedia ? "business-media-has-alternate" : ""} ${background ? "rounded-[inherit]" : "relative rounded-[1.5rem]"} ${height} bg-slate-100`}
      role="img"
      aria-label={business.imageAlt ?? business.name}
    >
      {hasPrimaryVideo ? (
        <video
          className="business-primary-media absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover/media:scale-105 group-hover/media:opacity-0"
          src={business.videoUrl}
          poster={business.imageUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
      ) : business.imageUrl ? (
        <div
          className="business-primary-media absolute inset-0 bg-cover bg-center transition duration-700 ease-out group-hover/media:scale-105 group-hover/media:opacity-0"
          style={{ backgroundImage: primaryBackgroundImage }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-white via-cyan-50 to-slate-100" />
      )}

      {hasHoverVideo ? (
        <video
          className="business-secondary-media absolute inset-0 h-full w-full scale-105 object-cover opacity-0 transition duration-700 ease-out group-hover/media:scale-100 group-hover/media:opacity-100"
          src={business.hoverVideoUrl}
          poster={business.hoverImageUrl ?? business.imageUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
      ) : business.hoverImageUrl ? (
        <div
          className="business-secondary-media absolute inset-0 scale-105 bg-cover bg-center opacity-0 transition duration-700 ease-out group-hover/media:scale-100 group-hover/media:opacity-100"
          style={{ backgroundImage: hoverBackgroundImage }}
        />
      ) : null}

      {!business.imageUrl && !business.videoUrl ? (
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
            Local business
          </p>
          <p className="mt-1 text-sm font-black text-slate-950">
            {business.name}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function FeaturedCard({ business }: { business: FeaturedBusiness }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[2.25rem] border border-slate-200 bg-white p-3 shadow-[0_28px_80px_-44px_rgba(15,23,42,0.78)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_36px_90px_-44px_rgba(6,182,212,0.3)] sm:p-4">
      <BusinessMediaPanel business={business} />

      <div className="flex flex-1 flex-col px-2 pb-2 pt-5 sm:px-3">
        <div className="flex items-start gap-3">
          <BusinessLogo business={business} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
            {business.category}
            </p>
            <h3 className="mt-1 text-2xl font-black leading-tight tracking-tight text-slate-950">
              {business.name}
            </h3>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-600">
          {business.description}
        </p>
        <p className="mt-4 rounded-2xl bg-cyan-50 px-4 py-3 text-sm font-black leading-5 text-cyan-950">
          {business.offer}
        </p>

        <div className="mt-auto grid gap-3 pt-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <TrackingLink
            href={business.href}
            event="featured_business_cta"
            category={business.category}
            business={business.name}
            businessSlug={business.slug}
            businessName={business.name}
            action={getBusinessActionType(business.href, business.cta)}
            className="btn-press inline-flex min-h-11 w-full items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-black text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
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
            data-business-action="request_info_click"
            data-business-slug={business.slug}
            data-business-name={business.name}
            data-business-category={business.category}
            className="btn-press inline-flex min-h-11 w-full items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-black text-slate-950 hover:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
          >
            Request Info
          </a>
        </div>
      </div>
    </article>
  );
}

function ListingCard({
  listing,
  section,
}: {
  listing: BusinessListing;
  section: ListingSection;
}) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-3 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.72)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_32px_82px_-42px_rgba(6,182,212,0.28)] sm:p-4">
      <BusinessMediaPanel business={listing} compact />

      <div className="flex flex-1 flex-col px-2 pb-2 pt-5 sm:px-3">
        <div className="flex items-start gap-3">
          <BusinessLogo business={listing} size="sm" />
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-black leading-tight tracking-tight text-slate-950 sm:text-2xl">
              {listing.name}
            </h3>
            <p className="mt-1 text-[11px] font-black uppercase tracking-[0.16em] text-cyan-700">
            {listing.category ?? section.title}
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-600">
          {listing.description}
        </p>

        {listing.offer ? (
          <p className="mt-4 rounded-2xl bg-cyan-50 px-3 py-2 text-sm font-black leading-5 text-cyan-950">
            {listing.offer}
          </p>
        ) : null}

        <div className="mt-auto grid gap-2 pt-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <TrackingLink
          href={listing.href}
          event="listing_business_cta"
          category={section.title}
          business={listing.name}
          businessSlug={listing.slug}
          businessName={listing.name}
          action={getBusinessActionType(listing.href, listing.cta)}
          className="btn-press inline-flex min-h-10 w-full items-center justify-center rounded-full bg-slate-950 px-4 text-sm font-black text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
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
          data-business-action="request_info_click"
          data-business-slug={listing.slug}
          data-business-name={listing.name}
          data-business-category={section.title}
          className="btn-press inline-flex min-h-10 w-full items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-950 hover:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
        >
          Get This Offer
        </a>
        </div>
      </div>
    </article>
  );
}

export default function MiamiPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#f4f7fb] text-slate-950">
      <Suspense fallback={null}>
        <PilotPageTracker eventType="miami_page_view" neighborhood="Miami" />
      </Suspense>

      <Suspense fallback={null}>
        <PilotClickTracker />
      </Suspense>

      <Suspense fallback={null}>
        <BusinessActionTracker />
      </Suspense>

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:px-6 sm:py-3">
          <a href="/miami" className="flex items-center gap-3">
            <Image
              src="/Rider-Local-Guide-Logo.png"
              alt="Rider Local Guide"
              className="h-10 w-10 rounded-xl object-contain shadow-sm sm:h-12 sm:w-12 sm:rounded-2xl"
              width={48}
              height={48}
              priority
            />

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-cyan-700 sm:text-[11px] sm:tracking-[0.22em]">
                <span className="sm:hidden">Rider Local Guide</span>
                <span className="hidden sm:inline">Miami Rider Local Guide</span>
              </p>
              <p className="mt-1 hidden text-xs font-semibold text-slate-500 sm:block">
                Curated local discovery pilot
              </p>
            </div>
          </a>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <a
              href="/driver-survey"
              className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-2 text-[10px] font-black text-cyan-900 hover:border-cyan-300 sm:px-3 sm:py-1.5 sm:text-xs"
            >
              <span className="sm:hidden">Survey</span>
              <span className="hidden sm:inline">Driver Survey</span>
            </a>

            <TrackingLink
              href="/business-pilot"
              event="header_business_link"
              className="rounded-full border border-slate-200 bg-white px-2.5 py-2 text-[10px] font-black text-slate-700 hover:border-cyan-300 hover:text-slate-950 sm:px-3 sm:py-1.5 sm:text-xs"
            >
              <span className="sm:hidden">Business</span>
              <span className="hidden sm:inline">For Businesses</span>
            </TrackingLink>
          </div>
        </div>
      </header>

      <section className="relative isolate flex min-h-[680px] items-center overflow-hidden bg-slate-950 sm:min-h-[760px] lg:min-h-[calc(100vh-73px)]">
        <MiamiHeroGallery />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
            <div className="max-w-3xl">
              <div className="flex flex-wrap gap-2">
                {["Rider-initiated", "Curated", "Local picks", "No app needed"].map(
                  (badge) => (
                    <span
                      key={badge}
                      className="rounded-full border border-white/30 bg-slate-950/35 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100 backdrop-blur-md"
                    >
                      {badge}
                    </span>
                  )
                )}
              </div>

              <h1 className="mt-5 text-[2.9rem] font-black leading-[0.94] tracking-[-0.06em] text-white drop-shadow-2xl sm:text-6xl lg:text-7xl">
                Discover Miami while you ride.
              </h1>

              <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-white/85 drop-shadow-lg sm:text-xl">
                Curated local food, services, experiences, and useful places for
                riders, visitors, and locals moving around Miami.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <TrackingLink
                  href="#featured"
                  event="hero_explore_picks"
                  className="btn-press inline-flex min-h-12 items-center justify-center rounded-full bg-cyan-400 px-6 text-sm font-black text-slate-950 shadow-[0_18px_35px_-20px_rgba(6,182,212,0.9)] hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950"
                >
                  Explore Local Picks
                </TrackingLink>

                <TrackingLink
                  href="#categories"
                  event="hero_browse_categories"
                  className="btn-press inline-flex min-h-12 items-center justify-center rounded-full border border-white/40 bg-white/15 px-6 text-sm font-black text-white shadow-lg backdrop-blur-md hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950"
                >
                  Browse Categories
                </TrackingLink>
              </div>
            </div>
        </div>
      </section>

      <section id="categories" className="scroll-mt-6">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
              Quick scan
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
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
                className={`btn-press rounded-[1.5rem] border p-5 shadow-[0_14px_45px_-34px_rgba(15,23,42,0.65)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_55px_-36px_rgba(15,23,42,0.75)] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 ${category.accent}`}
              >
                <span className="block text-lg font-black">{category.name}</span>
                <span className="mt-1 block text-sm font-semibold opacity-80">
                  {category.description}
                </span>
              </TrackingLink>
            ))}
          </div>
        </div>
      </section>

      <section id="featured" className="scroll-mt-6">
        <div className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
                Local picks
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Featured This Week
              </h2>
            </div>
            <p className="max-w-md text-sm font-medium leading-6 text-slate-500">
              Businesses can appear here with their logo, cover image, video, offer,
              and call-to-action.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredBusinesses.map((business) => (
              <FeaturedCard key={business.name} business={business} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] bg-gradient-to-br from-teal-900 to-slate-950 p-6 text-white shadow-xl sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-200">
            Visiting Miami?
          </p>

          <h2 className="mt-3 text-2xl font-black">
            Find local places before the ride ends.
          </h2>

          <p className="mt-3 text-sm leading-6 text-teal-50/90">
            Find quick food, useful services, attractions, and local help while you
            move around the city.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {["Near destination", "1 hour free", "Family-friendly", "Late night"].map(
              (item) => (
                <span
                  key={item}
                  className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-white ring-1 ring-white/15"
                >
                  {item}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mt-10 space-y-16">
          {listingSections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-6">
              <div className="mb-5 flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
                    {section.eyebrow}
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                    {section.title}
                  </h2>
                </div>

                <TrackingLink
                  href="#categories"
                  event="back_to_categories"
                  category={section.title}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 hover:border-cyan-300 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                >
                  Categories
                </TrackingLink>
              </div>

              <div
                className={`grid gap-6 md:grid-cols-2 ${
                  section.listings.length >= 3
                    ? "lg:grid-cols-3"
                    : "lg:grid-cols-2"
                }`}
              >
                {section.listings.map((listing) => (
                  <ListingCard
                    key={listing.name}
                    listing={listing}
                    section={section}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-600">
            Curated guide
          </p>

          <h2 className="mt-3 text-2xl font-black text-slate-950">
            Curated, not crowded.
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            During the pilot, we select only a few businesses per category so the
            guide stays useful, trustworthy, and easy to navigate.
          </p>
        </div>
      </section>

      <section
        id="request-info"
        className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:px-8"
      >
        <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 text-center shadow-sm sm:p-8">
          <h2 className="text-2xl font-black text-slate-950">
            Want to request info or join the pilot?
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            We will reach out with next steps for businesses and drivers.
          </p>
          <div className="mt-5">
            <a
              href="/business-pilot"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-black text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
            >
              Go to Business Pilot
            </a>
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <LocalDiscoveryTracker leadTargets={leadTargets} />
      </Suspense>

      <footer className="pb-10 text-center text-xs leading-5 text-slate-500">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p>
            Independent local discovery pilot. Not affiliated with Uber, Lyft, or any
            rideshare platform.
          </p>
          <p className="mt-2">
            Clicks, scans, and requests may be measured to help local businesses and
            participating drivers understand what riders find useful. We do not sell
            personal information.
          </p>
        </div>
      </footer>
    </main>
  );
}