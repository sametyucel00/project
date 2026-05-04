import { PlacesExplorer } from "@/components/PlacesExplorer";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata("/mekanlar");

export default function PlacesPage() {
  return (
    <main className="shell" id="main-content">
      <SiteHeader />
      <section className="section section-centered">
        <PlacesExplorer />
      </section>
      <SiteFooter />
    </main>
  );
}
