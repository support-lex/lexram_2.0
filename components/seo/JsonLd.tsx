import { jsonLdScript } from "@/lib/seo/jsonld";

export function JsonLd({
  id,
  data,
}: {
  id: string;
  data: Record<string, unknown>;
}) {
  return (
    <script
      type="application/ld+json"
      id={id}
      suppressHydrationWarning
      dangerouslySetInnerHTML={jsonLdScript(id, data)}
    />
  );
}
