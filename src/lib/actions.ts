"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "./supabaseClient";
import { parseWhenTakenShare } from "./parseShare";

export type SubmitScoreState = {
  error: string | null;
  success: boolean;
  personalBest: boolean;
  dailyBest: boolean;
};

export async function submitScore(
  _prevState: SubmitScoreState,
  formData: FormData
): Promise<SubmitScoreState> {
  const playerName = String(formData.get("playerName") ?? "").trim();
  const shareText = String(formData.get("shareText") ?? "").trim();

  const fail = (error: string): SubmitScoreState => ({
    error,
    success: false,
    personalBest: false,
    dailyBest: false,
  });

  if (!playerName) {
    return fail("Skriv inn navnet ditt.");
  }

  const parsed = parseWhenTakenShare(shareText);
  if (!parsed) {
    return fail(
      "Klarte ikke å tolke delingsteksten. Sjekk at hele meldingen fra WhenTaken er limt inn."
    );
  }

  const { data: previousScores } = await supabase
    .from("scores")
    .select("total_score")
    .eq("player_name", playerName)
    .neq("puzzle_number", parsed.puzzleNumber);

  const previousBest = (previousScores ?? []).reduce(
    (max, row) => Math.max(max, row.total_score),
    -Infinity
  );
  const personalBest =
    previousBest !== -Infinity && parsed.totalScore > previousBest;

  const { data: othersToday } = await supabase
    .from("scores")
    .select("total_score")
    .eq("puzzle_number", parsed.puzzleNumber)
    .neq("player_name", playerName);

  const othersBestToday = (othersToday ?? []).reduce(
    (max, row) => Math.max(max, row.total_score),
    -Infinity
  );
  const dailyBest = parsed.totalScore >= othersBestToday;

  const { error } = await supabase.from("scores").upsert(
    {
      player_name: playerName,
      puzzle_number: parsed.puzzleNumber,
      puzzle_date: parsed.date,
      total_score: parsed.totalScore,
      total_max: parsed.totalMax,
      rounds: parsed.rounds,
      raw_text: parsed.rawText,
    },
    { onConflict: "player_name,puzzle_number" }
  );

  if (error) {
    return fail(`Kunne ikke lagre resultatet: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/stats");
  revalidatePath("/history");

  return { error: null, success: true, personalBest, dailyBest };
}

export type PostCommentState = {
  error: string | null;
  success: boolean;
};

export async function postComment(
  _prevState: PostCommentState,
  formData: FormData
): Promise<PostCommentState> {
  const puzzleNumber = parseInt(String(formData.get("puzzleNumber") ?? ""), 10);
  const playerName = String(formData.get("playerName") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const path = String(formData.get("path") ?? "/");

  if (Number.isNaN(puzzleNumber)) {
    return { error: "Mangler rundenummer.", success: false };
  }
  if (!playerName) {
    return { error: "Skriv inn navnet ditt.", success: false };
  }
  if (!message) {
    return { error: "Skriv en melding.", success: false };
  }

  const { error } = await supabase.from("comments").insert({
    puzzle_number: puzzleNumber,
    player_name: playerName,
    message,
  });

  if (error) {
    return {
      error: `Kunne ikke lagre kommentaren: ${error.message}`,
      success: false,
    };
  }

  revalidatePath(path);

  return { error: null, success: true };
}

export async function toggleReaction(
  scoreId: string,
  playerName: string,
  emoji: string,
  path: string
): Promise<void> {
  if (!playerName.trim()) return;

  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("score_id", scoreId)
    .eq("player_name", playerName)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    await supabase.from("reactions").delete().eq("id", existing.id);
  } else {
    await supabase
      .from("reactions")
      .insert({ score_id: scoreId, player_name: playerName, emoji });
  }

  revalidatePath(path);
}
