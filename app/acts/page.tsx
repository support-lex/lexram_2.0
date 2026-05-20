import PageLayout from "@/components/layout/PageLayout";
import PublicActsExplorer from "@/components/resources/PublicActsExplorer";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Browse Indian Legal Acts | LexRam",
  description: "Search 11,000+ Indian central and state acts by ministry, domain, and year. Free to browse — sign up for full text and AI summaries.",
  openGraph: {
    title: "Browse 11,000+ Indian Acts — LexRam",
    description: "Every Indian Act, searchable in one place.",
    url: "https://lexram.ai/acts",
    siteName: "LexRam",
    type: "website",
  },
};

export default async function PublicResourcesPage() {
  // Detect auth so the explorer can decide whether to gate clicks
  const sb = await createSupabaseServerClient();
  const { data } = await sb.auth.getUser();
  const isAuthenticated = !!data.user;

  return (
    <PageLayout fullWidth>
      <PublicActsExplorer isAuthenticated={isAuthenticated} />
    </PageLayout>
  );
}
