import { MarketingPage } from "@/components/MarketingPage";
import { createMetadata } from "@/lib/seo";
import { getMarketingPage } from "@nar/core";
import { notFound } from "next/navigation";

export const metadata = createMetadata("/hakkimizda");

export default function AboutPage() {
  const page = getMarketingPage("hakkimizda");
  if (!page) notFound();
  return <MarketingPage page={page} />;
}
