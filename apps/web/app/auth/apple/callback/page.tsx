import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apple Giriş Yönlendirmesi | Nar Rehberi",
  robots: { index: false, follow: false }
};

const script = `
(function () {
  var target = "narrehberi://auth/apple";
  var suffix = window.location.hash || window.location.search || "";
  window.location.replace(target + suffix);
})();
`;

export default function AppleAuthCallbackPage() {
  return (
    <main className="shell auth-callback-page" id="main-content">
      <section className="section section-centered">
        <div className="section-center-column">
          <h1>Apple girişi tamamlanıyor</h1>
          <p className="lead">Nar Rehberi uygulamasına dönüyorsunuz.</p>
          <a className="primary" href="narrehberi://auth/apple">Uygulamada aç</a>
        </div>
      </section>
      <script dangerouslySetInnerHTML={{ __html: script }} />
    </main>
  );
}
