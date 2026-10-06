"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { submitScore, type SubmitScoreState } from "@/lib/actions";
import { parseWhenTakenShare } from "@/lib/parseShare";
import { usePlayerName } from "@/lib/usePlayerName";
import { medalEmoji } from "@/lib/medal";
import { PlayWhenTakenLink } from "@/components/PlayWhenTakenLink";

const initialState: SubmitScoreState = {
  error: null,
  success: false,
  personalBest: false,
  dailyBest: false,
};

function fireConfetti() {
  confetti({
    particleCount: 90,
    spread: 70,
    origin: { y: 0.7 },
    colors: ["#f4805a", "#fbd97a", "#8fcb9b", "#bfe3e0"],
  });
}

function fireFireworks() {
  const duration = 1200;
  const end = Date.now() + duration;
  const colors = ["#fbd97a", "#f4805a", "#e8c15c"];

  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      startVelocity: 45,
      origin: { x: 0, y: 0.7 },
      colors,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      startVelocity: 45,
      origin: { x: 1, y: 0.7 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

export default function AddScorePage() {
  const [state, formAction, pending] = useActionState(submitScore, initialState);
  const [playerName, setPlayerName] = usePlayerName();
  const [shareText, setShareText] = useState("");
  const prevStateRef = useRef(state);

  useEffect(() => {
    // Clears the form after a successful server round trip via useActionState.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state.success) setShareText("");
  }, [state.success]);

  useEffect(() => {
    // Fires a celebration exactly once per new server response (state is a
    // fresh object each time the action resolves), never on plain re-renders.
    if (state === prevStateRef.current) return;
    prevStateRef.current = state;
    if (!state.success) return;
    if (state.dailyBest) {
      fireFireworks();
    } else if (state.personalBest) {
      fireConfetti();
    }
  }, [state]);

  const preview = shareText.trim() ? parseWhenTakenShare(shareText) : null;
  const showParseWarning = shareText.trim().length > 0 && !preview;

  return (
    <main className="mx-auto max-w-md space-y-4 p-4">
      <h1 className="text-xl font-semibold">Legg til dagens resultat</h1>

      <PlayWhenTakenLink />

      <form action={formAction} className="card space-y-4 p-4">
        <div>
          <label
            className="mb-1 block text-sm font-medium text-ink"
            htmlFor="playerName"
          >
            Navnet ditt
          </label>
          <input
            id="playerName"
            name="playerName"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full rounded-2xl border border-peach-dark bg-cream px-3 py-2"
            placeholder="F.eks. Helge"
            required
          />
        </div>
        <div>
          <label
            className="mb-1 block text-sm font-medium text-ink"
            htmlFor="shareText"
          >
            Lim inn delingsteksten fra WhenTaken
          </label>
          <textarea
            id="shareText"
            name="shareText"
            value={shareText}
            onChange={(e) => setShareText(e.target.value)}
            rows={9}
            className="w-full rounded-2xl border border-peach-dark bg-cream px-3 py-2 font-mono text-xs"
            placeholder={"#WhenTaken #878 (24.07.2026)\n\nI scored 818/1000🏅\n..."}
            required
          />
        </div>

        {showParseWarning && (
          <p className="text-sm text-coral-dark">
            Klarte ikke å tolke teksten ennå — sjekk at hele meldingen fra
            WhenTaken er limt inn.
          </p>
        )}

        {preview && (
          <div className="space-y-2 rounded-2xl bg-peach px-3 py-2 text-sm">
            <p className="font-semibold text-ink">Forhåndsvisning</p>
            <p>
              Runde #{preview.puzzleNumber} · {preview.date}
            </p>
            <p>
              Score: {preview.totalScore}/{preview.totalMax}
            </p>
            <div className="space-y-1.5">
              {preview.rounds.map((round) => (
                <div
                  key={round.round}
                  className="flex flex-wrap items-center justify-between gap-1 rounded-xl bg-cream px-3 py-1.5"
                >
                  <span className="font-medium">#{round.round}</span>
                  <span>📍 {round.distanceText}</span>
                  <span>🗓️ {round.yearDiff} år</span>
                  <span className="font-semibold">
                    {medalEmoji(round.medal)} {round.score}/{round.maxScore}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {state.error && <p className="text-sm text-coral-dark">{state.error}</p>}

        {state.success && state.dailyBest && (
          <p className="text-sm font-semibold text-sun-dark">
            🏆 Dagens beste resultat! Godt jobba!
          </p>
        )}
        {state.success && !state.dailyBest && state.personalBest && (
          <p className="text-sm font-semibold text-mint-dark">
            🎉 Ny personlig rekord!
          </p>
        )}
        {state.success && !state.dailyBest && !state.personalBest && (
          <p className="text-sm font-semibold text-mint-dark">
            Resultat lagret!
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-coral py-2.5 font-semibold text-white shadow-sm disabled:opacity-50"
        >
          {pending ? "Lagrer..." : "Lagre resultat"}
        </button>
      </form>
    </main>
  );
}
