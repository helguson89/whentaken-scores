"use client";

import { useState, useTransition } from "react";
import { toggleReaction } from "@/lib/actions";
import { usePlayerName } from "@/lib/usePlayerName";
import { REACTION_EMOJIS, type ReactionRow, type ScoreRow } from "@/lib/types";

function medalFor(position: number): string {
  if (position === 0) return "🥇";
  if (position === 1) return "🥈";
  if (position === 2) return "🥉";
  return `${position + 1}.`;
}

function roundMedal(medal: "gold" | "silver" | "bronze" | null): string {
  if (medal === "gold") return "🥇";
  if (medal === "silver") return "🥈";
  if (medal === "bronze") return "🥉";
  return "";
}

export function ScoreCard({
  score,
  position,
  reactions,
  path,
}: {
  score: ScoreRow;
  position: number;
  reactions: ReactionRow[];
  path: string;
}) {
  const [open, setOpen] = useState(false);
  const [playerName, setPlayerName] = usePlayerName();
  const [isPending, startTransition] = useTransition();

  function handleReact(emoji: string) {
    const name = playerName || window.prompt("Hva heter du?")?.trim() || "";
    if (!name) return;
    if (name !== playerName) setPlayerName(name);
    startTransition(() => {
      void toggleReaction(score.id, name, emoji, path);
    });
  }

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2">
          <span className="w-7 text-lg">{medalFor(position)}</span>
          <span className="font-semibold">{score.player_name}</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="font-bold text-coral-dark">
            {score.total_score}/{score.total_max}
          </span>
          <span
            className={`inline-block text-ink-light transition-transform ${
              open ? "rotate-180" : ""
            }`}
          >
            ⌄
          </span>
        </span>
      </button>

      {open && (
        <div className="space-y-1.5 border-t border-peach-dark px-4 py-3">
          {score.rounds.map((round) => (
            <div
              key={round.round}
              className="flex flex-wrap items-center justify-between gap-1 rounded-xl bg-peach px-3 py-1.5 text-sm"
            >
              <span className="font-medium">#{round.round}</span>
              <span>📍 {round.distanceText}</span>
              <span>🗓️ {round.yearDiff} år</span>
              <span className="font-semibold">
                {roundMedal(round.medal)} {round.score}/{round.maxScore}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 border-t border-peach-dark px-4 py-2">
        {REACTION_EMOJIS.map((emoji) => {
          const forEmoji = reactions.filter((r) => r.emoji === emoji);
          const reactedByMe = forEmoji.some((r) => r.player_name === playerName);
          return (
            <button
              key={emoji}
              type="button"
              disabled={isPending}
              onClick={() => handleReact(emoji)}
              className={`rounded-full border px-2 py-0.5 text-sm ${
                reactedByMe
                  ? "border-coral bg-coral/10"
                  : "border-peach-dark bg-cream"
              }`}
            >
              {emoji} {forEmoji.length > 0 ? forEmoji.length : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}
