"use client";

import { useEffect } from "react";

/** Free first-party error hook — posts to /api/client-errors (no third-party SaaS). */
export function ErrorMonitor() {
  useEffect(() => {
    function send(message: string, stack?: string) {
      void fetch("/api/client-errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, stack: stack || "", url: window.location.href }),
        keepalive: true,
      }).catch(() => undefined);
    }
    function onError(ev: ErrorEvent) {
      send(ev.message || "window.onerror", ev.error?.stack);
    }
    function onRejection(ev: PromiseRejectionEvent) {
      const reason = ev.reason;
      const message = reason instanceof Error ? reason.message : String(reason || "unhandledrejection");
      const stack = reason instanceof Error ? reason.stack : undefined;
      send(message, stack);
    }
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
