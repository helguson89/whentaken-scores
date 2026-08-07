"use server";

import { revalidatePath } from "next/cache";
import webpush from "web-push";
import { supabase } from "./supabaseClient";
import { parseWhenTakenShare } from "./parseShare";
import type { PushSubscriptionJSON } from "./types";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;

if (vapidPublicKey && vapidPrivateKey && vapidSubject) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

async function notifySubscribers({
  excludePlayerName,
  title,
  body,
  url,
  tag,
}: {
  excludePlayerName: string;
  title: string;
  body: string;
  url: string;
  tag?: string;
}): Promise<void> {
  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) return;

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, player_name")
    .neq("player_name", excludePlayerName);

  if (!subscriptions || subscriptions.length === 0) return;

  const payload = JSON.stringify({ title, body, url, tag });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Subscription is gone (browser data cleared, uninstalled, etc).
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    })
  );
}

export async function saveSubscription(
  subscription: PushSubscriptionJSON,
  playerName: string
): Promise<void> {
  const name = playerName.trim();
  if (!name || !subscription.endpoint) return;

  await supabase.from("push_subscriptions").upsert(
    {
      player_name: name,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: "endpoint" }
  );
}

export async function deleteSubscription(endpoint: string): Promise<void> {
  if (!endpoint) return;
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
}

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

  await notifySubscribers({
    excludePlayerName: playerName,
    title: dailyBest ? "🏆 Dagens beste resultat!" : "Nytt resultat lagt inn",
    body: `${playerName} scoret ${parsed.totalScore}/${parsed.totalMax} på runde #${parsed.puzzleNumber}`,
    url: "/",
    tag: `score-${parsed.puzzleNumber}`,
  });

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

  await notifySubscribers({
    excludePlayerName: playerName,
    title: "💬 Ny melding",
    body: `${playerName}: ${message}`,
    url: path,
    tag: `comment-${puzzleNumber}`,
  });

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
