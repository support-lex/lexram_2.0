// Streams a CBIC tax PDF from Supabase Storage under our own domain.
//
// The backend used to hand the browser a signed Supabase URL directly. That
// worked, but it meant three things we do not want:
//
//   * the address bar read pwzarravsoahyihrdbit.supabase.co, exposing the
//     project ref on every source click and on any link a user copies;
//   * the signed token is a bearer capability — anyone with the URL could
//     fetch the document, signed in or not;
//   * the token expired (default 1h), so reopening a cached session showed a
//     Supabase error page instead of the PDF.
//
// Proxying fixes all three: the URL is ours and permanent, access is gated on
// the session, and the signing happens per request. We stream rather than
// redirect — a 302 to the signed URL would put supabase.co back in the bar.

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = process.env.CBIC_BUCKET ?? "tax-documents";

// Storage keys the ingest pipeline writes look like
//   customs/notification/tariff/2008/1003335-en.pdf
//   finance-acts/2016/the-finance-act-2016-28-of-2016-1000018.pdf
// Anything outside that shape is not ours to serve.
const SAFE_KEY = /^[A-Za-z0-9][A-Za-z0-9._/-]*\.pdf$/;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;

  // Route segments arrive percent-decoded; rebuild the storage key and reject
  // traversal rather than trusting Storage to normalise it away.
  const key = (path ?? []).join("/");
  if (!key || key.includes("..") || key.startsWith("/") || !SAFE_KEY.test(key)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sb = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to open this document." }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin()
    .storage.from(BUCKET)
    .download(key);

  if (error || !data) {
    return NextResponse.json({ error: "Document unavailable" }, { status: 404 });
  }

  // inline, not attachment: the browser's PDF viewer should render it in the
  // tab that window.open() just created, not download it.
  const filename = key.split("/").pop() || "document.pdf";
  return new NextResponse(data.stream(), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      // These are immutable published documents, but they sit behind an auth
      // check, so cache privately rather than at any shared proxy.
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
