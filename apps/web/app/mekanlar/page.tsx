import { PlacesExplorer } from "@/components/PlacesExplorer";
import { SiteFooter } from "@/components/SiteFooter";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata("/mekanlar");

export default function PlacesPage() {
  return (
    <main className="shell" id="main-content">
      <section className="section section-centered">
        <PlacesExplorer />
      </section>
      <SiteFooter />
    </main>
  );
}
