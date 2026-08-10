"use client";

import { useEffect } from "react";

// Registers the service worker and watches for new deploys. When a new
// version of the app takes over as the active service worker, we reload the
// page immediately so the new code is in effect on the very next interaction
// — no prompt, no waiting on the user to click anything.
export default function UpdateBanner() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // If a controller already exists when this component mounts, any
    // *future* controllerchange means a new version just took over — that's
    // the signal to reload. On the very first install there's no controller
    // yet, so we don't want to reload then (that would just loop).
    const hadControllerOnMount = !!navigator.serviceWorker.controller;
    let reloaded = false;

    const onControllerChange = () => {
      if (!hadControllerOnMount || reloaded) return;
      reloaded = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    let interval: ReturnType<typeof setInterval> | undefined;

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        reg.update().catch(() => {});
        // Re-check for updates periodically in case someone leaves the form
        // open across a deploy.
        interval = setInterval(() => reg.update().catch(() => {}), 60_000);
      })
      .catch((e) => console.warn("SW registration failed", e));

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      if (interval) clearInterval(interval);
    };
  }, []);

  return null;
}
