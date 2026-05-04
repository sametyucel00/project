import { MarketingPage } from "@/components/MarketingPage";
import { createMetadata } from "@/lib/seo";
import { getMarketingPage } from "@nar/core";
import { notFound } from "next/navigation";

export const metadata = createMetadata("/tiyatro-cozumleri");

export default function TheaterSolutionsPage() {
  const page = getMarketingPage("tiyatro-cozumleri");
  if (!page) notFound();
  return <MarketingPage page={page} />;
}
