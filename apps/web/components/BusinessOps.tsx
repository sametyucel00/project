"use client";

import { MapPinned, QrCode } from "lucide-react";
import { BusinessInfoForm } from "./BusinessInfoForm";
import { QrTransactionForm } from "./ActionForms";

export function BusinessOps() {
  return (
    <section className="admin-ops" aria-label="İşletme operasyon merkezi">
      <div className="ops-block" id="places">
        <MapPinned size={22} />
        <h2>İşletme Bilgileri</h2>
        <p>İşletme adı, açıklama, adres, çalışma saatleri, konum, görseller ve Google bilgilerini burada yönet.</p>
        <BusinessInfoForm />
      </div>

      <div className="ops-block" id="qr">
        <QrCode size={22} />
        <h2>QR ve Puan İşlemi</h2>
        <p>Kullanıcı QR kimliğiyle puan ekleme, puan düşme ve kullanım kayıtlarını tek işlemde yönet.</p>
        <QrTransactionForm />
      </div>
    </section>
  );
}
