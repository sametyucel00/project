"use client";

import { panelMenus, type UserRole } from "@nar/core";
import { Bell, ChartNoAxesCombined, ChevronRight, PlusCircle, QrCode, ShieldCheck } from "lucide-react";
import { AdminOps } from "./AdminOps";
import { AdminStats } from "./AdminStats";
import { BusinessOps } from "./BusinessOps";
import { IndividualOps } from "./IndividualOps";
import { RoleOps } from "./RoleOps";
import { OrdersOps } from "./OrdersOps";
import { PanelAccountOps } from "./PanelAccountOps";
import { SystemLogs } from "./SystemLogs";
import { NotificationStats } from "./NotificationStats";
import { PanelMetrics } from "./PanelMetrics";
import { SeoOps } from "./SeoOps";
import { LocalizationOps } from "./LocalizationOps";
import { TheaterOps } from "./TheaterOps";
import { ThemeToggle } from "./ThemeToggle";
import { WorkflowOps } from "./WorkflowOps";
import { useLocale } from "./LocaleProvider";

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

export function PanelShell({ role }: { role: UserRole }) {
  const { locale } = useLocale();
  const text = copy[locale];
  const menu = panelMenus[role];
  const notificationHref = role === "admin" ? "#panel-notifications" : "#settings";
  const newActionHref = role === "admin"
    ? "#admin-operations"
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
        <nav className="panel-menu" aria-label={`${text.roleLabels[role]} menüsü`}>
          {menu.map((item) => (
            <a href={`#${item.id}`} key={item.id}>
              <span>{item.title}</span>
              <ChevronRight size={16} />
            </a>
          ))}
        </nav>
      </aside>

      <section className="panel-main">
        <header className="panel-hero">
          <div>
            <p className="eyebrow">{text.roleLabels[role]}</p>
            <h1>{text.roleSubtitles[role]}</h1>
          </div>
          <div className="panel-actions">
            <a className="secondary" href={notificationHref}><Bell size={18} /><span>{text.notifications}</span></a>
            <a className="primary" href={newActionHref}><PlusCircle size={18} /><span>{text.newAction}</span></a>
          </div>
        </header>

        <PanelMetrics role={role} />

        <div className="panel-workspace">
          <section className="command-surface">
            <div>
              <ShieldCheck size={22} />
              <h2>{text.priorityFlow}</h2>
              <p>{text.priorityBody}</p>
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
            <h2>{text.instantMonitoring}</h2>
            <p>{text.instantMonitoringBody}</p>
            <div className="qr-preview">
              <QrCode size={54} />
              <span>{text.qrNote}</span>
            </div>
          </section>
        </div>
        <RoleOps role={role} />
        <WorkflowOps role={role} />
        {role === "individual" ? <IndividualOps /> : null}
        {role === "business" ? <BusinessOps /> : null}
        {role === "theater" ? <TheaterOps /> : null}
        {role === "admin" ? <TheaterOps mode="admin" /> : null}
        <OrdersOps role={role} />
        <PanelAccountOps role={role} />
        {role === "admin" ? <AdminStats /> : null}
        {role === "admin" ? <div id="panel-notifications"><NotificationStats /></div> : null}
        {role === "admin" ? <SeoOps /> : null}
        {role === "admin" ? <LocalizationOps /> : null}
        {role === "admin" ? <SystemLogs /> : null}
        {role === "admin" ? <AdminOps /> : null}
      </section>
    </main>
  );
}
