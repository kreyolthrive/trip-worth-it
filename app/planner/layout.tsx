import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Planner — Trip Worth-It",
  description:
    "Build a reserve buffer, track your monthly income against real costs, and save toward a specific goal — all without a spreadsheet.",
};

export default function PlannerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
