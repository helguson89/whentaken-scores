import { describe, it, expect } from "vitest";
import { parseWhenTakenShare } from "./parseShare";

const SAMPLE = `#WhenTaken #878 (24.07.2026)

I scored 818/1000🏅

1️⃣📍744 km - 🗓️9 yrs - 🥈165/200
2️⃣📍516 m - 🗓️11 yrs - 🥇182/200
3️⃣📍8.0K km - 🗓️5 yrs - 🥉103/200
4️⃣📍611 km - 🗓️8 yrs - 🥈171/200
5️⃣📍1.6 km - 🗓️3 yrs - 🥇197/200
 https://whentaken.com/`;

describe("parseWhenTakenShare", () => {
  it("parses puzzle number and date", () => {
    const result = parseWhenTakenShare(SAMPLE);
    expect(result).not.toBeNull();
    expect(result!.puzzleNumber).toBe(878);
    expect(result!.date).toBe("2026-07-24");
  });

  it("parses total score", () => {
    const result = parseWhenTakenShare(SAMPLE)!;
    expect(result.totalScore).toBe(818);
    expect(result.totalMax).toBe(1000);
  });

  it("parses all 5 rounds", () => {
    const result = parseWhenTakenShare(SAMPLE)!;
    expect(result.rounds).toHaveLength(5);
    expect(result.rounds[0]).toMatchObject({
      round: 1,
      distanceText: "744 km",
      yearDiff: 9,
      medal: "silver",
      score: 165,
      maxScore: 200,
    });
    expect(result.rounds[2]).toMatchObject({
      round: 3,
      distanceText: "8.0K km",
      yearDiff: 5,
      medal: "bronze",
      score: 103,
      maxScore: 200,
    });
  });

  it("converts distances to meters", () => {
    const result = parseWhenTakenShare(SAMPLE)!;
    expect(result.rounds[1].distanceMeters).toBeCloseTo(516);
    expect(result.rounds[2].distanceMeters).toBeCloseTo(8_000_000);
    expect(result.rounds[4].distanceMeters).toBeCloseTo(1600);
  });

  it("returns null for garbage input", () => {
    expect(parseWhenTakenShare("not a share text")).toBeNull();
  });
});
