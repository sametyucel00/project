import { importKinds } from "@nar/core";
import { Boxes, FileSpreadsheet, Percent, Send, Timer } from "lucide-react";
import { CategoryManagementForm, ExportManifestForm, ImportPreviewForm, NotificationForm, OfferCampaignForm } from "./ActionForms";
import { CatalogManagementOps } from "./CatalogManagementOps";
import { useLocale } from "./LocaleProvider";

const adminCopy = {
  tr: {
    notifications: "Bildirim Merkezi",
    notificationsBody: "Bildirimler hedef kitleye göre hazırlanır ve gönderim geçmişi panelde izlenir.",
    scheduled: "Zamanlanmış bildirim taslağı desteklenir.",
    offers: "Fırsat ve Kampanya Yönetimi",
    offersBody: "Taslak, yayında ve arşiv durumları; hikaye vitrini, QR şartı, kullanım limiti ve performans sayaçlarıyla birlikte yönetilir.",
    draft: "Taslak",
    live: "Yayında",
    story: "Hikaye vitrini",
    limit: "Kullanım limiti",
    importExport: "İçe / Dışa Aktarım",
    importExportBody: "Dosyalar önce önizlenir; hatalı satırlar kayıt işleminden önce görünür olur.",
    category: "Kategori Yönetimi",
    categoryBody: "Mekan ve etkinlik kategorileri admin panelinden oluşturulabilir, sıralanabilir ve yayın durumuyla yönetilebilir.",
    miniModules: "Mini Modül Yönetimi",
    miniModulesBody: "Turist destek bilgileri ve Antik Rehber içerikleri panelden yayınlanır; web ve mobilde güncel hali görünür.",
    touristSupport: "Turist destek",
    ancientGuide: "Antik Rehber",
    publishState: "Yayın durumu",
    history: "İşlem geçmişi"
  },
  en: {
    notifications: "Notification Center",
    notificationsBody: "Notifications are prepared based on the audience and delivery history is tracked in the panel.",
    scheduled: "Scheduled notification draft support is available.",
    offers: "Offer and Campaign Management",
    offersBody: "Draft, live and archived states are managed with story showcase, QR requirement, usage limit and performance counters.",
    draft: "Draft",
    live: "Live",
    story: "Story showcase",
    limit: "Usage limit",
    importExport: "Import / Export",
    importExportBody: "Files are previewed first; invalid rows are visible before saving.",
    category: "Category Management",
    categoryBody: "Venue and event categories can be created, sorted and managed by publish state in the admin panel.",
    miniModules: "Mini Module Management",
    miniModulesBody: "Tourist support content and Ancient Guide items are published from the panel and stay current on web and mobile.",
    touristSupport: "Tourist support",
    ancientGuide: "Ancient Guide",
    publishState: "Publish status",
    history: "Activity history"
  },
  ru: {
    notifications: "Центр уведомлений",
    notificationsBody: "Уведомления готовятся по аудитории, а история отправок отслеживается в панели.",
    scheduled: "Поддерживается черновик запланированного уведомления.",
    offers: "Управление предложениями и кампаниями",
    offersBody: "Черновики, публикации и архивы управляются вместе с витриной stories, QR-условием, лимитом и счетчиками.",
    draft: "Черновик",
    live: "В эфире",
    story: "Витрина stories",
    limit: "Лимит использования",
    importExport: "Импорт / Экспорт",
    importExportBody: "Файлы сначала просматриваются; ошибочные строки видны до сохранения.",
    category: "Управление категориями",
    categoryBody: "Категории мест и событий можно создавать, сортировать и управлять их публикацией из админ-панели.",
    miniModules: "Управление мини-модулями",
    miniModulesBody: "Контент туристической помощи и Античного гида публикуется из панели и остается актуальным на web и mobile.",
    touristSupport: "Туристическая помощь",
    ancientGuide: "Античный гид",
    publishState: "Статус публикации",
    history: "История действий"
  },
  de: {
    notifications: "Benachrichtigungszentrum",
    notificationsBody: "Benachrichtigungen werden nach Zielgruppe vorbereitet und die Versandhistorie wird im Panel verfolgt.",
    scheduled: "Entwurf für geplante Benachrichtigung wird unterstützt.",
    offers: "Angebots- und Kampagnenverwaltung",
    offersBody: "Entwurf, Live- und Archivstatus werden mit Story-Vitrine, QR-Bedingung, Nutzungslimit und Performancezählern verwaltet.",
    draft: "Entwurf",
    live: "Live",
    story: "Story-Vitrine",
    limit: "Nutzungslimit",
    importExport: "Import / Export",
    importExportBody: "Dateien werden zuerst in der Vorschau geprüft; fehlerhafte Zeilen sind vor dem Speichern sichtbar.",
    category: "Kategorieverwaltung",
    categoryBody: "Ort- und Event-Kategorien können im Adminbereich erstellt, sortiert und über ihren Publikationsstatus verwaltet werden.",
    miniModules: "Mini-Modulverwaltung",
    miniModulesBody: "Touristenhilfe und Antike-Guide-Inhalte werden im Panel veröffentlicht und bleiben auf Web und Mobile aktuell.",
    touristSupport: "Touristenhilfe",
    ancientGuide: "Antiker Guide",
    publishState: "Veröffentlichungsstatus",
    history: "Verlaufsdaten"
  }
} as const;

export function AdminOps() {
  const { locale } = useLocale();
  const copy = adminCopy[locale];
  return (
    <section className="admin-ops" id="admin-operations">
      <div className="ops-block" id="notifications">
        <Send size={22} />
        <h2>{copy.notifications}</h2>
        <p>{copy.notificationsBody}</p>
        <div className="ops-schedule">
          <Timer size={18} />
          <span>{copy.scheduled}</span>
        </div>
        <NotificationForm />
      </div>

      <div className="ops-block" id="offers">
        <Percent size={22} />
        <h2>{copy.offers}</h2>
        <p>{copy.offersBody}</p>
        <OfferCampaignForm />
      </div>

      <div className="ops-block" id="import">
        <FileSpreadsheet size={22} />
        <h2>{copy.importExport}</h2>
        <p>{copy.importExportBody}</p>
        <div className="import-table">
          {importKinds.map((kind) => (
            <article key={kind.id}>
              <strong>{kind.label}</strong>
              <span>{kind.requiredFields.length} zorunlu alan kontrol edilir.</span>
            </article>
          ))}
        </div>
        <ImportPreviewForm />
        <ExportManifestForm />
      </div>

      <div className="ops-block" id="category-management">
        <Boxes size={22} />
        <h2>{copy.category}</h2>
        <p>{copy.categoryBody}</p>
        <CategoryManagementForm />
      </div>

      <CatalogManagementOps />
    </section>
  );
}
