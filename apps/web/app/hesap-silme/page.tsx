import { SiteFooter } from "@/components/SiteFooter";
import type { Metadata } from "next";
import { AlertCircle, CheckCircle2, Mail, ShieldCheck, Trash2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Hesap ve Veri Silme | Nar Rehberi",
  description:
    "Nar Rehberi kullanıcıları için hesap kapatma ve kişisel veri silme talebi sayfası.",
  alternates: {
    canonical: "/hesap-silme/"
  },
  robots: {
    index: true,
    follow: true
  }
};

const deletedItems = [
  "Profil bilgileri ve hesap rolü",
  "E-posta ile ilişkili kullanıcı kaydı",
  "Favoriler, görevler, rozetler ve uygulama tercihleri",
  "QR, puan ve bildirim tercih kayıtları",
  "Cihaz bildirim tokenları"
];

const retainedItems = [
  "Yasal yükümlülük, güvenlik veya uyuşmazlık çözümü için gerekli işlem kayıtları sınırlı süre tutulabilir.",
  "Anonimleştirilmiş istatistikler kişisel kimlik bilgisi içermeden saklanabilir."
];

export default function AccountDeletionPage() {
  return (
    <>
      <main className="shell" id="main-content">
        <section className="legal-hero">
          <div className="section-center-column section-center-column-wide">
            <span className="legal-kicker">
              <Trash2 size={18} />
              Hesap ve veri silme
            </span>
            <h1>Nar Rehberi hesabınızı ve kişisel verilerinizi silebilirsiniz.</h1>
            <p className="lead">
              Bu sayfa, Nar Rehberi mobil uygulaması ve web hesabı için hesap kapatma
              ve veri silme taleplerinin nasıl yapılacağını açıklar. Sayfa herkese
              açıktır ve giriş yapmadan erişilebilir.
            </p>
            <div className="legal-actions">
              <a className="primary" href="mailto:bilgi@narrehberi.com?subject=Nar%20Rehberi%20Hesap%20Silme%20Talebi">
                <Mail size={18} />
                Silme talebi gönder
              </a>
              <a className="secondary" href="/iletisim/">
                İletişim formu
              </a>
            </div>
          </div>
        </section>

        <section className="section section-centered legal-section">
          <div className="legal-grid section-center-column section-center-column-wide">
            <article className="legal-card">
              <CheckCircle2 size={22} />
              <h2>Uygulama içinden silme</h2>
              <p>
                Nar Rehberi uygulamasında hesabınız açıksa Profil veya Ayarlar
                ekranından <strong>Hesabı sil</strong> seçeneğini kullanabilirsiniz.
                İşlem tamamlandığında hesap kapatma talebi alınır ve ilişkili kişisel
                veriler silme sürecine girer.
              </p>
            </article>

            <article className="legal-card">
              <Mail size={22} />
              <h2>E-posta ile talep</h2>
              <p>
                Uygulamaya erişemiyorsanız kayıtlı e-posta adresinizden
                <a href="mailto:bilgi@narrehberi.com"> bilgi@narrehberi.com</a>
                adresine “Hesap silme talebi” başlığıyla yazabilirsiniz. Talebin size
                ait olduğunu doğrulamak için yalnızca gerekli bilgiler istenir.
              </p>
            </article>

            <article className="legal-card">
              <ShieldCheck size={22} />
              <h2>İşlem süresi</h2>
              <p>
                Doğrulanan talepler mümkün olan en kısa sürede, en geç 30 gün içinde
                işlenir. Silme tamamlandığında hesabınıza bağlı kişisel veriler aktif
                sistemlerden kaldırılır veya anonimleştirilir.
              </p>
            </article>
          </div>
        </section>

        <section className="section section-centered legal-section legal-section-compact">
          <div className="section-center-column section-center-column-wide legal-columns">
            <div>
              <h2>Silinen veriler</h2>
              <ul className="legal-list">
                {deletedItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2>Sınırlı süre tutulabilecek veriler</h2>
              <ul className="legal-list legal-list-muted">
                {retainedItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="section section-centered legal-section legal-section-compact">
          <div className="section-center-column section-center-column-wide legal-note">
            <AlertCircle size={22} />
            <div>
              <h2>English summary</h2>
              <p>
                Nar Rehberi users can request account and personal data deletion from
                the app settings or by emailing <a href="mailto:bilgi@narrehberi.com">bilgi@narrehberi.com</a>.
                Verified requests are processed within 30 days. Profile, account,
                favorites, QR, points, notification preferences and device tokens are
                deleted or anonymized unless limited retention is legally required.
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
