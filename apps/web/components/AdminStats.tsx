"use client";

import { getAdminDashboardSummary } from "@/lib/panel-actions";
import { adminStats } from "@nar/core";
import { Activity, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";

export function AdminStats() {
  const fallbackStats = adminStats.map((stat) => stat);
  const [liveStats, setLiveStats] = useState(fallbackStats);
  const [status, setStatus] = useState("Canlı sayaçlar yükleniyor.");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const result = await getAdminDashboardSummary();
        if (!active) return;
        const summary = result.data;
        setLiveStats([
          { id: "active-users", label: "Aktif kullanıcı", value: String(summary.activeUsers), trend: "Canlı veri", tone: "nar" },
          { id: "published-places", label: "Yayındaki mekan", value: String(summary.publishedPlaces), trend: `${summary.publishedOffers} fırsat`, tone: "sea" },
          { id: "qr-usage", label: "QR kullanımı", value: String(summary.qrUsage), trend: `${summary.orderCount} sipariş`, tone: "sage" },
          { id: "notification-open", label: "Bildirim", value: String(summary.notificationCount), trend: `Dil: ${Object.keys(summary.languageUse).join(", ") || "tr"}`, tone: "plum" }
        ]);
        setStatus("Canlı panel sayaçları kullanılıyor.");
      } catch (error) {
        if (!active) return;
        setLiveStats(fallbackStats);
        setStatus(error instanceof Error ? error.message : "Sayaçlar yüklenemedi.");
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="admin-stats">
      <div className="stats-head">
        <BarChart3 size={22} />
        <div>
          <h2>İstatistikler</h2>
          <p>Aktif kullanıcı, mekan, fırsat, QR ve bildirim hareketleri tek yerde izlenir.</p>
          <span className="meta" aria-live="polite">{status}</span>
        </div>
      </div>
      <div className="stats-grid">
        {liveStats.map((stat) => (
          <article className={`stat-card tone-${stat.tone}`} key={stat.id}>
            <Activity size={18} />
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>{stat.trend}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
