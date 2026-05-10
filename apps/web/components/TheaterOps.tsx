"use client";

import { auth, db } from "@/lib/firebase";
import {
  adjustTheaterNotificationLimit,
  createTheaterEvent,
  deleteTheaterEvent,
  sendTheaterEventNotification,
  translateSynopsisDraft,
  updateTheaterEvent
} from "@/lib/panel-actions";
import { localizeText, type EventItem, type LocalizedText, type PublishStatus } from "@nar/core";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

type CategoryOption = { id: string; title: LocalizedText; sortOrder?: number };
type SynopsisDraft = { en: string; ru: string; de: string };

type TheaterDraft = {
  id: string;
  categoryId: string;
  titleTr: string;
  titleEn: string;
  titleRu: string;
  titleDe: string;
  descriptionTr: string;
  descriptionEn: string;
  descriptionRu: string;
  descriptionDe: string;
  synopsisTr: string;
  synopsisEn: string;
  synopsisRu: string;
  synopsisDe: string;
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
  notificationLimit: number;
};

const createBlankDraft = (): TheaterDraft => ({
  id: "",
  categoryId: "theater",
  titleTr: "",
  titleEn: "",
  titleRu: "",
  titleDe: "",
  descriptionTr: "",
  descriptionEn: "",
  descriptionRu: "",
  descriptionDe: "",
  synopsisTr: "",
  synopsisEn: "",
  synopsisRu: "",
  synopsisDe: "",
  district: "",
  venueName: "",
  startsAt: new Date().toISOString(),
  endsAt: "",
  priceType: "paid",
  ticketUrl: "",
  cast: "",
  coverImage: "",
  videoUrl: "",
  status: "draft",
  notificationLimit: 3
});

