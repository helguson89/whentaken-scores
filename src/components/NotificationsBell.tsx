"use client";

import { useEffect, useState } from "react";
import { deleteSubscription, saveSubscription } from "@/lib/actions";
import { usePlayerName } from "@/lib/usePlayerName";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function NotificationsBell() {
  const [playerName] = usePlayerName();
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    // Detects browser capability and any pre-existing subscription for this
    // device — both are external state that can't be derived from props.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(true);
    navigator.serviceWorker.register("/sw.js").then(async (registration) => {
      const existing = await registration.pushManager.getSubscription();
      setSubscribed(!!existing);
    });
  }, []);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;

      if (subscribed) {
        const existing = await registration.pushManager.getSubscription();
        if (existing) {
          await deleteSubscription(existing.endpoint);
          await existing.unsubscribe();
        }
        setSubscribed(false);
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) return;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = subscription.toJSON();
      if (!json.keys?.p256dh || !json.keys?.auth) return;

      await saveSubscription(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        },
        playerName || "Ukjent"
      );
      setSubscribed(true);
    } finally {
      setBusy(false);
    }
  }

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      title={subscribed ? "Skru av varsler" : "Skru på varsler"}
      className="fixed top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-peach-dark bg-cream text-lg shadow-sm disabled:opacity-50"
    >
      {subscribed ? "🔔" : "🔕"}
    </button>
  );
}
