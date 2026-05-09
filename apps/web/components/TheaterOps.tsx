"use client";

import { adjustTheaterNotificationLimit, createTheaterEvent, sendTheaterEventNotification, translateSynopsisDraft } from "@/lib/panel-actions";
import { db } from "@/lib/firebase";
import { featuredEvents, type EventItem } from "@nar/core";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

export function TheaterOps({ mode = "theater" }: { mode?: "theater" | "admin" }) {
  const sampleEvent = featuredEvents.find((event) => event.type === "theater") ?? featuredEvents[0];
  const initialUsed = sampleEvent.notificationUsed ?? 0;
  const [events, setEvents] = useState<EventItem[]>([sampleEvent]);
  const [synopsisTr, setSynopsisTr] = useState("Antalya gecesinde kesiÅŸen yollar ve kÃ¼Ã§Ã¼k sÄ±rlar Ã¼zerine sÄ±cak bir oyun.");
  const [eventId, setEventId] = useState(sampleEvent.id);
  const [notificationLimit, setNotificationLimit] = useState(sampleEvent.notificationLimit);
  const [categoryId, setCategoryId] = useState(sampleEvent.categoryId ?? sampleEvent.type);
  const [categories, setCategories] = useState<Array<{ id: string; title: { tr: string; en?: string; ru?: string; de?: string } }>>([]);
  const [notificationUsed, setNotificationUsed] = useState(initialUsed);
  const [status, setStatus] = useState("CanlÄ± tiyatro etkinlikleri yÃ¼kleniyor.");
  const [translation, setTranslation] = useState("Ã‡eviri taslaÄŸÄ± henÃ¼z oluÅŸturulmadÄ±.");
  const remainingNotifications = useMemo(() => Math.max(notificationLimit - notificationUsed, 0), [notificationLimit, notificationUsed]);

  useEffect(() => {
    let active = true;

    async function loadTheaterEvents() {
      try {
        const snapshot = await getDocs(query(
          collection(db, "events"),
          where("type", "==", "theater"),
          orderBy("startsAt", "desc"),
          limit(24)
        ));
        if (!active) return;
        const liveEvents = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as EventItem);
        const nextEvents = liveEvents.length ? liveEvents : [sampleEvent];
        const selected = nextEvents.find((event) => event.id === eventId) ?? nextEvents[0];
        setEvents(nextEvents);
        setEventId(selected.id);
        setNotificationLimit(selected.notificationLimit);
        setNotificationUsed(selected.notificationUsed ?? 0);
        setStatus(liveEvents.length ? "CanlÄ± tiyatro etkinlikleri kullanÄ±lÄ±yor." : "HenÃ¼z canlÄ± tiyatro etkinliÄŸi yok.");
      } catch (error) {
        if (!active) return;
        setEvents([sampleEvent]);
        setStatus(error instanceof Error ? error.message : "Tiyatro etkinlikleri yÃ¼klenemedi.");
      }
    getDocs(query(collection(db, "categories"), where("target", "==", "event"), where("status", "==", "published")))
      .then((snapshot) => {
        if (!active) return;
        const liveCategories = snapshot.docs
          .map((entry) => entry.data() as { id?: string; title?: { tr: string; en?: string; ru?: string; de?: string } })
          .filter((category) => category.id && category.title?.tr)
          .map((category) => ({ id: category.id as string, title: category.title as { tr: string; en?: string; ru?: string; de?: string } }));
        setCategories(liveCategories);
        if (liveCategories.length && !liveCategories.some((item) => item.id === categoryId)) {
          setCategoryId(liveCategories[0].id);
        }
      })
      .catch(() => {
        if (!active) return;
        setCategories([]);
      });

    void loadTheaterEvents();
    }

    void loadTheaterEvents();

    return () => {
      active = false;
    };
  }, []);

  function selectEvent(nextEventId: string) {
    const selected = events.find((event) => event.id === nextEventId);
    setEventId(nextEventId);
    if (!selected) return;
    setNotificationLimit(selected.notificationLimit);
    setNotificationUsed(selected.notificationUsed ?? 0);
    setSynopsisTr(selected.synopsis?.tr ?? selected.description.tr);
  }

  async function translate() {
    setStatus("Sinopsis Ã§eviri taslaÄŸÄ± hazÄ±rlanÄ±yor.");
    try {
      const result = await translateSynopsisDraft(synopsisTr);
      setTranslation(result.data.synopsis.en);
      setStatus("Sinopsis Ã§eviri taslaÄŸÄ± oluÅŸturuldu.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Sinopsis Ã§evirisi oluÅŸturulamadÄ±.");
    }
  }

  async function createDraft() {
    setStatus("Oyun taslaÄŸÄ± oluÅŸturuluyor.");
    try {
      const result = await createTheaterEvent({
        categoryId,
        title: {
          tr: "Yeni Sahne TaslaÄŸÄ±",
          en: "New Stage Draft",
          ru: "ĞĞ¾Ğ²Ñ‹Ğ¹ ÑÑ†ĞµĞ½Ğ¸Ñ‡ĞµÑĞºĞ¸Ğ¹ Ñ‡ĞµÑ€Ğ½Ğ¾Ğ²Ğ¸Ğº",
          de: "Neuer BÃ¼hnenentwurf"
        },
        description: {
          tr: synopsisTr,
          en: translation,
          ru: synopsisTr,
          de: synopsisTr
        },
        synopsis: {
          tr: synopsisTr,
          en: translation,
          ru: synopsisTr,
          de: synopsisTr
        },
        type: "theater",
        district: "MuratpaÅŸa",
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
      setStatus("Oyun taslaÄŸÄ± oluÅŸturuldu; bildirim limiti 3, kullanÄ±lan hak 0.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Oyun taslaÄŸÄ± oluÅŸturulamadÄ±.");
    }
  }

  async function sendNotification() {
    if (remainingNotifications <= 0) {
      setStatus("Bu oyun iÃ§in bildirim hakkÄ± tÃ¼kendi.");
      return;
    }
    setStatus("Oyun bildirimi gÃ¶nderiliyor.");
    try {
      await sendTheaterEventNotification({
        eventId,
        title: {
          tr: "Sahnede bu hafta",
          en: "On stage this week",
          ru: "ĞĞ° ÑÑ†ĞµĞ½Ğµ Ğ½Ğ° ÑÑ‚Ğ¾Ğ¹ Ğ½ĞµĞ´ĞµĞ»Ğµ",
          de: "Diese Woche auf der BÃ¼hne"
        },
        body: {
          tr: "Favorindeki oyun iÃ§in yeni gÃ¶sterim ve bilet bilgisi hazÄ±r.",
          en: "New showtime and ticket details are ready for your favorite play.",
          ru: "Ğ”Ğ»Ñ Ğ²Ğ°ÑˆĞµĞ³Ğ¾ Ğ»ÑĞ±Ğ¸Ğ¼Ğ¾Ğ³Ğ¾ ÑĞ¿ĞµĞºÑ‚Ğ°ĞºĞ»Ñ Ğ´Ğ¾ÑÑ‚ÑƒĞ¿Ğ½Ñ‹ Ğ½Ğ¾Ğ²Ñ‹Ğµ ÑĞµĞ°Ğ½ÑÑ‹ Ğ¸ Ğ±Ğ¸Ğ»ĞµÑ‚Ñ‹.",
          de: "Neue Spielzeit und Ticketdetails fÃ¼r dein LieblingsstÃ¼ck sind bereit."
        }
      });
      setNotificationUsed((value) => value + 1);
      setStatus("Bildirim gÃ¶nderildi ve kullanÄ±lan hak artÄ±rÄ±ldÄ±.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Bildirim gÃ¶nderilemedi.");
    }
  }

  async function increaseLimit() {
    const nextLimit = notificationLimit + 1;
        <label>
          Etkinlik kategorisi
          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            {categories.length > 0 ? (
              categories.map((category) => <option key={category.id} value={category.id}>{category.title.tr}</option>)
            ) : (
              <option value="theater">Tiyatro</option>
            )}
          </select>
        </label>
    setStatus("Admin bildirim limiti gÃ¼ncelleniyor.");
    try {
      await adjustTheaterNotificationLimit({ eventId, notificationLimit: nextLimit });
      setNotificationLimit(nextLimit);
      setStatus("Bildirim limiti admin tarafÄ±ndan artÄ±rÄ±ldÄ±.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Bildirim limiti gÃ¼ncellenemedi.");
    }
  }

  return (
    <section className="workflow" id={mode === "admin" ? "dt" : "play"}>
      <h2>{mode === "admin" ? "Tiyatro Bildirim KontrolÃ¼" : "Tiyatro Ãœretim AkÄ±ÅŸÄ±"}</h2>
      <div className="mini-form">
        <label>
          TÃ¼rkÃ§e sinopsis
          <textarea value={synopsisTr} onChange={(event) => setSynopsisTr(event.target.value)} rows={4} />
        </label>
        <label>
          Oyun kimliÄŸi
          <select value={eventId} onChange={(event) => selectEvent(event.target.value)}>
            {events.map((event) => <option key={event.id} value={event.id}>{event.title.tr}</option>)}
          </select>
        </label>
        <label>
          Manuel oyun kimliÄŸi
          <input value={eventId} onChange={(event) => setEventId(event.target.value)} />
        </label>
        <div className="metric-strip">
          <div className="metric">
            <span>Bildirim limiti</span>
            <strong>{notificationLimit}</strong>
          </div>
          <div className="metric">
            <span>KullanÄ±lan hak</span>
            <strong>{notificationUsed}</strong>
          </div>
          <div className="metric">
            <span>Kalan hak</span>
            <strong>{remainingNotifications}</strong>
          </div>
        </div>
        <div className="hero-actions">
          <button className="secondary" onClick={translate}>Ã‡eviri taslaÄŸÄ± oluÅŸtur</button>
          <button className="primary" onClick={createDraft}>Oyun taslaÄŸÄ± oluÅŸtur</button>
          <button className="secondary" onClick={sendNotification}>Bildirim hakkÄ± kullan</button>
          {mode === "admin" ? <button className="secondary" onClick={increaseLimit}>Bildirim limitini artÄ±r</button> : null}
        </div>
        <p className="meta">{translation}</p>
        <p className="meta" aria-live="polite">{status}</p>
      </div>
    </section>
  );
}