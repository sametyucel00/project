import { EventsExplorer } from "@/components/EventsExplorer";
import { SiteFooter } from "@/components/SiteFooter";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata("/etkinlikler");

export default function EventsPage() {
  return (
    <main className="shell" id="main-content">
      <section className="section section-centered">
        <EventsExplorer />
      </section>
      <SiteFooter />
    </main>
  );
}
