import { createSupabaseServerClient } from "@ai-ops/lib";
import { createHash } from "node:crypto";

import type { Severity } from "@/types/sanctions-screening";

export interface WatchlistEntry {
  listName: string;
  entity: string;
  risk: Severity;
}

interface FeedSource {
  name: string;
  url: string;
  listName?: string;
  risk?: Severity;
}

const DEFAULT_SOURCES: FeedSource[] = [
  {
    name: "OFAC_SDN_CSV",
    url: "https://www.treasury.gov/ofac/downloads/sdn.csv",
    listName: "OFAC SDN",
    risk: "high"
  }
];

function parseSources(): FeedSource[] {
  const raw = process.env.SANCTIONS_SOURCE_URLS;
  if (!raw) return DEFAULT_SOURCES;
  try {
    const parsed = JSON.parse(raw) as FeedSource[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SOURCES;
  } catch {
    return DEFAULT_SOURCES;
  }
}

function normalizeEntity(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function splitCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  values.push(current.trim());
  return values;
}

function parseCsvEntities(csv: string): string[] {
  const lines = csv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  const rows = lines.slice(1);
  const entities = rows
    .map((line) => splitCsvLine(line))
    .map((cols) => cols[1] ?? cols[0] ?? "")
    .map((value) => value.replace(/^"|"$/g, "").trim())
    .filter((value) => value.length > 2);
  return [...new Set(entities)];
}

function formatUpdatedAt(dateLike: string | Date | null): string | undefined {
  if (!dateLike) return undefined;
  const date = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
  if (Number.isNaN(date.getTime())) return undefined;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(date);
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return `${pick("day")}-${pick("month")}-${pick("year")} ${pick("hour")}:${pick("minute")}:${pick("second")}`;
}

export async function loadWatchlistFromDb(): Promise<{ entries: WatchlistEntry[]; updatedAtDisplay?: string }> {
  try {
    const supabase = createSupabaseServerClient();
    const { data: rows } = await supabase
      .schema("app_sanctionsscreening")
      .from("app_sanctionsscreening_watchlist_entries")
      .select("list_name,entity_name,risk,updated_at")
      .limit(2000);

    const { data: feedState } = await supabase
      .schema("app_sanctionsscreening")
      .from("app_sanctionsscreening_feed_state")
      .select("last_success_at")
      .order("last_success_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!rows || rows.length === 0) {
      return { entries: [], updatedAtDisplay: formatUpdatedAt(feedState?.last_success_at ?? null) };
    }

    const entries: WatchlistEntry[] = rows.map((row) => ({
      listName: String(row.list_name ?? "Sanctions List"),
      entity: String(row.entity_name ?? ""),
      risk: (String(row.risk ?? "medium") as Severity)
    }));
    return { entries, updatedAtDisplay: formatUpdatedAt(feedState?.last_success_at ?? null) };
  } catch {
    return { entries: [] };
  }
}

export async function refreshSanctionsFeed(): Promise<{
  processedSources: number;
  updatedSources: number;
  totalEntitiesUpserted: number;
  updatedAtDisplay?: string;
}> {
  const sources = parseSources();
  const supabase = createSupabaseServerClient();
  let updatedSources = 0;
  let totalEntitiesUpserted = 0;

  for (const source of sources) {
    const { data: state } = await supabase
      .schema("app_sanctionsscreening")
      .from("app_sanctionsscreening_feed_state")
      .select("etag,last_modified")
      .eq("source_name", source.name)
      .maybeSingle();

    const headers: Record<string, string> = {};
    if (state?.etag) headers["If-None-Match"] = state.etag;
    if (state?.last_modified) headers["If-Modified-Since"] = state.last_modified;

    const response = await fetch(source.url, { headers });
    if (response.status === 304) {
      await supabase.schema("app_sanctionsscreening").from("app_sanctionsscreening_feed_state").upsert(
        {
          source_name: source.name,
          source_url: source.url,
          etag: state?.etag ?? null,
          last_modified: state?.last_modified ?? null,
          last_checked_at: new Date().toISOString(),
          status: "not_modified"
        },
        { onConflict: "source_name" }
      );
      continue;
    }

    if (!response.ok) {
      await supabase.schema("app_sanctionsscreening").from("app_sanctionsscreening_feed_state").upsert(
        {
          source_name: source.name,
          source_url: source.url,
          last_checked_at: new Date().toISOString(),
          status: "error",
          message: `HTTP ${response.status}`
        },
        { onConflict: "source_name" }
      );
      continue;
    }

    const content = await response.text();
    const entities = parseCsvEntities(content);
    const contentHash = createHash("sha256").update(content).digest("hex");
    const nowIso = new Date().toISOString();

    if (entities.length > 0) {
      const rows = entities.map((entity) => ({
        source_name: source.name,
        source_url: source.url,
        list_name: source.listName ?? source.name,
        entity_name: entity,
        entity_name_normalized: normalizeEntity(entity),
        risk: source.risk ?? "high",
        external_id: null,
        raw: {},
        updated_at: nowIso
      }));
      const { error } = await supabase
        .schema("app_sanctionsscreening")
        .from("app_sanctionsscreening_watchlist_entries")
        .upsert(rows, { onConflict: "source_name,entity_name_normalized" });
      if (!error) {
        updatedSources += 1;
        totalEntitiesUpserted += rows.length;
      }
    }

    await supabase.schema("app_sanctionsscreening").from("app_sanctionsscreening_feed_state").upsert(
      {
        source_name: source.name,
        source_url: source.url,
        etag: response.headers.get("etag"),
        last_modified: response.headers.get("last-modified"),
        content_hash: contentHash,
        last_checked_at: nowIso,
        last_success_at: nowIso,
        last_row_count: entities.length,
        status: "ok"
      },
      { onConflict: "source_name" }
    );
  }

  return {
    processedSources: sources.length,
    updatedSources,
    totalEntitiesUpserted,
    updatedAtDisplay: formatUpdatedAt(new Date())
  };
}

