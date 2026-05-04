"use client";

import { logClientError } from "@/lib/error-log";
import { useEffect } from "react";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    void logClientError(error.message, { digest: error.digest ?? null, surface: "app-error-boundary" });
  }, [error]);

  return (
    <main className="shell" id="main-content">
      <section className="section system-state" aria-labelledby="error-title" role="alert">
        <p className="eyebrow">Bir şey ters gitti</p>
        <h1 id="error-title">Sayfayı şu anda açamadık.</h1>
        <p className="lead">Tekrar deneyebilir veya ana sayfaya dönebilirsin.</p>
        <div className="hero-actions" aria-label="Hata aksiyonları">
          <button className="primary" onClick={reset}>Tekrar dene</button>
          <a className="secondary" href="/">Ana sayfa</a>
        </div>
      </section>
    </main>
  );
}
