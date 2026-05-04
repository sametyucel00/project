"use client";

import { db } from "@/lib/firebase";
import { seoManagedRoutes, seoMeta, webManifest, type SeoMeta } from "@nar/core";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { Globe2, SearchCheck } from "lucide-react";
import { useEffect, useState } from "react";

export function SeoOps() {
  const [managedMeta, setManagedMeta] = useState(seoMeta);
  const [status, setStatus] = useState("Canlı SEO meta kayıtları yükleniyor.");

  useEffect(() => {
    let active = true;

    async function loadSeoMeta() {
      try {
        const snapshot = await getDocs(query(
          collection(db, "seoMeta"),
          where("slug", "in", seoManagedRoutes.slice(0, 10)),
          limit(20)
        ));
        if (!active) return;
        const liveMeta = snapshot.docs.map((doc) => ({ ...doc.data(), slug: doc.data().slug ?? doc.id }) as SeoMeta);
        setManagedMeta(liveMeta.length ? mergeMeta(liveMeta) : seoMeta);
        setStatus(liveMeta.length ? "Canlı SEO kayıtları kullanılıyor." : "SEO kayıtları için varsayılan sayfa bilgileri kullanılıyor.");
      } catch (error) {
        if (!active) return;
        setManagedMeta(seoMeta);
        setStatus(error instanceof Error ? error.message : "SEO kayıtları yüklenemedi.");
      }
    }

    void loadSeoMeta();

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="seo-ops">
      <div className="stats-head">
        <SearchCheck size={22} />
        <div>
          <h2>SEO Meta Yönetimi</h2>
          <p>Sayfa başlıkları, açıklamalar, paylaşım görselleri ve arama görünümü burada izlenir.</p>
          <span className="meta" aria-live="polite">{status}</span>
        </div>
      </div>
      <div className="seo-grid">
        {seoManagedRoutes.map((route) => {
          const meta = managedMeta.find((item) => item.slug === route);
          return (
            <article key={route}>
              <strong>{route}</strong>
              <span>{formatSeoTitle(route, meta?.title)}</span>
              <small>{meta?.noIndex ? "Aramaya kapalı" : "Aramaya açık"} · Paylaşım ve arama ayarları</small>
            </article>
          );
        })}
      </div>
      <div className="manifest-strip">
        <Globe2 size={18} />
        <span>{webManifest.name} · {webManifest.shortcuts.length} kısa yol · Uygulama görünümü hazır</span>
      </div>
    </section>
  );
}

function mergeMeta(liveMeta: SeoMeta[]) {
  const bySlug = new Map(seoMeta.map((meta) => [meta.slug, meta]));
  for (const meta of liveMeta) bySlug.set(meta.slug, meta);
  return seoManagedRoutes.map((route) => bySlug.get(route)).filter(Boolean) as SeoMeta[];
}

function formatSeoTitle(route: string, title?: string) {
  if (!title) return "Sayfa bilgisi bekliyor";
  if (route === "/tourist-survival-kit") return title.replace("Tourist Survival Kit", "Turist Destek Rehberi");
  return title;
}
