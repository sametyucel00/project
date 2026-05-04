"use client";

import { db } from "@/lib/firebase";
import {
  defaultPushPreferences,
  notificationAudiencePreviews,
  type NotificationDelivery,
  type NotificationDraft
} from "@nar/core";
import { collection, collectionGroup, getDocs, limit, orderBy, query } from "firebase/firestore";
import { BellRing, Clock, MousePointerClick, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export function NotificationStats() {
  const [notifications, setNotifications] = useState<NotificationDraft[]>([]);
  const [deliveries, setDeliveries] = useState<NotificationDelivery[]>([]);
  const [status, setStatus] = useState("Canlı bildirim geçmişi yükleniyor.");

  useEffect(() => {
    let active = true;

    async function loadNotifications() {
      try {
        const [notificationSnapshot, deliverySnapshot] = await Promise.all([
          getDocs(query(collection(db, "notifications"), orderBy("sentAt", "desc"), limit(16))),
          getDocs(query(collectionGroup(db, "deliveries"), orderBy("createdAt", "desc"), limit(24)))
        ]);
        if (!active) return;

        const liveNotifications = notificationSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as NotificationDraft);
        const liveDeliveries = deliverySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as NotificationDelivery);
        setNotifications(liveNotifications);
        setDeliveries(liveDeliveries);
        setStatus(liveNotifications.length || liveDeliveries.length ? "Canlı bildirim kayıtları kullanılıyor." : "Henüz bildirim kaydı yok.");
      } catch (error) {
        if (!active) return;
        setNotifications([]);
        setDeliveries([]);
        setStatus(error instanceof Error ? error.message : "Bildirim kayıtları yüklenemedi.");
      }
    }

    void loadNotifications();

    return () => {
      active = false;
    };
  }, []);

  const livePerformance = useMemo(() => {
    const sentCount = notifications.filter((item) => item.status === "sent").length;
    const scheduledCount = notifications.filter((item) => item.status === "scheduled").length;
    const openedCount = deliveries.filter((item) => item.status === "opened").length;
    const failedCount = deliveries.filter((item) => item.status === "failed").length;
    if (sentCount + scheduledCount + deliveries.length === 0) {
      return [
        { id: "sent", label: "Gönderilen", value: "0", detail: "Henüz gönderim yok" },
        { id: "opened", label: "Açılan", value: "0", detail: "Henüz açılma yok" },
        { id: "scheduled", label: "Zamanlanmış", value: "0", detail: "Planlanan bildirim yok" },
        { id: "failed", label: "Başarısız", value: "0", detail: "Başarısız gönderim yok" }
      ];
    }
    return [
      { id: "sent", label: "Gönderilen", value: String(sentCount), detail: "Gönderilen bildirim" },
      { id: "opened", label: "Açılan", value: String(openedCount), detail: "Açılan bildirim" },
      { id: "scheduled", label: "Zamanlanmış", value: String(scheduledCount), detail: "Sıradaki gönderimler" },
      { id: "failed", label: "Başarısız", value: String(failedCount), detail: "Başarısız gönderim" }
    ];
  }, [deliveries, notifications]);

  const scheduledNotifications = notifications.filter((notification) => notification.status === "scheduled");
  const sentNotifications = notifications.filter((notification) => notification.status !== "scheduled");

  return (
    <section className="notification-stats">
      <div className="stats-head">
        <BellRing size={22} />
        <div>
          <h2>Bildirim Performansı</h2>
          <p>Gönderimler, hedef kitle önizlemesi, açılma oranları ve kullanıcı tercihleri bu alanda izlenir.</p>
          <span className="meta" aria-live="polite">{status}</span>
        </div>
      </div>
      <div className="notification-metrics">
        {livePerformance.map((metric) => (
          <article key={metric.id}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.detail}</small>
          </article>
        ))}
      </div>
      <div className="scheduled-list" aria-label="Hedef kitle önizleme">
        {notificationAudiencePreviews.map((preview) => (
          <article key={`${preview.target.kind}-${preview.detail}`}>
            <UsersRound size={18} />
            <div>
              <strong>{preview.detail}</strong>
              <span>{preview.estimatedUsers} kullanıcı · {preview.estimatedTokens} bildirim cihazı</span>
            </div>
          </article>
        ))}
      </div>
      <div className="scheduled-list" aria-label="Zamanlanmış bildirimler">
        {scheduledNotifications.length === 0 ? (
          <article>
            <Clock size={18} />
            <div>
              <strong>Henüz zamanlanmış bildirim yok</strong>
              <span>Yeni zamanlama burada görünür.</span>
            </div>
          </article>
        ) : scheduledNotifications.map((notification) => (
          <article key={notification.id}>
            <Clock size={18} />
            <div>
              <strong>{notification.title.tr}</strong>
              <span>{notification.target.kind} · {formatNotificationDate(notification.scheduledAt)}</span>
            </div>
          </article>
        ))}
      </div>
      <div className="scheduled-list" aria-label="Bildirim geçmişi">
        {sentNotifications.length === 0 ? (
          <article>
            <MousePointerClick size={18} />
            <div>
              <strong>Henüz gönderim yok</strong>
              <span>Gönderilen bildirimler burada görünür.</span>
            </div>
          </article>
        ) : sentNotifications.map((notification) => (
          <article key={notification.id}>
            <MousePointerClick size={18} />
            <div>
              <strong>{notification.title.tr}</strong>
              <span>{formatNotificationStatus(notification.status)} · {formatNotificationDate(notification.sentAt)}</span>
            </div>
          </article>
        ))}
      </div>
      <div className="scheduled-list" aria-label="Teslim geçmişi">
        {deliveries.length === 0 ? (
          <article>
            <BellRing size={18} />
            <div>
              <strong>Henüz teslim kaydı yok</strong>
              <span>Bildirim ulaştığında burada görünür.</span>
            </div>
          </article>
        ) : deliveries.map((delivery) => (
          <article key={delivery.id}>
            <BellRing size={18} />
            <div>
              <strong>{formatDeliveryStatus(delivery.status)}</strong>
              <span>{delivery.notificationId} · {delivery.errorMessage ?? formatNotificationDate(delivery.openedAt ?? delivery.sentAt)}</span>
            </div>
          </article>
        ))}
      </div>
      <div className="role-flow" aria-label="Push tercihleri">
        {Object.entries(defaultPushPreferences).map(([key, value]) => (
          <span key={key}>{formatPreferenceKey(key)}: {value ? "Açık" : "Kapalı"}</span>
        ))}
      </div>
    </section>
  );
}

function formatNotificationDate(value?: unknown) {
  if (!value) return "Belirtilmemiş";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(value.toDate());
  }
  return "Belirtilmemiş";
}

function formatNotificationStatus(status?: string) {
  if (status === "sent") return "Gönderildi";
  if (status === "scheduled") return "Zamanlandı";
  if (status === "draft") return "Taslak";
  if (status === "failed") return "Başarısız";
  return "Durum belirtilmemiş";
}

function formatDeliveryStatus(status?: string) {
  if (status === "sent") return "Ulaştı";
  if (status === "opened") return "Açıldı";
  if (status === "failed") return "Başarısız";
  return "Durum belirtilmemiş";
}

function formatPreferenceKey(key: string) {
  const labels: Record<string, string> = {
    offers: "Fırsatlar",
    events: "Etkinlikler",
    qr: "QR ve puan",
    reminders: "Hatırlatmalar",
    theater: "Tiyatro"
  };
  return labels[key] ?? key;
}
