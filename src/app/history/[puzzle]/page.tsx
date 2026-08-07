import { supabase } from "@/lib/supabaseClient";
import { ScoreCard } from "@/components/ScoreCard";
import { CommentThread } from "@/components/CommentThread";
import type { CommentRow, ReactionRow, ScoreRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PuzzleHistoryPage({
  params,
}: PageProps<"/history/[puzzle]">) {
  const { puzzle } = await params;
  const puzzleNumber = parseInt(puzzle, 10);
  const path = `/history/${puzzle}`;

  const [{ data: rows }, { data: comments }] = await Promise.all([
    supabase
      .from("scores")
      .select("id, player_name, total_score, total_max, rounds, puzzle_date")
      .eq("puzzle_number", puzzleNumber)
      .order("total_score", { ascending: false }),
    supabase
      .from("comments")
      .select("id, puzzle_number, player_name, message, created_at")
      .eq("puzzle_number", puzzleNumber)
      .order("created_at", { ascending: true }),
  ]);

  if (!rows || rows.length === 0) {
    return (
      <main className="mx-auto max-w-md p-4">
        <p className="text-ink-light">
          Fant ingen resultater for runde #{puzzleNumber}.
        </p>
      </main>
    );
  }

  const scores = rows as unknown as (ScoreRow & { puzzle_date: string })[];
  const scoreIds = scores.map((s) => s.id);

  const { data: reactionRows } = await supabase
    .from("reactions")
    .select("*")
    .in("score_id", scoreIds);

  const reactionsByScore = new Map<string, ReactionRow[]>();
  for (const reaction of (reactionRows ?? []) as ReactionRow[]) {
    const list = reactionsByScore.get(reaction.score_id) ?? [];
    list.push(reaction);
    reactionsByScore.set(reaction.score_id, list);
  }

  return (
    <main className="mx-auto max-w-md space-y-4 p-4">
      <div>
        <h1 className="text-xl font-semibold">Runde #{puzzleNumber}</h1>
        <p className="text-sm text-ink-light">{scores[0].puzzle_date}</p>
      </div>

      <div className="space-y-2">
        {scores.map((score, i) => (
          <ScoreCard
            key={score.id}
            score={score}
            position={i}
            reactions={reactionsByScore.get(score.id) ?? []}
            path={path}
          />
        ))}
      </div>

      <CommentThread
        puzzleNumber={puzzleNumber}
        comments={(comments ?? []) as CommentRow[]}
        path={path}
        players={scores.map((s) => s.player_name)}
      />
    </main>
  );
}
