import { redirect } from "next/navigation";

function cleanDriverSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 80);
}

export default async function DriverQrRedirectPage({
  params,
}: {
  params: Promise<{ driverSlug: string }>;
}) {
  const { driverSlug } = await params;
  const cleanSlug = cleanDriverSlug(driverSlug);

  redirect(
    `/miami?driver=${encodeURIComponent(cleanSlug)}&utm_source=driver_qr&utm_medium=vehicle_qr&utm_campaign=miami_pilot`
  );
}
