"use client";

import { adjustTheaterNotificationLimit, createTheaterEvent, sendTheaterEventNotification, translateSynopsisDraft } from "@/lib/panel-actions";
import { db } from "@/lib/firebase";
import { localizeText, type EventItem, type LocalizedText } from "@nar/core";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

type CategoryOption = { id: string; title: LocalizedText; sortOrder?: number };

export function TheaterOps({ mode = "theater" }: { mode?: "theater" | "admin" }) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventId, setEventId] = useState("");
  const [categoryId, setCategoryId] = useState("theater");
  const [notificationLimit, setNotificationLimit] = useState(0);
  const [notificationUsed, setNotificationUsed] = useState(0);
  const [synopsisTr, setSynopsisTr] = useState("");
  const [translation, setTranslation] = useState("");
  const [status, setStatus] = useState("Canlı tiyatro etkinlikleri yükleniyor.");
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const remainingNotifications = useMemo(
    () => Math.max(notificationLimit - notificationUsed, 0),
    [notificationLimit, notificationUsed]
  );

  useEffect(() => {
    let active = true;

    async function loadTheaterEvents() {
      try {
        const snapshot = await getDocs(
          query(collection(db, "events"), where("type", "==", "theater"), limit(24))
        );
        if (!active) return;

        const liveEvents = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as EventItem);
        const selected = liveEvents.find((event) => event.id === eventId) ?? liveEvents[0];

        setEvents(liveEvents);
        if (selected) {
          setEventId(selected.id);
          setCategoryId(selected.categoryId ?? selected.type);
          setNotificationLimit(selected.notificationLimit ?? 0);
          setNotificationUsed(selected.notificationUsed ?? 0);
          setSynopsisTr(localizeText(selected.synopsis ?? selected.description, "tr"));
        } else {
          setEventId("");
          setCategoryId("theater");
          setNotificationLimit(0);
          setNotificationUsed(0);
          setSynopsisTr("");
        }
        setStatus(liveEvents.length ? "Canlı tiyatro etkinlikleri kullanılıyor." : "Henüz canlı tiyatro etkinliği yok.");
      } catch (error) {
        if (!active) return;
        setEvents([]);
        setEventId("");
        setCategoryId("theater");
        setNotificationLimit(0);
        setNotificationUsed(0);
        setSynopsisTr("");
        setStatus(error instanceof Error ? error.message : "Tiyatro etkinlikleri yüklenemedi.");
      }
    }

    async function loadCategories() {
      try {
        const snapshot = await getDocs(
          query(collection(db, "categories"), where("target", "==", "event"), where("status", "==", "published"), limit(50))
        );
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
        if (liveCategories.length && !liveCategories.some((item) => item.id === categoryId)) {
          setCategoryId(liveCategories[0].id);
        }
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
  }, [categoryId, eventId]);

  function selectEvent(nextEventId: string) {
    const selected = events.find((event) => event.id === nextEventId);
    setEventId(nextEventId);
    if (!selected) return;
    setCategoryId(selected.categoryId ?? selected.type);
    setNotificationLimit(selected.notificationLimit);
    setNotificationUsed(selected.notificationUsed ?? 0);
    setSynopsisTr(localizeText(selected.synopsis ?? selected.description, "tr"));
  }

  async function translate() {
    setStatus("Sinopsis çeviri taslağı hazırlanıyor.");
    try {
      const result = await translateSynopsisDraft(synopsisTr);
      setTranslation(result.data.synopsis.en);
      setStatus("Sinopsis çeviri taslağı oluşturuldu.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Sinopsis çevirisi oluşturulamadı.");
    }
  }

  async function createDraft() {
    setStatus("Oyun taslağı oluşturuluyor.");
    try {
      const result = await createTheaterEvent({
        categoryId,
        title: {
          tr: "Yeni Sahne Taslağı",
          en: "New Stage Draft",
          ru: "Новый сценический черновик",
          de: "Neuer Bühnenentwurf"
        },
        description: {
          tr: synopsisTr,
          en: translation || synopsisTr,
          ru: synopsisTr,
          de: synopsisTr
        },
        synopsis: {
          tr: synopsisTr,
          en: translation || synopsisTr,
          ru: synopsisTr,
          de: synopsisTr
        },
        type: "theater",
        district: "Muratpaşa",
        venueName: "Nar Sahne",
        startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        priceType: "paid",
        ticketUrl: "https://example.com/bilet",
        cast: ["Oyuncu 1", "Oyuncu 2"],
        coverImage: "https://images.unsplash.com/photo-1503095396549-807759245b35",
        status: "draft",
        notificationLimit: 3
      });
      setEventId(result.data.id);
      setNotificationLimit(3);
      setNotificationUsed(0);
      setStatus("Oyun taslağı oluşturuldu; bildirim limiti 3, kullanılan hak 0.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Oyun taslağı oluşturulamadı.");
    }
  }

  async function sendNotification() {
    if (remainingNotifications <= 0) {
      setStatus("Bu oyun için bildirim hakkı tükendi.");
      return;
    }

    setStatus("Oyun bildirimi gönderiliyor.");
    try {
      await sendTheaterEventNotification({
        eventId,
        title: {
          tr: "Sahnede bu hafta",
          en: "On stage this week",
          ru: "На сцене на этой неделе",
          de: "Diese Woche auf der Bühne"
        },
        body: {
          tr: "Favorindeki oyun için yeni gösterim ve bilet bilgisi hazır.",
          en: "New showtime and ticket details are ready for your favorite play.",
          ru: "Для вашего любимого спектакля готовы новые сеансы и билеты.",
          de: "Neue Spielzeit und Ticketdetails für dein Lieblingsstück sind bereit."
        }
      });
      setNotificationUsed((value) => value + 1);
      setStatus("Bildirim gönderildi ve kullanılan hak artırıldı.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Bildirim gönderilemedi.");
    }
  }

  async function increaseLimit() {
    const nextLimit = notificationLimit + 1;
    setStatus("Admin bildirim limiti güncelleniyor.");
    try {
      await adjustTheaterNotificationLimit({ eventId, notificationLimit: nextLimit });
      setNotificationLimit(nextLimit);
      setStatus("Bildirim limiti admin tarafından artırıldı.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Bildirim limiti güncellenemedi.");
    }
  }

  return (
    <section className="workflow" id={mode === "admin" ? "dt" : "play"}>
      <h2>{mode === "admin" ? "Tiyatro Bildirim Kontrolü" : "Tiyatro Üretim Akışı"}</h2>
      <div className="mini-form">
        <label>
          Türkçe sinopsis
          <textarea value={synopsisTr} onChange={(event) => setSynopsisTr(event.target.value)} rows={4} />
        </label>
        <label>
          Oyun kimliği
          <select value={eventId} onChange={(event) => selectEvent(event.target.value)}>
            {events.length > 0 ? (
              events.map((event) => <option key={event.id} value={event.id}>{localizeText(event.title, "tr")}</option>)
            ) : (
              <option value="">Henüz kayıt yok</option>
            )}
          </select>
        </label>
        <label>
          Etkinlik kategorisi
          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            {categories.length > 0 ? (
              categories.map((category) => <option key={category.id} value={category.id}>{localizeText(category.title, "tr")}</option>)
            ) : (
              <option value="theater">Tiyatro</option>
            )}
          </select>
        </label>
        <label>
          Manuel oyun kimliği
          <input value={eventId} onChange={(event) => setEventId(event.target.value)} />
        </label>
        <div className="metric-strip">
          <div className="metric">
            <span>Bildirim limiti</span>
            <strong>{notificationLimit}</strong>
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
          <button className="secondary" onClick={translate}>Çeviri taslağı oluştur</button>
          <button className="primary" onClick={createDraft}>Oyun taslağı oluştur</button>
          <button className="secondary" onClick={sendNotification}>Bildirim hakkı kullan</button>
          {mode === "admin" ? <button className="secondary" onClick={increaseLimit}>Bildirim limitini artır</button> : null}
        </div>
        <p className="meta">{translation}</p>
        <p className="meta" aria-live="polite">{status}</p>
      </div>
    </section>
  );
}
