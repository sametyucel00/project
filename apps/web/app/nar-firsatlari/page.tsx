"use client";

import { useEffect } from "react";

export default function NarOffersRedirectPage() {
  useEffect(() => {
    window.location.replace("/firsatlar/");
  }, []);

  return (
    <main className="system-state">
      <p className="eyebrow">Yönlendiriliyor</p>
      <h1>Nar Fırsatları açılıyor</h1>
      <a className="nav-action" href="/firsatlar/">Fırsatlara git</a>
    </main>
  );
}
