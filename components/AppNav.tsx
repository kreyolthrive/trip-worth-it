"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GaugeIcon, TargetIcon } from "@/components/ui/Icons";

const LINKS = [
  {
    href: "/",
    label: "Trip Check",
    sub: "Accept or skip faster",
    Icon: GaugeIcon,
  },
  {
    href: "/planner",
    label: "Planner",
    sub: "Reserve, income & goals",
    Icon: TargetIcon,
  },
];

export default function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-5 flex gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
      {LINKS.map(({ href, label, sub, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={[
              "flex flex-1 items-center gap-2.5 rounded-xl px-3.5 py-2.5 transition-all duration-150",
              active
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
            ].join(" ")}
          >
            <Icon
              className={[
                "h-4 w-4 flex-shrink-0",
                active ? "text-cyan-400" : "text-slate-400",
              ].join(" ")}
            />
            <div className="min-w-0">
              <p className={`text-[13px] font-semibold leading-none ${active ? "text-white" : "text-slate-700"}`}>
                {label}
              </p>
              <p className={`mt-0.5 truncate text-[11px] leading-none ${active ? "text-white/50" : "text-slate-400"}`}>
                {sub}
              </p>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
