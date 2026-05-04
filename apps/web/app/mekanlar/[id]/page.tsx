import { LivePlaceDetail } from "@/components/LiveDiscoveryDetail";
import { SiteFooter } from "@/components/SiteFooter";
import { featuredPlaces, getPlaceById } from "@nar/core";

export function generateStaticParams() {
  return featuredPlaces.map((place) => ({ id: place.id }));
}

export default async function PlaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fallback = getPlaceById(id) ?? null;

  return (
    <main className="shell">
      <LivePlaceDetail fallback={fallback} id={id} />
      <SiteFooter />
    </main>
  );
}
