"use client";

import { updatePushPreferences, useQrTransaction } from "@/lib/panel-actions";
import { auth, db } from "@/lib/firebase";
import { badges, deepLinks, defaultPushPreferences, featuredEvents, featuredOffers, featuredPlaces } from "@nar/core";
import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { Bell, Heart, Link2, Medal, QrCode } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const togglePreferenceLabels = {
  offers: "Fırsatlar",
  events: "Etkinlikler",
  theater: "Tiyatro",
  reminders: "Hatırlatıcılar"
};

type PanelQrTransaction = { id: string; type?: string; pointsDelta?: number; balanceAfter?: number; placeId?: string; createdAt?: unknown };
type PanelOrder = { id: string; entityTitle?: string; type?: string; status?: string; amountLabel?: string; createdAt?: unknown };

export function IndividualOps() {
  const samplePlace = featuredPlaces[0];
  const [userId, setUserId] = useState("");
  const [preferences, setPreferences] = useState(defaultPushPreferences);
  const [status, setStatus] = useState("Bireysel panel hazır.");
  const [transactions, setTransactions] = useState<PanelQrTransaction[]>([]);
  const [orders, setOrders] = useState<PanelOrder[]>([]);
  const [favoritePlaceIds, setFavoritePlaceIds] = useState<string[]>([]);
  const [favoriteEventIds, setFavoriteEventIds] = useState<string[]>([]);
  const [favoriteOfferIds, setFavoriteOfferIds] = useState<string[]>([]);

  useEffect(() => {
    const uid = auth.currentUser?.uid ?? "";
    setUserId(uid);
    if (!uid) return;

    let active = true;
    async function loadData() {
      try {
        const [txSnap, orderSnap, favoriteSnap] = await Promise.all([
          getDocs(query(collection(db, "qrTransactions"), where("userId", "==", uid), limit(8))),
          getDocs(query(collection(db, "orders"), where("userId", "==", uid), limit(8))),
          getDocs(query(collection(db, "favorites"), where("userId", "==", uid), limit(80))).catch(() => null)
        ]);
        const profileSnap = await getDoc(doc(db, "users", uid));
        if (!active) return;
        const profile = profileSnap.data();
        const favoriteDocs = favoriteSnap?.docs.map((entry) => entry.data()) ?? [];
        setTransactions(sortByCreatedAtDesc(txSnap.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as PanelQrTransaction)));
        setOrders(sortByCreatedAtDesc(orderSnap.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as PanelOrder)));
        setFavoritePlaceIds(uniqueStrings([
          ...toStringArray(profile?.favoritePlaceIds),
          ...favoriteDocs.filter((item) => item.entityType === "place").map((item) => String(item.entityId ?? item.placeId ?? ""))
        ]));
        setFavoriteEventIds(uniqueStrings([
          ...toStringArray(profile?.favoriteEventIds),
          ...favoriteDocs.filter((item) => item.entityType === "event").map((item) => String(item.entityId ?? item.eventId ?? ""))
        ]));
        setFavoriteOfferIds(uniqueStrings([
          ...toStringArray(profile?.favoriteOfferIds),
          ...favoriteDocs.filter((item) => item.entityType === "offer").map((item) => String(item.entityId ?? item.offerId ?? ""))
        ]));
      } catch {
        if (!active) return;
        setTransactions([]);
        setOrders([]);
      }
    }
    void loadData();
    return () => {
      active = false;
    };
  }, []);

  const knownBadges = useMemo(() => badges.slice(0, 6), []);
  const favoritePlaces = useMemo(() => featuredPlaces.filter((place) => favoritePlaceIds.includes(place.id)), [favoritePlaceIds]);
  const favoriteEvents = useMemo(() => featuredEvents.filter((event) => favoriteEventIds.includes(event.id)), [favoriteEventIds]);
  const favoriteOffers = useMemo(() => featuredOffers.filter((offer) => favoriteOfferIds.includes(offer.id)), [favoriteOfferIds]);

  async function tryQrPoints() {
    if (!userId.trim()) {
      setStatus("Önce giriş yapmalısın.");
      return;
    }
    setStatus("QR puan işlemi kaydediliyor.");
    try {
      const result = await useQrTransaction({
        userId,
        placeId: samplePlace.id,
        pointsDelta: 25,
        scanId: `web-individual-${userId}-${Date.now()}`,
        note: "Web bireysel panel QR işlemi"
      });
      setStatus(`QR puan işlemi kaydedildi. Bakiye: ${result.data.balanceAfter}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "QR puan işlemi kaydedilemedi.");
    }
  }

  async function savePreferences() {
    setStatus("Bildirim tercihleri kaydediliyor.");
    try {
      await updatePushPreferences({ preferences });
      setStatus("Bildirim tercihleri kaydedildi.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Bildirim tercihleri kaydedilemedi.");
    }
  }

  return (
    <section className="admin-ops" aria-label="Bireysel operasyon merkezi">
      <div className="ops-block" id="points">
        <QrCode size={22} />
        <h2>Puan ve QR</h2>
        <p>QR işlemleri ve puan hareketleri hesabına anlık yansır.</p>
        <div className="mini-form">
          <label>
            Kullanıcı kimliği
            <input value={userId} onChange={(event) => setUserId(event.target.value)} />
          </label>
          <button className="secondary" onClick={tryQrPoints}>QR puan işle</button>
          <p className="meta" aria-live="polite">{status}</p>
        </div>
        <div className="orders-list" aria-label="QR işlem geçmişi">
          {transactions.length ? transactions.map((transaction) => (
            <article key={transaction.id}>
              <div>
                <strong>{transaction.placeId ?? "Mekan belirtilmemiş"}</strong>
                <span>{transaction.type ?? "işlem"} · {transaction.pointsDelta ?? 0} puan · bakiye {transaction.balanceAfter ?? "?"}</span>
              </div>
            </article>
          )) : <p className="meta">Henüz QR işlem kaydı yok.</p>}
        </div>
      </div>

      <div className="ops-block" id="badges">
        <Medal size={22} />
        <h2>Rozetler ve Siparişler</h2>
        <p>Kazanılabilecek rozetler ve hesap sipariş geçmişi.</p>
        <div className="orders-list" aria-label="Rozet ve sipariş listesi">
          {knownBadges.map((badge) => (
            <article key={badge.id}>
              <div>
                <strong>{badge.title.tr}</strong>
                <span>{badge.level} · {badge.description.tr}</span>
              </div>
            </article>
          ))}
          {orders.length ? orders.map((order) => (
            <article key={order.id}>
              <div>
                <strong>{order.entityTitle ?? "Kayıt"}</strong>
                <span>{order.type ?? "sipariş"} · {order.status ?? "durum yok"} · {order.amountLabel ?? "tutar yok"}</span>
              </div>
            </article>
          )) : <p className="meta">Henüz sipariş kaydı yok.</p>}
        </div>
      </div>

      <div className="ops-block" id="notifications">
        <Bell size={22} />
        <h2>Bildirim Tercihleri</h2>
        <p>Bildirim türlerini buradan açıp kapatabilirsin.</p>
        <div className="role-flow" aria-label="Push tercihleri">
          {(Object.keys(togglePreferenceLabels) as Array<keyof typeof togglePreferenceLabels>).map((key) => (
            <label key={key}>
              <input
                checked={Boolean(preferences[key])}
                type="checkbox"
                onChange={(event) => setPreferences((current) => ({ ...current, [key]: event.target.checked }))}
              />
              {togglePreferenceLabels[key]}
            </label>
          ))}
        </div>
        <button className="secondary" onClick={savePreferences}>Tercihleri kaydet</button>
      </div>

      <div className="ops-block" id="favorites">
        <Heart size={22} />
        <h2>Favoriler</h2>
        <p>Kaydettiğin mekan, etkinlik ve fırsatlar burada görünür.</p>
        <div className="orders-list" aria-label="Favori kayıtları">
          {favoritePlaces.map((place) => (
            <article key={place.id}>
              <div>
                <strong>{place.title.tr}</strong>
                <span>Mekan · {place.district}</span>
              </div>
            </article>
          ))}
          {favoriteEvents.map((event) => (
            <article key={event.id}>
              <div>
                <strong>{event.title.tr}</strong>
                <span>Etkinlik · {event.venueName}</span>
              </div>
            </article>
          ))}
          {favoriteOffers.map((offer) => (
            <article key={offer.id}>
              <div>
                <strong>{offer.title.tr}</strong>
                <span>Fırsat · {offer.discountLabel}</span>
              </div>
            </article>
          ))}
          {!favoritePlaces.length && !favoriteEvents.length && !favoriteOffers.length ? <p className="meta">Henüz favori kaydı yok.</p> : null}
        </div>
      </div>

      <div className="ops-block">
        <Link2 size={22} />
        <h2>Hızlı Bağlantılar</h2>
        <p>Profil, QR ve mekan ekranlarına doğrudan yönlendirme bağlantıları.</p>
        <div className="import-table">
          <article><strong>Profil</strong><span>{deepLinks.profile()}</span></article>
          <article><strong>QR</strong><span>{deepLinks.qr()}</span></article>
          <article><strong>Mekan</strong><span>{deepLinks.place(samplePlace.id)}</span></article>
        </div>
      </div>
    </section>
  );
}

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function sortByCreatedAtDesc<T extends { createdAt?: unknown }>(items: T[]) {
  return [...items].sort((first, second) => getDateMillis(second.createdAt) - getDateMillis(first.createdAt));
}

function getDateMillis(value?: unknown) {
  if (!value) return 0;
  if (typeof value === "string") {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === "object" && value && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().getTime();
  }
  return 0;
}
