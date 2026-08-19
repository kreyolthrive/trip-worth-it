import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Trip Worth-It Terms",
  description: "Basic beta signup terms for Trip Worth-It.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#eef1f7] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_55px_-30px_rgba(15,23,42,0.35)] sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-700">
          Terms
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
          Trip Worth-It beta signup terms
        </h1>
        <div className="mt-6 space-y-4 text-[15px] leading-7 text-slate-600">
          <p>
            If you join the beta list, Trip Worth-It may use your contact details to send
            beta access updates, product research questions, and occasional launch news.
          </p>
          <p>
            Your signup information is only used for Trip Worth-It beta communication. It
            is not sold to third parties.
          </p>
          <p>
            Beta access is limited and may change as the product evolves. Submitting the
            form does not guarantee immediate access.
          </p>
        </div>
        <Link
          href="/beta"
          className="mt-8 inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[13px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
        >
          Back to beta page
        </Link>
      </div>
    </main>
  );
}
