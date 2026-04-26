import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Savings Buckets — Trip Worth-It",
  description:
    "Split your driving income into purposeful buckets — repairs, taxes, emergency reserves, and goal savings — so every dollar has a job.",
};

export default function BucketsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
