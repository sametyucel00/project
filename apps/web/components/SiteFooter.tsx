"use client";

import { Facebook, Instagram, Linkedin, Mail, Music2, Twitter } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLocale } from "./LocaleProvider";

export function SiteFooter() {
  const { t } = useLocale();

  return (
    <footer className="footer">
      <div className="footer-brand">
        <strong>Nar Rehberi</strong>
        <span>{t("footer.tagline")}</span>
      </div>
      <div className="footer-links" aria-label="Alt menü">
        <a href="/hakkimizda">{t("nav.about")}</a>
        <a href="/iletisim">{t("nav.contact")}</a>
        <a href="/mobil-uygulama">{t("common.mobileApp")}</a>
        <a href="/isletmeler-icin">{t("common.businessesFor")}</a>
        <a href="/hesap-silme">Hesap silme</a>
      </div>
      <LanguageSwitcher />
      <div className="social-links" aria-label="Sosyal medya">
        <a href="https://www.instagram.com/narrehberi.antalya/" aria-label="Instagram" target="_blank" rel="noreferrer"><Instagram size={18} /></a>
        <a href="https://x.com/NarRehberi" aria-label="X" target="_blank" rel="noreferrer"><Twitter size={18} /></a>
        <a href="https://www.tiktok.com/@narrehberi" aria-label="TikTok" target="_blank" rel="noreferrer"><Music2 size={18} /></a>
        <a href="https://www.facebook.com/profile.php?id=61581596289276" aria-label="Facebook" target="_blank" rel="noreferrer"><Facebook size={18} /></a>
        <a href="https://www.linkedin.com/company/narrehberi/" aria-label="LinkedIn" target="_blank" rel="noreferrer"><Linkedin size={18} /></a>
        <a href="mailto:bilgi@narrehberi.com" aria-label="E-posta"><Mail size={18} /></a>
      </div>
    </footer>
  );
}
