# Development Ortamı

Bu proje development ve test ortamı için hazırlanır. Kullanıcı açıkça istemeden production web build, Android build, iOS build veya Windows build alınmaz.

## Kurulum

```bash
npm install
```

## Web

```bash
npm run dev:web
```

Varsayılan adres:

```text
http://127.0.0.1:3000
```

Rota ve responsive kontrollerini çalışan dev sunucuya karşı koşturmak için:

```powershell
$env:NAR_WEB_BASE_URL='http://127.0.0.1:3000'
npm run check:web-live
```

## Mobil

```bash
npm run dev:mobile
```

Expo development ortamı açılır. Android/iOS production build komutu bilinçli olarak eklenmemiştir.

## Firebase Emulator

Firebase config `firebase/` klasörü altında tutulur. Cloud Functions workspace komutu Firebase CLI'yı aynı ağacın içinden çalıştırır:

```bash
npm run dev:functions
```

Emulator portları:

- Auth: `9099`
- Firestore: `8080`
- Functions: `5001`
- Storage: `9199`
- Emulator UI: `4000`

Web veya mobil uygulamayı emulatorlara bağlamak için `.env` içinde şu bayraklar açılır:

```env
NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true
EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true
```

Host ve port değerleri `.env.example` içinde ayrı anahtarlar olarak tutulur. Varsayılan demo proje `demo-nar-rehberi` canlı Firebase'e yazmayı engellemek için `.firebaserc` içinde sabitlenmiştir.

## Seed Data

Development seed dosyaları `firebase/seed` altında tutulur.

```bash
npm run seed:export
npm run check:seed
```

Firestore emulator çalışırken seed verisini basmak için:

```powershell
$env:FIRESTORE_EMULATOR_HOST='127.0.0.1:8080'
npm run seed:firestore
```

`seed:firestore` canlı Firebase projesine yazmayı engellemek için `FIRESTORE_EMULATOR_HOST` olmadan çalışmaz.

## Environment

`.env.example` içindeki anahtarlar gerçek Firebase ve Google Maps değerleriyle doldurulabilir. Değerler boşken uygulama development sayfalarını kırmamak için demo fallback kullanır.

Kritik environment alanları:

- Firebase web ve Expo public config anahtarları
- Firebase emulator host ve portları
- Google Maps API anahtarları
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_FCM_VAPID_KEY`

## Kalite Kontrolleri

```bash
npm run check:quality
```

Çalışan web development sunucusuna karşı canlı rota ve responsive sağlık kontrolü:

```powershell
$env:NAR_WEB_BASE_URL='http://127.0.0.1:3000'
npm run check:web-live
```

`check:quality` şu kontrolleri çalıştırır:

- Türkçe karakter / UTF-8
- Environment ve emulator sözleşmesi
- Seed data sözleşmesi
- Firebase security rules
- Veri sözleşmeleri
- Import/export davranışı
- Auth, rol yönlendirme ve QR akışı
- Bildirim, etkinlik, mekan ve fırsat akışları
- Çok dil, tema ve mini modüller
- Governance, SEO, audit ve error log
- Analytics ve dashboard istatistikleri
- UI contract
- Web route inventory
- Product-flow izleri
- Accessibility izleri
- TypeScript
