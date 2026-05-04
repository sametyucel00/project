"use client";

import { useLocale } from "@/components/LocaleProvider";
import { ArrowRight, Compass, Download, LogIn } from "lucide-react";
import { SectionEyebrow } from "./SectionEyebrow";

export function HomeHero() {
  const { t } = useLocale();

  return (
    <div className="hero-copy">
      <SectionEyebrow icon={Compass}>{t("home.eyebrow")}</SectionEyebrow>
      <h1>{t("home.title")}</h1>
      <p className="lead">{t("home.lead")}</p>
      <div className="hero-actions">
        <a className="primary" href="/giris">
          <LogIn size={18} />
          <span style={{ marginLeft: 8 }}>{t("nav.login")}</span>
        </a>
        <a className="secondary" href="/mobil-uygulama">
          <Download size={18} />
          <span style={{ marginLeft: 8 }}>Mobil Uygulama</span>
        </a>
        <a className="secondary" href="#ozellikler">
          <ArrowRight size={18} />
          <span style={{ marginLeft: 8 }}>{t("common.explore")}</span>
        </a>
      </div>
    </div>
  );
}
