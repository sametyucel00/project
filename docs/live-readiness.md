# Canlı Hazırlık ve Devir Notları

Bu dosya production build veya deploy komutu çalıştırmadan, development/test tarafında hazır olanları ve canlıya geçiş için kullanıcı tarafında gerekenleri ayırır.

## Benim Tarafımda Tamamlananlar

- Next.js web tanıtım sitesi, discovery rotaları, detay sayfaları ve tek giriş merkezi hazır.
- Expo / React Native mobil uygulama iskeleti; Ana Sayfa, Mekanlar, Etkinlikler, Fırsatlar ve Profil sekmeleri hazır.
- Admin, işletme, tiyatro ve bireysel panel yüzeyleri hazır.
- Firebase Auth, Firestore, Storage, Cloud Functions ve FCM için development sözleşmeleri hazır.
- Firestore security rules ve indexes dosyaları development kontrolünden geçti.
- Mekan, etkinlik, fırsat, QR, puan, görev, rozet, sipariş, bildirim, import/export, SEO, audit ve error log akışları kod seviyesinde bağlı.
- Tourist Survival Kit ve Antik Rehber web/mobil canlı veri + seed fallback akışına ve admin panel yönetimine bağlandı.
- Eski `nar-rehberi-pro` Firebase web config ve Google Places anahtarı development `.env` dosyasına bağlandı.
- Eski `venues` koleksiyonu yeni `places` modeline, eski `theatre_plays` koleksiyonu yeni `events` modeline runtime uyumluluk katmanıyla çevrilir.
- Eski statik Antalya 2026 etkinlik takvimi `legacy:import-events` ile yeni `events` seed dosyasına ve core fallback etkinliklerine aktarıldı.
- Çok dil modeli Türkçe, İngilizce, Rusça ve Almanca alanlarıyla hazır.
- Açık/koyu tema, responsive, accessibility, web route inventory ve product-flow kontrolleri hazır.
- Türkçe karakter / UTF-8 koruma kontrolü kalite zincirine bağlı.
- Development web canlı rota ve responsive kontrolleri `check:web-live` ile doğrulanabilir.

## Çalıştırılan Son Kontroller

```bash
npm run check:quality
```

```powershell
$env:NAR_WEB_BASE_URL='http://127.0.0.1:3001'
npm run check:web-live
```

Bu kontroller production build almaz; sadece development/test doğrulaması yapar.

## Kullanıcı Tarafında Gerekenler

- Gerçek Firebase project seçimi ve `.env` değerlerinin doldurulması.
- Eski Firebase kullanılacağı için `nar-rehberi-pro` Console erişiminin, billing durumunun ve Auth provider ayarlarının kontrol edilmesi.
- Web push için VAPID public key `.env` içinde `NEXT_PUBLIC_FCM_VAPID_KEY` alanına eklendi; private key client tarafına yazılmadı.
- Eski canlı veri denetimi için `npm run check:legacy-live`, normalize migration önizlemesi için `npm run legacy:normalized-preview` hazırlandı.
- Eski statik etkinlik takvimini tekrar aktarmak için `npm run legacy:import-events` hazırlandı; canlı Firestore yazımı için admin credential gerekir.
- Google Maps / Places canlı doğrulaması için `npm run check:google-apis` hazırlandı.
- Yeni Google Maps / Places key `.env` içine bağlandı ve `npm run check:google-apis` canlı Places isteğiyle doğrulandı.
- Web ve mobil auth servislerinde email kayıt/giriş, provider giriş ve şifre sıfırlama akışları bağlı.
- Google Login client ID ve OAuth ayarlarının Firebase Console üzerinden açılması.
- Apple Login için Apple Developer tarafında service/app ayarlarının yapılması.
- Google Maps ve Google Places API keylerinin oluşturulması ve quota/billing ayarlarının kontrolü.
- Google Cloud Console'da key restriction ayarları canlı domain ve mobil paket kimlikleriyle sınırlandırılmalı; ardından `npm run check:google-apis` tekrar çalıştırılmalı.
- FCM web VAPID key ve mobil push credentials değerlerinin girilmesi.
- Gerçek Firestore verisine seed aktarımı gerekiyorsa emulator dışında dikkatli deploy/import planı yapılması.
- Eski veriler yeni UI içinde göründükten sonra eksik alanlar panelden düzeltilmeli; örnekler: çok dilli açıklama, kategori eşlemesi, kapak görseli, çalışma saatleri ve yayın durumu.
- Canlı ön rapora göre eski `venues` kayıtlarında açıklama/kapak görseli eksikleri ve bazı metinlerde Türkçe karakter bozulması var; normalize preview bu bozuk metinleri güvenli fallback ile maskeleyerek üretir.
- Gerçek kullanıcılarla admin manuel rol atama testi yapılması.
- Expo development cihaz testleri yapılması; Android/iOS production build ancak ayrıca istendiğinde alınmalı.
- Firebase rules, functions ve indexes deploy adımları ayrıca onaylandıktan sonra çalıştırılmalı.
- Canlı görseller, gerçek mekan/etkinlik/fırsat içerikleri ve profesyonel çeviri revizyonları eklenmeli.

## Deploy Öncesi Manuel QA

- Web ana sayfa, mekanlar, etkinlikler, fırsatlar, mini modüller ve paneller gerçek tarayıcıda gezilmeli.
- Mobilde alt menü, QR, puan, favori, hatırlatıcı, görev ve bildirim tercihleri gerçek cihazda denenmeli.
- Admin bildirim hedefleme, zamanlama, delivery ve açılma metriği canlı FCM credential ile test edilmeli.
- İşletme panelinde QR okutma ve puan hareketi gerçek test kullanıcısıyla denenmeli.
- Tiyatro panelinde oyun oluşturma, sinopsis çevirisi ve 3 bildirim limiti doğrulanmalı.
- Import/export için CSV, JSON ve XLSX gerçek dosya örnekleriyle kontrol edilmeli.
- Türkçe karakter bozulması için her büyük içerik importundan sonra `npm run check:turkish` çalıştırılmalı.
