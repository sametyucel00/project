"use client";

import { Boxes, FileSpreadsheet, Send, Timer } from "lucide-react";
import { CategoryManagementForm, ExportManifestForm, ImportPreviewForm, NotificationForm } from "./ActionForms";
import { CatalogManagementOps } from "./CatalogManagementOps";
import { useLocale } from "./LocaleProvider";

const adminCopy = {
  tr: {
    notifications: "Bildirim Merkezi",
    notificationsBody: "Bildirimler hedef kitleye göre hazırlanır ve gönderim geçmişi burada izlenir.",
    scheduled: "Zamanlanan bildirim desteği aktif.",
    importExport: "İçe / Dışa Aktarım",
    importExportBody: "Dosyalar önce önizlenir; hatalı satırlar kayıttan önce görünür olur.",
    category: "Kategori Yönetimi",
    categoryBody: "Mekan ve etkinlik kategorileri oluşturulur, sıralanır ve yayın durumuyla yönetilir."
  },
  en: {
    notifications: "Notification Center",
    notificationsBody: "Notifications are prepared by audience and delivery history is tracked here.",
    scheduled: "Scheduled notification support is enabled.",
    importExport: "Import / Export",
    importExportBody: "Files are previewed first; invalid rows are visible before saving.",
    category: "Category Management",
    categoryBody: "Venue and event categories are created, sorted and managed by publish state."
  },
  ru: {
    notifications: "Центр уведомлений",
    notificationsBody: "Уведомления готовятся по аудитории, а история отправок отслеживается здесь.",
    scheduled: "Поддержка запланированных уведомлений включена.",
    importExport: "Импорт / Экспорт",
    importExportBody: "Файлы сначала просматриваются; ошибочные строки видны до сохранения.",
    category: "Управление категориями",
    categoryBody: "Категории мест и событий создаются, сортируются и управляются по статусу публикации."
  },
  de: {
    notifications: "Benachrichtigungszentrum",
    notificationsBody: "Benachrichtigungen werden nach Zielgruppe vorbereitet und die Versandhistorie wird hier verfolgt.",
    scheduled: "Unterstützung für geplante Benachrichtigungen ist aktiv.",
    importExport: "Import / Export",
    importExportBody: "Dateien werden zuerst in der Vorschau geprüft; fehlerhafte Zeilen sind vor dem Speichern sichtbar.",
    category: "Kategorieverwaltung",
    categoryBody: "Ort- und Event-Kategorien werden erstellt, sortiert und über den Veröffentlichungsstatus verwaltet."
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

      <div className="ops-block" id="import">
        <FileSpreadsheet size={22} />
        <h2>{copy.importExport}</h2>
        <p>{copy.importExportBody}</p>
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
