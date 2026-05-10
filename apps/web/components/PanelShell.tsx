"use client";

import type { UserRole } from "@nar/core";
import { Bell, ChevronRight, PlusCircle } from "lucide-react";
import { AdminOps } from "./AdminOps";
import { BusinessOps } from "./BusinessOps";
import { ContactInbox } from "./ContactInbox";
import { IndividualOps } from "./IndividualOps";
import { OrdersOps } from "./OrdersOps";
import { PanelAccountOps } from "./PanelAccountOps";
import { PanelMetrics } from "./PanelMetrics";
import { RoleOps } from "./RoleOps";
import { TheaterOps } from "./TheaterOps";
import { ThemeToggle } from "./ThemeToggle";
import { useLocale } from "./LocaleProvider";

type MenuItem = { id: string; title: string; description: string };

const panelMenus: Record<UserRole, MenuItem[]> = {
  admin: [
    { id: "overview", title: "Genel", description: "Platform özeti ve hızlı işlemler." },
    { id: "members", title: "Üyeler", description: "Kullanıcılar, roller ve hesap durumu." },
    { id: "content-management", title: "İçerik", description: "Mekan, etkinlik ve fırsat kayıtları." },
    { id: "import", title: "İçe / Dışa Aktarım", description: "Dosya önizleme ve aktarım kayıtları." },
    { id: "category-management", title: "Kategoriler", description: "Mekan ve etkinlik kategorileri." },
    { id: "notifications", title: "Bildirimler", description: "Bildirim merkezi ve gönderimler." },
    { id: "contact-inbox", title: "İletişim", description: "Formdan gelen mesajlar." },
    { id: "settings", title: "Ayarlar", description: "Profil ve oturum tercihleri." }
  ],
  business: [
    { id: "overview", title: "Genel", description: "İşletme özeti ve hızlı işlemler." },
    { id: "places", title: "Mekanlar", description: "Sahip olunan mekanlar ve Google bilgileri." },
    { id: "offers", title: "Fırsatlar", description: "Kampanyalar ve yayın durumu." },
    { id: "qr", title: "QR İşlem", description: "QR puan ve kampanya islemleri." },
    { id: "orders", title: "Siparişler", description: "Kullanım ve işlem geçmişi." },
    { id: "settings", title: "Ayarlar", description: "Profil ve bildirim tercihleri." }
  ],
  theater: [
    { id: "overview", title: "Genel", description: "Tiyatro özeti ve hızlı işlemler." },
    { id: "play", title: "Oyun", description: "Oyun, sinopsis, bilet ve bildirim akışı." },
    { id: "settings", title: "Ayarlar", description: "Tiyatro profili ve içerik tercihleri." }
  ],
  individual: [
    { id: "overview", title: "Genel", description: "Puan, QR, görev ve favori özeti." },
    { id: "points", title: "Puan ve QR", description: "Puan bakiyesi ve QR hareketleri." },
    { id: "tasks", title: "Görevler", description: "Tamamlanabilir görevler." },
    { id: "badges", title: "Rozetler", description: "Kazanımlar ve sehir basarilari." },
    { id: "favorites", title: "Favoriler", description: "Kaydedilen mekan, etkinlik ve fırsatlar." },
    { id: "orders", title: "Siparişler", description: "İşlem ve sipariş geçmişi." },
    { id: "settings", title: "Ayarlar", description: "Dil, tema ve bildirim tercihleri." }
  ]
};

