This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Local Discovery Tracking Setup

The Miami rider discovery page supports driver QR tracking, click tracking, and rider lead capture.

Production env vars:

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

On Vercel, add both variables in Project Settings before deploying production tracking.

Apply the schema in `supabase/local-discovery.sql` to create:

- `local_discovery_events`
- `local_discovery_leads`

Driver QR URLs use `/d/[driverSlug]`. For example, `/d/florine` redirects to:

```text
/miami?driver=florine&utm_source=driver_qr&utm_medium=vehicle_qr&utm_campaign=miami_pilot
```

Scans, category taps, business clicks, and rider leads are written through server-side API routes. When Supabase env vars are present, the API stores data in Supabase using the service role key on the server only. When Supabase is not configured, the app falls back to local JSON files for local testing:

- `data/local-discovery-events.json`
- `data/local-discovery-leads.json`

The JSON/demo fallback is only for local testing. Use Supabase for durable production tracking and reporting.