export function TheaterOps({ mode = "theater" }: { mode?: "theater" | "admin" }) {
  const uid = auth.currentUser?.uid ?? "";
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState<TheaterDraft>(createBlankDraft());
  const [synopsisDraft, setSynopsisDraft] = useState<SynopsisDraft>({ en: "", ru: "", de: "" });
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [notificationUsed, setNotificationUsed] = useState(0);
  const [notificationTitleTr, setNotificationTitleTr] = useState("Sahnede bu hafta");
  const [notificationBodyTr, setNotificationBodyTr] = useState("Favorindeki oyun için yeni gösterim ve bilet bilgisi hazır.");
  const [status, setStatus] = useState("Tiyatro etkinlikleri yükleniyor.");

  const selectedEvent = useMemo(() => events.find((item) => item.id === selectedId) ?? null, [events, selectedId]);
  const remainingNotifications = useMemo(
    () => Math.max(Number(draft.notificationLimit ?? 0) - notificationUsed, 0),
    [draft.notificationLimit, notificationUsed]
  );

  useEffect(() => {
    let active = true;

    async function loadTheaterEvents() {
      if (!uid) {
        if (!active) return;
        setEvents([]);
        setSelectedId("");
        setDraft(createBlankDraft());
        setStatus("Oturum bekleniyor.");
        return;
      }

      try {
        const snapshot = await getDocs(query(collection(db, "events"), where("organizerId", "==", uid), limit(50)));
        if (!active) return;

        const liveEvents = snapshot.docs
          .map((entry) => ({ id: entry.id, ...entry.data() }) as EventItem)
          .filter((event) => event.type === "theater")
          .sort((left, right) => {
            const leftStarts = Date.parse(left.startsAt ?? "");
            const rightStarts = Date.parse(right.startsAt ?? "");
            return Number.isFinite(rightStarts) && Number.isFinite(leftStarts) ? rightStarts - leftStarts : left.id.localeCompare(right.id);
          });

        setEvents(liveEvents);
        const nextSelected = liveEvents[0] ?? null;
        applyEvent(nextSelected);
        setStatus(liveEvents.length ? "Kendi tiyatro etkinliklerin yüklendi." : "Henüz tiyatro panelinden oluşturulmuş etkinlik yok.");
      } catch (error) {
        if (!active) return;
        setEvents([]);
        setSelectedId("");
        setDraft(createBlankDraft());
        setStatus(error instanceof Error ? error.message : "Tiyatro etkinlikleri yüklenemedi.");
      }
    }

    async function loadCategories() {
      try {
        const snapshot = await getDocs(query(collection(db, "categories"), where("target", "==", "event"), where("status", "==", "published"), limit(50)));
        if (!active) return;
        const liveCategories = snapshot.docs
          .map((entry) => entry.data() as Partial<CategoryOption> & { id?: string })
          .filter((category): category is CategoryOption => Boolean(category.id && category.title?.tr))
          .sort((left, right) => {
            const leftOrder = Number(left.sortOrder ?? 0);
            const rightOrder = Number(right.sortOrder ?? 0);
            return leftOrder - rightOrder;
          });
        setCategories(liveCategories);
      } catch {
        if (!active) return;
        setCategories([]);
      }
    }

    void loadTheaterEvents();
    void loadCategories();

    return () => {
      active = false;
    };
  }, [uid]);

  function applyEvent(event: EventItem | null) {
    if (!event) {
      setSelectedId("");
      setDraft(createBlankDraft());
      setSynopsisDraft({ en: "", ru: "", de: "" });
      setNotificationUsed(0);
      return;
    }

    setSelectedId(event.id);
    setDraft({
      id: event.id,
      categoryId: event.categoryId ?? event.type,
      titleTr: event.title.tr ?? "",
      titleEn: event.title.en ?? event.title.tr ?? "",
      titleRu: event.title.ru ?? event.title.tr ?? "",
      titleDe: event.title.de ?? event.title.tr ?? "",
      descriptionTr: event.description.tr ?? "",
      descriptionEn: event.description.en ?? event.description.tr ?? "",
      descriptionRu: event.description.ru ?? event.description.tr ?? "",
      descriptionDe: event.description.de ?? event.description.tr ?? "",
      synopsisTr: event.synopsis?.tr ?? event.description.tr ?? "",
      synopsisEn: event.synopsis?.en ?? event.synopsis?.tr ?? event.description.en ?? event.description.tr ?? "",
      synopsisRu: event.synopsis?.ru ?? event.synopsis?.tr ?? event.description.ru ?? event.description.tr ?? "",
      synopsisDe: event.synopsis?.de ?? event.synopsis?.tr ?? event.description.de ?? event.description.tr ?? "",
      district: event.district,
      venueName: event.venueName,
      startsAt: event.startsAt,
      endsAt: event.endsAt ?? "",
      priceType: event.priceType,
      ticketUrl: event.ticketUrl ?? "",
      cast: event.cast.join(", "),
      coverImage: event.coverImage,
      videoUrl: event.videoUrl ?? "",
      status: event.status,
      notificationLimit: event.notificationLimit ?? 3
    });
    setSynopsisDraft({
      en: event.synopsis?.en ?? "",
      ru: event.synopsis?.ru ?? "",
      de: event.synopsis?.de ?? ""
    });
    setNotificationUsed(Number(event.notificationUsed ?? 0));
    setNotificationTitleTr(localizeText(event.title, "tr"));
    setNotificationBodyTr(
      event.synopsis?.tr?.trim()
        ? `${localizeText(event.title, "tr")} için yeni gösterim ve bilet bilgisi hazır.`
        : "Favorindeki oyun için yeni gösterim ve bilet bilgisi hazır."
    );
  }

  async function translateSynopsis() {
    if (!draft.synopsisTr.trim()) {
      setStatus("Önce Türkçe sinopsis gir.");
      return;
    }

    setStatus("Sinopsis çeviri taslağı hazırlanıyor.");
    try {
      const result = await translateSynopsisDraft(draft.synopsisTr);
      setSynopsisDraft({
        en: result.data.synopsis.en,
        ru: result.data.synopsis.ru,
        de: result.data.synopsis.de
      });
      setDraft((current) => ({
        ...current,
        synopsisEn: result.data.synopsis.en,
        synopsisRu: result.data.synopsis.ru,
        synopsisDe: result.data.synopsis.de
      }));
      setStatus("Sinopsis çeviri taslağı oluşturuldu.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Sinopsis çevirisi oluşturulamadı.");
    }
  }

  function buildPayload() {
    return {
      categoryId: draft.categoryId || "theater",
      title: {
        tr: draft.titleTr.trim(),
        en: draft.titleEn.trim() || draft.titleTr.trim(),
        ru: draft.titleRu.trim() || draft.titleTr.trim(),
        de: draft.titleDe.trim() || draft.titleTr.trim()
      },
      description: {
        tr: draft.descriptionTr.trim(),
        en: draft.descriptionEn.trim() || draft.descriptionTr.trim(),
        ru: draft.descriptionRu.trim() || draft.descriptionTr.trim(),
        de: draft.descriptionDe.trim() || draft.descriptionTr.trim()
      },
      synopsis: {
        tr: draft.synopsisTr.trim(),
        en: draft.synopsisEn.trim() || draft.synopsisTr.trim(),
        ru: draft.synopsisRu.trim() || draft.synopsisTr.trim(),
        de: draft.synopsisDe.trim() || draft.synopsisTr.trim()
      },
      type: "theater" as const,
      district: draft.district.trim(),
      venueName: draft.venueName.trim(),
      startsAt: draft.startsAt,
      endsAt: draft.endsAt.trim() || undefined,
      priceType: draft.priceType,
      ticketUrl: draft.ticketUrl.trim() || undefined,
      cast: draft.cast
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      coverImage: draft.coverImage.trim(),
      videoUrl: draft.videoUrl.trim() || undefined,
      status: draft.status,
      notificationLimit: draft.notificationLimit
    };
  }

  async function saveCurrent() {
    if (!draft.titleTr.trim() || !draft.descriptionTr.trim() || !draft.venueName.trim()) {
      setStatus("Başlık, açıklama ve mekân adı gerekli.");
      return;
    }

    setStatus(selectedId ? "Etkinlik güncelleniyor." : "Etkinlik oluşturuluyor.");
    try {
      if (selectedId) {
        const result = await updateTheaterEvent({ eventId: selectedId, ...buildPayload() });
        setSelectedId(result.data.id);
      } else {
        const result = await createTheaterEvent(buildPayload());
        setSelectedId(result.data.id);
      }
      setStatus("Etkinlik kaydedildi.");
      await refreshEvents();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Etkinlik kaydedilemedi.");
    }
  }

  async function deleteCurrent() {
    if (!selectedId) {
      setStatus("Silmek için etkinlik seç.");
      return;
    }

    setStatus("Etkinlik siliniyor.");
    try {
      await deleteTheaterEvent({ eventId: selectedId });
      setStatus("Etkinlik arşivlendi.");
      await refreshEvents();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Etkinlik silinemedi.");
    }
  }

  async function sendNotification() {
    if (!selectedId) {
      setStatus("Bildirim için etkinlik seç.");
      return;
    }
    if (remainingNotifications <= 0) {
      setStatus("Bu oyun için bildirim hakkı tükendi.");
      return;
    }

    setStatus("Oyun bildirimi gönderiliyor.");
    try {
      await sendTheaterEventNotification({
        eventId: selectedId,
        title: {
          tr: notificationTitleTr.trim() || "Sahnede bu hafta",
          en: notificationTitleTr.trim() || "On stage this week",
          ru: notificationTitleTr.trim() || "На сцене на этой неделе",
          de: notificationTitleTr.trim() || "Diese Woche auf der Bühne"
        },
        body: {
          tr: notificationBodyTr.trim() || "Favorindeki oyun için yeni gösterim ve bilet bilgisi hazır.",
          en: notificationBodyTr.trim() || "New showtime and ticket details are ready for your favorite play.",
          ru: notificationBodyTr.trim() || "Новые сеансы и билеты готовы для твоего любимого спектакля.",
          de: notificationBodyTr.trim() || "Neue Spielzeiten und Ticketdetails sind bereit."
        }
      });
      setNotificationUsed((value) => value + 1);
      setStatus("Bildirim gönderildi.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Bildirim gönderilemedi.");
    }
  }

  async function increaseLimit() {
    if (!selectedId) {
      setStatus("Limit güncellemek için etkinlik seç.");
      return;
    }
    const nextLimit = Number(draft.notificationLimit ?? 0) + 1;
    setStatus("Bildirim limiti güncelleniyor.");
    try {
      await adjustTheaterNotificationLimit({ eventId: selectedId, notificationLimit: nextLimit });
      setDraft((current) => ({ ...current, notificationLimit: nextLimit }));
      setStatus("Bildirim limiti artırıldı.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Bildirim limiti güncellenemedi.");
    }
  }

  async function refreshEvents() {
    if (!uid) return;
    const snapshot = await getDocs(query(collection(db, "events"), where("organizerId", "==", uid), limit(50)));
    const liveEvents = snapshot.docs
      .map((entry) => ({ id: entry.id, ...entry.data() }) as EventItem)
      .filter((event) => event.type === "theater")
      .sort((left, right) => Date.parse(right.startsAt ?? "") - Date.parse(left.startsAt ?? ""));
    setEvents(liveEvents);
    const nextSelected = liveEvents.find((item) => item.id === selectedId) ?? liveEvents[0] ?? null;
    applyEvent(nextSelected);
  }

  return (
    <section className="workflow" id={mode === "admin" ? "dt" : "play"}>
      <h2>{mode === "admin" ? "Tiyatro Bildirim Kontrolü" : "Tiyatro Üretim Akışı"}</h2>
      <p className="meta">Yalnızca tiyatro panelinden oluşturduğun etkinlikler burada görünür ve düzenlenir.</p>

      <div className="catalog-rows" style={{ alignItems: "start" }}>
        <div className="catalog-list" style={{ minWidth: 320 }}>
          {events.length === 0 ? (
            <article className="catalog-empty">
              <strong>Henüz etkinlik yok</strong>
              <span>Yeni bir tiyatro etkinliği oluşturarak başlayabilirsin.</span>
            </article>
          ) : (
            events.map((event) => (
              <button
                key={event.id}
                className={`catalog-item ${selectedId === event.id ? "active" : ""}`}
                type="button"
                onClick={() => applyEvent(event)}
              >
                <strong>{localizeText(event.title, "tr")}</strong>
                <span>{event.venueName} · {event.district}</span>
                <small>{event.status} · {event.notificationUsed ?? 0}/{event.notificationLimit}</small>
              </button>
            ))
          )}
        </div>

        <div className="catalog-editor">
          <div className="hero-actions">
            <button className="secondary" type="button" onClick={() => applyEvent(null)}>Yeni etkinlik</button>
            <button className="secondary" type="button" onClick={() => void refreshEvents()}>Yenile</button>
            <button className="secondary" type="button" onClick={() => void saveCurrent()}>Kaydet</button>
            <button className="secondary" type="button" onClick={() => void deleteCurrent()} disabled={!selectedId}>Sil</button>
          </div>

          <div className="mini-form" style={{ maxWidth: "none" }}>
            <label>
              Etkinlik kimliği
              <input value={draft.id} onChange={(event) => setDraft((current) => ({ ...current, id: event.target.value }))} placeholder="bohem-gecesi-2026" />
            </label>
            <label>
              Kategori
              <select value={draft.categoryId} onChange={(event) => setDraft((current) => ({ ...current, categoryId: event.target.value }))}>
                <option value="theater">Tiyatro</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {localizeText(category.title, "tr")}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Türkçe başlık
              <input value={draft.titleTr} onChange={(event) => setDraft((current) => ({ ...current, titleTr: event.target.value }))} />
            </label>
            <label>
              İngilizce başlık
              <input value={draft.titleEn} onChange={(event) => setDraft((current) => ({ ...current, titleEn: event.target.value }))} />
            </label>
            <label>
              Rusça başlık
              <input value={draft.titleRu} onChange={(event) => setDraft((current) => ({ ...current, titleRu: event.target.value }))} />
            </label>
            <label>
              Almanca başlık
              <input value={draft.titleDe} onChange={(event) => setDraft((current) => ({ ...current, titleDe: event.target.value }))} />
            </label>
            <label>
              Türkçe açıklama
              <textarea rows={3} value={draft.descriptionTr} onChange={(event) => setDraft((current) => ({ ...current, descriptionTr: event.target.value }))} />
            </label>
            <label>
              İngilizce açıklama
              <textarea rows={3} value={draft.descriptionEn} onChange={(event) => setDraft((current) => ({ ...current, descriptionEn: event.target.value }))} />
            </label>
            <label>
              Türkçe sinopsis
              <textarea rows={4} value={draft.synopsisTr} onChange={(event) => setDraft((current) => ({ ...current, synopsisTr: event.target.value }))} />
            </label>
            <label>
              Sinopsis çevirileri
              <textarea rows={3} value={[synopsisDraft.en, synopsisDraft.ru, synopsisDraft.de].filter(Boolean).join("\n\n")} readOnly />
            </label>
            <label>
              Mekân adı
              <input value={draft.venueName} onChange={(event) => setDraft((current) => ({ ...current, venueName: event.target.value }))} />
            </label>
            <label>
              İlçe
              <input value={draft.district} onChange={(event) => setDraft((current) => ({ ...current, district: event.target.value }))} />
            </label>
            <label>
              Başlangıç
              <input value={draft.startsAt} onChange={(event) => setDraft((current) => ({ ...current, startsAt: event.target.value }))} />
            </label>
            <label>
              Bitiş
              <input value={draft.endsAt} onChange={(event) => setDraft((current) => ({ ...current, endsAt: event.target.value }))} />
            </label>
            <label>
              Ücret tipi
              <select value={draft.priceType} onChange={(event) => setDraft((current) => ({ ...current, priceType: event.target.value as "free" | "paid" }))}>
                <option value="paid">Ücretli</option>
                <option value="free">Ücretsiz</option>
              </select>
            </label>
            <label>
              Bilet bağlantısı
              <input value={draft.ticketUrl} onChange={(event) => setDraft((current) => ({ ...current, ticketUrl: event.target.value }))} />
            </label>
            <label>
              Oyuncu kadrosu
              <textarea rows={2} value={draft.cast} onChange={(event) => setDraft((current) => ({ ...current, cast: event.target.value }))} placeholder="Oyuncu 1, Oyuncu 2" />
            </label>
            <label>
              Kapak görseli
              <input value={draft.coverImage} onChange={(event) => setDraft((current) => ({ ...current, coverImage: event.target.value }))} />
            </label>
            <label>
              Video bağlantısı
              <input value={draft.videoUrl} onChange={(event) => setDraft((current) => ({ ...current, videoUrl: event.target.value }))} />
            </label>
            <label>
              Durum
              <select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as PublishStatus }))}>
                <option value="draft">Taslak</option>
                <option value="pending">Onay bekliyor</option>
                <option value="published">Yayında</option>
                <option value="archived">Arşiv</option>
              </select>
            </label>
          </div>

          <div className="metric-strip">
            <div className="metric">
              <span>Bildirim limiti</span>
              <strong>{draft.notificationLimit}</strong>
            </div>
            <div className="metric">
              <span>Kullanılan hak</span>
              <strong>{notificationUsed}</strong>
            </div>
            <div className="metric">
              <span>Kalan hak</span>
              <strong>{remainingNotifications}</strong>
            </div>
          </div>

          <div className="hero-actions">
            <button className="secondary" onClick={translateSynopsis}>Çeviri taslağı oluştur</button>
            <button className="primary" onClick={() => void saveCurrent()}>Etkinliği kaydet</button>
            <button className="secondary" onClick={sendNotification} disabled={!selectedId}>Bildirim gönder</button>
            {mode === "admin" ? <button className="secondary" onClick={increaseLimit} disabled={!selectedId}>Bildirim limitini artır</button> : null}
          </div>

          <label>
            Bildirim başlığı
            <input value={notificationTitleTr} onChange={(event) => setNotificationTitleTr(event.target.value)} />
          </label>
          <label>
            Bildirim mesajı
            <textarea rows={3} value={notificationBodyTr} onChange={(event) => setNotificationBodyTr(event.target.value)} />
          </label>

          <p className="meta">{selectedEvent ? `Seçili etkinlik: ${localizeText(selectedEvent.title, "tr")}` : "Seçili etkinlik yok."}</p>
          <p className="meta" aria-live="polite">{status}</p>
        </div>
      </div>
    </section>
  );
}
