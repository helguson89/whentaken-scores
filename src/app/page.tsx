import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { ScoreCard } from "@/components/ScoreCard";
import { CommentThread } from "@/components/CommentThread";
import type { CommentRow, ReactionRow, ScoreRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { data: latestRow } = await supabase
    .from("scores")
    .select("puzzle_number, puzzle_date")
    .order("puzzle_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestRow) {
    return (
      <main className="mx-auto max-w-md space-y-4 p-4">
        <h1 className="text-xl font-semibold">Ingen resultater ennå</h1>
        <p className="text-ink-light">
          Vær den første til å legge inn dagens WhenTaken-resultat.
        </p>
        {/* Same-tab navigation on purpose — see the comment on the other
            whentaken.com link below. */}
        <a
          href="https://whentaken.com/"
          className="card flex items-center justify-between px-4 py-3 hover:bg-peach"
        >
          <span className="font-semibold">🎮 Spill dagens WhenTaken</span>
          <span className="text-ink-light">→</span>
        </a>
        <Link
          href="/add"
          className="inline-block rounded-full bg-coral px-5 py-2.5 font-semibold text-white shadow-sm"
        >
          Legg til resultat
        </Link>
      </main>
    );
  }

  const puzzleNumber = latestRow.puzzle_number;

  const [{ data: rows }, { data: comments }] = await Promise.all([
    supabase
      .from("scores")
      .select("id, player_name, total_score, total_max, rounds")
      .eq("puzzle_number", puzzleNumber)
      .order("total_score", { ascending: false }),
    supabase
      .from("comments")
      .select("id, puzzle_number, player_name, message, created_at")
      .eq("puzzle_number", puzzleNumber)
      .order("created_at", { ascending: true }),
  ]);

  const scores = (rows ?? []) as unknown as ScoreRow[];
  const scoreIds = scores.map((s) => s.id);

  const { data: reactionRows } =
    scoreIds.length > 0
      ? await supabase.from("reactions").select("*").in("score_id", scoreIds)
      : { data: [] as ReactionRow[] };

  const reactionsByScore = new Map<string, ReactionRow[]>();
  for (const reaction of (reactionRows ?? []) as ReactionRow[]) {
    const list = reactionsByScore.get(reaction.score_id) ?? [];
    list.push(reaction);
    reactionsByScore.set(reaction.score_id, list);
  }

  return (
    <main className="mx-auto max-w-md space-y-4 p-4">
      <div>
        <h1 className="text-xl font-semibold">
          Dagens resultat — runde #{puzzleNumber}
        </h1>
        <p className="text-sm text-ink-light">{latestRow.puzzle_date}</p>
      </div>

      {/*
        Deliberately no target="_blank" here: in an installed/standalone PWA,
        opening an external link in a new tab launches a separate browser
        app instance, so closing it lands on the home screen instead of back
        in this app. Navigating in the same tab keeps it in this window's
        history, so the device's normal back gesture/button returns here.
      */}
      <a
        href="https://whentaken.com/"
        className="card flex items-center justify-between px-4 py-3 hover:bg-peach"
      >
        <span className="font-semibold">🎮 Spill dagens WhenTaken</span>
        <span className="text-ink-light">→</span>
      </a>

      <div className="space-y-2">
        {scores.map((score, i) => (
          <ScoreCard
            key={score.id}
            score={score}
            position={i}
            reactions={reactionsByScore.get(score.id) ?? []}
            path="/"
          />
        ))}
      </div>

      <Link
        href="/add"
        className="inline-block rounded-full bg-coral px-5 py-2.5 font-semibold text-white shadow-sm"
      >
        Legg til ditt resultat
      </Link>

      <CommentThread
        puzzleNumber={puzzleNumber}
        comments={(comments ?? []) as CommentRow[]}
        path="/"
        players={scores.map((s) => s.player_name)}
      />
    </main>
  );
}
