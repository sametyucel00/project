import { SiteFooter } from "@/components/SiteFooter";
import type { Metadata } from "next";
import { Bell, Database, LockKeyhole, Mail, MapPin, ShieldCheck, Trash2, UserRound } from "lucide-react";

export const metadata: Metadata = {
  title: "Gizlilik Politikası | Nar Rehberi",
  description:
    "Nar Rehberi mobil uygulaması ve web platformu için gizlilik politikası, veri toplama, kullanım ve silme açıklamaları.",
  alternates: {
    canonical: "/privacy-policy/"
  },
  robots: {
    index: true,
    follow: true
  }
};

const sections = [
  {
    icon: UserRound,
    title: "Toplanan bilgiler",
    text:
      "Nar Rehberi; hesap oluşturma, giriş yapma, profil yönetimi ve uygulama deneyimini sunmak için ad soyad, e-posta adresi, kullanıcı rolü, tercih edilen dil, tema tercihi ve hesap durum bilgilerini işleyebilir."
  },
  {
    icon: MapPin,
    title: "Konum verisi",
    text:
      "Konum izni verirseniz yakınınızdaki mekan ve etkinlik mesafelerini göstermek için cihaz konumunuz kullanılabilir. Konum izni isteğe bağlıdır ve cihaz ayarlarından her zaman kapatılabilir."
  },
  {
    icon: Bell,
    title: "Bildirim ve cihaz bilgileri",
    text:
      "Bildirim tercihlerinizi yönetebilmek için cihaz bildirim tokenları, bildirim izin durumu ve bildirim geçmişi tutulabilir. Bildirimleri cihaz veya uygulama ayarlarından kapatabilirsiniz."
  },
  {
    icon: Database,
    title: "Uygulama kullanım verileri",
    text:
      "Favoriler, QR işlemleri, puan hareketleri, görevler, rozetler, siparişler, fırsat kullanımı ve benzeri uygulama kayıtları hizmetin çalışması ve güvenliği için saklanabilir."
  },
  {
    icon: LockKeyhole,
    title: "Verilerin korunması",
    text:
      "Veriler Firebase Auth, Firestore, Firebase Storage ve ilgili güvenlik kuralları üzerinden korunur. Yetkisiz erişimi önlemek için rol bazlı erişim, doğrulama ve kayıt kontrolleri kullanılır."
  },
  {
    icon: Trash2,
    title: "Hesap ve veri silme",
    text:
      "Hesabınızı ve kişisel verilerinizi uygulama içinden veya hesap silme sayfasındaki yöntemlerle silebilirsiniz. Doğrulanan talepler en geç 30 gün içinde işlenir."
  }
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <main className="shell" id="main-content">
        <section className="legal-hero">
          <div className="section-center-column section-center-column-wide">
            <span className="legal-kicker">
              <ShieldCheck size={18} />
              Gizlilik Politikası
            </span>
            <h1>Nar Rehberi gizliliğinizi açık, anlaşılır ve kontrollü şekilde yönetir.</h1>
            <p className="lead">
              Bu politika Nar Rehberi mobil uygulaması, web sitesi ve kullanıcı
              panellerinde hangi verilerin işlendiğini, verilerin hangi amaçla
              kullanıldığını ve kullanıcıların haklarını açıklar.
            </p>
            <div className="legal-actions">
              <a className="primary" href="/hesap-silme/">
                <Trash2 size={18} />
                Hesap ve veri silme
              </a>
              <a className="secondary" href="mailto:bilgi@narrehberi.com">
                <Mail size={18} />
                bilgi@narrehberi.com
              </a>
            </div>
          </div>
        </section>

        <section className="section section-centered legal-section">
          <div className="legal-grid section-center-column section-center-column-wide">
            {sections.map(({ icon: Icon, title, text }) => (
              <article className="legal-card" key={title}>
                <Icon size={22} />
                <h2>{title}</h2>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section section-centered legal-section legal-section-compact">
          <div className="section-center-column section-center-column-wide legal-columns">
            <div>
              <h2>Verilerin kullanım amaçları</h2>
              <ul className="legal-list">
                <li>Hesap oluşturma, giriş ve oturum yönetimi</li>
                <li>Mekan, etkinlik, fırsat ve harita deneyimini sunma</li>
                <li>QR, puan, görev, favori ve bildirim özelliklerini çalıştırma</li>
                <li>Güvenlik, hata tespiti, kötüye kullanım önleme ve destek süreçleri</li>
                <li>Yasal yükümlülüklerin yerine getirilmesi</li>
              </ul>
            </div>
            <div>
              <h2>Kullanıcı hakları</h2>
              <ul className="legal-list legal-list-muted">
                <li>Hesap bilgilerinizi güncelleme</li>
                <li>Bildirim ve konum tercihlerinizi değiştirme</li>
                <li>Hesabınızın ve kişisel verilerinizin silinmesini isteme</li>
                <li>Veri işleme hakkında bilgi talep etme</li>
                <li>Destek için bizimle iletişime geçme</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="section section-centered legal-section legal-section-compact">
          <div className="section-center-column section-center-column-wide legal-note">
            <Mail size={22} />
            <div>
              <h2>İletişim</h2>
              <p>
                Gizlilik, veri güvenliği veya hesap silme talepleriniz için
                <a href="mailto:bilgi@narrehberi.com"> bilgi@narrehberi.com</a>
                adresinden Nar Rehberi ekibine ulaşabilirsiniz. Son güncelleme:
                4 Mayıs 2026.
              </p>
            </div>
          </div>
        </section>

        <section className="section section-centered legal-section legal-section-compact">
          <div className="section-center-column section-center-column-wide legal-note">
            <ShieldCheck size={22} />
            <div>
              <h2>English summary</h2>
              <p>
                Nar Rehberi may process account, email, role, language, theme,
                optional location, notification token, favorites, QR, points and app
                activity data to provide the service. Users can manage permissions,
                contact us at <a href="mailto:bilgi@narrehberi.com">bilgi@narrehberi.com</a>,
                and request account or personal data deletion from the app or
                <a href="/hesap-silme/"> the account deletion page</a>.
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
