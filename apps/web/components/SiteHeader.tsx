"use client";

import { AccessibilityControls } from "./AccessibilityControls";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLocale } from "./LocaleProvider";
import { ThemeToggle } from "./ThemeToggle";
import { Building2, CalendarDays, CircleHelp, Compass, Gift, Mail } from "lucide-react";

const navItems = [
  { href: "/mekanlar", key: "nav.places", icon: Compass },
  { href: "/etkinlikler", key: "nav.events", icon: CalendarDays },
  { href: "/firsatlar", key: "nav.offers", icon: Gift },
  { href: "/isletmeler-icin", key: "nav.business", icon: Building2 },
  { href: "/hakkimizda", key: "nav.about", icon: CircleHelp },
  { href: "/iletisim", key: "nav.contact", icon: Mail }
];

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  const { t } = useLocale();

  return (
    <nav className="nav">
      <a className="brand" href="/">
        <img className="brand-logo brand-logo-light" src="/nar-logo.png" alt="Nar Rehberi logosu" />
        <img className="brand-logo brand-logo-dark" src="/nar-logo.png" alt="Nar Rehberi logosu" />
        <span>Nar Rehberi</span>
      </a>
      {!compact ? (
        <div className="nav-links" aria-label="Ana menü">
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>
              <item.icon size={15} />
              <span>{t(item.key)}</span>
            </a>
          ))}
        </div>
      ) : <div className="nav-spacer" />}
      <div className="nav-tools">
        {!compact ? <LanguageSwitcher /> : null}
        <AccessibilityControls />
        <ThemeToggle />
        <a href="/giris" className="nav-action">{t("nav.login")}</a>
      </div>
    </nav>
  );
}
