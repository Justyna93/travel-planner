"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js so the app can load without a network connection.
 *
 * Only runs in production builds: in `next dev` the asset hashes and HMR
 * socket change constantly, and a caching service worker just serves stale
 * code. Test offline behaviour with `next build && next start`.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

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
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
