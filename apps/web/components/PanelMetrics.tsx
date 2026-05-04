"use client";

import { auth, db } from "@/lib/firebase";
import { getAdminDashboardSummary } from "@/lib/panel-actions";
import { dashboardMetrics, type UserRole } from "@nar/core";
import { collection, doc, getCountFromServer, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useLocale } from "./LocaleProvider";

type Metric = { label: string; value: string };

export function PanelMetrics({ role }: { role: UserRole }) {
  const { locale } = useLocale();
  const copy = {
    tr: {
      loading: "Panel verileri yükleniyor.",
      waiting: "Oturum bekleniyor.",
      live: "Canlı panel verileri kullanılıyor.",
      failed: "Panel verileri yüklenemedi.",
      points: "Puan",
      order: "Sipariş",
      qr: "QR işlem",
      activeUser: "Aktif kullanıcı",
      qrUsage: "QR kullanımı",
      notification: "Bildirim",
      activeOffer: "Aktif fırsat",
      livePlace: "Yayındaki mekan",
      theaterPlay: "Tiyatro oyunu",
      playNotification: "Oyun bildirimi",
      notificationLimit: "Bildirim hakkı"
    },
    en: {
      loading: "Loading panel data.",
      waiting: "Waiting for session.",
      live: "Live panel data is in use.",
      failed: "Panel data could not be loaded.",
      points: "Points",
      order: "Order",
      qr: "QR action",
      activeUser: "Active user",
      qrUsage: "QR usage",
      notification: "Notification",
      activeOffer: "Active offer",
      livePlace: "Live place",
      theaterPlay: "Theater play",
      playNotification: "Play notification",
      notificationLimit: "Notification quota"
    },
    ru: {
      loading: "Загрузка данных панели.",
      waiting: "Ожидание сессии.",
      live: "Используются живые данные панели.",
      failed: "Не удалось загрузить данные панели.",
      points: "Баллы",
      order: "Заказ",
      qr: "QR-действие",
      activeUser: "Активный пользователь",
      qrUsage: "Использование QR",
      notification: "Уведомление",
      activeOffer: "Активное предложение",
      livePlace: "Площадка в эфире",
      theaterPlay: "Театральная постановка",
      playNotification: "Уведомление о постановке",
      notificationLimit: "Лимит уведомлений"
    },
    de: {
      loading: "Plandaten werden geladen.",
      waiting: "Warte auf Sitzung.",
      live: "Live-Plandaten werden verwendet.",
      failed: "Plandaten konnten nicht geladen werden.",
      points: "Punkte",
      order: "Bestellung",
      qr: "QR-Aktion",
      activeUser: "Aktiver Nutzer",
      qrUsage: "QR-Nutzung",
      notification: "Benachrichtigung",
      activeOffer: "Aktives Angebot",
      livePlace: "Aktiver Ort",
      theaterPlay: "Theaterstück",
      playNotification: "Stück-Benachrichtigung",
      notificationLimit: "Benachrichtigungslimit"
    }
  } as const;
  const text = copy[locale];
  const [metrics, setMetrics] = useState<Metric[]>(dashboardMetrics[role]);
  const [status, setStatus] = useState<string>(text.loading);

  useEffect(() => {
    let active = true;

      if (role === "individual") {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          setMetrics(dashboardMetrics.individual);
          setStatus(text.waiting);
          return;
        }

      const unsubscribe = onSnapshot(doc(db, "users", uid), async (userSnapshot) => {
        const [orderCount, qrCount] = await Promise.all([
          getCountFromServer(query(collection(db, "orders"), where("userId", "==", uid))),
          getCountFromServer(query(collection(db, "qrTransactions"), where("userId", "==", uid)))
        ]);
        if (!active) return;
        setMetrics([
          { label: text.points, value: String(userSnapshot.data()?.points ?? 0) },
          { label: text.order, value: String(orderCount.data().count) },
          { label: text.qr, value: String(qrCount.data().count) }
        ]);
        setStatus(text.live);
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
            { label: text.activeUser, value: String(summary.data.activeUsers) },
            { label: text.qrUsage, value: String(summary.data.qrUsage) },
            { label: text.notification, value: String(summary.data.notificationCount) }
          ]);
          setStatus(text.live);
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
            { label: text.qr, value: String(qrCount.data().count) },
            { label: text.activeOffer, value: String(offerCount.data().count) },
            { label: text.livePlace, value: String(placeCount.data().count) }
          ]);
          setStatus(text.live);
          return;
        }

        const [eventCount, notificationCount] = await Promise.all([
          getCountFromServer(query(collection(db, "events"), where("type", "==", "theater"))),
          getCountFromServer(query(collection(db, "notifications"), where("target.kind", "==", "event")))
        ]);
        if (!active) return;
        setMetrics([
          { label: text.theaterPlay, value: String(eventCount.data().count) },
          { label: text.playNotification, value: String(notificationCount.data().count) },
          { label: text.notificationLimit, value: "3" }
        ]);
        setStatus(text.live);
      } catch (error) {
        if (!active) return;
        setMetrics(dashboardMetrics[role]);
        setStatus(error instanceof Error ? error.message : text.failed);
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
