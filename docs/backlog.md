# Nar Rehberi Yapılacaklar

## Grup 1: Platform Temeli

- Monorepo workspace düzeni.
- Ortak TypeScript veri modelleri.
- Firebase Auth, Firestore, Storage ve Functions bağlantıları.
- Türkçe karakter / UTF-8 otomatik kontrolü.
- Ortak rol, dil, kategori ve yayın durumu sözleşmeleri.

Durum: Tamamlandı.

## Grup 2: Web Tanıtım ve Giriş Merkezi

- Premium landing page.
- Özellikler, etkinlikler, fırsatlar, işletme ve tiyatro çözüm alanları.
- Tek giriş sayfası.
- SEO metadata, sitemap, robots ve manifest.
- Mobil uygulama showcase.
- Canlı route ve responsive sağlık kontrolleri.

Durum: Tamamlandı; içerik zenginliği panel verileriyle büyütülebilir.

## Grup 3: Rol Bazlı Paneller

- Admin, işletme, tiyatro ve bireysel panel kabukları.
- Rol bazlı yönlendirme yardımcıları.
- Bildirim, import/export, onay kuyruğu, istatistik, SEO, audit ve error log yüzeyleri.

Durum: Temel akışlar tamamlandı; gerçek operasyon verisiyle form detayları artırılabilir.

## Grup 4: Mobil Uygulama

- Alt menü: Ana Sayfa, Mekanlar, Etkinlikler, Fırsatlar, Profil.
- Saat bazlı dinamik ana sayfa.
- Mekan, etkinlik, fırsat ve profil ekranları.
- Favori, hatırlatıcı, QR, bilet, push tercih ve FCM aksiyon köprüleri.
- Tourist Survival Kit ve Antik Rehber mini modülleri.

Durum: Development iskeleti tamamlandı; native Google/Apple token köprüleri sonraki gerçek cihaz entegrasyonunda bağlanacak.

## Grup 5: Mekan, Etkinlik ve Fırsat Veri Akışları

- Google Places API eşleme modeli.
- Mekan filtreleri ve boş alan yönetimi.
- Etkinlik filtreleri, detay ve harita alanları.
- Fırsat detay, QR kullanımı, puan kullanımı ve şartlar.
- Taslak/yayınlandı/onay sistemi.

Durum: Tamamlandı; gerçek API anahtarlarıyla canlı veri testleri yapılabilir.

## Grup 6: QR, Puan, Görev ve Rozet

- Kullanıcı QR kimliği.
- İşletme QR okutma.
- Puan ekleme/düşme.
- Kampanya kullanımı.
- Görev ve rozet kuralları.
- Audit log.

Durum: Tamamlandı; fiziksel QR scanner UI sonraki cihaz test grubunda derinleştirilebilir.

## Grup 7: Bildirim Sistemi

- Admin panelden hedefli bildirim.
- Zamanlanmış bildirim.
- FCM token saklama.
- Web push izin ve service worker akışı.
- Bildirim geçmişi, açılma metriği ve performans kontrolü.
- Tiyatro oyunu başına maksimum 3 bildirim kuralı.

Durum: Tamamlandı; canlı FCM credentials ile uçtan uca gönderim testi yapılabilir.

## Grup 8: Import / Export

- CSV, JSON, XLSX import.
- Önizleme.
- Hatalı satır gösterimi.
- Mekan, etkinlik, tiyatro oyunu, fırsat ve kategori export manifest.
- Türkçe karakter bozulması import engeli.

Durum: Tamamlandı.

## Grup 9: Çok Dil, Tema ve Kalite

- Türkçe, İngilizce, Rusça, Almanca içerik modeli.
- Dinamik içerikte `title.tr/en/ru/de` ve `description.tr/en/ru/de`.
- Açık/koyu tema.
- UI contract, web inventory ve canlı web QA.
- Türkçe karakter taraması.

Durum: Tamamlandı.

## Grup 10: Test Sistemi

- Login/register kontrolleri.
- Google ve Apple login izleri.
- Bildirim kontrolleri.
- Etkinlik, mekan, fırsat ve QR kontrolleri.
- Import/export kontrolleri.
- Rol yönlendirme kontrolleri.
- Açık/koyu mod, responsive, accessibility ve docs kontrolleri.

Durum: Devam ediyor; otomatik kontrol seti genişletildi ve her yeni büyük işte korunacak.
