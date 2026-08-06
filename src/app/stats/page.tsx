import { supabase } from "@/lib/supabaseClient";
import { TrendChart } from "@/components/TrendChart";
import type { ParsedRound } from "@/lib/parseShare";

export const dynamic = "force-dynamic";

type ScoreRow = {
  player_name: string;
  puzzle_number: number;
  total_score: number;
  rounds: ParsedRound[];
};

type PlayerStats = {
  playerName: string;
  gamesPlayed: number;
  totalScoreSum: number;
  bestScore: number;
  wins: number;
};

const MIN_GAMES = 3;

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length < 2) return Infinity;
  const avg = average(values);
  const variance = average(values.map((v) => (v - avg) ** 2));
  return Math.sqrt(variance);
}

export default async function StatsPage() {
  const { data: rows } = await supabase
    .from("scores")
    .select("player_name, puzzle_number, total_score, rounds")
    .order("puzzle_number", { ascending: true });

  const scoreRows = (rows ?? []) as ScoreRow[];

  const byPuzzle = new Map<number, ScoreRow[]>();
  const statsByPlayer = new Map<string, PlayerStats>();
  const totalScoresByPlayer = new Map<string, number[]>();
  const distanceErrorsByPlayer = new Map<string, number[]>();
  const yearDiffsByPlayer = new Map<string, number[]>();

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

    const totals = totalScoresByPlayer.get(row.player_name) ?? [];
    totals.push(row.total_score);
    totalScoresByPlayer.set(row.player_name, totals);

    const distances = distanceErrorsByPlayer.get(row.player_name) ?? [];
    const years = yearDiffsByPlayer.get(row.player_name) ?? [];
    for (const round of row.rounds ?? []) {
      if (round.distanceMeters != null) distances.push(round.distanceMeters);
      years.push(round.yearDiff);
    }
    distanceErrorsByPlayer.set(row.player_name, distances);
    yearDiffsByPlayer.set(row.player_name, years);
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

  const qualified = (playerName: string) =>
    (statsByPlayer.get(playerName)?.gamesPlayed ?? 0) >= MIN_GAMES;

  const bestDistance = [...distanceErrorsByPlayer.entries()]
    .filter(([player, values]) => qualified(player) && values.length > 0)
    .map(([player, values]) => ({ player, avg: average(values) }))
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 3);

  const bestYear = [...yearDiffsByPlayer.entries()]
    .filter(([player, values]) => qualified(player) && values.length > 0)
    .map(([player, values]) => ({ player, avg: average(values) }))
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 3);

  const mostConsistent = [...totalScoresByPlayer.entries()]
    .filter(([player, values]) => qualified(player) && values.length >= 2)
    .map(([player, values]) => ({ player, stddev: stddev(values) }))
    .sort((a, b) => a.stddev - b.stddev)
    .slice(0, 3);

  const players = [...statsByPlayer.keys()];
  const trendData = [...byPuzzle.keys()]
    .sort((a, b) => a - b)
    .map((puzzleNumber) => {
      const row: Record<string, number | string> = { puzzle: `#${puzzleNumber}` };
      for (const r of byPuzzle.get(puzzleNumber) ?? []) {
        row[r.player_name] = r.total_score;
      }
      return row;
    });

  function formatMeters(m: number): string {
    if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
    return `${Math.round(m)} m`;
  }

  return (
    <main className="mx-auto max-w-md space-y-4 p-4">
      <h1 className="text-xl font-semibold">Statistikk</h1>

      {stats.length === 0 && (
        <p className="text-ink-light">Ingen resultater ennå.</p>
      )}

      {stats.length > 0 && (
        <>
          <div className="card space-y-2 p-4">
            <h2 className="font-semibold text-ink">🏆 Sammenlagt</h2>
            <div className="space-y-2">
              {stats.map((s) => (
                <div
                  key={s.playerName}
                  className="rounded-xl bg-peach px-3 py-2"
                >
                  <p className="font-semibold">{s.playerName}</p>
                  <p className="text-sm text-ink-light">
                    Snitt: {Math.round(s.totalScoreSum / s.gamesPlayed)} · Best:{" "}
                    {s.bestScore} · Spilt: {s.gamesPlayed} · Seire: {s.wins}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {players.length > 1 && trendData.length > 1 && (
            <div className="card space-y-2 p-4">
              <h2 className="font-semibold text-ink">📈 Trend</h2>
              <TrendChart data={trendData} players={players} />
            </div>
          )}

          <div className="card space-y-2 p-4">
            <h2 className="font-semibold text-ink">📍 Best på avstand</h2>
            {bestDistance.length === 0 ? (
              <p className="text-sm text-ink-light">
                Ingen kvalifiserer ennå (min. {MIN_GAMES} runder).
              </p>
            ) : (
              <ul className="space-y-1">
                {bestDistance.map((entry, i) => (
                  <li
                    key={entry.player}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-medium">
                      {i + 1}. {entry.player}
                    </span>
                    <span className="text-ink-light">
                      {formatMeters(entry.avg)} snitt
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card space-y-2 p-4">
            <h2 className="font-semibold text-ink">🗓️ Best på år</h2>
            {bestYear.length === 0 ? (
              <p className="text-sm text-ink-light">
                Ingen kvalifiserer ennå (min. {MIN_GAMES} runder).
              </p>
            ) : (
              <ul className="space-y-1">
                {bestYear.map((entry, i) => (
                  <li
                    key={entry.player}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-medium">
                      {i + 1}. {entry.player}
                    </span>
                    <span className="text-ink-light">
                      {entry.avg.toFixed(1)} år snitt
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card space-y-2 p-4">
            <h2 className="font-semibold text-ink">🎯 Mest konsistent</h2>
            {mostConsistent.length === 0 ? (
              <p className="text-sm text-ink-light">
                Ingen kvalifiserer ennå (min. {MIN_GAMES} runder).
              </p>
            ) : (
              <ul className="space-y-1">
                {mostConsistent.map((entry, i) => (
                  <li
                    key={entry.player}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-medium">
                      {i + 1}. {entry.player}
                    </span>
                    <span className="text-ink-light">
                      ±{Math.round(entry.stddev)} poeng
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </main>
  );
}
