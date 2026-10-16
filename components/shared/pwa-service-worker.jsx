"use client";

import { useEffect } from "react";

export default function PwaServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return undefined;

    // Registration is intentionally client-only: the worker can then intercept
    // future navigations and serve /offline when the network is unavailable.
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("Não foi possível registrar o modo offline.", error);
    });
  }, []);

  return null;
}
