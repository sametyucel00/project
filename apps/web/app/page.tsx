import { AppShowcase } from "@/components/AppShowcase";
import { HomeHero } from "@/components/HomeHero";
import { HomeOffersRail } from "@/components/HomeOffersRail";
import { LandingSections } from "@/components/LandingSections";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function Home() {
  return (
    <main className="shell" id="main-content">
      <SiteHeader />
      <HomeOffersRail />

      <section className="hero">
        <HomeHero />
        <AppShowcase />
      </section>

      <LandingSections />

      <SiteFooter />
    </main>
  );
}
