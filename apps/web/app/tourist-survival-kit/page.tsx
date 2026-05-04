import { LiveTouristSurvivalKit } from "@/components/LiveMiniModules";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata("/tourist-survival-kit");

export default function TouristSurvivalKitPage() {
  return (
    <main className="shell" id="main-content">
      <nav className="nav">
        <a className="brand" href="/"><span className="brand-mark">N</span><span>Nar Rehberi</span></a>
        <a className="nav-action" href="/mobil-uygulama">Mobil Uygulama</a>
      </nav>
      <section className="section">
        <p className="eyebrow">Tourist Survival Kit</p>
        <h1>Turistlerin şehirde hızlıca ihtiyaç duyacağı küçük ama kritik rehber.</h1>
        <p className="lead">Acil numaralar, eczaneler, hastaneler, ulaşım ve turist bilgileri ana menüye yük olmadan mini modül olarak çalışır.</p>
        <LiveTouristSurvivalKit />
      </section>
    </main>
  );
}
