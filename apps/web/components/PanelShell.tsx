"use client";

import type { UserRole } from "@nar/core";
import { Bell, ChartNoAxesCombined, ChevronRight, PlusCircle, QrCode, ShieldCheck } from "lucide-react";
import { AdminOps } from "./AdminOps";
import { AdminStats } from "./AdminStats";
import { BusinessOps } from "./BusinessOps";
import { ContactInbox } from "./ContactInbox";
import { IndividualOps } from "./IndividualOps";
import { LocalizationOps } from "./LocalizationOps";
import { NotificationStats } from "./NotificationStats";
import { OrdersOps } from "./OrdersOps";
import { PanelAccountOps } from "./PanelAccountOps";
import { PanelMetrics } from "./PanelMetrics";
import { RoleOps } from "./RoleOps";
import { SeoOps } from "./SeoOps";
import { SystemLogs } from "./SystemLogs";
import { TheaterOps } from "./TheaterOps";
import { ThemeToggle } from "./ThemeToggle";
import { WorkflowOps } from "./WorkflowOps";
import { useLocale } from "./LocaleProvider";

const panelMenus: Record<UserRole, Array<{ id: string; title: string; description: string }>> = {
  admin: [
    { id: "overview", title: "Genel", description: "Platform sa?l???, h?zl? i?ler ve canl? ?zet." },
    { id: "members", title: "?yeler", description: "Kullan?c?lar, roller ve hesap durumu." },
    { id: "approvals", title: "Onaylar", description: "Mekan, etkinlik, f?rsat ve kategori onay kuyru?u." },
    { id: "orders", title: "Sipari?ler", description: "F?rsat, bilet ve puan kullan?m kay?tlar?." },
    { id: "places", title: "Mekanlar", description: "Mekan bilgisi, Google snapshot ve yay?n durumu." },
    { id: "events", title: "Etkinlikler", description: "Etkinlik olu?turma ve yay?n y?netimi." },
    { id: "offers", title: "F?rsatlar", description: "Kampanya, stories ve yay?n durumu." },
    { id: "qr", title: "QR Ak??", description: "QR i?lem ve puan kay?tlar?." },
    { id: "import", title: "??e / D??a Aktar?m", description: "Dosya ?nizleme, i?e aktar?m ve d??a aktar?m kay?tlar?." },
    { id: "category-management", title: "Kategoriler", description: "Mekan ve etkinlik kategorileri." },
    { id: "notifications", title: "Bildirimler", description: "Bildirim merkezi ve hedefleme." },
    { id: "stats", title: "?statistikler", description: "Canl? panel saya?lar? ve kullan?m ?zetleri." },
    { id: "settings", title: "Ayarlar", description: "Profil, SEO ve sistem tercihleri." }
  ],
  business: [
    { id: "overview", title: "Genel", description: "??letme paneli ?zeti ve h?zl? i?ler." },
    { id: "places", title: "Mekanlar", description: "Sahip olunan mekanlar ve Google bilgileri." },
    { id: "offers", title: "F?rsatlar", description: "Anl?k kampanyalar ve yay?n durumu." },
    { id: "qr", title: "QR ??lem", description: "QR puan ve kampanya i?lemleri." },
    { id: "settings", title: "Ayarlar", description: "??letme profili ve bildirim tercihleri." }
  ],
  theater: [
    { id: "overview", title: "Genel", description: "Tiyatro paneli ?zeti ve h?zl? i?ler." },
    { id: "play", title: "Oyun", description: "Oyun, sinopsis, bilet ve bildirim ak???." },
    { id: "settings", title: "Ayarlar", description: "Tiyatro profili ve i?erik tercihleri." }
  ],
  individual: [
    { id: "overview", title: "Genel", description: "Puan, QR, g?rev ve favori ?zeti." },
    { id: "points", title: "Puan ve QR", description: "Puan bakiyesi ve QR hareketleri." },
    { id: "tasks", title: "G?revler", description: "Tamamlanabilir ke?if ve kullan?m g?revleri." },
    { id: "badges", title: "Rozetler", description: "Kazan?mlar ve ?ehir ba?ar?lar?." },
    { id: "favorites", title: "Favoriler", description: "Kaydedilen mekan, etkinlik ve f?rsatlar." },
    { id: "settings", title: "Ayarlar", description: "Dil, tema ve bildirim tercihleri." }
  ]
};

