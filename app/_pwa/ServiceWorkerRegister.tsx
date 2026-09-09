"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js so the app can load without a network connection.
 *
 * Only runs in production builds: in `next dev` the asset hashes and HMR
 * socket change constantly, and a caching service worker just serves stale
 * code. Test offline behaviour with `next build && next start`.
 *
 * When a new worker version activates (e.g. a CACHE_VERSION bump), reload once
 * so the page is driven by the new worker and its fresh caches.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    // Only reload on an *update*: if there's already a controller now, a later
    // controllerchange means a new worker version took over. On the very first
    // visit there's no controller and the initial claim must not trigger a reload.
    let reloading = false;
    const hadController = Boolean(navigator.serviceWorker.controller);
    const onControllerChange = () => {
      if (reloading || !hadController) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch((err) => {
          console.error("Service worker registration failed:", err);
        });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
      window.removeEventListener("load", register);
    };
  }, []);

  return null;
}
