import { LiveEventDetail } from "@/components/LiveDiscoveryDetail";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { featuredEvents, getEventById } from "@nar/core";

export function generateStaticParams() {
  return featuredEvents.map((event) => ({ id: event.id }));
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fallback = getEventById(id) ?? null;

  return (
    <main className="shell">
      <SiteHeader compact />
      <LiveEventDetail fallback={fallback} id={id} />
      <SiteFooter />
    </main>
  );
}
