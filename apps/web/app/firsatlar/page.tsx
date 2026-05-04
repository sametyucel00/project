import { OffersExplorer } from "@/components/OffersExplorer";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata("/firsatlar");

export default function OffersPage() {
  return (
    <main className="shell" id="main-content">
      <SiteHeader />
      <section className="section section-centered">
        <OffersExplorer />
      </section>
      <SiteFooter />
    </main>
  );
}
