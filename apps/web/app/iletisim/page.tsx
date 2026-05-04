import { ContactForm } from "@/components/ContactForm";
import { MarketingPage } from "@/components/MarketingPage";
import { SiteFooter } from "@/components/SiteFooter";
import { createMetadata } from "@/lib/seo";
import { getMarketingPage } from "@nar/core";
import { notFound } from "next/navigation";

export const metadata = createMetadata("/iletisim");

export default function ContactPage() {
  const page = getMarketingPage("iletisim");
  if (!page) notFound();
  return (
    <>
      <MarketingPage page={page} showFooter={false} />
      <section className="section section-centered">
        <div className="section-center-column">
          <ContactForm />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
