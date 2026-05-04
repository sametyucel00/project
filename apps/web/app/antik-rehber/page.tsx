import { LiveAncientGuide } from "@/components/LiveMiniModules";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata("/antik-rehber");

export default function AncientGuidePage() {
  return (
    <main className="shell" id="main-content">
      <nav className="nav">
        <a className="brand" href="/"><span className="brand-mark">N</span><span>Nar Rehberi</span></a>
        <a className="nav-action" href="/mekanlar">Mekanlar</a>
      </nav>
      <section className="section">
        <p className="eyebrow">Antik Rehber</p>
        <h1>Şehrin antik katmanlarını kompakt keşif rotalarına dönüştür.</h1>
        <p className="lead">Ana menüye dönüşmeden, şehir keşif akışında mini kültür rotaları olarak görünür.</p>
        <LiveAncientGuide />
      </section>
    </main>
  );
}
