import { hasSupabaseServerAccess } from "@ai-ops/config";
import { NextResponse } from "next/server";

import { refreshSanctionsFeed } from "@/lib/sanctions-feed";

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const hasVercelCronHeader = request.headers.has("x-vercel-cron");
  if (hasVercelCronHeader) return true;
  if (!cronSecret) return true;
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasSupabaseServerAccess()) {
    return NextResponse.json(
      { status: "skipped", reason: "Supabase server credentials are not configured." },
      { status: 200 }
    );
  }

  try {
    const result = await refreshSanctionsFeed();
    return NextResponse.json({ status: "ok", ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sanctions feed refresh failed.";
    return NextResponse.json({ status: "error", error: message }, { status: 500 });
  }
}

