"use client";

import { useActionState, useEffect, useState } from "react";
import { submitScore, type SubmitScoreState } from "@/lib/actions";
import { parseWhenTakenShare } from "@/lib/parseShare";

const initialState: SubmitScoreState = { error: null, success: false };
const NAME_STORAGE_KEY = "whentaken_player_name";

export default function AddScorePage() {
  const [state, formAction, pending] = useActionState(submitScore, initialState);
  const [playerName, setPlayerName] = useState("");
  const [shareText, setShareText] = useState("");

  useEffect(() => {
    // Syncs from an external system (localStorage), not derivable from props/state.
    const stored = window.localStorage.getItem(NAME_STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setPlayerName(stored);
  }, []);

  useEffect(() => {
    if (playerName) window.localStorage.setItem(NAME_STORAGE_KEY, playerName);
  }, [playerName]);

  useEffect(() => {
    // Clears the form after a successful server round trip via useActionState.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state.success) setShareText("");
  }, [state.success]);

  const preview = shareText.trim() ? parseWhenTakenShare(shareText) : null;
  const showParseWarning = shareText.trim().length > 0 && !preview;

  return (
    <main className="mx-auto max-w-md p-4 space-y-4">
      <h1 className="text-xl font-semibold">Legg til dagens resultat</h1>
      <form action={formAction} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="playerName">
            Navnet ditt
          </label>
          <input
            id="playerName"
            name="playerName"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full rounded border px-3 py-2"
            placeholder="F.eks. Helge"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="shareText">
            Lim inn delingsteksten fra WhenTaken
          </label>
          <textarea
            id="shareText"
            name="shareText"
            value={shareText}
            onChange={(e) => setShareText(e.target.value)}
            rows={9}
            className="w-full rounded border px-3 py-2 font-mono text-xs"
            placeholder={"#WhenTaken #878 (24.07.2026)\n\nI scored 818/1000🏅\n..."}
            required
          />
        </div>

        {showParseWarning && (
          <p className="text-sm text-red-600">
            Klarte ikke å tolke teksten ennå — sjekk at hele meldingen fra
            WhenTaken er limt inn.
          </p>
        )}

        {preview && (
          <div className="rounded border bg-gray-50 p-3 text-sm space-y-1">
            <p className="font-medium">Forhåndsvisning</p>
            <p>
              Runde #{preview.puzzleNumber} · {preview.date}
            </p>
            <p>
              Score: {preview.totalScore}/{preview.totalMax}
            </p>
          </div>
        )}

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.success && (
          <p className="text-sm text-green-600">Resultat lagret!</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-black text-white py-2 font-medium disabled:opacity-50"
        >
          {pending ? "Lagrer..." : "Lagre resultat"}
        </button>
      </form>
    </main>
  );
}
