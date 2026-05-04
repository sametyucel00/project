"use client";

import type { MarketingPageContent } from "@nar/core";
import { ArrowRight, Building2, CheckCircle2, Handshake, Info, Smartphone, type LucideIcon } from "lucide-react";
import { SiteFooter } from "./SiteFooter";
import { useLocale } from "./LocaleProvider";
import { SectionEyebrow } from "./SectionEyebrow";

const localizedPages: Record<string, Record<string, { eyebrow: string; title: string; description: string; sections: Array<{ title: string; text: string }> }>> = {
  "hakkimizda": {
    tr: {
      eyebrow: "Hakkımızda",
      title: "Mekan, etkinlik ve unutulmaz rotalar etrafında şekillenen bir şehir rehberi.",
      description: "Nar Rehberi; sakin, net ve premium bir şehir keşfi akışında kullanıcıları, işletmeleri ve sahneleri buluşturur.",
      sections: [
        { title: "Tek keşif akışı", text: "Mekanlar, etkinlikler ve fırsatlar kullanıcıyı yormadan yakın kalır." },
        { title: "Yerel doku", text: "Semt hissi, zamanlama ve gerçek mekan sinyalleri deneyimi şekillendirir." },
        { title: "Ortak platform", text: "Bireysel kullanıcılar, işletmeler ve tiyatrolar aynı net sistem içinde ilerler." }
      ]
    },
    en: {
      eyebrow: "About",
      title: "A city guide shaped around venues, events and memorable routes.",
      description: "Nar Rehberi brings residents, visitors, businesses and stages into the same city rhythm.",
      sections: [
        { title: "One discovery flow", text: "Places, events and offers stay close without tiring the user." },
        { title: "Local texture", text: "Neighborhood mood, timing and real venue signals drive the experience." },
        { title: "Shared platform", text: "Individuals, businesses and theaters move inside the same clear system." }
      ]
    },
    ru: {
      eyebrow: "О нас",
      title: "Городской гид, построенный вокруг мест, событий и запоминающихся маршрутов.",
      description: "Nar Rehberi объединяет жителей, гостей, бизнес и сцену в одном городском ритме.",
      sections: [
        { title: "Единый сценарий поиска", text: "Места, события и предложения остаются рядом и не утомляют пользователя." },
        { title: "Локальный характер", text: "Район, время и реальные сигналы площадки формируют опыт." },
        { title: "Общая платформа", text: "Частные пользователи, бизнес и театры работают в одном понятном контуре." }
      ]
    },
    de: {
      eyebrow: "Über uns",
      title: "Ein Stadtführer rund um Orte, Events und erinnerungswürdige Routen.",
      description: "Nar Rehberi verbindet Bewohner, Gäste, Unternehmen und Bühnen in einem Stadtfluss.",
      sections: [
        { title: "Ein Erkundungsfluss", text: "Orte, Events und Angebote bleiben nah, ohne den Nutzer zu ermüden." },
        { title: "Lokales Gefühl", text: "Stadtteil, Timing und echte Signals der Orte prägen das Erlebnis." },
        { title: "Gemeinsame Plattform", text: "Private Nutzer, Unternehmen und Theater bewegen sich in einem klaren System." }
      ]
    }
  },
  "isletmeler-icin": {
    tr: {
      eyebrow: "İşletmeler İçin",
      title: "Mekânını, fırsatlarını ve sadakat akışını tek sakin çalışma alanından yönet.",
      description: "Nar Rehberi işletmelerin daha kolay keşfedilmesini, tekrar ziyaret edilmesini ve önerilmesini sağlar.",
      sections: [
        { title: "Mekan kontrolü", text: "Mekan detaylarını, görselleri ve keşif sinyallerini güncel tut." },
        { title: "Fırsat yönetimi", text: "Kampanyaları, QR avantajlarını ve zaman bazlı öne çıkanları hızlı yayınla." },
        { title: "Sadakat akışı", text: "Puanları, QR hareketlerini ve tekrar etkileşimi tek yerde takip et." }
      ]
    },
    en: {
      eyebrow: "For Businesses",
      title: "Manage your venue, offers and loyalty flow from one calm workspace.",
      description: "Nar Rehberi helps businesses become easier to discover, easier to revisit and easier to recommend.",
      sections: [
        { title: "Venue control", text: "Keep venue details, visuals and discovery signals up to date." },
        { title: "Offer management", text: "Publish campaigns, QR perks and time-based highlights quickly." },
        { title: "Loyalty flow", text: "Track points, QR activity and repeat engagement in one place." }
      ]
    },
    ru: {
      eyebrow: "Для бизнеса",
      title: "Управляйте площадкой, предложениями и лояльностью из одного спокойного пространства.",
      description: "Nar Rehberi помогает бизнесу легче находиться, чаще возвращаться и чаще рекомендоваться.",
      sections: [
        { title: "Контроль площадки", text: "Держите данные, визуалы и сигналы поиска площадки актуальными." },
        { title: "Управление предложениями", text: "Быстро публикуйте кампании, QR-выгоды и временные акценты." },
        { title: "Лояльность", text: "Отслеживайте баллы, QR-активность и повторные визиты в одном месте." }
      ]
    },
    de: {
      eyebrow: "Für Unternehmen",
      title: "Verwalte deinen Ort, Angebote und Loyalty-Fluss in einem ruhigen Arbeitsbereich.",
      description: "Nar Rehberi hilft Unternehmen, leichter entdeckt, erneut besucht und empfohlen zu werden.",
      sections: [
        { title: "Ortsteuerung", text: "Halte Details, Bilder und Entdeckungssignale aktuell." },
        { title: "Angebotsverwaltung", text: "Veröffentliche Kampagnen, QR-Vorteile und zeitliche Highlights schnell." },
        { title: "Loyalty-Fluss", text: "Verfolge Punkte, QR-Aktivitäten und Wiederkehr an einem Ort." }
      ]
    }
  },
  "mobil-uygulama": {
    tr: {
      eyebrow: "Mobil Uygulama",
      title: "İlk dokunuştan itibaren hızlı, sakin ve faydalı hissettiren keşif deneyimi.",
      description: "Arama, hikayeler, rotalar ve etkinlik zamanlaması tek bir mobil ritimde buluşur.",
      sections: [
        { title: "Hızlı ana ekran", text: "Ana ekran günün saatine ve yakın bağlama göre uyumlanır." },
        { title: "Daha net detaylar", text: "Mekan, etkinlik ve fırsat sayfaları veri eksik olsa bile açık kalır." },
        { title: "Dahili sadakat", text: "QR kullanımı, puanlar ve avantajlar keşif akışına yakın kalır." }
      ]
    },
    en: {
      eyebrow: "Mobile App",
      title: "A discovery experience that feels fast, quiet and useful from the first tap.",
      description: "Search, stories, routes and event timing come together in one mobile rhythm.",
      sections: [
        { title: "Quick home", text: "The home screen adapts to time of day and nearby context." },
        { title: "Cleaner details", text: "Venue, event and offer pages stay clear even when data is incomplete." },
        { title: "Loyalty built in", text: "QR use, points and perks stay close to the discovery flow." }
      ]
    },
    ru: {
      eyebrow: "Мобильное приложение",
      title: "Опыт открытия, который с первого касания ощущается быстрым, спокойным и полезным.",
      description: "Поиск, истории, маршруты и расписание событий объединяются в одном мобильном ритме.",
      sections: [
        { title: "Быстрая главная", text: "Главный экран подстраивается под время суток и ближайший контекст." },
        { title: "Чище детали", text: "Страницы мест, событий и предложений остаются понятными даже при неполных данных." },
        { title: "Лояльность встроена", text: "QR, баллы и преимущества остаются рядом с поиском." }
      ]
    },
    de: {
      eyebrow: "Mobile App",
      title: "Ein Entdeckungserlebnis, das sich vom ersten Tap an schnell, ruhig und nützlich anfühlt.",
      description: "Suche, Stories, Routen und Event-Zeiten greifen in einem mobilen Rhythmus ineinander.",
      sections: [
        { title: "Schneller Start", text: "Der Homescreen passt sich Tageszeit und Nähe an." },
        { title: "Klarere Details", text: "Orte, Events und Angebote bleiben auch bei fehlenden Daten verständlich." },
        { title: "Loyalität integriert", text: "QR-Nutzung, Punkte und Vorteile bleiben nah am Entdeckungsfluss." }
      ]
    }
  },
  "iletisim": {
    tr: {
      eyebrow: "İletişim",
      title: "Doğru ekibe ulaş, işi uzatmadan ilerle.",
      description: "İşletme iş birlikleri, tiyatro çözümleri, destek ve şehir bağlantıları tek formdan yönlenir.",
      sections: [
        { title: "Net yönlendirme", text: "Konuyu seç, mesaj doğru ekibe gitsin." },
        { title: "Hızlı dönüş", text: "Talepler tek akışta toplansın, bir şey kaybolmasın." },
        { title: "İnsani ton", text: "İletişim yüzünü kısa, net ve rahat kullanılır tutuyoruz." }
      ]
    },
    en: {
      eyebrow: "Contact",
      title: "Reach the right team without getting lost in the process.",
      description: "Business partnerships, theater solutions, support and city collaborations are routed from one form.",
      sections: [
        { title: "Clear routing", text: "Choose your topic and the message goes to the relevant team." },
        { title: "Fast follow-up", text: "Requests land in one stream so nothing gets lost." },
        { title: "Human tone", text: "We keep the contact surface short, clear and easy to use." }
      ]
    },
    ru: {
      eyebrow: "Контакты",
      title: "Свяжитесь с нужной командой без лишних шагов.",
      description: "Партнерства, театральные решения, поддержка и городские запросы идут через одну форму.",
      sections: [
        { title: "Четкая маршрутизация", text: "Выберите тему, и сообщение попадет нужной команде." },
        { title: "Быстрый ответ", text: "Запросы собираются в одном потоке и ничего не теряется." },
        { title: "Человеческий тон", text: "Мы делаем форму короткой, ясной и удобной." }
      ]
    },
    de: {
      eyebrow: "Kontakt",
      title: "Erreiche das richtige Team, ohne dich im Prozess zu verlieren.",
      description: "Business-Partnerschaften, Theaterlösungen, Support und Stadtthemen laufen über ein Formular.",
      sections: [
        { title: "Klare Weiterleitung", text: "Thema wählen und die Nachricht geht an das passende Team." },
        { title: "Schnelles Follow-up", text: "Anfragen landen in einem Strom, damit nichts verloren geht." },
        { title: "Menschlicher Ton", text: "Wir halten die Kontaktfläche kurz, klar und leicht nutzbar." }
      ]
    }
  }
};

