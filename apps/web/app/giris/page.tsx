import { LoginClient } from "@/components/LoginClient";
import { LoginIntro } from "@/components/LoginIntro";
import { SiteHeader } from "@/components/SiteHeader";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata("/giris");

export default function LoginPage() {
  return (
    <main className="shell" id="main-content">
      <SiteHeader compact />
      <section className="section section-centered" style={{ minHeight: "calc(100vh - 68px)" }}>
        <div className="section-center-column section-center-column-wide">
          <LoginIntro />
          <LoginClient />
        </div>
      </section>
    </main>
  );
}
