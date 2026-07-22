"use client";

import { useEffect, useState } from "react";

const demoOffer = {
  businessName: "Sample Brickell Late-Night Dining Partner",
  category: "Late-Night Food and Dining",
  zone: "Brickell",
  city: "Miami",
  businessType: "Open Late - Dinner - Drinks",
  offerTitle: "Free appetizer with purchase of two drinks",
  offerCode: "RLG-BRICKELL",
  validMinutes: 30,
};

function getTime() {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(new Date());
}

function getClaimId() {
  return `RLG-${Math.floor(10000 + Math.random() * 89999)}`;
}

export default function OfferDemoPage() {
  const [claimed, setClaimed] = useState(false);
  const [time, setTime] = useState("");
  const [claimId, setClaimId] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTime(getTime());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  function claimOffer() {
    setClaimId(getClaimId());
    setTime(getTime());
    setClaimed(true);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center">
        {!claimed ? (
          <section className="w-full overflow-hidden rounded-[2rem] bg-white text-slate-950 shadow-2xl">
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-900 p-6 text-white">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
                Rider Local Guide Demo
              </p>

              <h1 className="mt-4 text-3xl font-black leading-tight">
                {demoOffer.category}
              </h1>

              <p className="mt-2 text-sm font-semibold text-slate-300">
                {demoOffer.zone} - {demoOffer.businessType}
              </p>
            </div>

            <div className="p-6">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
                {demoOffer.businessName}
              </p>

              <h2 className="mt-3 text-2xl font-black">
                {demoOffer.offerTitle}
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                This demo shows how a rider can scan, view a relevant local
                business, claim an offer, and show a live ticket to the merchant.
              </p>

              <p className="mt-6 text-center text-xs font-bold text-slate-500">
                Tap once to generate a live offer ticket.
              </p>

              <button
                type="button"
                onClick={claimOffer}
                className="mt-2 min-h-12 w-full rounded-full bg-cyan-400 px-6 font-black text-slate-950 hover:bg-cyan-300"
              >
                Claim Rider Offer
              </button>

              <p className="mt-3 text-center text-xs font-semibold text-slate-500">
                No login. No app download. No passenger data.
              </p>
              
              <p className="mt-3 text-center text-[10px] font-semibold text-slate-400">
                Demo only. Valid for {demoOffer.validMinutes} minutes after claim. Final offers require business approval.
              </p>
            </div>
          </section>
        ) : (
          <section className="w-full overflow-hidden rounded-[2rem] border border-cyan-300/30 bg-slate-900 shadow-2xl">
            <div className="border-b border-white/10 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
                    Rider Local Guide Offer
                  </p>

                  <h1 className="mt-3 text-2xl font-black">
                    {demoOffer.businessName}
                  </h1>
                </div>

                <div className="flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-2 text-xs font-black text-emerald-300">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
                  Active
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="rounded-3xl bg-white p-5 text-center text-slate-950">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  Offer Code
                </p>

                <p className="mt-2 text-3xl font-black tracking-tight">
                  {demoOffer.offerCode}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    Claim ID
                  </p>

                  <p className="mt-2 text-sm font-black text-white">
                    {claimId || "RLG-00000"}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    Live Time
                  </p>

                  <p className="mt-2 text-sm font-black text-white">
                    {time || "--:--:--"}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-cyan-400/10 p-4">
                <p className="text-sm font-black leading-6 text-cyan-100">
                  Show this live screen to your server before ordering.
                </p>

                <p className="mt-2 text-xs font-semibold text-cyan-100/80">
                  Demo only. Valid for {demoOffer.validMinutes} minutes after claim. Final offers require business approval.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setClaimed(false)}
                className="mt-6 min-h-11 w-full rounded-full border border-white/15 bg-white/10 px-5 text-sm font-black text-white hover:bg-white/15"
              >
                Back to Listing
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}