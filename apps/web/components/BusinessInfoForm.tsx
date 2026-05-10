"use client";

import { auth, db } from "@/lib/firebase";
import { fetchPlaceSnapshot } from "@/lib/google-places";
import type { LocalizedText, Place, PublishStatus } from "@nar/core";
import { collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

type PlaceCategory = { id: string; title: LocalizedText; status?: PublishStatus; target?: "place" | "event" };
type BusinessDraft = {
  id: string;
  titleTr: string;
  descriptionTr: string;
  categoryId: string;
  district: string;
  address: string;
  phone: string;
  website: string;
  email: string;
  menuUrl: string;
  openingHours: string;
  instagram: string;
  facebook: string;
  x: string;
  coverImage: string;
  gallery: string;
  features: string;
  accessibilityWheelchair: boolean;
  accessibilityChildFriendly: boolean;
  accessibilityParking: boolean;
  accessibilityWifi: boolean;
  accessibilityVegan: boolean;
  locationLat: string;
  locationLng: string;
  googlePlaceId: string;
  googleRating: string;
  googleReviewCount: string;
  status: PublishStatus;
};

const emptyDraft = (): BusinessDraft => ({
  id: "",
  titleTr: "",
  descriptionTr: "",
  categoryId: "",
  district: "",
  address: "",
  phone: "",
  website: "",
  email: "",
  menuUrl: "",
  openingHours: "",
  instagram: "",
  facebook: "",
  x: "",
  coverImage: "",
  gallery: "",
  features: "",
  accessibilityWheelchair: false,
  accessibilityChildFriendly: false,
  accessibilityParking: false,
  accessibilityWifi: false,
  accessibilityVegan: false,
  locationLat: "",
  locationLng: "",
  googlePlaceId: "",
  googleRating: "",
  googleReviewCount: "",
  status: "draft"
});

function text(value: string): LocalizedText {
  return { tr: value, en: value, ru: value, de: value };
}

export function BusinessInfoForm() {
  const uid = auth.currentUser?.uid ?? "";
  const [places, setPlaces] = useState<Place[]>([]);
  const [categories, setCategories] = useState<PlaceCategory[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState<BusinessDraft>(emptyDraft());
  const [status, setStatus] = useState("İşletme bilgileri hazır.");
  const [loading, setLoading] = useState(false);

  const ownedPlaces = useMemo(() => places.filter((place) => place.ownerId === uid), [places, uid]);
  const categoryOptions = useMemo(() => {
    const dynamic = categories
      .filter((category) => category.target === "place" && category.status === "published")
      .map((category) => ({ id: category.id, label: category.title.tr }));
    const fallback = [
      { id: "restaurants", label: "Restoran" },
      { id: "coffee", label: "Kafe" },
      { id: "shopping", label: "Alışveriş" },
      { id: "hotel", label: "Otel" },
      { id: "nightlife", label: "Gece hayatı" },
      { id: "culture", label: "Kültür" }
    ];
    return [...dynamic, ...fallback.filter((item) => !dynamic.some((entry) => entry.id === item.id))];
  }, [categories]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [placeSnap, categorySnap] = await Promise.all([
          getDocs(collection(db, "places")),
          getDocs(collection(db, "categories"))
        ]);
        if (!active) return;
        const livePlaces = placeSnap.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as Place);
        const liveCategories = categorySnap.docs
          .map((entry) => ({ id: entry.id, ...(entry.data() as Partial<PlaceCategory>) }))
          .filter((item): item is PlaceCategory => Boolean(item.id && item.title?.tr));
        setPlaces(livePlaces);
        setCategories(liveCategories);
        setStatus(livePlaces.filter((item) => item.ownerId === uid).length ? "İşletme kayıtları yüklendi." : "Henüz size ait işletme yok.");
      } catch (error) {
        if (!active) return;
        setStatus(error instanceof Error ? error.message : "İşletme kayıtları yüklenemedi.");
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [uid]);

  useEffect(() => {
    if (!selectedId) return;
    const current = ownedPlaces.find((place) => place.id === selectedId);
    if (current) applyPlace(current);
  }, [ownedPlaces, selectedId]);

  function applyPlace(place?: Place | null) {
    if (!place) {
      setSelectedId("");
      setDraft(emptyDraft());
      return;
    }
    setSelectedId(place.id);
    setDraft({
      id: place.id,
      titleTr: place.title.tr ?? "",
      descriptionTr: place.description.tr ?? "",
      categoryId: place.categoryId ?? "",
      district: place.district ?? "",
      address: place.address ?? "",
      phone: place.phone ?? "",
      website: place.website ?? "",
      email: place.email ?? "",
      menuUrl: place.menuUrl ?? "",
      openingHours: place.openingHours?.join(" | ") ?? "",
      instagram: place.socialLinks?.instagram ?? "",
      facebook: place.socialLinks?.facebook ?? "",
      x: place.socialLinks?.x ?? "",
      coverImage: place.coverImage ?? "",
      gallery: place.gallery?.join(" | ") ?? "",
      features: place.features?.join(" | ") ?? "",
      accessibilityWheelchair: place.accessibility?.wheelchair ?? false,
      accessibilityChildFriendly: place.accessibility?.childFriendly ?? false,
      accessibilityParking: place.accessibility?.parking ?? false,
      accessibilityWifi: place.accessibility?.wifi ?? false,
      accessibilityVegan: place.accessibility?.vegan ?? false,
      locationLat: place.location?.lat ? String(place.location.lat) : "",
      locationLng: place.location?.lng ? String(place.location.lng) : "",
      googlePlaceId: place.googlePlaceId ?? "",
      googleRating: place.googleRating !== undefined ? String(place.googleRating) : "",
      googleReviewCount: place.googleReviewCount !== undefined ? String(place.googleReviewCount) : "",
      status: place.status ?? "draft"
    });
  }

  async function refresh() {
    setStatus("İşletme kayıtları yenileniyor.");
    const snapshot = await getDocs(collection(db, "places"));
    const livePlaces = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as Place);
    setPlaces(livePlaces);
    setStatus(livePlaces.filter((item) => item.ownerId === uid).length ? "İşletme kayıtları güncellendi." : "Henüz size ait işletme yok.");
  }

  async function saveCurrent() {
    if (!uid) {
      setStatus("Oturum bekleniyor.");
      return;
    }
    if (!draft.id.trim() || !draft.titleTr.trim() || !draft.descriptionTr.trim() || !draft.categoryId.trim() || !draft.address.trim()) {
      setStatus("Kimlik, başlık, açıklama, kategori ve adres gerekli.");
      return;
    }
    setLoading(true);
    setStatus("İşletme kaydediliyor.");
    try {
      let snapshot: Awaited<ReturnType<typeof fetchPlaceSnapshot>> | null = null;
      if (draft.googlePlaceId.trim()) {
        try {
          snapshot = await fetchPlaceSnapshot(draft.googlePlaceId.trim());
        } catch {
          snapshot = null;
        }
      }
      const gallery = splitList(draft.gallery);
      const features = splitList(draft.features);
      const openingHours = splitList(draft.openingHours);
      const location = draft.locationLat.trim() && draft.locationLng.trim()
        ? { lat: Number(draft.locationLat), lng: Number(draft.locationLng) }
        : undefined;
      const placeRef = doc(db, "places", draft.id.trim());
      await setDoc(placeRef, {
        id: draft.id.trim(),
        ownerId: uid,
        googlePlaceId: draft.googlePlaceId.trim() || snapshot?.googlePlaceId || null,
        title: text(draft.titleTr.trim()),
        description: text(draft.descriptionTr.trim()),
        categoryId: draft.categoryId.trim(),
        district: draft.district.trim(),
        address: snapshot?.address ?? draft.address.trim(),
        location: snapshot?.location ?? location ?? null,
        phone: snapshot?.phone ?? (draft.phone.trim() || null),
        website: snapshot?.website ?? (draft.website.trim() || null),
        email: draft.email.trim() || null,
        menuUrl: draft.menuUrl.trim() || null,
        openingHours: snapshot?.openingHours?.length ? snapshot.openingHours : openingHours,
        socialLinks: {
          instagram: draft.instagram.trim() || null,
          facebook: draft.facebook.trim() || null,
          x: draft.x.trim() || null
        },
        coverImage: draft.coverImage.trim(),
        gallery: snapshot?.photoRefs?.length ? snapshot.photoRefs : gallery,
        features,
        accessibility: {
          wheelchair: draft.accessibilityWheelchair,
          childFriendly: draft.accessibilityChildFriendly,
          parking: draft.accessibilityParking,
          wifi: draft.accessibilityWifi,
          vegan: draft.accessibilityVegan
        },
        googleRating: snapshot?.rating ?? (draft.googleRating.trim() ? Number(draft.googleRating) : null),
        googleReviewCount: snapshot?.reviewCount ?? (draft.googleReviewCount.trim() ? Number(draft.googleReviewCount) : null),
        openNow: null,
        status: draft.status,
        googleFetchedAt: snapshot?.fetchedAt ?? null,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setStatus("İşletme kaydedildi.");
      await refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "İşletme kaydedilemedi.");
    } finally {
      setLoading(false);
    }
  }

  async function removeCurrent() {
    if (!draft.id.trim()) {
      setStatus("Silmek için işletme seç.");
      return;
    }
    setLoading(true);
    setStatus("İşletme siliniyor.");
    try {
      await deleteDoc(doc(db, "places", draft.id.trim()));
      setStatus("İşletme silindi.");
      applyPlace(null);
      await refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "İşletme silinemedi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="workflow" id="places">
      <h2>İşletme Bilgileri</h2>
      <p className="meta">Sahip olduğun mekanları burada oluşturur, düzenler ve Google bilgilerini eşitlersin.</p>

      <div className="catalog-rows" style={{ alignItems: "start" }}>
        <div className="catalog-list" style={{ minWidth: 320 }}>
          <button className="secondary" type="button" onClick={() => applyPlace(null)}>Yeni işletme</button>
          <button className="secondary" type="button" onClick={() => void refresh()}>Yenile</button>
          {ownedPlaces.length === 0 ? (
            <article className="catalog-empty">
              <strong>Size ait işletme yok</strong>
              <span>Yeni işletme ekleyerek başlayabilirsin.</span>
            </article>
          ) : ownedPlaces.map((place) => (
            <button key={place.id} className={`catalog-item ${selectedId === place.id ? "active" : ""}`} type="button" onClick={() => applyPlace(place)}>
              <strong>{place.title.tr}</strong>
              <span>{place.district} · {place.categoryId}</span>
              <small>{place.status}</small>
            </button>
          ))}
        </div>

        <div className="catalog-editor">
          <div className="mini-form" style={{ maxWidth: "none" }}>
            <label>İşletme kimliği<input value={draft.id} onChange={(event) => setDraft((current) => ({ ...current, id: event.target.value }))} placeholder="liman-kahve" /></label>
            <label>Kategori<select value={draft.categoryId} onChange={(event) => setDraft((current) => ({ ...current, categoryId: event.target.value }))}>{categoryOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
            <label>Türkçe başlık<input value={draft.titleTr} onChange={(event) => setDraft((current) => ({ ...current, titleTr: event.target.value }))} /></label>
            <label>Türkçe açıklama<textarea rows={3} value={draft.descriptionTr} onChange={(event) => setDraft((current) => ({ ...current, descriptionTr: event.target.value }))} /></label>
            <label>İlçe<input value={draft.district} onChange={(event) => setDraft((current) => ({ ...current, district: event.target.value }))} /></label>
            <label>Adres<input value={draft.address} onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))} /></label>
            <label>Telefon<input value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} /></label>
            <label>Web sitesi<input value={draft.website} onChange={(event) => setDraft((current) => ({ ...current, website: event.target.value }))} /></label>
            <label>E-posta<input value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} /></label>
            <label>Menü bağlantısı<input value={draft.menuUrl} onChange={(event) => setDraft((current) => ({ ...current, menuUrl: event.target.value }))} /></label>
            <label>Çalışma saatleri<textarea rows={2} value={draft.openingHours} onChange={(event) => setDraft((current) => ({ ...current, openingHours: event.target.value }))} placeholder="Pazartesi-Cuma 10:00-22:00 | Cumartesi-Pazar 10:00-23:30" /></label>
            <label>Instagram<input value={draft.instagram} onChange={(event) => setDraft((current) => ({ ...current, instagram: event.target.value }))} /></label>
            <label>Facebook<input value={draft.facebook} onChange={(event) => setDraft((current) => ({ ...current, facebook: event.target.value }))} /></label>
            <label>X / Twitter<input value={draft.x} onChange={(event) => setDraft((current) => ({ ...current, x: event.target.value }))} /></label>
            <label>Kapak görseli<input value={draft.coverImage} onChange={(event) => setDraft((current) => ({ ...current, coverImage: event.target.value }))} /></label>
            <label>Galeri görselleri<textarea rows={2} value={draft.gallery} onChange={(event) => setDraft((current) => ({ ...current, gallery: event.target.value }))} placeholder="url1 | url2 | url3" /></label>
            <label>Özellikler<textarea rows={2} value={draft.features} onChange={(event) => setDraft((current) => ({ ...current, features: event.target.value }))} placeholder="Wi-Fi | Otopark | Vegan" /></label>
            <label>Konum enlem<input value={draft.locationLat} onChange={(event) => setDraft((current) => ({ ...current, locationLat: event.target.value }))} /></label>
            <label>Konum boylam<input value={draft.locationLng} onChange={(event) => setDraft((current) => ({ ...current, locationLng: event.target.value }))} /></label>
            <label>Google Place ID<input value={draft.googlePlaceId} onChange={(event) => setDraft((current) => ({ ...current, googlePlaceId: event.target.value }))} /></label>
            <label>Google puanı<input type="number" step="0.1" value={draft.googleRating} onChange={(event) => setDraft((current) => ({ ...current, googleRating: event.target.value }))} /></label>
            <label>Google yorum sayısı<input type="number" value={draft.googleReviewCount} onChange={(event) => setDraft((current) => ({ ...current, googleReviewCount: event.target.value }))} /></label>
            <label>Durum<select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as PublishStatus }))}><option value="draft">Taslak</option><option value="pending">Onay bekliyor</option><option value="published">Yayında</option><option value="archived">Arşiv</option></select></label>
          </div>

          <div className="hero-actions" style={{ marginTop: 20 }}>
            <button className="secondary" type="button" onClick={() => void saveCurrent()} disabled={loading}>Kaydet</button>
            <button className="secondary" type="button" onClick={() => void removeCurrent()} disabled={loading || !draft.id.trim()}>Sil</button>
          </div>

          <p className="meta">Google bilgisi varsa kayıt sırasında otomatik çekilir.</p>
          <p className="meta" aria-live="polite">{status}</p>
        </div>
      </div>
    </section>
  );
}

function splitList(value: string) {
  return value.split(/[|,\n]/).map((item) => item.trim()).filter(Boolean);
}
