# Mimari Notları

## Eski Projeden Alınan Referanslar

Eski JavaScript/Capacitor projesi sadece davranış ve veri izi için referans kabul edildi. Taşınan fikirler:

- Firebase Auth, Firestore ve Storage kullanımı.
- Auth gateway ve rol bazlı panel ayrımı.
- Kategori vitrini, Antalya etkinlik takvimi, işletme paneli, tiyatro paneli, kullanıcı paneli ve admin panel akışları.
- XLSX import/export bağımlılığı.
- QR ve puan mantığına ait ürün beklentisi.

Taşınmayanlar: eski UI, eski responsive yapı, eski component sistemi, eski sayfa düzenleri.

## Uygulama Katmanları

- `apps/web`: Next.js tanıtım sitesi, discovery yüzeyi, tek giriş merkezi ve rol bazlı paneller.
- `apps/mobile`: Expo / React Native mobil discovery uygulaması.
- `packages/core`: Ortak veri modelleri, seed verileri, i18n, import/export ve iş kuralı helperları.
- `packages/ui`: Ortak tasarım tokenları.
- `firebase/functions`: Callable Functions ve zamanlanmış bildirim processorları.
- `firebase`: Firestore rules, Storage rules, indexler ve seed dosyaları.
- `scripts`: Development ve kalite kontrol komutları.

## Koleksiyonlar

- `users/{uid}`: profil, rol, dil, şehir, puan, QR kimliği, bildirim tercihleri.
- `users/{uid}/fcmTokens/{token}`: web, iOS ve Android FCM tokenları.
- `users/{uid}/favorites/{favoriteId}`: mekan, etkinlik ve fırsat favorileri.
- `users/{uid}/reminders/{reminderId}`: etkinlik ve fırsat hatırlatıcıları.
- `places/{placeId}`: Google Places bağlantısı, işletme sahipliği, çok dilli açıklama, özellikler, yayın durumu.
- `events/{eventId}`: tür, tarih, mekan, kadro, sinopsis, bilet, medya, bildirim limiti, yayın durumu.
- `offers/{offerId}`: kampanya, indirim, QR kullanım şartı, süre, işletme.
- `stories/{storyId}`: hikaye tarzı öneriler ve panelden yönetilen vitrin içerikleri.
- `qrTransactions/{id}`: işletme, kullanıcı, puan hareketi, kampanya kullanımı ve audit izi.
- `notifications/{id}`: hedefleme, zamanlama, FCM sonucu ve geçmiş.
- `notifications/{id}/deliveries/{deliveryId}`: token bazlı delivery ve açılma kayıtları.
- `imports/{id}`: CSV/XLSX/JSON önizleme, hata satırları, onay durumu.
- `exportManifests/{id}`: export talebi ve format bilgisi.
- `orders/{id}`: bilet, fırsat ve puan kullanımı kayıtları.
- `analyticsEvents/{id}` ve `analyticsCounters/{id}`: event ve sayaç tabanlı platform istatistikleri.
- `approvalQueue/{id}`: içerik onay sistemi.
- `auditLogs/{id}` ve `errorLogs/{id}`: operasyon ve hata izleri.

## Yönlendirme

Tek üyelik sistemi web ve mobilde aynı rol mantığını kullanır:

- `individual`: puan, QR, görevler, rozetler, favoriler.
- `business`: mekan, fırsat, sadakat, QR işlem.
- `theater`: oyun, kadro, sinopsis, bilet, bildirim hakkı.
- `admin`: üyeler, mekanlar, etkinlikler, bildirimler, import/export, istatistikler.

## Kalite Omurgası

Ana kalite zinciri `npm run check:quality` komutudur. Canlı Next development sunucusu gerektiren HTTP kontrolleri ayrıca `npm run check:web-live` ile çalıştırılır.
