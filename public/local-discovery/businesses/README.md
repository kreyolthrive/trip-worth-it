# Local Discovery Business Images

Place business-owned media in folders named after each business slug:

```text
public/local-discovery/businesses/[business-slug]/logo.png
public/local-discovery/businesses/[business-slug]/cover.png
```

Use `logoUrl` for the logo path and `imageUrl` for the cover, service, or offer image in the local discovery business data.

Example:

```ts
{
  slug: "the-compere-touch",
  logoUrl: "/local-discovery/businesses/the-compere-touch/logo.png",
  imageUrl: "/local-discovery/businesses/the-compere-touch/cover.png",
  imageAlt: "Concierge care and recovery support",
}
```

For production, these assets can later move to Supabase Storage while keeping the same `logoUrl`, `imageUrl`, and `imageAlt` fields.
