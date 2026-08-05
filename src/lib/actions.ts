"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "./supabaseClient";
import { parseWhenTakenShare } from "./parseShare";

export type SubmitScoreState = {
  error: string | null;
  success: boolean;
};

export async function submitScore(
  _prevState: SubmitScoreState,
  formData: FormData
): Promise<SubmitScoreState> {
  const playerName = String(formData.get("playerName") ?? "").trim();
  const shareText = String(formData.get("shareText") ?? "").trim();

  if (!playerName) {
    return { error: "Skriv inn navnet ditt.", success: false };
  }

  const parsed = parseWhenTakenShare(shareText);
  if (!parsed) {
    return {
      error:
        "Klarte ikke å tolke delingsteksten. Sjekk at hele meldingen fra WhenTaken er limt inn.",
      success: false,
    };
  }

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
    return { error: `Kunne ikke lagre resultatet: ${error.message}`, success: false };
  }

  revalidatePath("/");
  revalidatePath("/stats");
  revalidatePath("/history");

  return { error: null, success: true };
}