export function PanelShell({ role }: { role: UserRole }) {
  const { locale } = useLocale();
  const text = {
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
      priorityFlow: "Öncelikli Akış",
      priorityBody: "Bu bölümde rolüne uygun temel işlemleri hızlıca yönetebilirsin.",
      instantMonitoring: "Anlık İzleme",
      instantMonitoringBody: "İstatistikler ve işlem geçmişi canlı verilerle güncellenir.",
      qrNote: "QR ve puan işlemleri güvenli şekilde kaydedilir."
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
      priorityFlow: "Priority Flow",
      priorityBody: "Handle the core tasks for your role quickly in this area.",
      instantMonitoring: "Live Monitoring",
      instantMonitoringBody: "Metrics and activity history update with live data.",
      qrNote: "QR and point actions are saved securely."
    },
    ru: {
      roleLabels: {
        admin: "Панель управления",
        business: "Панель бизнеса",
        theater: "Панель театра",
        individual: "Личная панель"
      },
      roleSubtitles: {
        admin: "Управляйте платформой, модерацией и контентом отсюда.",
        business: "Управляйте местами, предложениями, QR и лояльностью из одного места.",
        theater: "Ведите постановки, синопсисы, билеты и объявления в сценическом ритме.",
        individual: "Следите за баллами, QR, заданиями, бейджами и избранным на одном экране."
      },
      notifications: "Уведомления",
      newAction: "Новое действие",
      priorityFlow: "Приоритетный поток",
      priorityBody: "Здесь можно быстро управлять основными задачами вашей роли.",
      instantMonitoring: "Живой мониторинг",
      instantMonitoringBody: "Метрики и история действий обновляются в реальном времени.",
      qrNote: "Действия QR и баллов сохраняются безопасно."
    },
    de: {
      roleLabels: {
        admin: "Admin-Bereich",
        business: "Business-Bereich",
        theater: "Theater-Bereich",
        individual: "Persönlicher Bereich"
      },
      roleSubtitles: {
        admin: "Verwalte Plattform, Moderation und Content-Flüsse hier.",
        business: "Organisiere Ort, Angebote, QR und Loyalty-Flows an einem Ort.",
        theater: "Steuere Stücke, Synopsen, Tickets und Ankündigungen im Bühnenrhythmus.",
        individual: "Verfolge Punkte, QR, Aufgaben, Abzeichen und Favoriten auf einem Bildschirm."
      },
      notifications: "Benachrichtigungen",
      newAction: "Neue Aktion",
      priorityFlow: "Prioritätsfluss",
      priorityBody: "Verwalte die wichtigsten Aufgaben deiner Rolle schnell in diesem Bereich.",
      instantMonitoring: "Live-Überwachung",
      instantMonitoringBody: "Kennzahlen und Verlaufsdaten werden live aktualisiert.",
      qrNote: "QR- und Punkteaktionen werden sicher gespeichert."
    }
  } as const;
  const copy = text[locale];
  const menu = panelMenus[role];
  const notificationHref = role === "admin" ? "#notifications" : "#settings";
  const newActionHref = role === "admin"
    ? "#offers"
    : role === "business"
      ? "#qr"
      : role === "theater"
        ? "#play"
        : "#tasks";

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
        <nav className="panel-menu" aria-label={`${copy.roleLabels[role]} menüsü`}>
          {menu.map((item) => (
            <a href={`#${item.id}`} key={item.id}>
              <span>{item.title}</span>
              <ChevronRight size={16} />
            </a>
          ))}
        </nav>
      </aside>

      <section className="panel-main">
        <header className="panel-hero" id="overview">
          <div>
            <p className="eyebrow">{copy.roleLabels[role]}</p>
            <h1>{copy.roleSubtitles[role]}</h1>
          </div>
          <div className="panel-actions">
            <a className="secondary" href={notificationHref}><Bell size={18} /><span>{copy.notifications}</span></a>
            <a className="primary" href={newActionHref}><PlusCircle size={18} /><span>{copy.newAction}</span></a>
          </div>
        </header>

        <section aria-label="Panel özeti">
          <PanelMetrics role={role} />
        </section>

        <div className="panel-workspace">
          <section className="command-surface">
            <div>
              <ShieldCheck size={22} />
              <h2>{copy.priorityFlow}</h2>
              <p>{copy.priorityBody}</p>
            </div>
            <div className="command-list">
              {menu.slice(0, 5).map((item) => (
                <article id={item.id} key={item.id}>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                  <ChevronRight size={18} />
                </article>
              ))}
            </div>
          </section>

          <section className="insight-surface">
            <ChartNoAxesCombined size={22} />
            <h2>{copy.instantMonitoring}</h2>
            <p>{copy.instantMonitoringBody}</p>
            <div className="qr-preview">
              <QrCode size={54} />
              <span>{copy.qrNote}</span>
            </div>
          </section>
        </div>

        {role === "admin" ? <div id="members"><RoleOps role={role} /></div> : null}
        {role === "admin" ? <WorkflowOps role={role} /> : null}
        {role === "business" ? <BusinessOps /> : null}
        {role === "theater" ? <TheaterOps sectionId="play" /> : null}
        {role === "individual" ? <IndividualOps /> : null}
        <OrdersOps role={role} />
        <PanelAccountOps role={role} />
        {role === "admin" ? <div id="stats"><AdminStats /></div> : null}
        {role === "admin" ? <div id="notifications"><NotificationStats /></div> : null}
        {role === "admin" ? <ContactInbox /> : null}
        {role === "admin" ? <SeoOps /> : null}
        {role === "admin" ? <LocalizationOps /> : null}
        {role === "admin" ? <SystemLogs /> : null}
        {role === "admin" ? <AdminOps /> : null}
      </section>
    </main>
  );
}
