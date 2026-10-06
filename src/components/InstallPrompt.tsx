"use client";

import { useEffect, useState } from "react";
import { isIos, isStandalone } from "@/lib/platform";

const DISMISS_KEY = "whentaken_install_dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (isStandalone()) return;
    if (window.localStorage.getItem(DISMISS_KEY) === "1") return;

    // Reveals the prompt only once we know it's neither already installed
    // nor previously dismissed by the user — both external, one-time checks.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(false);
    if (isIos()) {
      setShowIosHint(true);
    }

    function handler(event: Event) {
      event.preventDefault();
      setDeferredEvent(event as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  async function install() {
    if (!deferredEvent) return;
    await deferredEvent.prompt();
    const choice = await deferredEvent.userChoice;
    if (choice.outcome === "accepted") {
      dismiss();
    } else {
      setDeferredEvent(null);
    }
  }

  if (dismissed || (!deferredEvent && !showIosHint)) return null;

  return (
    <div className="card fixed inset-x-4 bottom-24 z-10 mx-auto flex max-w-md items-center justify-between gap-3 p-3 text-sm">
      <span>
        {deferredEvent
          ? "📲 Installer appen for rask tilgang fra hjemskjermen"
          : "📲 Trykk Del-knappen nederst og velg «Legg til på Hjem-skjerm»"}
      </span>
      <div className="flex shrink-0 items-center gap-2">
        {deferredEvent && (
          <button
            type="button"
            onClick={install}
            className="rounded-full bg-coral px-3 py-1.5 font-semibold text-white"
          >
            Installer
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Lukk"
          className="text-ink-light"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
