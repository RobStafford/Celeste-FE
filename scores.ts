import type { Score } from "@/types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

export async function getTopScores(): Promise<Score[]> {
  const resp = await fetch(`${API_BASE}/scores`, {
    headers: { Accept: "application/json" }
  });
  if (!resp.ok) throw new Error(`scores http ${resp.status}`);
  const data = (await resp.json()) as Score[];
  return Array.isArray(data) ? data.slice(0, 10) : [];
}

export async function postScore(player: string, score: number): Promise<void> {
  const resp = await fetch(`${API_BASE}/scores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player, score })
  });
  if (!resp.ok) throw new Error(`post http ${resp.status}`);
}