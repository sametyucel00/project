import { OffersExplorer } from "@/components/OffersExplorer";
import { SiteFooter } from "@/components/SiteFooter";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata("/firsatlar");

export default function OffersPage() {
  return (
    <main className="shell" id="main-content">
      <section className="section section-centered">
        <OffersExplorer />
      </section>
      <SiteFooter />
    </main>
  );
}
