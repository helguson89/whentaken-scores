export type ParsedRound = {
  round: number;
  distanceText: string;
  distanceMeters: number | null;
  yearDiff: number;
  medal: "gold" | "silver" | "bronze" | null;
  score: number;
  maxScore: number;
};

export type ParsedShare = {
  puzzleNumber: number;
  date: string; // ISO yyyy-mm-dd
  totalScore: number;
  totalMax: number;
  rounds: ParsedRound[];
  rawText: string;
};

const MEDAL_MAP: Record<string, ParsedRound["medal"]> = {
  "\u{1F947}": "gold",
  "\u{1F948}": "silver",
  "\u{1F949}": "bronze",
};

function parseDistance(text: string): number | null {
  const match = text.trim().match(/^([\d.,]+)\s*(K)?\s*(km|m)$/i);
  if (!match) return null;
  const value = parseFloat(match[1].replace(",", "."));
  if (Number.isNaN(value)) return null;
  const thousand = match[2] ? 1000 : 1;
  const unit = match[3].toLowerCase();
  const inUnitScale = value * thousand;
  return unit === "km" ? inUnitScale * 1000 : inUnitScale;
}

export function parseWhenTakenShare(input: string): ParsedShare | null {
  const text = input.trim();

  const headerMatch = text.match(/#WhenTaken\s*#(\d+)\s*\((\d{2})\.(\d{2})\.(\d{4})\)/i);
  if (!headerMatch) return null;
  const [, puzzleStr, dd, mm, yyyy] = headerMatch;

  const totalMatch = text.match(/scored\s*(\d+)\s*\/\s*(\d+)/i);
  if (!totalMatch) return null;
  const [, totalScoreStr, totalMaxStr] = totalMatch;

  // Rounds silently went missing from the breakdown for some players even
  // though the total score (parsed separately, above) was always right —
  // one round's line just failed to match while the others still did. Two
  // things made the match fragile:
  //  1. The leading round-number keycap (1️⃣, 2️⃣, ...) and the calendar
  //     emoji (🗓️) are multi-codepoint sequences (base + variation
  //     selector [+ combining enclosing keycap]) that some keyboards/
  //     clipboards mangle or strip on copy, losing just the selector.
  //  2. The distance was captured as "everything up to the next hyphen",
  //     and depended on that hyphen being a plain ASCII "-" — but some
  //     devices substitute an en dash (–) or em dash (—) for it on copy.
  // We don't need the round number at all (roundIndex below comes from
  // match order), so this anchors on the 📍 pin emoji, matches the distance
  // as an explicit number+unit token instead of "until the next dash", and
  // accepts any dash-like separator and a missing/variant calendar selector.
  const DISTANCE = "[\\d.,]+\\s*K?\\s*(?:km|m)";
  const DASH = "[-‐-―−]";
  const roundLineRegex = new RegExp(
    `📍\\s*(${DISTANCE})\\s*${DASH}\\s*🗓\\uFE0F?\\s*(\\d+)\\s*yrs?\\s*${DASH}\\s*(🥇|🥈|🥉)?\\s*(\\d+)\\s*/\\s*(\\d+)`,
    "giu"
  );

  const rounds: ParsedRound[] = [];
  let match: RegExpExecArray | null;
  let roundIndex = 0;
  while ((match = roundLineRegex.exec(text)) !== null) {
    roundIndex += 1;
    const [, distanceText, yearDiffStr, medalEmoji, scoreStr, maxScoreStr] = match;
    rounds.push({
      round: roundIndex,
      distanceText: distanceText.trim(),
      distanceMeters: parseDistance(distanceText),
      yearDiff: parseInt(yearDiffStr, 10),
      medal: medalEmoji ? MEDAL_MAP[medalEmoji] ?? null : null,
      score: parseInt(scoreStr, 10),
      maxScore: parseInt(maxScoreStr, 10),
    });
  }

  if (rounds.length === 0) return null;

  return {
    puzzleNumber: parseInt(puzzleStr, 10),
    date: `${yyyy}-${mm}-${dd}`,
    totalScore: parseInt(totalScoreStr, 10),
    totalMax: parseInt(totalMaxStr, 10),
    rounds,
    rawText: text,
  };
}
