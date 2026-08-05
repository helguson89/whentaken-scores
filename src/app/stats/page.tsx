import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

type ScoreRow = {
  player_name: string;
  puzzle_number: number;
  total_score: number;
};

type PlayerStats = {
  playerName: string;
  gamesPlayed: number;
  totalScoreSum: number;
  bestScore: number;
  wins: number;
};

export default async function StatsPage() {
  const { data: rows } = await supabase
    .from("scores")
    .select("player_name, puzzle_number, total_score");

  const scoreRows = (rows ?? []) as ScoreRow[];

  const byPuzzle = new Map<number, ScoreRow[]>();
  const statsByPlayer = new Map<string, PlayerStats>();

  for (const row of scoreRows) {
    const stats = statsByPlayer.get(row.player_name) ?? {
      playerName: row.player_name,
      gamesPlayed: 0,
      totalScoreSum: 0,
      bestScore: 0,
      wins: 0,
    };
    stats.gamesPlayed += 1;
    stats.totalScoreSum += row.total_score;
    stats.bestScore = Math.max(stats.bestScore, row.total_score);
    statsByPlayer.set(row.player_name, stats);

    const puzzleRows = byPuzzle.get(row.puzzle_number) ?? [];
    puzzleRows.push(row);
    byPuzzle.set(row.puzzle_number, puzzleRows);
  }

  for (const puzzleRows of byPuzzle.values()) {
    const maxScore = Math.max(...puzzleRows.map((r) => r.total_score));
    for (const row of puzzleRows) {
      if (row.total_score === maxScore) {
        statsByPlayer.get(row.player_name)!.wins += 1;
      }
    }
  }

  const stats = [...statsByPlayer.values()].sort(
    (a, b) => b.totalScoreSum / b.gamesPlayed - a.totalScoreSum / a.gamesPlayed
  );

  return (
    <main className="mx-auto max-w-md p-4 space-y-4">
      <h1 className="text-xl font-semibold">Statistikk</h1>
      {stats.length === 0 && <p className="text-gray-600">Ingen resultater ennå.</p>}
      <div className="space-y-2">
        {stats.map((s) => (
          <div key={s.playerName} className="rounded border p-3">
            <p className="font-medium">{s.playerName}</p>
            <p className="text-sm text-gray-600">
              Snitt: {Math.round(s.totalScoreSum / s.gamesPlayed)} · Best: {s.bestScore}
              {" · "}
              Spilt: {s.gamesPlayed} · Seire: {s.wins}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
