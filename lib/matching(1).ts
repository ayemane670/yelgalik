/**
 * YELGALIK — Matching Engine (v1, rule-based, no AI)
 * ----------------------------------------------------
 * Computes a 0-100 match score between a Request (buyer wants)
 * and a Product (seller has). Designed to be fast (no external calls)
 * and to run both directions:
 *   - When a Request is created  -> search existing active Products
 *   - When a Product is created  -> search existing active Requests
 *
 * Weighting (sums to 100):
 *   Title/category similarity : 40
 *   Price fit                 : 25
 *   City match                : 15
 *   Condition compatibility   : 10
 *   Specs overlap             : 10
 */

export type MatchInput = {
  requestTitle: string;
  requestCategoryId: number | null;
  requestMaxBudget: number;
  requestCityId: number | null;
  requestCondition: string; // 'new'|'like_new'|'good'|'used'|'any'
  requestSpecs: Record<string, string>;

  productTitle: string;
  productCategoryId: number | null;
  productPrice: number;
  productCityId: number | null;
  productCondition: string; // 'new'|'like_new'|'good'|'used'
  productSpecs: Record<string, string>;
};

const CONDITION_RANK: Record<string, number> = {
  new: 4,
  like_new: 3,
  good: 2,
  used: 1,
};

export function normalizeTitle(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[إأآا]/g, "ا")
    .replace(/[ىي]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s]/gu, "") // strip punctuation/emoji
    .replace(/\s+/g, " ")
    .trim();
}

/** Simple token-overlap similarity (Jaccard on words), 0..1 */
function titleSimilarity(a: string, b: string): number {
  const ta = new Set(normalizeTitle(a).split(" ").filter(Boolean));
  const tb = new Set(normalizeTitle(b).split(" ").filter(Boolean));
  if (ta.size === 0 || tb.size === 0) return 0;
  let intersect = 0;
  for (const w of ta) if (tb.has(w)) intersect++;
  const union = new Set([...ta, ...tb]).size;
  return intersect / union;
}

function priceFitScore(maxBudget: number, price: number): number {
  if (price <= maxBudget) {
    // Reward prices close to (but under) budget slightly less than very cheap ones being fine too;
    // full score if within budget, scaled down slightly if using almost 100% of budget vs plenty of margin.
    return 1;
  }
  // Over budget: linear decay, zero once 30%+ over budget
  const overRatio = (price - maxBudget) / maxBudget;
  if (overRatio >= 0.3) return 0;
  return 1 - overRatio / 0.3;
}

function conditionScore(requested: string, offered: string): number {
  if (requested === "any") return 1;
  const reqRank = CONDITION_RANK[requested] ?? 2;
  const offRank = CONDITION_RANK[offered] ?? 2;
  if (offRank >= reqRank) return 1; // offered condition meets or exceeds requested
  const diff = reqRank - offRank;
  return Math.max(0, 1 - diff * 0.35);
}

function specsOverlapScore(reqSpecs: Record<string, string>, prodSpecs: Record<string, string>): number {
  const keys = Object.keys(reqSpecs);
  if (keys.length === 0) return 1; // no specs requested = no penalty
  let matched = 0;
  for (const k of keys) {
    const reqVal = String(reqSpecs[k]).toLowerCase().trim();
    const prodVal = String(prodSpecs[k] ?? "").toLowerCase().trim();
    if (!reqVal) continue;
    if (prodVal.includes(reqVal) || reqVal.includes(prodVal)) matched++;
  }
  return matched / keys.length;
}

export function computeMatchScore(input: MatchInput): number {
  const titleSim = titleSimilarity(input.requestTitle, input.productTitle);
  const categoryMatch = input.requestCategoryId && input.productCategoryId
    ? input.requestCategoryId === input.productCategoryId ? 1 : 0
    : 0.5; // unknown category -> neutral

  // Blend title similarity with category exact-match (category acts as a gate/boost)
  const titleScore = Math.min(1, titleSim * 0.7 + categoryMatch * 0.3);

  const priceScore = priceFitScore(input.requestMaxBudget, input.productPrice);
  const cityScore = input.requestCityId && input.productCityId
    ? input.requestCityId === input.productCityId ? 1 : 0.2 // different city still possible (shipping/travel)
    : 0.5;
  const condScore = conditionScore(input.requestCondition, input.productCondition);
  const specsScore = specsOverlapScore(input.requestSpecs, input.productSpecs);

  const total =
    titleScore * 40 +
    priceScore * 25 +
    cityScore * 15 +
    condScore * 10 +
    specsScore * 10;

  return Math.round(Math.max(0, Math.min(100, total)));
}

export function scoreLabel(score: number): { emoji: string; label: string } {
  if (score >= 90) return { emoji: "🟢", label: "تطابق ممتاز" };
  if (score >= 70) return { emoji: "🟡", label: "تطابق جيد" };
  if (score >= 50) return { emoji: "🟠", label: "تطابق متوسط" };
  return { emoji: "⚪", label: "تطابق ضعيف" };
}

/** Minimum score to bother creating a match + notification */
export const MATCH_THRESHOLD = 45;
