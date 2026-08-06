"use client";

import { useEffect, useState } from "react";

const NAME_STORAGE_KEY = "whentaken_player_name";

export function usePlayerName() {
  const [playerName, setPlayerName] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(NAME_STORAGE_KEY);
    // Syncs from an external system (localStorage), not derivable from props/state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setPlayerName(stored);
  }, []);

  useEffect(() => {
    if (playerName) window.localStorage.setItem(NAME_STORAGE_KEY, playerName);
  }, [playerName]);

  return [playerName, setPlayerName] as const;
}