function resolvePage(page: MarketingPageContent, locale: string) {
  if (locale === "tr") return page;
  const localized = localizedPages[page.slug]?.[locale] ?? localizedPages[page.slug]?.en;
  if (!localized) return page;
  return { ...page, ...localized };
}

const pageIcons: Record<string, LucideIcon> = {
  "hakkimizda": Info,
  "isletmeler-icin": Building2,
  "mobil-uygulama": Smartphone,
  "iletisim": Handshake
};

export function MarketingPage({ page, showFooter = true }: { page: MarketingPageContent; showFooter?: boolean }) {
  const { locale, t } = useLocale();
  const resolvedPage = resolvePage(page, locale);
  const EyebrowIcon = pageIcons[page.slug] ?? Info;

  return (
    <main className="shell" id="main-content">
      <section className="marketing-hero">
        <div className="section-center-column section-center-column-wide">
          <SectionEyebrow icon={EyebrowIcon}>{resolvedPage.eyebrow}</SectionEyebrow>
          <h1>{resolvedPage.title}</h1>
          <p className="lead">{resolvedPage.description}</p>
          <div className="hero-actions">
            <a className="primary" href="/giris">
              <ArrowRight size={18} />
              <span>{t("common.start")}</span>
            </a>
            <a className="secondary" href="/iletisim">
              <span>{t("common.contact")}</span>
            </a>
            {page.slug === "mobil-uygulama" ? (
              <>
                <a className="secondary" href="https://play.google.com/store/apps/details?id=narrehberi.com&hl=tr" target="_blank" rel="noreferrer">
                  <Smartphone size={18} />
                  <span>{t("common.androidApp")}</span>
                </a>
                <a className="secondary" href="https://apps.apple.com/tr/app/nar-rehberi/id6761314584" target="_blank" rel="noreferrer">
                  <Smartphone size={18} />
                  <span>{t("common.iosApp")}</span>
                </a>
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section className="section section-centered">
        <div className="marketing-grid section-center-column section-center-column-wide">
          {resolvedPage.sections.map((section) => (
            <article className="marketing-item" key={section.title}>
              <CheckCircle2 size={22} />
              <h2>{section.title}</h2>
              <p>{section.text}</p>
            </article>
          ))}
        </div>
      </section>
      {showFooter ? <SiteFooter /> : null}
    </main>
  );
}
