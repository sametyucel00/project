"use client";

import { auth, db } from "@/lib/firebase";
import { getAdminDashboardSummary } from "@/lib/panel-actions";
import { dashboardMetrics, type UserRole } from "@nar/core";
import { collection, doc, getCountFromServer, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

type Metric = { label: string; value: string };

export function PanelMetrics({ role }: { role: UserRole }) {
  const [metrics, setMetrics] = useState<Metric[]>(dashboardMetrics[role]);
  const [status, setStatus] = useState("Panel verileri yükleniyor.");

  useEffect(() => {
    let active = true;

    if (role === "individual") {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        setMetrics(dashboardMetrics.individual);
        setStatus("Oturum bekleniyor.");
        return;
      }

      const unsubscribe = onSnapshot(doc(db, "users", uid), async (userSnapshot) => {
        const [orderCount, qrCount] = await Promise.all([
          getCountFromServer(query(collection(db, "orders"), where("userId", "==", uid))),
          getCountFromServer(query(collection(db, "qrTransactions"), where("userId", "==", uid)))
        ]);
        if (!active) return;
        setMetrics([
          { label: "Puan", value: String(userSnapshot.data()?.points ?? 0) },
          { label: "Sipariş", value: String(orderCount.data().count) },
          { label: "QR işlem", value: String(qrCount.data().count) }
        ]);
        setStatus("Canlı panel verileri kullanılıyor.");
      }, (error) => {
        setStatus(error.message);
      });

      return () => {
        active = false;
        unsubscribe();
      };
    }

    async function loadMetrics() {
      try {
        if (role === "admin") {
          const summary = await getAdminDashboardSummary();
          if (!active) return;
          setMetrics([
            { label: "Aktif kullanıcı", value: String(summary.data.activeUsers) },
            { label: "QR kullanımı", value: String(summary.data.qrUsage) },
            { label: "Bildirim", value: String(summary.data.notificationCount) }
          ]);
          setStatus("Canlı panel verileri kullanılıyor.");
          return;
        }

        if (role === "business") {
          const [qrCount, offerCount, placeCount] = await Promise.all([
            getCountFromServer(collection(db, "qrTransactions")),
            getCountFromServer(query(collection(db, "offers"), where("status", "==", "published"))),
            getCountFromServer(query(collection(db, "places"), where("status", "==", "published")))
          ]);
          if (!active) return;
          setMetrics([
            { label: "QR işlem", value: String(qrCount.data().count) },
            { label: "Aktif fırsat", value: String(offerCount.data().count) },
            { label: "Yayındaki mekan", value: String(placeCount.data().count) }
          ]);
          setStatus("Canlı panel verileri kullanılıyor.");
          return;
        }

        const [eventCount, notificationCount] = await Promise.all([
          getCountFromServer(query(collection(db, "events"), where("type", "==", "theater"))),
          getCountFromServer(query(collection(db, "notifications"), where("target.kind", "==", "event")))
        ]);
        if (!active) return;
        setMetrics([
          { label: "Tiyatro oyunu", value: String(eventCount.data().count) },
          { label: "Oyun bildirimi", value: String(notificationCount.data().count) },
          { label: "Bildirim hakkı", value: "3" }
        ]);
        setStatus("Canlı panel verileri kullanılıyor.");
      } catch (error) {
        if (!active) return;
        setMetrics(dashboardMetrics[role]);
        setStatus(error instanceof Error ? error.message : "Panel verileri yüklenemedi.");
      }
    }

    void loadMetrics();
    return () => {
      active = false;
    };
  }, [role]);

  return (
    <>
      <div className="metric-strip">
        {metrics.map((metric) => (
          <div className="metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>
      <p className="meta" aria-live="polite">{status}</p>
    </>
  );
}
