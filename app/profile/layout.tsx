import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Driver Profile — Trip Worth-It",
  description:
    "Set your driver baseline so Trip Worth-It can personalize trip checks, planning, savings buckets, and dashboard guidance.",
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
