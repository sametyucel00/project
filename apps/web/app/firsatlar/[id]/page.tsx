import { LiveOfferDetail } from "@/components/LiveDiscoveryDetail";
import { SiteFooter } from "@/components/SiteFooter";
import { featuredOffers, getOfferById } from "@nar/core";

export function generateStaticParams() {
  return featuredOffers.map((offer) => ({ id: offer.id }));
}

export default async function OfferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fallback = getOfferById(id) ?? null;

  return (
    <main className="shell">
      <LiveOfferDetail fallback={fallback} id={id} />
      <SiteFooter />
    </main>
  );
}
