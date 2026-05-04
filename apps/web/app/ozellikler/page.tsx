import { MarketingPage } from "@/components/MarketingPage";
import { createMetadata } from "@/lib/seo";
import { getMarketingPage } from "@nar/core";
import { notFound } from "next/navigation";

export const metadata = createMetadata("/ozellikler");

export default function FeaturesPage() {
  const page = getMarketingPage("ozellikler");
  if (!page) notFound();
  return <MarketingPage page={page} />;
}
