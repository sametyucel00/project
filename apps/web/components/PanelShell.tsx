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

const roleLabels: Record<UserRole, string> = {
  admin: "Yönetim Paneli",
  business: "İşletme Paneli",
  theater: "Tiyatro Paneli",
  individual: "Bireysel Panel"
};

const roleSubtitles: Record<UserRole, string> = {
  admin: "Platform yönetimi, denetim ve içerik süreçlerini buradan yönet.",
  business: "Mekan, fırsat, QR ve sadakat akışlarını tek yerden düzenle.",
  theater: "Oyun, sinopsis, bilet ve duyuru yönetimini sahne ritmine göre sürdür.",
  individual: "Puan, QR, görev, rozet ve favorilerini tek ekranda takip et."
};

export function PanelShell({ role }: { role: UserRole }) {
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
          <img className="brand-logo brand-logo-light" src="/nar-logo-light.svg" alt="Nar Rehberi logosu" />
          <img className="brand-logo brand-logo-dark" src="/nar-logo-dark.svg" alt="Nar Rehberi logosu" />
          <span>Nar Rehberi</span>
        </a>
        <div style={{ marginTop: 18 }}>
          <ThemeToggle />
        </div>
        <nav className="panel-menu" aria-label={`${roleLabels[role]} menüsü`}>
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
            <p className="eyebrow">{roleLabels[role]}</p>
            <h1>{roleSubtitles[role]}</h1>
          </div>
          <div className="panel-actions">
            <a className="secondary" href={notificationHref}><Bell size={18} /><span>Bildirimler</span></a>
            <a className="primary" href={newActionHref}><PlusCircle size={18} /><span>Yeni işlem</span></a>
          </div>
        </header>

        <PanelMetrics role={role} />

        <div className="panel-workspace">
          <section className="command-surface">
            <div>
              <ShieldCheck size={22} />
              <h2>Öncelikli Akış</h2>
              <p>Bu bölümde rolüne uygun temel işlemleri hızlıca yönetebilirsin.</p>
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
            <h2>Anlık İzleme</h2>
            <p>İstatistikler ve işlem geçmişi canlı verilerle güncellenir.</p>
            <div className="qr-preview">
              <QrCode size={54} />
              <span>QR ve puan işlemleri güvenli şekilde kaydedilir.</span>
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
