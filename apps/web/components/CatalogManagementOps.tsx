"use client";

import { db } from "@/lib/firebase";
import { localizeText, type EventItem, type EventType, type LocalizedText, type Offer, type Place, type PublishStatus, eventTypes, placeCategoryOptions } from "@nar/core";
import { collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { Layers3, PencilLine, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "./LocaleProvider";
import { seedCollections } from "../../../packages/core/src/seed";

type CatalogKind = "place" | "event" | "offer";

type TextDraft = { tr: string; en: string; ru: string; de: string };
type PlaceDraft = {
  id: string;
  title: TextDraft;
  description: TextDraft;
  categoryId: string;
  district: string;
  address: string;
  coverImage: string;
  status: PublishStatus;
  ownerId: string;
};
type EventDraft = {
  id: string;
  categoryId: string;
  title: TextDraft;
  description: TextDraft;
  synopsis: TextDraft;
  type: EventType;
  district: string;
  venueName: string;
  startsAt: string;
  endsAt: string;
  priceType: "free" | "paid";
  ticketUrl: string;
  cast: string;
  coverImage: string;
  videoUrl: string;
  status: PublishStatus;
};
type OfferDraft = {
  id: string;
  businessId: string;
  placeId: string;
  title: TextDraft;
  description: TextDraft;
  conditions: TextDraft;
  discountLabel: string;
  startsAt: string;
  endsAt: string;
  requiresQr: boolean;
  pointCost: number;
  storyEnabled: boolean;
  storyPriority: number;
  storyImage: string;
  useLimit: number;
  featured: boolean;
  status: PublishStatus;
};

const blankText = (value = ""): TextDraft => ({ tr: value, en: value, ru: value, de: value });

const createPlaceDraft = (): PlaceDraft => ({
  id: "",
  title: blankText(),
  description: blankText(),
  categoryId: "",
  district: "",
  address: "",
  coverImage: "",
  status: "draft",
  ownerId: ""
});

const createEventDraft = (): EventDraft => ({
  id: "",
  categoryId: "",
  title: blankText(),
  description: blankText(),
  synopsis: blankText(),
  type: "theater",
  district: "",
  venueName: "",
  startsAt: new Date().toISOString(),
  endsAt: "",
  priceType: "paid",
  ticketUrl: "",
  cast: "",
  coverImage: "",
  videoUrl: "",
  status: "draft"
});

const createOfferDraft = (): OfferDraft => ({
  id: "",
  businessId: "",
  placeId: "",
  title: blankText(),
  description: blankText(),
  conditions: blankText(),
  discountLabel: "%25",
  startsAt: new Date().toISOString(),
  endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  requiresQr: true,
  pointCost: 0,
  storyEnabled: true,
  storyPriority: 1,
  storyImage: "",
  useLimit: 250,
  featured: true,
  status: "draft"
});

export function CatalogManagementOps() {
  const { locale } = useLocale();
  const [kind, setKind] = useState<CatalogKind>("place");
  const [places, setPlaces] = useState<Place[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; target: "place" | "event"; title: LocalizedText; status: PublishStatus; sortOrder?: number }>>([]);
  const [hiddenIds, setHiddenIds] = useState<Record<CatalogKind, string[]>>({ place: [], event: [], offer: [] });
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [placeDraft, setPlaceDraft] = useState<PlaceDraft>(createPlaceDraft());
  const [eventDraft, setEventDraft] = useState<EventDraft>(createEventDraft());
  const [offerDraft, setOfferDraft] = useState<OfferDraft>(createOfferDraft());
  const [status, setStatus] = useState("İçerik yönetimi hazır.");

  useEffect(() => {
    let active = true;
    async function loadCatalog() {
      try {
        const [placeSnap, eventSnap, offerSnap, categorySnap] = await Promise.all([
          getDocs(collection(db, "places")),
          getDocs(collection(db, "events")),
          getDocs(collection(db, "offers")),
          getDocs(collection(db, "categories"))
        ]);
        if (!active) return;
        const livePlaces = placeSnap.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as Place);
        const liveEvents = eventSnap.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as EventItem);
        const liveOffers = offerSnap.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as Offer);
        const liveCategories = categorySnap.docs
          .map((entry) => entry.data() as { id?: string; target?: "place" | "event"; title?: LocalizedText; status?: PublishStatus; sortOrder?: number })
          .filter((item): item is { id: string; target: "place" | "event"; title: LocalizedText; status: PublishStatus; sortOrder?: number } => Boolean(item.id && item.target && item.title && item.status))
          .sort((first, second) => {
            if (first.target !== second.target) return first.target.localeCompare(second.target);
            return (first.sortOrder ?? 0) - (second.sortOrder ?? 0) || localizeText(first.title, locale).localeCompare(localizeText(second.title, locale), locale === "tr" ? "tr-TR" : undefined);
          });
        const fallbackCategories = [
          ...placeCategoryOptions.map((item, index) => ({ id: item.id, target: "place" as const, title: item.title, status: "published" as PublishStatus, sortOrder: index })),
          ...eventTypes.map((item, index) => ({ id: item.id, target: "event" as const, title: item.title, status: "published" as PublishStatus, sortOrder: index }))
        ];
        setPlaces(mergeWithFallback(livePlaces, seedCollections.places as Place[], hiddenIds.place));
        setEvents(mergeWithFallback(liveEvents, seedCollections.events as EventItem[], hiddenIds.event));
        setOffers(mergeWithFallback(liveOffers, seedCollections.offers as Offer[], hiddenIds.offer));
        setCategories(mergeCategoriesWithFallback(liveCategories, fallbackCategories));
        setStatus("Canlı katalog verileri yüklendi.");
      } catch (error) {
        if (!active) return;
        setStatus(error instanceof Error ? error.message : "Katalog yüklenemedi.");
      }
    }
    void loadCatalog();
    return () => {
      active = false;
    };
  }, [hiddenIds.event, hiddenIds.offer, hiddenIds.place, locale]);

  const visiblePlaces = useMemo(() => filterBySearch(places, search, locale), [locale, places, search]);
  const visibleEvents = useMemo(() => filterBySearch(events, search, locale), [locale, events, search]);
  const visibleOffers = useMemo(() => filterBySearch(offers, search, locale), [locale, offers, search]);

  const placeCategoryOptionsLive = useMemo(() => [
    ...placeCategoryOptions,
    ...categories.filter((item) => item.target === "place" && !placeCategoryOptions.some((candidate) => candidate.id === item.id)).map((item) => ({ id: item.id, title: item.title }))
  ], [categories]);

  const eventCategoryOptionsLive = useMemo(() => [
    ...eventTypes,
    ...categories.filter((item) => item.target === "event" && !eventTypes.some((candidate) => candidate.id === item.id)).map((item) => ({ id: item.id, title: item.title }))
  ], [categories]);

  const placeOptions = useMemo(() => [...places].sort((a, b) => localizeText(a.title, locale).localeCompare(localizeText(b.title, locale), locale === "tr" ? "tr-TR" : undefined)), [locale, places]);

  const activeList = kind === "place" ? visiblePlaces : kind === "event" ? visibleEvents : visibleOffers;

  useEffect(() => {
    if (selectedId) return;
    const nextId = activeList[0]?.id ?? "";
    if (nextId) setSelectedId(nextId);
  }, [activeList, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    if (kind === "place") {
      const current = places.find((item) => item.id === selectedId);
      if (current) setPlaceDraft(fromPlace(current));
    }
    if (kind === "event") {
      const current = events.find((item) => item.id === selectedId);
      if (current) setEventDraft(fromEvent(current));
    }
    if (kind === "offer") {
      const current = offers.find((item) => item.id === selectedId);
      if (current) setOfferDraft(fromOffer(current));
    }
  }, [events, kind, offers, places, selectedId]);

  function startNew() {
    const nextId = `${kind}-${Date.now()}`;
    setSelectedId(nextId);
    if (kind === "place") setPlaceDraft({ ...createPlaceDraft(), id: nextId });
    if (kind === "event") setEventDraft({ ...createEventDraft(), id: nextId });
    if (kind === "offer") setOfferDraft({ ...createOfferDraft(), id: nextId });
  }

  async function saveCurrent() {
    setStatus("Kaydediliyor.");
    try {
      const nextHiddenIds = {
        ...hiddenIds,
        [kind]: hiddenIds[kind].filter((itemId) => itemId !== selectedId)
      };
      if (kind === "place") {
        await setDoc(doc(db, "places", placeDraft.id), {
          ...buildPlacePayload(placeDraft),
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
      if (kind === "event") {
        await setDoc(doc(db, "events", eventDraft.id), {
          ...buildEventPayload(eventDraft),
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
      if (kind === "offer") {
        await setDoc(doc(db, "offers", offerDraft.id), {
          ...buildOfferPayload(offerDraft),
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
      setStatus("Kaydedildi.");
      setHiddenIds(nextHiddenIds);
      await refresh(nextHiddenIds);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Kaydedilemedi.");
    }
  }

  async function deleteCurrent() {
    if (!selectedId) return;
    setStatus("Siliniyor.");
    try {
      const nextHiddenIds = {
        ...hiddenIds,
        [kind]: hiddenIds[kind].includes(selectedId) ? hiddenIds[kind] : [...hiddenIds[kind], selectedId]
      };
      await deleteDoc(doc(db, kind === "place" ? "places" : kind === "event" ? "events" : "offers", selectedId));
      setStatus("Kay�t silindi.");
      setHiddenIds(nextHiddenIds);
      setSelectedId("");
      if (kind === "place") setPlaceDraft(createPlaceDraft());
      if (kind === "event") setEventDraft(createEventDraft());
      if (kind === "offer") setOfferDraft(createOfferDraft());
      await refresh(nextHiddenIds);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Kayıt silinemedi.");
    }
  }

  async function refresh(overrideHiddenIds = hiddenIds) {
    const [placeSnap, eventSnap, offerSnap] = await Promise.all([
      getDocs(collection(db, "places")),
      getDocs(collection(db, "events")),
      getDocs(collection(db, "offers"))
    ]);
    setPlaces(mergeWithFallback(
      placeSnap.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as Place),
      seedCollections.places as Place[],
      overrideHiddenIds.place
    ));
    setEvents(mergeWithFallback(
      eventSnap.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as EventItem),
      seedCollections.events as EventItem[],
      overrideHiddenIds.event
    ));
    setOffers(mergeWithFallback(
      offerSnap.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as Offer),
      seedCollections.offers as Offer[],
      overrideHiddenIds.offer
    ));
  }

  function selectItem(id: string) {
    setSelectedId(id);
    if (kind === "place") {
      const current = places.find((item) => item.id === id);
      if (current) setPlaceDraft(fromPlace(current));
    }
    if (kind === "event") {
      const current = events.find((item) => item.id === id);
      if (current) setEventDraft(fromEvent(current));
    }
    if (kind === "offer") {
      const current = offers.find((item) => item.id === id);
      if (current) setOfferDraft(fromOffer(current));
    }
  }

  const summary = {
    place: `${places.length} mekan`,
    event: `${events.length} etkinlik`,
    offer: `${offers.length} fırsat`
  };

  return (
    <section className="ops-block catalog-manager" id="content-management" aria-label="İçerik yönetimi">
      <Layers3 size={22} />
      <h2>İçerik Yönetimi</h2>
      <p>Mekan, etkinlik ve fırsat kayıtlarını seç, düzenle, yeni kayıt ekle ya da sil.</p>

      <div className="role-flow" aria-label="İçerik türleri">
        <button className={kind === "place" ? "active" : ""} type="button" onClick={() => { setKind("place"); setSelectedId(places[0]?.id ?? ""); }}>
          Mekanlar
        </button>
        <button className={kind === "event" ? "active" : ""} type="button" onClick={() => { setKind("event"); setSelectedId(events[0]?.id ?? ""); }}>
          Etkinlikler
        </button>
        <button className={kind === "offer" ? "active" : ""} type="button" onClick={() => { setKind("offer"); setSelectedId(offers[0]?.id ?? ""); }}>
          Fırsatlar
        </button>
        <span>{summary[kind]}</span>
      </div>

      <div className="mini-form" style={{ maxWidth: "none" }}>
        <label>
          Kayıt ara
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="İsim, ilçe, kategori veya kimlik" />
        </label>
      </div>

      <div className="catalog-rows">
        <div className="catalog-list">
          {activeList.length === 0 ? (
            <article className="catalog-empty">
              <strong>Kayıt yok</strong>
              <span>Yeni kayıt oluşturabilir veya başka bir tür seçebilirsin.</span>
            </article>
          ) : activeList.map((item) => {
            const title = localizeText(item.title, locale);
            const subtitle = kind === "place" ? (item as Place).district : kind === "event" ? (item as EventItem).venueName : (item as Offer).discountLabel;
            return (
              <button
                key={item.id}
                className={`catalog-item ${selectedId === item.id ? "active" : ""}`}
                type="button"
                onClick={() => selectItem(item.id)}
              >
                <strong>{title}</strong>
                <span>{subtitle}</span>
                <small>{kind === "place" ? (item as Place).status : kind === "event" ? (item as EventItem).status : (item as Offer).status}</small>
              </button>
            );
          })}
        </div>

        <div className="catalog-editor">
          <div className="hero-actions">
            <button className="secondary" type="button" onClick={startNew}><Plus size={16} /> Yeni kayıt</button>
            <button className="secondary" type="button" onClick={() => void refresh()}><RotateCcw size={16} /> Yenile</button>
            <button className="secondary" type="button" onClick={() => void saveCurrent()}><PencilLine size={16} /> Kaydet</button>
            <button className="secondary" type="button" onClick={() => void deleteCurrent()} disabled={!selectedId}><Trash2 size={16} /> Sil</button>
          </div>

          {kind === "place" ? (
            <div className="mini-form" style={{ maxWidth: "none" }}>
              <label>Kayıt kimliği<input value={placeDraft.id} onChange={(event) => setPlaceDraft((current) => ({ ...current, id: event.target.value }))} /></label>
              <label>Türkçe başlık<input value={placeDraft.title.tr} onChange={(event) => setPlaceDraft((current) => ({ ...current, title: { ...current.title, tr: event.target.value } }))} /></label>
              <label>İngilizce başlık<input value={placeDraft.title.en} onChange={(event) => setPlaceDraft((current) => ({ ...current, title: { ...current.title, en: event.target.value } }))} /></label>
              <label>Türkçe açıklama<textarea rows={3} value={placeDraft.description.tr} onChange={(event) => setPlaceDraft((current) => ({ ...current, description: { ...current.description, tr: event.target.value } }))} /></label>
              <label>Kategori<select value={placeDraft.categoryId} onChange={(event) => setPlaceDraft((current) => ({ ...current, categoryId: event.target.value }))}>
                <option value="">Seç</option>
                {placeCategoryOptionsLive.map((category) => <option key={category.id} value={category.id}>{localizeText(category.title, locale)}</option>)}
              </select></label>
              <label>İlçe<input value={placeDraft.district} onChange={(event) => setPlaceDraft((current) => ({ ...current, district: event.target.value }))} /></label>
              <label>Adres<textarea rows={2} value={placeDraft.address} onChange={(event) => setPlaceDraft((current) => ({ ...current, address: event.target.value }))} /></label>
              <label>Kapak görseli<input value={placeDraft.coverImage} onChange={(event) => setPlaceDraft((current) => ({ ...current, coverImage: event.target.value }))} /></label>
              <label>Durum<select value={placeDraft.status} onChange={(event) => setPlaceDraft((current) => ({ ...current, status: event.target.value as PublishStatus }))}>
                <option value="draft">Taslak</option>
                <option value="pending">Onay bekliyor</option>
                <option value="published">Yayında</option>
                <option value="archived">Arşiv</option>
              </select></label>
            </div>
          ) : null}

          {kind === "event" ? (
            <div className="mini-form" style={{ maxWidth: "none" }}>
              <label>Kayıt kimliği<input value={eventDraft.id} onChange={(event) => setEventDraft((current) => ({ ...current, id: event.target.value }))} /></label>
              <label>Türkçe başlık<input value={eventDraft.title.tr} onChange={(event) => setEventDraft((current) => ({ ...current, title: { ...current.title, tr: event.target.value } }))} /></label>
              <label>Türkçe açıklama<textarea rows={3} value={eventDraft.description.tr} onChange={(event) => setEventDraft((current) => ({ ...current, description: { ...current.description, tr: event.target.value } }))} /></label>
              <label>Sinopsis<textarea rows={3} value={eventDraft.synopsis.tr} onChange={(event) => setEventDraft((current) => ({ ...current, synopsis: { ...current.synopsis, tr: event.target.value } }))} /></label>
              <label>Kategori<select value={eventDraft.categoryId} onChange={(event) => setEventDraft((current) => ({ ...current, categoryId: event.target.value }))}>
                <option value="">Seç</option>
                {eventCategoryOptionsLive.map((category) => <option key={category.id} value={category.id}>{localizeText(category.title, locale)}</option>)}
              </select></label>
              <label>Tür<select value={eventDraft.type} onChange={(event) => setEventDraft((current) => ({ ...current, type: event.target.value as EventType }))}>
                {eventTypes.map((item) => <option key={item.id} value={item.id}>{localizeText(item.title, locale)}</option>)}
              </select></label>
              <label>Mekan adı<input value={eventDraft.venueName} onChange={(event) => setEventDraft((current) => ({ ...current, venueName: event.target.value }))} /></label>
              <label>İlçe<input value={eventDraft.district} onChange={(event) => setEventDraft((current) => ({ ...current, district: event.target.value }))} /></label>
              <label>Başlangıç<input value={eventDraft.startsAt} onChange={(event) => setEventDraft((current) => ({ ...current, startsAt: event.target.value }))} /></label>
              <label>Bitiş<input value={eventDraft.endsAt} onChange={(event) => setEventDraft((current) => ({ ...current, endsAt: event.target.value }))} /></label>
              <label>Bilet bağlantısı<input value={eventDraft.ticketUrl} onChange={(event) => setEventDraft((current) => ({ ...current, ticketUrl: event.target.value }))} /></label>
              <label>Kapak görseli<input value={eventDraft.coverImage} onChange={(event) => setEventDraft((current) => ({ ...current, coverImage: event.target.value }))} /></label>
              <label>Durum<select value={eventDraft.status} onChange={(event) => setEventDraft((current) => ({ ...current, status: event.target.value as PublishStatus }))}>
                <option value="draft">Taslak</option>
                <option value="pending">Onay bekliyor</option>
                <option value="published">Yayında</option>
                <option value="archived">Arşiv</option>
              </select></label>
            </div>
          ) : null}

          {kind === "offer" ? (
            <div className="mini-form" style={{ maxWidth: "none" }}>
              <label>Kayıt kimliği<input value={offerDraft.id} onChange={(event) => setOfferDraft((current) => ({ ...current, id: event.target.value }))} /></label>
              <label>Türkçe başlık<input value={offerDraft.title.tr} onChange={(event) => setOfferDraft((current) => ({ ...current, title: { ...current.title, tr: event.target.value } }))} /></label>
              <label>Türkçe açıklama<textarea rows={3} value={offerDraft.description.tr} onChange={(event) => setOfferDraft((current) => ({ ...current, description: { ...current.description, tr: event.target.value } }))} /></label>
              <label>Şartlar<textarea rows={3} value={offerDraft.conditions.tr} onChange={(event) => setOfferDraft((current) => ({ ...current, conditions: { ...current.conditions, tr: event.target.value } }))} /></label>
              <label>İşletme kimliği<input value={offerDraft.businessId} onChange={(event) => setOfferDraft((current) => ({ ...current, businessId: event.target.value }))} /></label>
              <label>Mekan seç<select value={offerDraft.placeId} onChange={(event) => setOfferDraft((current) => ({ ...current, placeId: event.target.value }))}>
                <option value="">Seç</option>
                {placeOptions.map((place) => <option key={place.id} value={place.id}>{localizeText(place.title, locale)} · {place.district}</option>)}
              </select></label>
              <label>İndirim etiketi<input value={offerDraft.discountLabel} onChange={(event) => setOfferDraft((current) => ({ ...current, discountLabel: event.target.value }))} /></label>
              <label>Başlangıç<input value={offerDraft.startsAt} onChange={(event) => setOfferDraft((current) => ({ ...current, startsAt: event.target.value }))} /></label>
              <label>Bitiş<input value={offerDraft.endsAt} onChange={(event) => setOfferDraft((current) => ({ ...current, endsAt: event.target.value }))} /></label>
              <label>Puan maliyeti<input type="number" value={offerDraft.pointCost} onChange={(event) => setOfferDraft((current) => ({ ...current, pointCost: Number(event.target.value) }))} /></label>
              <label>Kullanım limiti<input type="number" value={offerDraft.useLimit} onChange={(event) => setOfferDraft((current) => ({ ...current, useLimit: Number(event.target.value) }))} /></label>
              <label>Hikaye görseli<input value={offerDraft.storyImage} onChange={(event) => setOfferDraft((current) => ({ ...current, storyImage: event.target.value }))} /></label>
              <label>Durum<select value={offerDraft.status} onChange={(event) => setOfferDraft((current) => ({ ...current, status: event.target.value as PublishStatus }))}>
                <option value="draft">Taslak</option>
                <option value="pending">Onay bekliyor</option>
                <option value="published">Yayında</option>
                <option value="archived">Arşiv</option>
              </select></label>
            </div>
          ) : null}
        </div>
      </div>

      <div className="compact-list catalog-summary" aria-label="Kayıt özeti">
        <article><strong>Mekanlar</strong><span>{places.length} kayıt</span></article>
        <article><strong>Etkinlikler</strong><span>{events.length} kayıt</span></article>
        <article><strong>Fırsatlar</strong><span>{offers.length} kayıt</span></article>
      </div>
      <p className="meta" aria-live="polite">{status}</p>
    </section>
  );
}

function mergeWithFallback<T extends { id: string }>(liveItems: T[], fallbackItems: T[], hiddenIds: string[]) {
  const seen = new Set<string>();
  const merged: T[] = [];
  for (const item of liveItems) {
    if (hiddenIds.includes(item.id) || seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
  }
  for (const item of fallbackItems) {
    if (hiddenIds.includes(item.id) || seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
  }
  return merged;
}

function mergeCategoriesWithFallback(
  liveItems: Array<{ id: string; target: "place" | "event"; title: LocalizedText; status: PublishStatus; sortOrder?: number }>,
  fallbackItems: Array<{ id: string; target: "place" | "event"; title: LocalizedText; status: PublishStatus; sortOrder?: number }>
) {
  const seen = new Set<string>();
  const merged = [...liveItems];
  for (const item of liveItems) seen.add(item.id);
  for (const item of fallbackItems) {
    if (seen.has(item.id)) continue;
    merged.push(item);
  }
  return merged.sort((first, second) => {
    if (first.target !== second.target) return first.target.localeCompare(second.target);
    return (first.sortOrder ?? 0) - (second.sortOrder ?? 0) || localizeText(first.title, "tr").localeCompare(localizeText(second.title, "tr"), "tr-TR");
  });
}

function filterBySearch<T extends { id: string; title: LocalizedText }>(items: T[], search: string, locale: "tr" | "en" | "ru" | "de") {
  const query = search.trim().toLocaleLowerCase(locale === "tr" ? "tr-TR" : undefined);
  if (!query) return [...items].sort((first, second) => localizeText(first.title, locale).localeCompare(localizeText(second.title, locale), locale === "tr" ? "tr-TR" : undefined));
  return [...items]
    .filter((item) => {
      const title = localizeText(item.title, locale);
      return `${item.id} ${title}`.toLocaleLowerCase(locale === "tr" ? "tr-TR" : undefined).includes(query);
    })
    .sort((first, second) => localizeText(first.title, locale).localeCompare(localizeText(second.title, locale), locale === "tr" ? "tr-TR" : undefined));
}

function fromPlace(place: Place): PlaceDraft {
  return {
    id: place.id,
    title: {
      tr: place.title.tr ?? "",
      en: place.title.en ?? place.title.tr ?? "",
      ru: place.title.ru ?? place.title.tr ?? "",
      de: place.title.de ?? place.title.tr ?? ""
    },
    description: {
      tr: place.description.tr ?? "",
      en: place.description.en ?? place.description.tr ?? "",
      ru: place.description.ru ?? place.description.tr ?? "",
      de: place.description.de ?? place.description.tr ?? ""
    },
    categoryId: place.categoryId,
    district: place.district,
    address: place.address,
    coverImage: place.coverImage,
    status: place.status,
    ownerId: place.ownerId ?? ""
  };
}

function fromEvent(event: EventItem): EventDraft {
  return {
    id: event.id,
    categoryId: event.categoryId ?? event.type,
    title: {
      tr: event.title.tr ?? "",
      en: event.title.en ?? event.title.tr ?? "",
      ru: event.title.ru ?? event.title.tr ?? "",
      de: event.title.de ?? event.title.tr ?? ""
    },
    description: {
      tr: event.description.tr ?? "",
      en: event.description.en ?? event.description.tr ?? "",
      ru: event.description.ru ?? event.description.tr ?? "",
      de: event.description.de ?? event.description.tr ?? ""
    },
    synopsis: {
      tr: event.synopsis?.tr ?? event.description.tr ?? "",
      en: event.synopsis?.en ?? event.synopsis?.tr ?? event.description.en ?? event.description.tr ?? "",
      ru: event.synopsis?.ru ?? event.synopsis?.tr ?? event.description.ru ?? event.description.tr ?? "",
      de: event.synopsis?.de ?? event.synopsis?.tr ?? event.description.de ?? event.description.tr ?? ""
    },
    type: event.type,
    district: event.district,
    venueName: event.venueName,
    startsAt: event.startsAt,
    endsAt: event.endsAt ?? "",
    priceType: event.priceType,
    ticketUrl: event.ticketUrl ?? "",
    cast: event.cast.join(", "),
    coverImage: event.coverImage,
    videoUrl: event.videoUrl ?? "",
    status: event.status
  };
}

function fromOffer(offer: Offer): OfferDraft {
  return {
    id: offer.id,
    businessId: offer.businessId,
    placeId: offer.placeId,
    title: {
      tr: offer.title.tr ?? "",
      en: offer.title.en ?? offer.title.tr ?? "",
      ru: offer.title.ru ?? offer.title.tr ?? "",
      de: offer.title.de ?? offer.title.tr ?? ""
    },
    description: {
      tr: offer.description.tr ?? "",
      en: offer.description.en ?? offer.description.tr ?? "",
      ru: offer.description.ru ?? offer.description.tr ?? "",
      de: offer.description.de ?? offer.description.tr ?? ""
    },
    conditions: {
      tr: offer.conditions.tr ?? "",
      en: offer.conditions.en ?? offer.conditions.tr ?? "",
      ru: offer.conditions.ru ?? offer.conditions.tr ?? "",
      de: offer.conditions.de ?? offer.conditions.tr ?? ""
    },
    discountLabel: offer.discountLabel,
    startsAt: offer.startsAt,
    endsAt: offer.endsAt,
    requiresQr: offer.requiresQr,
    pointCost: offer.pointCost ?? 0,
    storyEnabled: Boolean(offer.storyEnabled),
    storyPriority: offer.storyPriority ?? 1,
    storyImage: "",
    useLimit: offer.useLimit ?? 250,
    featured: Boolean(offer.featured),
    status: offer.status
  };
}

function buildPlacePayload(draft: PlaceDraft) {
  return {
    id: draft.id,
    title: draft.title,
    description: draft.description,
    categoryId: draft.categoryId,
    district: draft.district,
    address: draft.address,
    coverImage: draft.coverImage,
    status: draft.status,
    ownerId: draft.ownerId || undefined
  };
}

function buildEventPayload(draft: EventDraft) {
  return {
    id: draft.id,
    categoryId: draft.categoryId || undefined,
    title: draft.title,
    description: draft.description,
    synopsis: draft.synopsis,
    type: draft.type,
    district: draft.district,
    venueName: draft.venueName,
    startsAt: draft.startsAt,
    endsAt: draft.endsAt || undefined,
    priceType: draft.priceType,
    ticketUrl: draft.ticketUrl || undefined,
    cast: draft.cast.split(",").map((item) => item.trim()).filter(Boolean),
    coverImage: draft.coverImage,
    videoUrl: draft.videoUrl || undefined,
    status: draft.status
  };
}

function buildOfferPayload(draft: OfferDraft) {
  return {
    id: draft.id,
    businessId: draft.businessId || undefined,
    placeId: draft.placeId,
    title: draft.title,
    description: draft.description,
    conditions: draft.conditions,
    discountLabel: draft.discountLabel,
    startsAt: draft.startsAt,
    endsAt: draft.endsAt,
    requiresQr: draft.requiresQr,
    pointCost: draft.pointCost,
    storyEnabled: draft.storyEnabled,
    storyPriority: draft.storyPriority,
    storyImage: draft.storyImage || undefined,
    useLimit: draft.useLimit,
    featured: draft.featured,
    status: draft.status
  };
}
