import { LivePlaceDetail } from "@/components/LiveDiscoveryDetail";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { featuredPlaces, getPlaceById } from "@nar/core";

export function generateStaticParams() {
  return featuredPlaces.map((place) => ({ id: place.id }));
}

export default async function PlaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fallback = getPlaceById(id) ?? null;

  return (
    <main className="shell">
      <SiteHeader compact />
      <LivePlaceDetail fallback={fallback} id={id} />
      <SiteFooter />
    </main>
  );
}
