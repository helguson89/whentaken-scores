import type { ParsedRound } from "./parseShare";

export function medalEmoji(medal: ParsedRound["medal"]): string {
  if (medal === "gold") return "🥇";
  if (medal === "silver") return "🥈";
  if (medal === "bronze") return "🥉";
  return "";
}
