const MENTION_PATTERN = "@([\\p{L}\\p{N}_-]+)";

export function extractMentions(message: string): string[] {
  const regex = new RegExp(MENTION_PATTERN, "gu");
  return [...message.matchAll(regex)].map((m) => m[1]);
}

export function splitMentions(message: string): { text: string; isMention: boolean }[] {
  const parts: { text: string; isMention: boolean }[] = [];
  let lastIndex = 0;
  const regex = new RegExp(MENTION_PATTERN, "gu");
  let match: RegExpExecArray | null;
  while ((match = regex.exec(message)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: message.slice(lastIndex, match.index), isMention: false });
    }
    parts.push({ text: match[0], isMention: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < message.length) {
    parts.push({ text: message.slice(lastIndex), isMention: false });
  }
  return parts;
}

export function mentionsPlayer(mentions: string[], playerName: string): boolean {
  const normalized = playerName.trim().toLowerCase();
  return mentions.some((m) => m.trim().toLowerCase() === normalized);
}
