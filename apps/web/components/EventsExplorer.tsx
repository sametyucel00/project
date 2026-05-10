"use client";

import { eventTypes, eventViewModes, featuredEvents, getEventTypeId, type EventItem } from "@nar/core";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { CalendarRange, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createEventCalendarUrl, DiscoveryList, FilterPills, type FilterOption, localizeText } from "./DiscoveryList";
import { useLocale } from "./LocaleProvider";
import { fetchLiveEvents } from "@/lib/live-data";
import { SectionEyebrow } from "./SectionEyebrow";

function startOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function uniqueEventsByTitle(items: EventItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = localizeText(item.title, "tr");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function compareByPriority(first: EventItem, second: EventItem, now: Date) {
  const firstDate = new Date(first.startsAt);
  const secondDate = new Date(second.startsAt);
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const firstCurrentMonth = firstDate.getMonth() === currentMonth && firstDate.getFullYear() === currentYear;
  const secondCurrentMonth = secondDate.getMonth() === currentMonth && secondDate.getFullYear() === currentYear;
  if (firstCurrentMonth !== secondCurrentMonth) return firstCurrentMonth ? -1 : 1;

  const firstFuture = firstDate.getTime() >= now.getTime();
  const secondFuture = secondDate.getTime() >= now.getTime();
  if (firstFuture !== secondFuture) return firstFuture ? -1 : 1;

  if (firstFuture && secondFuture) return firstDate.getTime() - secondDate.getTime();
  return secondDate.getTime() - firstDate.getTime();
}

export function EventsExplorer() {
  const { locale, t } = useLocale();
  const viewModeLabels = {
    month: { tr: "Aylık", en: "Month", ru: "Месяц", de: "Monat" },
    week: { tr: "Haftalık", en: "Week", ru: "Неделя", de: "Woche" },
    list: { tr: "Liste", en: "List", ru: "Liste", de: "Liste" },
    map: { tr: "Harita", en: "Map", ru: "Harita", de: "Karte" }
  } as const;
  const filterLabels = {
    today: { tr: "Bugün", en: "Today", ru: "Сегодня", de: "Heute" },
    thisWeek: { tr: "Bu hafta", en: "This week", ru: "На этой неделе", de: "Diese Woche" },
    month: { tr: "Bu ay", en: "This month", ru: "Этот месяц", de: "Dieser Monat" },
    soon: { tr: "Yakında", en: "Soon", ru: "Скоро", de: "Bald" }
  } as const;
  const searchPlaceholder = {
    tr: "Etkinlik adı, tür, mekan veya ilçe ara",
    en: "Search event name, type, venue or district",
    ru: "Искать событие, тип, площадку или район",
    de: "Eventname, Typ, Ort oder Bezirk suchen"
  }[locale];
  const maySpotlightTitle = {
    tr: "Mayıs'ta Antalya",
    en: "May in Antalya",
    ru: "Май в Анталье",
    de: "Mai in Antalya"
  }[locale];
  const maySpotlightLead = {
    tr: "Festival, konser, bale ve şehir sahnesinden güncel Mayıs seçkisi.",
    en: "A current May selection from festivals, concerts, ballet and the city stage.",
    ru: "Актуальная майская подборка фестивалей, концертов, балета и городской сцены.",
    de: "Eine aktuelle Mai-Auswahl aus Festivals, Konzerten, Ballett und Stadtszene."
  }[locale];
  const [items, setItems] = useState<EventItem[]>([...featuredEvents]);
  const [activeView, setActiveView] = useState("list");
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [customCategories, setCustomCategories] = useState<Array<{ id: string; title: { tr: string; en?: string; ru?: string; de?: string } }>>([]);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    fetchLiveEvents(500)
      .then((result) => {
        if (!active) return;
        const merged = [...featuredEvents];
        for (const event of result) {
          if (!merged.some((item) => item.id === event.id)) merged.push(event);
        }
        setItems(merged);
      })
      .catch(() => {
        if (!active) return;
        setItems([...featuredEvents]);
      });

    getDocs(collection(db, "categories"))
      .then((snapshot) => {
        if (!active) return;
        const liveCategories = snapshot.docs
          .map((entry) => entry.data() as { id?: string; target?: string; status?: string; title?: { tr: string; en?: string; ru?: string; de?: string } })
          .filter((category) => category.target === "event" && category.status === "published" && category.id && category.title?.tr)
          .map((category) => ({ id: category.id as string, title: category.title as { tr: string; en?: string; ru?: string; de?: string } }));
        setCustomCategories(liveCategories);
      })
      .catch(() => {
        if (!active) return;
        setCustomCategories([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const viewModes = useMemo<FilterOption[]>(() => eventViewModes.map((mode) => ({ id: mode.id, label: viewModeLabels[mode.id][locale] })), [locale]);

  const eventFilters = useMemo<FilterOption[]>(() => [
    { id: "all", label: t("common.explore") },
    { id: "today", label: filterLabels.today[locale] },
    { id: "thisWeek", label: filterLabels.thisWeek[locale] },
    { id: "month", label: filterLabels.month[locale] },
    { id: "soon", label: filterLabels.soon[locale] }
  ], [locale, t]);

  const categoryFilters = useMemo<FilterOption[]>(() => [
    { id: "all", label: t("common.explore") },
    ...[
      ...eventTypes.map((type) => ({ id: type.id, title: type.title })),
      ...customCategories.filter((category) => !eventTypes.some((type) => type.id === category.id))
    ].map((type) => ({ id: type.id, label: localizeText(type.title, locale) }))
  ], [customCategories, locale, t]);

  const filteredItems = useMemo(() => {
    const now = new Date();
    const startToday = startOfDay(now);
    const endWeek = new Date(startToday);
    endWeek.setDate(endWeek.getDate() + 7);
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const byFilter = items.filter((event) => {
      const eventCategoryId = event.categoryId ?? getEventTypeId(event);
      const customCategoryTitle = customCategories.find((category) => category.id === eventCategoryId)?.title;
      const defaultTypeTitle = eventTypes.find((type) => type.id === getEventTypeId(event))?.title;
      const searchHaystack = [
        localizeText(event.title, locale),
        event.title.en,
        event.title.ru,
        event.title.de,
        localizeText(event.description, locale),
        event.description.en,
        event.description.ru,
        event.description.de,
        localizeText(event.synopsis, locale),
        event.synopsis?.en,
        event.synopsis?.ru,
        event.synopsis?.de,
        event.venueName,
        event.district,
        event.type,
        eventCategoryId,
        customCategoryTitle?.tr,
        defaultTypeTitle?.tr
      ].filter(Boolean).join(" ").toLocaleLowerCase("tr-TR");

      if (searchText.trim().length > 0) {
        const query = searchText.trim().toLocaleLowerCase("tr-TR");
        if (!searchHaystack.includes(query)) return false;
      }

      if (activeCategory !== "all" && eventCategoryId !== activeCategory && getEventTypeId(event) !== activeCategory) {
        return false;
      }

      const eventDate = new Date(event.startsAt);
      switch (activeFilter) {
        case "today":
          return startOfDay(eventDate).getTime() === startToday.getTime();
        case "thisWeek":
          return eventDate >= startToday && eventDate < endWeek;
        case "month":
          return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
        case "soon":
          return eventDate >= startToday;
        default:
          return true;
      }
    });

    const sorted = [...byFilter].sort((first, second) => compareByPriority(first, second, now));

    if (activeView === "month") {
      return sorted.filter((event) => {
        const date = new Date(event.startsAt);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
    }

    if (activeView === "week") {
      return sorted.filter((event) => {
        const date = new Date(event.startsAt);
        return date >= startToday && date < endWeek;
      });
    }

    return sorted;
  }, [activeCategory, activeFilter, activeView, customCategories, items, searchText]);

  useEffect(() => {
    if (!searchText.trim()) return;
    const timer = window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 420);
    return () => window.clearTimeout(timer);
  }, [filteredItems.length, searchText]);

  const monthlyPreview = filteredItems.slice(0, 8).map((event) => ({
    day: new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : locale, { day: "2-digit" }).format(new Date(event.startsAt)),
    month: new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : locale, { month: "short" }).format(new Date(event.startsAt)),
    title: localizeText(event.title, locale),
    venue: event.venueName,
    calendarUrl: createEventCalendarUrl(event)
  }));

  const maySpotlight = useMemo(() => uniqueEventsByTitle(
    items
      .filter((event) => event.startsAt.startsWith("2026-05"))
      .sort((first, second) => first.startsAt.localeCompare(second.startsAt))
  ).slice(0, 6), [items]);

  return (
    <>
      <div className="section-center-column section-center-column-wide">
        <SectionEyebrow icon={CalendarRange}>{t("events.eyebrow")}</SectionEyebrow>
        <h1>{t("events.title")}</h1>
        <p className="lead">{t("events.lead")}</p>
      </div>
      <label className="search-row search-row-spacious" aria-label="Etkinlik arama">
        <Search size={17} />
        <input
          type="search"
          placeholder={searchPlaceholder}
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
      </label>

      <section className="section" aria-labelledby="mayis-ajandasi-baslik">
        <div className="section-head">
          <h2 id="mayis-ajandasi-baslik">{maySpotlightTitle}</h2>
          <p>{maySpotlightLead}</p>
        </div>
        <div className="rail">
          {maySpotlight.map((event) => (
            <article className="feature" key={event.id}>
              <span className="event-meta">{new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeStyle: "short" }).format(new Date(event.startsAt))}</span>
              <h3>{localizeText(event.title, locale)}</h3>
              <p>{event.venueName} · {event.district}</p>
            </article>
          ))}
        </div>
      </section>

      <FilterPills activeId={activeView} ariaLabel="Etkinlik görünüm modları" onChange={setActiveView} options={viewModes} />
      <FilterPills activeId={activeCategory} ariaLabel="Etkinlik kategorileri" onChange={setActiveCategory} options={categoryFilters} />
      <FilterPills activeId={activeFilter} ariaLabel="Etkinlik filtreleri" onChange={setActiveFilter} options={eventFilters} />

      {activeView !== "map" ? (
        <div className="orders-list" aria-label={t("events.monthlyPreview")}>
          {monthlyPreview.map((item) => (
            <article key={`${item.day}-${item.title}`}>
              <div>
                <strong>{item.day} {item.month}</strong>
                <span>{item.title} · {item.venue}</span>
              </div>
              <a aria-label={`${item.title} için ${t("events.addToCalendar")}`} className="calendar-link" href={item.calendarUrl} rel="noreferrer" target="_blank">{t("events.addToCalendar")}</a>
            </article>
          ))}
        </div>
      ) : (
        <section className="section section-tight">
          <div className="section-head">
            <h2>{viewModeLabels.map[locale]}</h2>
            <p>{locale === "tr" ? "Harita görünümü için etkinliğe tıklayıp detay ekranındaki konum alanını kullanabilirsin." : locale === "en" ? "Use the event detail location area to work with map view." : locale === "ru" ? "Используйте блок локации в деталях события для карты." : "Nutze den Standortbereich in den Eventdetails für die Kartenansicht."}</p>
          </div>
        </section>
      )}

      <div ref={resultsRef}>
        <DiscoveryList items={filteredItems} type="events" />
      </div>
    </>
  );
}
