import { MarketingPage } from "@/components/MarketingPage";
import { createMetadata } from "@/lib/seo";
import { getMarketingPage } from "@nar/core";
import { notFound } from "next/navigation";

export const metadata = createMetadata("/isletmeler-icin");

export default function BusinessPage() {
  const page = getMarketingPage("isletmeler-icin");
  if (!page) notFound();
  return <MarketingPage page={page} />;
}
