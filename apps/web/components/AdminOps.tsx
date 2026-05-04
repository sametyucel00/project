import { importKinds, notificationTargets } from "@nar/core";
import { Boxes, FileSpreadsheet, Landmark, Percent, Send, Timer } from "lucide-react";
import { CategoryManagementForm, ExportManifestForm, ImportPreviewForm, MiniModuleManagementForm, NotificationForm, OfferCampaignForm } from "./ActionForms";

export function AdminOps() {
  return (
    <section className="admin-ops" id="admin-operations">
      <div className="ops-block" id="notifications">
        <Send size={22} />
        <h2>Bildirim Merkezi</h2>
        <p>Bildirimler hedef kitleye göre hazırlanır ve gönderim geçmişi panelde izlenir.</p>
        <div className="ops-grid">
          {notificationTargets.map((target) => (
            <button key={target.id}>{target.label}</button>
          ))}
        </div>
        <div className="ops-schedule">
          <Timer size={18} />
          <span>Zamanlanmış bildirim taslağı desteklenir.</span>
        </div>
        <NotificationForm />
      </div>

      <div className="ops-block" id="offers">
        <Percent size={22} />
        <h2>Fırsat ve Kampanya Yönetimi</h2>
        <p>Taslak, yayında ve arşiv durumları; hikaye vitrini, QR şartı, kullanım limiti ve performans sayaçlarıyla birlikte yönetilir.</p>
        <div className="ops-grid">
          {["Taslak", "Yayında", "Hikaye vitrini", "Kullanım limiti"].map((item) => (
            <button key={item}>{item}</button>
          ))}
        </div>
        <OfferCampaignForm />
      </div>

      <div className="ops-block" id="import">
        <FileSpreadsheet size={22} />
        <h2>İçe / Dışa Aktarım</h2>
        <p>Dosyalar önce önizlenir; hatalı satırlar kayıt işleminden önce görünür olur.</p>
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
        <h2>Kategori Yönetimi</h2>
        <p>Mekan ve etkinlik kategorileri admin panelinden oluşturulabilir, sıralanabilir ve yayın durumuyla yönetilebilir.</p>
        <div className="ops-grid">
          {["Mekan kategorisi", "Etkinlik kategorisi", "Çok dil", "Sıralama"].map((item) => (
            <button key={item}>{item}</button>
          ))}
        </div>
        <CategoryManagementForm />
      </div>

      <div className="ops-block" id="general">
        <Landmark size={22} />
        <h2>Mini Modül Yönetimi</h2>
        <p>Turist destek bilgileri ve Antik Rehber içerikleri panelden yayınlanır; web ve mobilde güncel hali görünür.</p>
        <div className="ops-grid">
          {["Turist destek", "Antik Rehber", "Yayın durumu", "İşlem geçmişi"].map((item) => (
            <button key={item}>{item}</button>
          ))}
        </div>
        <MiniModuleManagementForm />
      </div>
    </section>
  );
}
