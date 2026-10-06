"use client";

import { useEffect, useState } from "react";
import { isIos, isStandalone } from "@/lib/platform";

export function PlayWhenTakenLink() {
  const [showReturnHint, setShowReturnHint] = useState(false);

  useEffect(() => {
    // Installed/standalone apps have no browser chrome of their own, so once
    // whentaken.com takes over the screen there's no visible way back —
    // this hint is the only guidance we can give. Only needed in standalone
    // mode: a normal browser tab already has its own back/tab-switch UI.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isStandalone()) setShowReturnHint(true);
  }, []);

  return (
    <div className="space-y-1">
      {/*
        Deliberately target="_blank" with no rel="noopener"/"noreferrer":
        on Android, an installed PWA that opens an external link this way
        keeps a window.opener reference, which is what lets Chrome show its
        "Return to [app]" mini toolbar on the opened tab. Stripping opener
        (as noopener/noreferrer both do) removes that link back. whentaken.com
        is a trusted destination the user chose to visit, so the minor
        referrer/opener exposure is worth it for getting people back in.
      */}
      <a
        href="https://whentaken.com/"
        target="_blank"
        className="card flex items-center justify-between px-4 py-3 hover:bg-peach"
      >
        <span className="font-semibold">🎮 Spill dagens WhenTaken</span>
        <span className="text-ink-light">→</span>
      </a>
      {showReturnHint && (
        <p className="px-1 text-xs text-ink-light">
          {isIos()
            ? "Når du er ferdig: trykk Hjem-knappen / sveip opp og åpne WT Scores fra hjemskjermen igjen."
            : "Når du er ferdig: bytt tilbake til WT Scores i oversikten over åpne apper, eller se etter en «tilbake»-lenke øverst på siden."}
        </p>
      )}
    </div>
  );
}
