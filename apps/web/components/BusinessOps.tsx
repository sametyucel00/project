import { BadgePercent, MapPinned, QrCode } from "lucide-react";
import { GooglePlaceSnapshotForm, OfferCampaignForm, QrTransactionForm } from "./ActionForms";

export function BusinessOps() {
  return (
    <section className="admin-ops" aria-label="İşletme operasyon merkezi">
      <div className="ops-block" id="qr">
        <QrCode size={22} />
        <h2>QR ve Puan İşlemi</h2>
        <p>Kullanıcı QR kimliğiyle puan ekleme, puan düşme ve kampanya kullanımını tek işlem kaydına bağlar.</p>
        <QrTransactionForm />
      </div>

      <div className="ops-block" id="offers">
        <BadgePercent size={22} />
        <h2>Fırsat Yönetimi</h2>
        <p>Anlık kampanya, hikaye vitrini, QR şartı, kullanım limiti ve yayın durumunu işletme akışına taşır.</p>
        <OfferCampaignForm />
      </div>

      <div className="ops-block" id="places">
        <MapPinned size={22} />
        <h2>Google Mekan Bilgisi</h2>
        <p>Telefon, web sitesi, puan, yorum sayısı, çalışma saatleri ve konum bilgisi mekan detayına işlenir.</p>
        <GooglePlaceSnapshotForm />
      </div>
    </section>
  );
}
