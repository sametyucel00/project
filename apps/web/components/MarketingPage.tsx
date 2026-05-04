"use client";

import type { MarketingPageContent } from "@nar/core";
import { ArrowRight, Building2, CheckCircle2, Handshake, Info, Smartphone, type LucideIcon } from "lucide-react";
import { SiteFooter } from "./SiteFooter";
import { useLocale } from "./LocaleProvider";
import { SectionEyebrow } from "./SectionEyebrow";

const localizedPages: Record<string, Record<string, { eyebrow: string; title: string; description: string; sections: Array<{ title: string; text: string }> }>> = {
  "hakkimizda": {
    en: {
      eyebrow: "About",
      title: "A city guide shaped around venues, events and memorable routes.",
      description: "Nar Rehberi brings residents, visitors, businesses and stages into the same city rhythm.",
      sections: [
        { title: "One discovery flow", text: "Places, events and offers stay close without tiring the user." },
        { title: "Local texture", text: "Neighborhood mood, timing and real venue signals drive the experience." },
        { title: "Shared platform", text: "Individuals, businesses and theaters move inside the same clear system." }
      ]
    }
  },
  "isletmeler-icin": {
    en: {
      eyebrow: "For Businesses",
      title: "Manage your venue, offers and loyalty flow from one calm workspace.",
      description: "Nar Rehberi helps businesses become easier to discover, easier to revisit and easier to recommend.",
      sections: [
        { title: "Venue control", text: "Keep venue details, visuals and discovery signals up to date." },
        { title: "Offer management", text: "Publish campaigns, QR perks and time-based highlights quickly." },
        { title: "Loyalty flow", text: "Track points, QR activity and repeat engagement in one place." }
      ]
    }
  },
  "mobil-uygulama": {
    en: {
      eyebrow: "Mobile App",
      title: "A discovery experience that feels fast, quiet and useful from the first tap.",
      description: "Search, stories, routes and event timing come together in one mobile rhythm.",
      sections: [
        { title: "Quick home", text: "The home screen adapts to time of day and nearby context." },
        { title: "Cleaner details", text: "Venue, event and offer pages stay clear even when data is incomplete." },
        { title: "Loyalty built in", text: "QR use, points and perks stay close to the discovery flow." }
      ]
    }
  },
  "iletisim": {
    en: {
      eyebrow: "Contact",
      title: "Reach the right team without getting lost in the process.",
      description: "Business partnerships, theater solutions, support and city collaborations are routed from one form.",
      sections: [
        { title: "Clear routing", text: "Choose your topic and the message goes to the relevant team." },
        { title: "Fast follow-up", text: "Requests land in one stream so nothing gets lost." },
        { title: "Human tone", text: "We keep the contact surface short, clear and easy to use." }
      ]
    }
  }
};

function resolvePage(page: MarketingPageContent, locale: string) {
  if (locale === "tr") return page;
  const localized = localizedPages[page.slug]?.[locale] ?? localizedPages[page.slug]?.en;
  if (!localized) return page;
  return { ...page, ...localized };
}

const pageIcons: Record<string, LucideIcon> = {
  "hakkimizda": Info,
  "isletmeler-icin": Building2,
  "mobil-uygulama": Smartphone,
  "iletisim": Handshake
};

export function MarketingPage({ page, showFooter = true }: { page: MarketingPageContent; showFooter?: boolean }) {
  const { locale, t } = useLocale();
  const resolvedPage = resolvePage(page, locale);
  const EyebrowIcon = pageIcons[page.slug] ?? Info;

  return (
    <main className="shell" id="main-content">
      <section className="marketing-hero">
        <div className="section-center-column section-center-column-wide">
          <SectionEyebrow icon={EyebrowIcon}>{resolvedPage.eyebrow}</SectionEyebrow>
          <h1>{resolvedPage.title}</h1>
          <p className="lead">{resolvedPage.description}</p>
          <div className="hero-actions">
            <a className="primary" href="/giris">
              <ArrowRight size={18} />
              <span>{t("common.start")}</span>
            </a>
            <a className="secondary" href="/iletisim">
              <span>{t("common.contact")}</span>
            </a>
            {page.slug === "mobil-uygulama" ? (
              <>
                <a className="secondary" href="https://play.google.com/store/apps/details?id=narrehberi.com&hl=tr" target="_blank" rel="noreferrer">
                  <Smartphone size={18} />
                  <span>{t("common.androidApp")}</span>
                </a>
                <a className="secondary" href="https://apps.apple.com/tr/app/nar-rehberi/id6761314584" target="_blank" rel="noreferrer">
                  <Smartphone size={18} />
                  <span>{t("common.iosApp")}</span>
                </a>
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section className="section section-centered">
        <div className="marketing-grid section-center-column section-center-column-wide">
          {resolvedPage.sections.map((section) => (
            <article className="marketing-item" key={section.title}>
              <CheckCircle2 size={22} />
              <h2>{section.title}</h2>
              <p>{section.text}</p>
            </article>
          ))}
        </div>
      </section>
      {showFooter ? <SiteFooter /> : null}
    </main>
  );
}
