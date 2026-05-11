"use client";

import { auth, db } from "@/lib/firebase";
import {
  adjustTheaterNotificationLimit,
  createTheaterEvent,
  deleteTheaterEvent,
  sendTheaterEventNotification,
  translateTheaterContent,
  updateTheaterEvent
} from "@/lib/panel-actions";
import { eventTypes, localizeText, type EventItem, type EventType, type LocalizedText, type PublishStatus } from "@nar/core";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

type TranslationPreview = {
  title: LocalizedText;
  description: LocalizedText;
  synopsis: LocalizedText;
  notificationTitle: LocalizedText;
  notificationBody: LocalizedText;
};

type TheaterDraft = {
  id: string;
  type: EventType;
  titleTr: string;
  descriptionTr: string;
  synopsisTr: string;
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

const emptyLocalizedText = (): LocalizedText => ({ tr: "", en: "", ru: "", de: "" });

const emptyDraft = (): TheaterDraft => ({
  id: "",
  type: "theater",
  titleTr: "",
  descriptionTr: "",
  synopsisTr: "",
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

const emptyTranslations = (): TranslationPreview => ({
  title: emptyLocalizedText(),
  description: emptyLocalizedText(),
  synopsis: emptyLocalizedText(),
  notificationTitle: emptyLocalizedText(),
  notificationBody: emptyLocalizedText()
});

function splitDateTime(value: string) {
  if (!value) return { date: "", time: "" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "", time: "" };
  const pad = (input: number) => String(input).padStart(2, "0");
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`
  };
}

function mergeDateTime(dateValue: string, timeValue: string) {
  if (!dateValue) return "";
  const safeTime = timeValue || "00:00";
  const merged = new Date(`${dateValue}T${safeTime}:00`);
  return Number.isNaN(merged.getTime()) ? "" : merged.toISOString();
}

export function TheaterOps({ mode = "theater" }: { mode?: "theater" | "admin" }) {
  const uid = auth.currentUser?.uid ?? "";
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState<TheaterDraft>(emptyDraft());
  const [translations, setTranslations] = useState<TranslationPreview>(emptyTranslations());
  const [notificationUsed, setNotificationUsed] = useState(0);
  const [notificationTitleTr, setNotificationTitleTr] = useState("Sahnede bu hafta");
  const [notificationBodyTr, setNotificationBodyTr] = useState("Favorindeki oyun için yeni gösterim ve bilet bilgisi hazır.");
  const [status, setStatus] = useState("Etkinlikler yükleniyor.");

  const selectedEvent = useMemo(() => events.find((item) => item.id === selectedId) ?? null, [events, selectedId]);
  const remainingNotifications = useMemo(() => Math.max(Number(draft.notificationLimit ?? 0) - notificationUsed, 0), [draft.notificationLimit, notificationUsed]);
  const eventTypeOptions = useMemo(() => eventTypes.map((item) => ({ id: item.id, label: localizeText(item.title, "tr") })), []);
  const eventTypeLabelById = useMemo(() => new Map<string, string>(eventTypeOptions.map((item) => [item.id, item.label])), [eventTypeOptions]);
  const startsAtParts = useMemo(() => splitDateTime(draft.startsAt), [draft.startsAt]);
  const endsAtParts = useMemo(() => splitDateTime(draft.endsAt), [draft.endsAt]);

  useEffect(() => {
    let active = true;

    async function loadEvents() {
      if (!uid) {
        if (!active) return;
        setEvents([]);
        setSelectedId("");
        setDraft(emptyDraft());
        setTranslations(emptyTranslations());
        setNotificationUsed(0);
        setStatus("Oturum bekleniyor.");
        return;
      }

      try {
        const snapshot = await getDocs(query(collection(db, "events"), where("organizerId", "==", uid), limit(50)));
        if (!active) return;
        const liveEvents = snapshot.docs
          .map((entry) => ({ id: entry.id, ...entry.data() }) as EventItem)
          .sort((left, right) => Date.parse(right.startsAt ?? "") - Date.parse(left.startsAt ?? ""));
        setEvents(liveEvents);
        applyEvent(liveEvents[0] ?? null);
        setStatus(liveEvents.length ? "Etkinlikler yüklendi." : "Henüz etkinlik yok.");
      } catch (error) {
        if (!active) return;
        setEvents([]);
        setSelectedId("");
        setDraft(emptyDraft());
        setTranslations(emptyTranslations());
        setNotificationUsed(0);
        setStatus(error instanceof Error ? error.message : "Etkinlikler yüklenemedi.");
      }
    }

    void loadEvents();
    return () => {
      active = false;
    };
  }, [uid]);

  function applyEvent(event: EventItem | null) {
    if (!event) {
      setSelectedId("");
      setDraft(emptyDraft());
      setTranslations(emptyTranslations());
      setNotificationUsed(0);
      return;
    }

    setSelectedId(event.id);
    setDraft({
      id: event.id,
      type: event.type,
      titleTr: event.title.tr ?? "",
      descriptionTr: event.description.tr ?? "",
      synopsisTr: event.synopsis?.tr ?? event.description.tr ?? "",
      district: event.district ?? "",
      venueName: event.venueName ?? "",
      startsAt: event.startsAt,
      endsAt: event.endsAt ?? "",
      priceType: event.priceType,
      ticketUrl: event.ticketUrl ?? "",
      cast: event.cast?.join(", ") ?? "",
      coverImage: event.coverImage ?? "",
      videoUrl: event.videoUrl ?? "",
      status: event.status,
      notificationLimit: event.notificationLimit ?? 3
    });
    setTranslations({
      title: event.title,
      description: event.description,
      synopsis: event.synopsis ?? event.description,
      notificationTitle: {
        tr: localizeText(event.title, "tr") || "Sahnede bu hafta",
        en: event.title.en ?? event.title.tr ?? "On stage this week",
        ru: event.title.ru ?? event.title.tr ?? "На сцене на этой неделе",
        de: event.title.de ?? event.title.tr ?? "Diese Woche auf der Bühne"
      },
      notificationBody: {
        tr: event.synopsis?.tr?.trim() ? `${localizeText(event.title, "tr")} için yeni gösterim ve bilet bilgisi hazır.` : "Favorindeki oyun için yeni gösterim ve bilet bilgisi hazır.",
        en: event.synopsis?.en ?? event.description.en ?? event.description.tr ?? "New showtime and ticket details are ready.",
        ru: event.synopsis?.ru ?? event.description.ru ?? event.description.tr ?? "Новые сеансы и билеты готовы.",
        de: event.synopsis?.de ?? event.description.de ?? event.description.tr ?? "Neue Spielzeiten und Ticketdetails sind bereit."
      }
    });
    setNotificationUsed(Number(event.notificationUsed ?? 0));
    setNotificationTitleTr(localizeText(event.title, "tr") || "Sahnede bu hafta");
    setNotificationBodyTr(event.synopsis?.tr?.trim() ? `${localizeText(event.title, "tr")} için yeni gösterim ve bilet bilgisi hazır.` : "Favorindeki oyun için yeni gösterim ve bilet bilgisi hazır.");
  }

  async function refreshEvents() {
    if (!uid) return;
    const snapshot = await getDocs(query(collection(db, "events"), where("organizerId", "==", uid), limit(50)));
    const liveEvents = snapshot.docs
      .map((entry) => ({ id: entry.id, ...entry.data() }) as EventItem)
      .sort((left, right) => Date.parse(right.startsAt ?? "") - Date.parse(left.startsAt ?? ""));
    setEvents(liveEvents);
    applyEvent(liveEvents.find((item) => item.id === selectedId) ?? liveEvents[0] ?? null);
  }

  async function autoTranslate() {
    if (!draft.titleTr.trim() || !draft.descriptionTr.trim() || !draft.synopsisTr.trim()) {
      setStatus("Önce Türkçe başlık, açıklama ve sinopsis gir.");
      return;
    }

    setStatus("Groq ile çeviri hazırlanıyor.");
    try {
      const result = await translateTheaterContent({
        titleTr: draft.titleTr.trim(),
        descriptionTr: draft.descriptionTr.trim(),
        synopsisTr: draft.synopsisTr.trim(),
        notificationTitleTr: notificationTitleTr.trim(),
        notificationBodyTr: notificationBodyTr.trim()
      });
      setTranslations(result.data);
      setStatus("Çeviri hazır.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Çeviri oluşturulamadı.");
    }
  }

  function buildPayload(translated = translations) {
    return {
      categoryId: draft.type,
      title: translated.title.tr ? translated.title : { tr: draft.titleTr.trim(), en: draft.titleTr.trim(), ru: draft.titleTr.trim(), de: draft.titleTr.trim() },
      description: translated.description.tr ? translated.description : { tr: draft.descriptionTr.trim(), en: draft.descriptionTr.trim(), ru: draft.descriptionTr.trim(), de: draft.descriptionTr.trim() },
      synopsis: translated.synopsis.tr ? translated.synopsis : { tr: draft.synopsisTr.trim(), en: draft.synopsisTr.trim(), ru: draft.synopsisTr.trim(), de: draft.synopsisTr.trim() },
      type: draft.type,
      district: draft.district.trim(),
      venueName: draft.venueName.trim(),
      startsAt: draft.startsAt,
      endsAt: draft.endsAt.trim() || undefined,
      priceType: draft.priceType,
      ticketUrl: draft.ticketUrl.trim() || undefined,
      cast: draft.cast.split(",").map((item) => item.trim()).filter(Boolean),
      coverImage: draft.coverImage.trim(),
      videoUrl: draft.videoUrl.trim() || undefined,
      status: draft.status,
      notificationLimit: draft.notificationLimit
    };
  }

  async function saveCurrent() {
    if (!draft.titleTr.trim() || !draft.descriptionTr.trim() || !draft.synopsisTr.trim() || !draft.venueName.trim()) {
      setStatus("Başlık, açıklama, sinopsis ve mekân adı gerekli.");
      return;
    }
    if (!draft.startsAt.trim()) {
      setStatus("Başlangıç tarihi gerekli.");
      return;
    }

    try {
      if (!translations.title.tr || !translations.description.tr || !translations.synopsis.tr) {
        await autoTranslate();
      }
      setStatus(selectedId ? "Etkinlik güncelleniyor." : "Etkinlik oluşturuluyor.");
      const translated = translations.title.tr ? translations : (await translateTheaterContent({
        titleTr: draft.titleTr.trim(),
        descriptionTr: draft.descriptionTr.trim(),
        synopsisTr: draft.synopsisTr.trim(),
        notificationTitleTr: notificationTitleTr.trim(),
        notificationBodyTr: notificationBodyTr.trim()
      })).data;
      if (selectedId) {
        const result = await updateTheaterEvent({ eventId: selectedId, ...buildPayload(translated) });
        setSelectedId(result.data.id);
      } else {
        const result = await createTheaterEvent(buildPayload(translated));
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
    setStatus("Etkinlik arşivleniyor.");
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
      setStatus("Bu etkinlik için bildirim hakkı tükendi.");
      return;
    }

    setStatus("Bildirim gönderiliyor.");
    try {
      const translated = await translateTheaterContent({
        titleTr: notificationTitleTr.trim() || localizeText(selectedEvent?.title ?? translations.title, "tr"),
        descriptionTr: notificationBodyTr.trim() || draft.descriptionTr.trim(),
        synopsisTr: draft.synopsisTr.trim(),
        notificationTitleTr: notificationTitleTr.trim() || localizeText(selectedEvent?.title ?? translations.title, "tr"),
        notificationBodyTr: notificationBodyTr.trim() || "Favorindeki oyun için yeni gösterim ve bilet bilgisi hazır."
      });
      await sendTheaterEventNotification({
        eventId: selectedId,
        title: translated.data.notificationTitle,
        body: translated.data.notificationBody
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

  return (
    <section className="workflow" id={mode === "admin" ? "dt" : "play"}>
      <h2>{mode === "admin" ? "Etkinlik Bildirim Kontrolü" : "Etkinlik Yönetimi"}</h2>
      <p className="meta">Bu panelden oluşturduğun tüm etkinlikler web ve mobilde görünür.</p>

      <div className="catalog-rows" style={{ alignItems: "start" }}>
        <div className="catalog-list" style={{ minWidth: 320 }}>
          {events.length === 0 ? (
            <article className="catalog-empty">
              <strong>Henüz etkinlik yok</strong>
              <span>Yeni bir etkinlik oluşturarak başlayabilirsin.</span>
            </article>
          ) : events.map((event) => (
            <button
              key={event.id}
              className={`catalog-item ${selectedId === event.id ? "active" : ""}`}
              type="button"
              onClick={() => applyEvent(event)}
            >
              <strong>{localizeText(event.title, "tr")}</strong>
              <span>{event.venueName} · {event.district}</span>
              <small>{eventTypeLabelById.get(event.type) ?? event.type} · {event.status === "draft" ? "Taslak" : event.status === "pending" ? "Onay bekliyor" : event.status === "published" ? "Yayında" : "Arşiv"}</small>
            </button>
          ))}
        </div>

        <div className="catalog-editor">
          <div className="hero-actions">
            <button className="secondary" type="button" onClick={() => applyEvent(null)}>Yeni etkinlik</button>
            <button className="secondary" type="button" onClick={() => void refreshEvents()}>Yenile</button>
            <button className="secondary" type="button" onClick={() => void autoTranslate()}>Çeviri oluştur</button>
            <button className="secondary" type="button" onClick={() => void saveCurrent()}>Kaydet</button>
            <button className="secondary" type="button" onClick={() => void deleteCurrent()} disabled={!selectedId}>Sil</button>
          </div>

          <div className="mini-form" style={{ maxWidth: "none" }}>
            <label>Etkinlik kimliği<input value={draft.id} onChange={(event) => setDraft((current) => ({ ...current, id: event.target.value }))} placeholder="bohem-gecesi-2026" /></label>
            <label>Etkinlik türü
              <select className="panel-select" value={draft.type} onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as EventType }))}>
                {eventTypeOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label>Türkçe başlık<input value={draft.titleTr} onChange={(event) => setDraft((current) => ({ ...current, titleTr: event.target.value }))} /></label>
            <label>Türkçe açıklama<textarea rows={3} value={draft.descriptionTr} onChange={(event) => setDraft((current) => ({ ...current, descriptionTr: event.target.value }))} /></label>
            <label>Türkçe sinopsis<textarea rows={4} value={draft.synopsisTr} onChange={(event) => setDraft((current) => ({ ...current, synopsisTr: event.target.value }))} /></label>
            <label>İlçe<input value={draft.district} onChange={(event) => setDraft((current) => ({ ...current, district: event.target.value }))} /></label>
            <label>Mekân adı<input value={draft.venueName} onChange={(event) => setDraft((current) => ({ ...current, venueName: event.target.value }))} /></label>
            <div className="datetime-grid">
              <label>Başlangıç tarihi<input type="date" value={startsAtParts.date} onChange={(event) => setDraft((current) => ({ ...current, startsAt: mergeDateTime(event.target.value, startsAtParts.time) }))} /></label>
              <label>Başlangıç saati<input type="time" value={startsAtParts.time} onChange={(event) => setDraft((current) => ({ ...current, startsAt: mergeDateTime(startsAtParts.date, event.target.value) }))} /></label>
            </div>
            <div className="datetime-grid">
              <label>Bitiş tarihi<input type="date" value={endsAtParts.date} onChange={(event) => setDraft((current) => ({ ...current, endsAt: mergeDateTime(event.target.value, endsAtParts.time) }))} /></label>
              <label>Bitiş saati<input type="time" value={endsAtParts.time} onChange={(event) => setDraft((current) => ({ ...current, endsAt: mergeDateTime(endsAtParts.date, event.target.value) }))} /></label>
            </div>
            <label>Ücret tipi
              <select className="panel-select" value={draft.priceType} onChange={(event) => setDraft((current) => ({ ...current, priceType: event.target.value as "free" | "paid" }))}>
                <option value="paid">Ücretli</option>
                <option value="free">Ücretsiz</option>
              </select>
            </label>
            <label>Bilet bağlantısı<input value={draft.ticketUrl} onChange={(event) => setDraft((current) => ({ ...current, ticketUrl: event.target.value }))} /></label>
            <label>Oyuncu kadrosu<textarea rows={2} value={draft.cast} onChange={(event) => setDraft((current) => ({ ...current, cast: event.target.value }))} placeholder="Oyuncu 1, Oyuncu 2" /></label>
            <label>Kapak görseli<input value={draft.coverImage} onChange={(event) => setDraft((current) => ({ ...current, coverImage: event.target.value }))} /></label>
            <label>Video bağlantısı<input value={draft.videoUrl} onChange={(event) => setDraft((current) => ({ ...current, videoUrl: event.target.value }))} /></label>
            <label>Durum
              <select className="panel-select" value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as PublishStatus }))}>
                <option value="draft">Taslak</option>
                <option value="pending">Onay bekliyor</option>
                <option value="published">Yayında</option>
                <option value="archived">Arşiv</option>
              </select>
            </label>
          </div>

          <div className="ops-block" style={{ marginTop: 20 }} aria-label="Otomatik çeviri önizlemesi">
            <h3>Otomatik çeviri önizlemesi</h3>
            <div className="mini-form" style={{ maxWidth: "none" }}>
              <label>Başlık çevirisi<textarea rows={2} readOnly value={formatTranslation(translations.title)} /></label>
              <label>Açıklama çevirisi<textarea rows={2} readOnly value={formatTranslation(translations.description)} /></label>
              <label>Sinopsis çevirisi<textarea rows={2} readOnly value={formatTranslation(translations.synopsis)} /></label>
            </div>
          </div>

          <div className="metric-strip">
            <div className="metric"><span>Bildirim limiti</span><strong>{draft.notificationLimit}</strong></div>
            <div className="metric"><span>Kullanılan hak</span><strong>{notificationUsed}</strong></div>
            <div className="metric"><span>Kalan hak</span><strong>{remainingNotifications}</strong></div>
          </div>

          <div className="ops-block" style={{ marginTop: 20, background: "var(--surface-2)" }} aria-label="Bildirim gönderimi">
            <h3>Bildirim gönderimi</h3>
            <label>
              Bildirim etkinliği
              <select className="panel-select" value={selectedId} onChange={(event) => applyEvent(events.find((item) => item.id === event.target.value) ?? null)}>
                <option value="">Etkinlik seç</option>
                {events.map((event) => <option key={event.id} value={event.id}>{localizeText(event.title, "tr")}</option>)}
              </select>
            </label>
            <div className="mini-form" style={{ maxWidth: "none" }}>
              <label>Bildirim başlığı<input value={notificationTitleTr} onChange={(event) => setNotificationTitleTr(event.target.value)} /></label>
              <label>Bildirim mesajı<textarea rows={3} value={notificationBodyTr} onChange={(event) => setNotificationBodyTr(event.target.value)} /></label>
            </div>
            <div className="hero-actions">
              <button className="secondary" onClick={sendNotification} disabled={!selectedId}>Bildirim gönder</button>
              {mode === "admin" ? <button className="secondary" onClick={increaseLimit} disabled={!selectedId}>Bildirim limitini artır</button> : null}
            </div>
          </div>

          <p className="meta">{selectedEvent ? `Seçili etkinlik: ${localizeText(selectedEvent.title, "tr")}` : "Seçili etkinlik yok."}</p>
          <p className="meta" aria-live="polite">{status}</p>
        </div>
      </div>
    </section>
  );
}

function formatTranslation(text: LocalizedText) {
  return [
    `TR: ${text.tr || "-"}`,
    `EN: ${text.en || "-"}`,
    `RU: ${text.ru || "-"}`,
    `DE: ${text.de || "-"}`
  ].join("\n");
}
