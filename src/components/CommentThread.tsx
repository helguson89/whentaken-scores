"use client";

import { useActionState, useEffect, useState } from "react";
import { postComment, type PostCommentState } from "@/lib/actions";
import { usePlayerName } from "@/lib/usePlayerName";
import { splitMentions } from "@/lib/mentions";
import type { CommentRow } from "@/lib/types";

const initialState: PostCommentState = { error: null, success: false };

function MessageText({ message }: { message: string }) {
  return (
    <>
      {splitMentions(message).map((part, i) =>
        part.isMention ? (
          <span key={i} className="font-semibold text-coral">
            {part.text}
          </span>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </>
  );
}

export function CommentThread({
  puzzleNumber,
  comments,
  path,
  players,
}: {
  puzzleNumber: number;
  comments: CommentRow[];
  path: string;
  players?: string[];
}) {
  const [state, formAction, pending] = useActionState(postComment, initialState);
  const [playerName, setPlayerName] = usePlayerName();
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Clears the message after a successful server round trip via useActionState.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state.success) setMessage("");
  }, [state.success]);

  return (
    <div className="card space-y-3 p-4">
      <h2 className="font-semibold text-ink">💬 Chat om runde #{puzzleNumber}</h2>

      <div className="max-h-64 space-y-2 overflow-y-auto">
        {comments.length === 0 && (
          <p className="text-sm text-ink-light">Ingen kommentarer ennå. Si noe!</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="rounded-xl bg-peach px-3 py-2 text-sm">
            <span className="font-semibold">{c.player_name}: </span>
            <MessageText message={c.message} />
          </div>
        ))}
      </div>

      {players && players.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {players.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() =>
                setMessage((prev) => (prev.endsWith(" ") || !prev ? prev : `${prev} `) + `@${p} `)
              }
              className="rounded-full bg-peach px-2.5 py-1 text-xs font-medium text-ink-light hover:bg-peach-dark hover:text-ink"
            >
              @{p}
            </button>
          ))}
        </div>
      )}

      <form action={formAction} className="flex flex-wrap gap-2">
        <input type="hidden" name="puzzleNumber" value={puzzleNumber} />
        <input type="hidden" name="path" value={path} />
        <input
          type="text"
          name="playerName"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Navn"
          required
          className="w-20 rounded-full border border-peach-dark bg-cream px-3 py-1.5 text-sm"
        />
        <input
          type="text"
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Skriv en melding..."
          required
          className="min-w-0 flex-1 rounded-full border border-peach-dark bg-cream px-3 py-1.5 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-coral px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </div>
  );
}
