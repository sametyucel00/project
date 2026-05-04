"use client";

import { useLocale } from "@/components/LocaleProvider";
import { LockKeyhole } from "lucide-react";
import { SectionEyebrow } from "./SectionEyebrow";

export function LoginIntro() {
  const { t } = useLocale();

  return (
    <>
      <SectionEyebrow icon={LockKeyhole}>{t("login.eyebrow")}</SectionEyebrow>
      <h1 style={{ fontSize: "clamp(42px, 7vw, 76px)" }}>{t("login.title")}</h1>
      <p className="lead">{t("login.lead")}</p>
    </>
  );
}
