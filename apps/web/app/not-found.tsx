export default function NotFound() {
  return (
    <main className="shell" id="main-content">
      <section className="section system-state" aria-labelledby="not-found-title">
        <p className="eyebrow">404</p>
        <h1 id="not-found-title">Bu rota henüz şehir haritasında yok.</h1>
        <p className="lead">Ana sayfaya dönebilir veya keşif alanlarından devam edebilirsiniz.</p>
        <div className="hero-actions" aria-label="404 aksiyonları">
          <a className="primary" href="/">Ana sayfa</a>
          <a className="secondary" href="/mekanlar">Mekanlar</a>
        </div>
      </section>
    </main>
  );
}
