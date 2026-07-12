/**
 * Per-university aggregate score formulas.
 *
 * Each Nigerian university calculates its admission "aggregate" score
 * differently — usually some weighting of JAMB (UTME) score and
 * Post-UTME screening score, sometimes including O'Level points too.
 *
 * There is NO universal formula. Always verify with the university's
 * own admissions office / portal before trusting a number here.
 *
 * HOW TO ADD / UPDATE A UNIVERSITY:
 *   1. Find the slug (matches `universities.slug` in the DB).
 *   2. Add an entry to `FORMULAS` below with a `calculate` function.
 *   3. Fill in `verified`, `source`, and `lastCheckedAt` so future-you
 *      knows how trustworthy this entry is and when to re-check it.
 *
 * Universities NOT listed here automatically use `DEFAULT_FORMULA`
 * (the common 50:50 JAMB/Post-UTME split), so the calculator still
 * works for every school — just less precisely for unverified ones.
 */

export type FormulaInput = {
  jamb: number; // JAMB/UTME score, out of 400
  postUtme?: number; // Post-UTME screening score, out of 100 (if applicable)
  oLevelPoints?: number; // Optional O'Level points, if a formula uses them
};

export type FormulaResult = {
  aggregate: number; // final aggregate score
  breakdown: { label: string; value: number }[]; // shown in the UI, e.g. "JAMB (÷8): 30"
};

export type UniversityFormula = {
  /** Human-readable name of the formula, shown in the UI */
  label: string;
  /** Whether this university conducts a written/CBT Post-UTME at all */
  hasPostUtme: boolean;
  /** Has this formula been checked against an official/reliable source? */
  verified: boolean;
  /** Where this formula was confirmed (article, portal, etc.) */
  source: string;
  /** ISO date this was last checked — formulas can change yearly */
  lastCheckedAt: string;
  /** The actual calculation */
  calculate: (input: FormulaInput) => FormulaResult;
};

// ============================================================
// Shared building blocks
// ============================================================

