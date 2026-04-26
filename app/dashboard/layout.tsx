import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Trip Worth-It",
  description:
    "See the most important signals from your trip decisions, planning, and savings setup in one place.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
