import type { ParsedRound } from "./parseShare";

export type ScoreRow = {
  id: string;
  player_name: string;
  puzzle_number: number;
  puzzle_date: string;
  total_score: number;
  total_max: number;
  rounds: ParsedRound[];
  created_at: string;
};

export type CommentRow = {
  id: string;
  puzzle_number: number;
  player_name: string;
  message: string;
  created_at: string;
};

export type ReactionRow = {
  id: string;
  score_id: string;
  player_name: string;
  emoji: string;
  created_at: string;
};

export type ReactionSummary = {
  emoji: string;
  count: number;
  reactedByMe: boolean;
};

export type PushSubscriptionRow = {
  id: string;
  player_name: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
};

export type PushSubscriptionJSON = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export const REACTION_EMOJIS = ["👏", "🔥", "😂", "😱", "💀"] as const;
