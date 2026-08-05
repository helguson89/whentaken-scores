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

  const roundLineRegex =
    /(?:\d️⃣|[1-5]️⃣)\s*📍\s*([^-]+?)\s*-\s*🗓️\s*(\d+)\s*yrs?\s*-\s*(🥇|🥈|🥉)?\s*(\d+)\s*\/\s*(\d+)/gu;

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
