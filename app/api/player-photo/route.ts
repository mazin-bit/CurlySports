import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// In-memory cache: name → photo URL or null (null = confirmed not found)
const cache = new Map<string, string | null>();
const CACHE_MAX = 5000;

function wikify(name: string): string {
  return name.trim().replace(/ /g, "_");
}

async function lookupWikipedia(name: string): Promise<string | null> {
  const candidates = [
    name,
    `${name} (footballer)`,
    `${name} (soccer)`,
    `${name} (association football)`,
  ];

  for (const candidate of candidates) {
    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikify(candidate))}`;
      const r = await fetch(url, { next: { revalidate: 86400 } });
      if (!r.ok) continue;
      const d = await r.json();

      // Verify it's a person (not a disambiguation page or unrelated article)
      const desc: string = (d.description ?? "").toLowerCase();
      const extract: string = (d.extract ?? "").toLowerCase();
      const type: string = d.type ?? "";

      if (type === "disambiguation") continue;

      const isPlayer =
        desc.includes("football") || desc.includes("soccer") ||
        desc.includes("footballer") || desc.includes("player") ||
        desc.includes("goalkeeper") || desc.includes("defender") ||
        desc.includes("midfielder") || desc.includes("forward") ||
        desc.includes("winger") || desc.includes("striker") ||
        extract.includes("footballer") || extract.includes("soccer player") ||
        extract.includes("association football");

      // For exact name match (first candidate), only require a thumbnail
      // For disambiguation variants, require footballer description
      if (candidate === name && d.thumbnail?.source) return d.thumbnail.source;
      if (isPlayer && d.thumbnail?.source) return d.thumbnail.source;
    } catch {
      // continue to next candidate
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name")?.trim() ?? "";
  if (!name || name.length < 2) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  // Return cached result
  if (cache.has(name)) {
    const url = cache.get(name);
    if (!url) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.redirect(url, { status: 302 });
  }

  const photoUrl = await lookupWikipedia(name);

  // Trim cache if too large
  if (cache.size >= CACHE_MAX) {
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) cache.delete(firstKey);
  }
  cache.set(name, photoUrl ?? null);

  if (!photoUrl) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.redirect(photoUrl, { status: 302 });
}