const copy = {
  tr: {
    roleLabels: {
      admin: "Yönetim Paneli",
      business: "İşletme Paneli",
      theater: "Tiyatro Paneli",
      individual: "Bireysel Panel"
    },
    roleSubtitles: {
      admin: "Platform yönetimi, denetim ve içerik süreçlerini buradan yönet.",
      business: "Mekan, fırsat, QR ve sadakat akışlarını tek yerden düzenle.",
      theater: "Oyun, sinopsis, bilet ve duyuru yönetimini sahne ritmine göre sürdür.",
      individual: "Puan, QR, görev, rozet ve favorilerini tek ekranda takip et."
    },
    notifications: "Bildirimler",
    newAction: "Yeni işlem",
    quickActionNote: "Rolüne uygun temel işlemleri buradan yönetebilirsin.",
    liveNote: "Canlı verilerle güncellenen panel özeti."
  },
  en: {
    roleLabels: {
      admin: "Admin Panel",
      business: "Business Panel",
      theater: "Theater Panel",
      individual: "Personal Panel"
    },
    roleSubtitles: {
      admin: "Manage platform operations, moderation and content flows here.",
      business: "Organize venue, offer, QR and loyalty flows from one place.",
      theater: "Run play, synopsis, ticket and announcement management in stage rhythm.",
      individual: "Track points, QR, tasks, badges and favorites in one screen."
    },
    notifications: "Notifications",
    newAction: "New action",
    quickActionNote: "Handle the core tasks for your role here.",
    liveNote: "Panel summaries update with live data."
  },
  ru: {
    roleLabels: {
      admin: "Panel upravleniya",
      business: "Panel biznesa",
      theater: "Teatralnaya panel",
      individual: "Lichnaya panel"
    },
    roleSubtitles: {
      admin: "Upravlyayte platformoy, moderatsiyey i kontentom zdes.",
      business: "Organizuyte ploshchadki, predlozheniya, QR i loyalnost v odnom meste.",
      theater: "Upravlyayte pyesami, sinopsisami, biletami i obyavleniyami.",
      individual: "Sledite za ballami, QR, zadachami, beydzhami i izbrannym na odnom ekrane."
    },
    notifications: "Uvedomleniya",
    newAction: "Novoe deystvie",
    quickActionNote: "Zdes dostupny osnovnye zadachi vashey roli.",
    liveNote: "Svodki paneli obnovlyayutsya v realnom vremeni."
  },
  de: {
    roleLabels: {
      admin: "Admin-Bereich",
      business: "Business-Bereich",
      theater: "Theater-Bereich",
      individual: "Persoenlicher Bereich"
    },
    roleSubtitles: {
      admin: "Verwalte Plattform, Moderation und Content-Fluesse hier.",
      business: "Organisiere Ort, Angebote, QR und Loyalty-Flows an einem Ort.",
      theater: "Steuere Stuecke, Synopsen, Tickets und Ankuendigungen im Buehnenrhythmus.",
      individual: "Verfolge Punkte, QR, Aufgaben, Abzeichen und Favoriten auf einem Bildschirm."
    },
    notifications: "Benachrichtigungen",
    newAction: "Neue Aktion",
    quickActionNote: "Verwalte hier die wichtigsten Aufgaben deiner Rolle.",
    liveNote: "Panel-Zusammenfassungen aktualisieren sich live."
  }
} as const;

export function PanelShell({ role }: { role: UserRole }) {
  const { locale } = useLocale();
  const t = copy[locale];
  const menu = panelMenus[role];
  const notificationHref = role === "admin" ? "#notifications" : "#settings";
  const newActionHref = role === "admin" ? "#content-management" : role === "business" ? "#qr" : role === "theater" ? "#play" : "#tasks";

  return (
    <main className="panel-page" id="main-content">
      <aside className="panel-sidebar">
        <a className="brand" href="/">
          <img className="brand-logo brand-logo-light" src="/nar-logo.png" alt="Nar Rehberi logosu" />
          <img className="brand-logo brand-logo-dark" src="/nar-logo.png" alt="Nar Rehberi logosu" />
          <span>Nar Rehberi</span>
        </a>
        <div style={{ marginTop: 18 }}>
          <ThemeToggle />
        </div>
        <nav className="panel-menu" aria-label={`${t.roleLabels[role]} menusu`}>
          {menu.map((item) => (
            <a href={`#${item.id}`} key={item.id}>
              <div>
                <span>{item.title}</span>
                <small>{item.description}</small>
              </div>
              <ChevronRight size={16} />
            </a>
          ))}
        </nav>
      </aside>

      <section className="panel-main">
        <header className="panel-hero" id="overview">
          <div>
            <p className="eyebrow">{t.roleLabels[role]}</p>
            <h1>{t.roleSubtitles[role]}</h1>
          </div>
          <div className="panel-actions">
            <a className="secondary" href={notificationHref}>
              <Bell size={18} />
              <span>{t.notifications}</span>
            </a>
            <a className="primary" href={newActionHref}>
              <PlusCircle size={18} />
              <span>{t.newAction}</span>
            </a>
          </div>
        </header>

        <section aria-label="Panel ozeti">
          <PanelMetrics role={role} />
        </section>

        <p className="meta panel-note">{t.quickActionNote}</p>

        {role === "admin" ? <div id="members"><RoleOps role={role} /></div> : null}
        {role === "admin" ? <AdminOps /> : null}
        {role === "business" ? <BusinessOps /> : null}
        {role === "theater" ? <div id="play"><TheaterOps mode="theater" /></div> : null}
        {role === "individual" ? <IndividualOps /> : null}
        {role !== "admin" ? <OrdersOps role={role} /> : null}
        <PanelAccountOps role={role} />
        {role === "admin" ? <div id="contact-inbox" className="contact-inbox-wide"><ContactInbox /></div> : null}
      </section>
    </main>
  );
}