/** The most common Nigerian formula: JAMB÷8 (max 50) + Post-UTME÷2 (max 50) */
function standardFiftyFifty(input: FormulaInput): FormulaResult {
  const jambPart = input.jamb / 8;
  const postUtmePart = (input.postUtme ?? 0) / 2;
  return {
    aggregate: round2(jambPart + postUtmePart),
    breakdown: [
      { label: "JAMB ÷ 8", value: round2(jambPart) },
      { label: "Post-UTME ÷ 2", value: round2(postUtmePart) },
    ],
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ============================================================
// Default fallback — used for any university not explicitly listed
// ============================================================

export const DEFAULT_FORMULA: UniversityFormula = {
  label: "Standard 50:50 (JAMB ÷ 8 + Post-UTME ÷ 2)",
  hasPostUtme: true,
  verified: false,
  source: "Common default across many Nigerian universities — not confirmed for this specific school.",
  lastCheckedAt: "2026-07-12",
  calculate: standardFiftyFifty,
};

// ============================================================
// Per-university formulas
// ============================================================

export const FORMULAS: Record<string, UniversityFormula> = {
  "university-of-ibadan": {
    label: "UI Standard (JAMB ÷ 8 + Post-UTME ÷ 2)",
    hasPostUtme: true,
    verified: true,
    source: "naijastudyguide.com — JAMB Cut-Off Mark for UI 2026",
    lastCheckedAt: "2026-07-12",
    calculate: standardFiftyFifty,
  },

  "university-of-ilorin": {
    label: "UNILORIN Standard (JAMB ÷ 8 + Post-UTME ÷ 2)",
    hasPostUtme: true,
    verified: true,
    source: "smartjamb.com — UNILORIN Post UTME Form 2026",
    lastCheckedAt: "2026-07-12",
    calculate: standardFiftyFifty,
  },

  "federal-university-of-agriculture-abeokuta": {
    label: "FUNAAB Standard (JAMB ÷ 8 + Post-UTME ÷ 2)",
    hasPostUtme: true,
    verified: true,
    source: "smartjamb.com — FUNAAB Post UTME Form 2026",
    lastCheckedAt: "2026-07-12",
    calculate: standardFiftyFifty,
    // NOTE: one other source (ulearngo.com) claims FUNAAB actually uses a
    // 30:20:50 Post-UTME:O'Level:UTME split. Sources conflict — worth
    // double-checking directly with FUNAAB's admissions office before
    // fully trusting this one.
  },

  "obafemi-awolowo-university": {
    label: "OAU Standard (JAMB ÷ 8 + Post-UTME ÷ 2)",
    hasPostUtme: true,
    verified: true,
    source: "smartjamb.com — OAU Post UTME Form 2026/2027",
    lastCheckedAt: "2026-07-12",
    calculate: standardFiftyFifty,
  },

  "university-of-benin": {
    label: "UNIBEN Standard (JAMB ÷ 8 + Post-UTME ÷ 2, no O'Level)",
    hasPostUtme: true,
    verified: true,
    source: "smartjamb.com — UNIBEN Aggregate Calculator 2026",
    lastCheckedAt: "2026-07-12",
    calculate: standardFiftyFifty,
  },

  // ------------------------------------------------------------
  // Everything below is UNVERIFIED — no confirmed source yet.
  // They're listed explicitly (rather than left out) so it's easy
  // to see, at a glance, exactly which schools still need checking.
  // Each currently just points at the default formula.
  //
  // ⚠️ SLUGS BELOW ARE BEST-GUESS kebab-case based on university
  // names — confirm each against the real `universities.slug`
  // value in Supabase before relying on this. A wrong slug means
  // that university silently falls through to DEFAULT_FORMULA
  // even after you think you've set it up.
  // ------------------------------------------------------------

  "university-of-lagos": { ...DEFAULT_FORMULA, label: "UNILAG (unverified, using default)" },
  "bayero-university-kano": { ...DEFAULT_FORMULA, label: "BUK (unverified, using default)" },
  "covenant-university": { ...DEFAULT_FORMULA, label: "Covenant University (unverified, using default)" },
  "landmark-university": { ...DEFAULT_FORMULA, label: "Landmark University (unverified, using default)" },
  "ahmadu-bello-university": { ...DEFAULT_FORMULA, label: "ABU (unverified, using default)" },
  "federal-university-of-technology-minna": { ...DEFAULT_FORMULA, label: "FUTMINNA (unverified, using default)" },
  "university-of-jos": { ...DEFAULT_FORMULA, label: "UNIJOS (unverified, using default)" },
  "university-of-nigeria-nsukka": { ...DEFAULT_FORMULA, label: "UNN (unverified, using default)" },
  "babcock-university": { ...DEFAULT_FORMULA, label: "Babcock University (unverified, using default)" },
  "delta-state-university-abraka": { ...DEFAULT_FORMULA, label: "DELSU (unverified, using default)" },
  "ekiti-state-university": { ...DEFAULT_FORMULA, label: "EKSU (unverified, using default)" },
  "federal-university-oye-ekiti": { ...DEFAULT_FORMULA, label: "FUOYE (unverified, using default)" },
  "ladoke-akintola-university-of-technology": { ...DEFAULT_FORMULA, label: "LAUTECH (unverified, using default)" },
  "lagos-state-university": { ...DEFAULT_FORMULA, label: "LASU (unverified, using default)" },
  "nnamdi-azikiwe-university": { ...DEFAULT_FORMULA, label: "UNIZIK (unverified, using default)" },
  "university-of-calabar": { ...DEFAULT_FORMULA, label: "UNICAL (unverified, using default)" },
  "university-of-port-harcourt": { ...DEFAULT_FORMULA, label: "UNIPORT (unverified, using default)" },
  "federal-university-of-technology-akure": { ...DEFAULT_FORMULA, label: "FUTA (unverified, using default)" },
  "federal-university-of-technology-owerri": { ...DEFAULT_FORMULA, label: "FUTO (unverified, using default)" },
  // OOU was in the original 24-university list but didn't appear in the
  // latest `select name, slug from universities` result — may not be in
  // the DB yet, or the slug differs from this guess. Confirm before relying
  // on the "verified" claim below.
  "olabisi-onabanjo-university": {
    ...DEFAULT_FORMULA,
    label: "OOU Standard (JAMB ÷ 8 + Post-UTME ÷ 2) — slug unconfirmed, not found in latest DB export",
    verified: true,
    source: "smartjamb.com — OOU Post UTME Form 2026 (slug guessed, please confirm)",
  },
};

/** Look up a university's formula by slug, falling back to the default. */
export function getFormula(universitySlug: string): UniversityFormula {
  return FORMULAS[universitySlug] ?? DEFAULT_FORMULA;
}
