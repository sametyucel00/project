"use client";

import { useLocale } from "@/components/LocaleProvider";
import { ArrowRight, Compass, Download, LogIn, Smartphone } from "lucide-react";
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
        <a className="secondary" href="https://play.google.com/store/apps/details?id=narrehberi.com&hl=tr" target="_blank" rel="noreferrer">
          <Smartphone size={18} />
          <span style={{ marginLeft: 8 }}>{t("common.androidApp")}</span>
        </a>
        <a className="secondary" href="https://apps.apple.com/tr/app/nar-rehberi/id6761314584" target="_blank" rel="noreferrer">
          <Smartphone size={18} />
          <span style={{ marginLeft: 8 }}>{t("common.iosApp")}</span>
        </a>
        <a className="secondary" href="#ozellikler">
          <ArrowRight size={18} />
          <span style={{ marginLeft: 8 }}>{t("common.explore")}</span>
        </a>
      </div>
    </div>
  );
}
