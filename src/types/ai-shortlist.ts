export type AiShortlistListOrigin =
  | "soso-country-ranking"
  | "soso-world-slice"
  | "hipolabs"
  | "global-world-pool";

/** catalog = platform ro‘yxatidagi indeks; ai_research = katalog yetishmaganda model tavsiyasi */
export type AiShortlistPickSource = "catalog" | "ai_research";

export interface AiShortlistPick {
  pick_source: AiShortlistPickSource;
  /** Katalog rejimida 1..n; ai_research da 0 */
  index: number;
  name: string;
  country: string;
  website: string | null;
  reason: string;
  fit_score: number;
  next_step: string;
  national_rank: number | null;
  world_rank: number | null;
  ranking_source_url: string | null;
}

export interface AiShortlistResult {
  summary: string;
  trust_note: string;
  list_origin: AiShortlistListOrigin;
  /** Katalog yetarli bo‘lmasa ai_research — model o‘zi tavsiya qiladi */
  picks_mode: "catalog" | "ai_research";
  picks: AiShortlistPick[];
}
