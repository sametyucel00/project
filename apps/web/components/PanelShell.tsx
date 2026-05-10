"use client";

import type { UserRole } from "@nar/core";
import { Bell, ChevronRight, PlusCircle } from "lucide-react";
import { AdminOps } from "./AdminOps";
import { AdminStats } from "./AdminStats";
import { BusinessOps } from "./BusinessOps";
import { ContactInbox } from "./ContactInbox";
import { IndividualOps } from "./IndividualOps";
import { OrdersOps } from "./OrdersOps";
import { PanelAccountOps } from "./PanelAccountOps";
import { PanelMetrics } from "./PanelMetrics";
import { RoleOps } from "./RoleOps";
import { TheaterOps } from "./TheaterOps";
import { ThemeToggle } from "./ThemeToggle";
import { WorkflowOps } from "./WorkflowOps";
import { useLocale } from "./LocaleProvider";

type MenuItem = { id: string; title: string; description: string };

const panelMenus: Record<UserRole, MenuItem[]> = {
  admin: [
    { id: "overview", title: "Genel", description: "Platform ozeti ve hizli islemler." },
    { id: "members", title: "Uyeler", description: "Kullanicilar, roller ve hesap durumu." },
    { id: "approvals", title: "Onaylar", description: "Mekan, etkinlik, firsat ve kategori kuyruklari." },
    { id: "orders", title: "Siparisler", description: "Siparisler ve QR islem kayitlari." },
    { id: "places", title: "Mekanlar", description: "Google bilgileri ve mekan duzeni." },
    { id: "events", title: "Etkinlikler", description: "Etkinlik olusturma ve bildirim akisi." },
    { id: "offers", title: "Firsatlar", description: "Kampanyalar, hikayeler ve yayin durumu." },
    { id: "qr", title: "QR Akisi", description: "Puan ve islem kayitlari." },
    { id: "import", title: "Ice / Disa Aktarim", description: "Dosya onizleme ve aktarim kayitlari." },
    { id: "category-management", title: "Kategoriler", description: "Mekan ve etkinlik kategorileri." },
    { id: "notifications", title: "Bildirimler", description: "Bildirim merkezi ve gonderimler." },
    { id: "stats", title: "Istatistikler", description: "Canli panel sayaclari." },
    { id: "contact-inbox", title: "Iletisim", description: "Formdan gelen mesajlar." },
    { id: "settings", title: "Ayarlar", description: "Profil ve oturum tercihleri." }
  ],
  business: [
    { id: "overview", title: "Genel", description: "Isletme ozeti ve hizli islemler." },
    { id: "places", title: "Mekanlar", description: "Sahip olunan mekanlar ve Google bilgileri." },
    { id: "offers", title: "Firsatlar", description: "Kampanyalar ve yayin durumu." },
    { id: "qr", title: "QR Islem", description: "QR puan ve kampanya islemleri." },
    { id: "orders", title: "Siparisler", description: "Kullanim ve islem gecmisi." },
    { id: "settings", title: "Ayarlar", description: "Profil ve bildirim tercihleri." }
  ],
  theater: [
    { id: "overview", title: "Genel", description: "Tiyatro ozeti ve hizli islemler." },
    { id: "play", title: "Oyun", description: "Oyun, sinopsis, bilet ve bildirim akisi." },
    { id: "settings", title: "Ayarlar", description: "Tiyatro profili ve icerik tercihleri." }
  ],
  individual: [
    { id: "overview", title: "Genel", description: "Puan, QR, gorev ve favori ozeti." },
    { id: "points", title: "Puan ve QR", description: "Puan bakiyesi ve QR hareketleri." },
    { id: "tasks", title: "Gorevler", description: "Tamamlanabilir gorevler." },
    { id: "badges", title: "Rozetler", description: "Kazanımlar ve sehir basarilari." },
    { id: "favorites", title: "Favoriler", description: "Kaydedilen mekan, etkinlik ve firsatlar." },
    { id: "orders", title: "Siparisler", description: "Islem ve siparis gecmisi." },
    { id: "settings", title: "Ayarlar", description: "Dil, tema ve bildirim tercihleri." }
  ]
};

const copy = {
  tr: {
    roleLabels: {
      admin: "Yonetim Paneli",
      business: "Isletme Paneli",
      theater: "Tiyatro Paneli",
      individual: "Bireysel Panel"
    },
    roleSubtitles: {
      admin: "Platform yonetimi, denetim ve icerik sureclerini buradan yonet.",
      business: "Mekan, firsat, QR ve sadakat akislarini tek yerden duzenle.",
      theater: "Oyun, sinopsis, bilet ve duyuru yonetimini sahne ritmine gore surdur.",
      individual: "Puan, QR, gorev, rozet ve favorilerini tek ekranda takip et."
    },
    notifications: "Bildirimler",
    newAction: "Yeni islem",
    quickActionNote: "Rolune uygun temel islemleri buradan yonetebilirsin.",
    liveNote: "Canli verilerle guncellenen panel ozeti."
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
  const newActionHref = role === "admin" ? "#offers" : role === "business" ? "#qr" : role === "theater" ? "#play" : "#tasks";

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
        {role === "admin" ? <WorkflowOps role={role} /> : null}
        {role === "admin" ? <AdminOps /> : null}
        {role === "admin" ? <div id="stats"><AdminStats /></div> : null}
        {role === "admin" ? <div id="contact-inbox"><ContactInbox /></div> : null}
        {role === "business" ? <BusinessOps /> : null}
        {role === "theater" ? <div id="play"><TheaterOps mode="theater" /></div> : null}
        {role === "individual" ? <IndividualOps /> : null}
        <OrdersOps role={role} />
        <PanelAccountOps role={role} />
      </section>
    </main>
  );
}
