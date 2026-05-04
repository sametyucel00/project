# Nar Rehberi Next Gen

Nar Rehberi; şehir keşfi, mekanlar, etkinlikler, tiyatro yönetimi, fırsatlar, QR sadakat ve rol bazlı paneller için sıfırdan kurulan modern platformdur.

## Yapı

- `apps/web`: Next.js tanıtım sitesi, discovery yüzeyi ve rol bazlı giriş merkezi.
- `apps/mobile`: React Native / Expo mobil uygulama iskeleti.
- `packages/core`: Paylaşılan veri modelleri, roller, kategoriler, i18n ve seed verileri.
- `packages/ui`: Ortak tasarım tokenları.
- `firebase`: Firestore rules, indexes ve Cloud Functions.
- `scripts/check-turkish-encoding.mjs`: Türkçe karakter bozulması ve UTF-8 kalite kontrolü.

## Geliştirme

```bash
npm install
npm run dev:web
npm run dev:mobile
npm run check:quality
```

Production, Android, iOS veya Windows build scriptleri bilinçli olarak eklenmedi. Geliştirme ve test akışı hazırdır.

Firestore emulator seed akışı:

```powershell
npm run seed:export
$env:FIRESTORE_EMULATOR_HOST='127.0.0.1:8080'
npm run seed:firestore
```

Detaylı geliştirme notları: [docs/development.md](docs/development.md)

## Kritik Kurallar

- Tüm metin dosyaları UTF-8 tutulur.
- Bozuk mojibake karakterleri kalite kontrolünde hata üretir.
- Dinamik içerikler `title.tr`, `title.en`, `title.ru`, `title.de` ve `description.*` formatıyla tutulur.
- Kullanıcı rolleri: `individual`, `business`, `theater`, `admin`.
- Yeni bireysel kullanıcılar 500 puan ile başlar.
- Gizli anahtarlar, signing dosyaları ve build artefactleri repoya eklenmez.
