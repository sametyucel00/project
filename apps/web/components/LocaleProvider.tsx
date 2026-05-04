"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type SiteLocale = "tr" | "en" | "ru" | "de";

type Dictionary = Record<string, Record<SiteLocale, string>>;

const dictionary: Dictionary = {
  "common.close": { tr: "Kapat", en: "Close", ru: "Закрыть", de: "Schließen" },
  "common.start": { tr: "Başla", en: "Start", ru: "Начать", de: "Starten" },
  "common.contact": { tr: "İletişim", en: "Contact", ru: "Контакты", de: "Kontakt" },
  "common.mobileApp": { tr: "Mobil Uygulama", en: "Mobile App", ru: "Мобильное приложение", de: "Mobile App" },
  "common.businessesFor": { tr: "İşletmeler İçin", en: "For Businesses", ru: "Для бизнеса", de: "Für Unternehmen" },
  "common.explore": { tr: "Keşfet", en: "Explore", ru: "Открыть", de: "Entdecken" },
  "common.noContent": { tr: "Henüz içerik yok", en: "No content yet", ru: "Пока нет контента", de: "Noch kein Inhalt" },
  "common.tryOtherFilters": { tr: "Filtreleri değiştirerek tekrar deneyebilirsin.", en: "Try changing the filters.", ru: "Попробуйте изменить фильтры.", de: "Versuche andere Filter." },
  "common.unspecified": { tr: "Belirtilmemiş", en: "Not specified", ru: "Не указано", de: "Nicht angegeben" },
  "common.open": { tr: "Açık", en: "Open", ru: "Открыто", de: "Offen" },
  "common.qrActive": { tr: "QR aktif", en: "QR active", ru: "QR активен", de: "QR aktiv" },
  "common.qrOptional": { tr: "QR gerekmez", en: "No QR needed", ru: "QR не нужен", de: "Kein QR nötig" },
  "nav.places": { tr: "Mekanlar", en: "Places", ru: "Места", de: "Orte" },
  "nav.events": { tr: "Etkinlikler", en: "Events", ru: "События", de: "Events" },
  "nav.offers": { tr: "Fırsatlar", en: "Offers", ru: "Предложения", de: "Angebote" },
  "nav.business": { tr: "İşletmeler İçin", en: "For Businesses", ru: "Для бизнеса", de: "Für Unternehmen" },
  "nav.about": { tr: "Hakkımızda", en: "About", ru: "О нас", de: "Über uns" },
  "nav.contact": { tr: "İletişim", en: "Contact", ru: "Контакты", de: "Kontakt" },
  "nav.login": { tr: "Giriş", en: "Login", ru: "Вход", de: "Login" },
  "footer.tagline": {
    tr: "Şehri, etkinlikleri ve fırsatları daha rahat keşfet.",
    en: "Explore the city, events and offers more comfortably.",
    ru: "Открывайте город, события и предложения с большим комфортом.",
    de: "Entdecke Stadt, Events und Angebote entspannter."
  },
  "home.eyebrow": {
    tr: "Antalya'dan başlayan modern şehir rehberi",
    en: "A modern city guide starting from Antalya",
    ru: "Современный городской гид, начинающийся в Анталье",
    de: "Moderner City-Guide aus Antalya"
  },
  "home.title": {
    tr: "Nar Rehberi ile şehir, fırsat ve sahne aynı akışta.",
    en: "City, offers and stages flow together with Nar Rehberi.",
    ru: "Город, предложения и сцена в одном потоке с Nar Rehberi.",
    de: "Stadt, Angebote und Bühne in einem Fluss mit Nar Rehberi."
  },
  "home.lead": {
    tr: "Mekan keşfi, etkinlik takvimi, fırsatlar ve şehir önerileri tek üyelikle yanında.",
    en: "Places, events, offers and city suggestions come together in one account.",
    ru: "Места, события, предложения и городские советы собраны в одной учетной записи.",
    de: "Orte, Events, Angebote und Stadttipps kommen in einem Konto zusammen."
  },
  "login.eyebrow": { tr: "Tek hesap", en: "One account", ru: "Одна учетная запись", de: "Ein Konto" },
  "login.title": {
    tr: "Nar Rehberi hesabına hızlıca gir.",
    en: "Sign in to your Nar Rehberi account quickly.",
    ru: "Быстро войдите в аккаунт Nar Rehberi.",
    de: "Melde dich schnell bei deinem Nar Rehberi Konto an."
  },
  "login.lead": {
    tr: "Bireysel kullanıcı, işletme veya tiyatro hesabı seçerek sana uygun alana geç.",
    en: "Choose an individual, business or theater account and continue to the right area.",
    ru: "Выберите личный, бизнес- или театральный аккаунт и продолжайте дальше.",
    de: "Wähle ein privates, Business- oder Theaterkonto und gehe direkt weiter."
  },
  "contact.eyebrow": { tr: "İletişim Formu", en: "Contact Form", ru: "Форма связи", de: "Kontaktformular" },
  "contact.title": {
    tr: "İş birliği türünü seç, doğru ekibe ulaş.",
    en: "Choose your topic and reach the right team.",
    ru: "Выберите тему и свяжитесь с нужной командой.",
    de: "Wähle dein Thema und erreiche das richtige Team."
  },
  "contact.name": { tr: "Ad Soyad", en: "Full Name", ru: "Имя и фамилия", de: "Vor- und Nachname" },
  "contact.email": { tr: "E-Posta", en: "E-Mail", ru: "Эл. почта", de: "E-Mail" },
  "contact.subject": { tr: "Konu", en: "Topic", ru: "Тема", de: "Thema" },
  "contact.message": { tr: "Mesaj", en: "Message", ru: "Сообщение", de: "Nachricht" },
  "contact.send": { tr: "Gönder", en: "Send", ru: "Отправить", de: "Senden" },
  "contact.sending": { tr: "Gönderiliyor...", en: "Sending...", ru: "Отправляется...", de: "Wird gesendet..." },
  "contact.success": { tr: "Mesajın alındı.", en: "Your message has been received.", ru: "Ваше сообщение получено.", de: "Deine Nachricht wurde erhalten." },
  "contact.error": { tr: "Mesaj gönderilemedi.", en: "Message could not be sent.", ru: "Сообщение не удалось отправить.", de: "Nachricht konnte nicht gesendet werden." },
  "contact.subject.business": { tr: "İşletme", en: "Business", ru: "Бизнес", de: "Unternehmen" },
  "contact.subject.theater": { tr: "Tiyatro", en: "Theater", ru: "Театр", de: "Theater" },
  "contact.subject.city": { tr: "Şehir iş birliği", en: "City partnership", ru: "Городское партнерство", de: "Stadtpartnerschaft" },
  "contact.subject.support": { tr: "Destek", en: "Support", ru: "Поддержка", de: "Support" },
  "contact.placeholder.name": { tr: "Adınız", en: "Your name", ru: "Ваше имя", de: "Dein Name" },
  "contact.placeholder.email": { tr: "bilgi@narrehberi.com", en: "info@narrehberi.com", ru: "info@narrehberi.com", de: "info@narrehberi.com" },
  "contact.placeholder.message": { tr: "Kısaca anlatın", en: "Tell us briefly", ru: "Кратко опишите", de: "Kurz beschreiben" },
  "places.eyebrow": { tr: "Mekanlar", en: "Places", ru: "Места", de: "Orte" },
  "places.title": {
    tr: "Şehir rotalarını daha hızlı seç.",
    en: "Choose your city routes faster.",
    ru: "Выбирайте городские маршруты быстрее.",
    de: "Wähle deine Stadtrouten schneller."
  },
  "places.lead": {
    tr: "Kategori, ilçe, açık mekan, puan, yakınımda ve erişilebilirlik seçenekleriyle kendine uygun yeri bul.",
    en: "Find the right place with category, district, open now, rating, nearby and accessibility filters.",
    ru: "Найдите подходящее место по категории, району, открытому статусу, рейтингу, близости и доступности.",
    de: "Finde mit Kategorie-, Bezirks-, Offen-, Bewertungs-, Nähe- und Barrierefreiheitsfiltern den passenden Ort."
  },
  "places.metricOpen": { tr: "Açık mekan", en: "Open places", ru: "Открытые места", de: "Offene Orte" },
  "places.metricOffer": { tr: "Fırsat bağlantısı", en: "Offer connection", ru: "Связанные предложения", de: "Angebotsverknüpfung" },
  "places.metricRating": { tr: "Google puanı", en: "Google rating", ru: "Оценка Google", de: "Google-Bewertung" },
  "events.eyebrow": { tr: "Etkinlikler", en: "Events", ru: "События", de: "Events" },
  "events.title": {
    tr: "Şehirde ne varsa takviminde netçe gör.",
    en: "See what is happening in the city clearly in your calendar.",
    ru: "Четко увидьте, что происходит в городе, в своем календаре.",
    de: "Sieh klar, was in der Stadt passiert, direkt in deinem Kalender."
  },
  "events.lead": {
    tr: "Tiyatro, bale, müzikal, konser, festival, sergi, fuar, workshop, çocuk etkinliği, stand-up ve gösteriler tek yerde.",
    en: "Theater, ballet, musical, concert, festival, exhibition, fair, workshop, kids events, stand-up and shows in one place.",
    ru: "Театр, балет, мюзикл, концерт, фестиваль, выставка, ярмарка, воркшоп, детские события, стендап и шоу в одном месте.",
    de: "Theater, Ballett, Musical, Konzert, Festival, Ausstellung, Messe, Workshop, Kinder-Events, Stand-up und Shows an einem Ort."
  },
  "events.monthlyPreview": { tr: "Aylık önizleme", en: "Monthly preview", ru: "Обзор месяца", de: "Monatsvorschau" },
  "events.view": { tr: "Görünüm", en: "View", ru: "Вид", de: "Ansicht" },
  "events.addToCalendar": { tr: "Takvime ekle", en: "Add to calendar", ru: "Добавить в календарь", de: "Zum Kalender hinzufügen" },
  "offers.eyebrow": { tr: "Nar Fırsatları", en: "Nar Offers", ru: "Предложения Nar", de: "Nar Angebote" },
  "offers.title": {
    tr: "Anlık kampanyalar, hikaye tarzı öneriler ve QR sadakat avantajları.",
    en: "Instant campaigns, story-style suggestions and QR loyalty perks.",
    ru: "Мгновенные кампании, сторис-подборки и QR-преимущества лояльности.",
    de: "Sofortkampagnen, Story-Empfehlungen und QR-Treuevorteile."
  },
  "offers.lead": {
    tr: "Yakındaki kampanyaları keşfet, QR ile kullan ve puanlarınla daha fazla avantaj yakala.",
    en: "Discover nearby campaigns, use them with QR and unlock more perks with your points.",
    ru: "Открывайте ближайшие кампании, используйте их через QR и получайте больше преимуществ с баллами.",
    de: "Entdecke Kampagnen in deiner Nähe, nutze sie per QR und hole mit Punkten mehr Vorteile heraus."
  },
  "offers.stories": { tr: "Hikaye tarzı fırsatlar", en: "Story-style offers", ru: "Предложения в формате сторис", de: "Story-Angebote" },
  "detail.favorite": { tr: "Favori", en: "Favorite", ru: "Избранное", de: "Favorit" },
  "detail.share": { tr: "Paylaş", en: "Share", ru: "Поделиться", de: "Teilen" },
  "detail.openInApp": { tr: "Uygulamada aç", en: "Open in app", ru: "Открыть в приложении", de: "In App öffnen" },
  "detail.map": { tr: "Harita ve Yol Tarifi", en: "Map and Directions", ru: "Карта и маршрут", de: "Karte und Route" },
  "detail.getDirections": { tr: "Google Maps ile yol tarifi", en: "Get directions with Google Maps", ru: "Маршрут в Google Maps", de: "Route in Google Maps" },
  "detail.contentMissing": { tr: "İçerik bulunamadı", en: "Content not found", ru: "Контент не найден", de: "Inhalt nicht gefunden" },
  "detail.contentUnavailable": { tr: "Bu sayfa şu anda görüntülenemiyor.", en: "This page cannot be displayed right now.", ru: "Эта страница сейчас недоступна.", de: "Diese Seite kann gerade nicht angezeigt werden." },
  "a11y.open": { tr: "Erişilebilirlik ayarlarını aç", en: "Open accessibility settings", ru: "Открыть настройки доступности", de: "Barrierefreiheit öffnen" },
  "a11y.panel": { tr: "Erişilebilirlik ayarları", en: "Accessibility settings", ru: "Настройки доступности", de: "Barrierefreiheit" },
  "a11y.title": { tr: "Erişilebilirlik", en: "Accessibility", ru: "Доступность", de: "Barrierefreiheit" },
  "a11y.contrast": { tr: "Yüksek kontrast", en: "High contrast", ru: "Высокий контраст", de: "Hoher Kontrast" },
  "a11y.motion": { tr: "Hareketi azalt", en: "Reduce motion", ru: "Уменьшить движение", de: "Bewegung reduzieren" },
  "a11y.speechStart": { tr: "Sesli okumayı başlat", en: "Start reading aloud", ru: "Начать озвучивание", de: "Vorlesen starten" },
  "a11y.speechStop": { tr: "Sesli okumayı durdur", en: "Stop reading aloud", ru: "Остановить озвучивание", de: "Vorlesen stoppen" },
  "a11y.speechUnavailable": { tr: "Destek yok", en: "Not supported", ru: "Не поддерживается", de: "Nicht unterstützt" },
  "a11y.textScale": { tr: "Yazı boyutu", en: "Text size", ru: "Размер текста", de: "Textgröße" },
  "a11y.normal": { tr: "Normal", en: "Normal", ru: "Обычный", de: "Normal" },
  "a11y.large": { tr: "Büyük", en: "Large", ru: "Крупный", de: "Groß" }
};

type LocaleContextValue = {
  locale: SiteLocale;
  setLocale: (locale: SiteLocale) => void;
  t: (key: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SiteLocale>("tr");

  useEffect(() => {
    const stored = window.localStorage.getItem("nar-locale");
    if (stored === "tr" || stored === "en" || stored === "ru" || stored === "de") {
      setLocaleState(stored);
      document.documentElement.lang = stored;
    }
  }, []);

  function setLocale(nextLocale: SiteLocale) {
    setLocaleState(nextLocale);
    window.localStorage.setItem("nar-locale", nextLocale);
    document.documentElement.lang = nextLocale;
  }

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale,
    t: (key) => dictionary[key]?.[locale] ?? dictionary[key]?.tr ?? key
  }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocale LocaleProvider içinde kullanılmalı.");
  return value;
}
