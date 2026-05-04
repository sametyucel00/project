import { AppShowcase } from "@/components/AppShowcase";
import { MarketingPage } from "@/components/MarketingPage";
import { SiteFooter } from "@/components/SiteFooter";
import { createMetadata } from "@/lib/seo";
import { getMarketingPage } from "@nar/core";
import { notFound } from "next/navigation";

export const metadata = createMetadata("/mobil-uygulama");

export default function MobileAppPage() {
  const page = getMarketingPage("mobil-uygulama");
  if (!page) notFound();
  return (
    <>
      <MarketingPage page={page} showFooter={false} />
      <section className="section section-centered" id="mobil">
        <div className="section-center-column section-center-column-wide">
          <div className="section-head">
            <h2>Mobil deneyim ilk bakışta kendini anlatır.</h2>
            <p>Ana sayfa, öneriler ve kısa yollar aynı akışta buluşur.</p>
          </div>
        </div>
        <AppShowcase />
      </section>
      <SiteFooter />
    </>
  );
}
