import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "./JsonLd";

export type Crumb = { name: string; href: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const urls = items.map((c) => ({
    name: c.name,
    url: `https://lexram.ai${c.href}`,
  }));
  return <JsonLd id="ld-breadcrumb" data={breadcrumbJsonLd(urls)} />;
}
