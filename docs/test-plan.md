# Test ve Kontrol Planı

## Otomatik Kontroller

- `npm run check:turkish`: UTF-8 ve Türkçe karakter bozulması kontrolü.
- `npm run check:env`: Environment, Firebase fallback, emulator, Expo config ve build yasağı sözleşmesi.
- `npm run check:seed`: Seed JSON dosyaları, zorunlu alanlar, çok dilli alanlar, manifest count ve checksum kontrolü.
- `npm run check:security`: Secret taraması, signing artefact yasağı, Firebase rules ve Firestore index sözleşmesi.
- `npm run check:contracts`: Ortak veri sözleşmeleri ve kritik iş kuralı izleri.
- `npm run check:import-export`: CSV, JSON, XLSX, panel önizleme ve Functions import/export akışları.
- `npm run check:auth-qr`: Login/register, rol yönlendirme, 500 puan, QR ve mobil aksiyon köprüleri.
- `npm run check:notifications`: Bildirim hedefleme, FCM, zamanlama, delivery, açılma ve tercih izleri.
- `npm run check:events`: Etkinlik görünümleri, filtreleri, detay alanları, tiyatro sinopsis ve bildirim limiti.
- `npm run check:places`: Mekan filtreleri, Google Places snapshot, harita, boş alan yönetimi ve detay alanları.
- `npm run check:offers`: Fırsat, QR sadakat, kampanya kullanımı, sipariş ve analytics izleri.
- `npm run check:localization`: Çok dil, tema, Tourist Survival Kit ve Antik Rehber izleri.
- `npm run check:governance`: Onay kuyruğu, audit log, error log, SEO ve deep link izleri.
- `npm run check:analytics`: Analytics event, sayaç, dashboard, bildirim, dil ve platform izleri.
- `npm run check:ui`: Premium web/mobile tasarım dili ve UI contract izleri.
- `npm run check:web-inventory`: Web rota, SEO metadata, sitemap, robots, manifest ve panel rota envanteri.
- `npm run check:flows`: Uçtan uca product-flow izleri.
- `npm run check:a11y`: Skip link, focus state, reduced motion, dokunma hedefi, aria ve mobil label izleri.
- `npm run check:docs`: Dokümanların güncel kontrol zinciriyle uyumu.
- `npm run check:web-live`: Çalışan Next dev sunucusuna karşı route ve responsive sağlık kontrolü.
- `npm run typecheck`: Web, mobil, core, ui ve functions TypeScript kontrolü.
- `npm run check:quality`: Canlı sunucu gerektirmeyen ana kalite zinciri.

## Fonksiyonel Test Başlıkları

- Login/register: Email akışı, provider login, rol dokümanı ve 500 başlangıç puanı.
- Bildirim sistemi: Admin hedefleme, FCM token, zamanlanmış gönderim, delivery geçmişi, açılma metriği ve push tercihleri.
- Etkinlik filtreleri: Ay, tarih aralığı, bugün, bu hafta, tür, ilçe, ücretli/ücretsiz, popüler ve yakında.
- QR sistemi: İşletme kendi mekanında puan ekleme/düşme, kampanya kullanımı ve negatif bakiye koruması.
- Import/export: CSV, JSON, XLSX önizleme, hatalı satır raporu, commit ve export manifest.
- Responsive görünüm: Web mobile-first, tablet ve desktop kırılımları.
- Açık/koyu mod: Web `data-theme`, mobil sistem teması ve profil tercihleri.
- Rol yönlendirmeleri: `individual`, `business`, `theater`, `admin`.

## Manuel Görsel QA

- Web ana sayfa ilk ekranda marka, mobil uygulama sinyali ve bir sonraki bölüm ipucu görünür olmalı.
- Mobil ana sayfada alt menü sabit, arama erişilebilir ve saat kartı içerik değiştirmeli.
- Boş alanlarda “Belirtilmemiş” kompakt gösterilmeli, büyük boşluk kalmamalı.
- Kart yoğunluğu artarsa bölüm tasarımı liste, bant veya detay yüzeyi olarak yeniden düzenlenmeli.
- `npm run check:web-live` çalışmadan önce development sunucusu hazır olmalı.
