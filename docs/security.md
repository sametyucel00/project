# Güvenlik Notları

## Firebase Rules

- `firebase/firestore.rules`: Rol bazlı Firestore erişimleri.
- `firebase/storage.rules`: Rol bazlı Storage erişimleri.
- `firebase/firestore.indexes.json`: Sorgu ve collection group index sözleşmesi.

Erişim prensipleri:

- Admin tam erişim alır.
- İşletme yalnızca kendi mekan, fırsat, QR ve sipariş verisini yönetir.
- Tiyatro yalnızca kendi oyun, etkinlik, sinopsis ve bildirim hakkı akışını yönetir.
- Bireysel kullanıcı yalnızca kendi profil, QR, favori, hatırlatıcı, FCM token ve sipariş kayıtlarına erişir.
- Analytics counter, audit log ve sistem logları admin okumasına açıktır; istemci yazımı kapalıdır.

## Kritik Kurallar

- Yeni bireysel kullanıcı `500` puan ile başlar.
- Tiyatro kullanıcısı oyun başına varsayılan en fazla `3` bildirim hakkına sahiptir.
- QR işleminde puan bakiyesi negatife düşemez.
- Import/export, onay kuyruğu, audit log ve error log akışları admin denetimindedir.
- Bildirim delivery kayıtları ve FCM tokenları kullanıcı alt koleksiyonlarında ayrıştırılır.

## Gizli Bilgi Hijyeni

Gerçek Firebase service account, private key, keystore, APK, AAB, IPA veya signing dosyaları repoya eklenmez.

Otomatik kontrol:

```bash
npm run check:security
```

Bu kontrol şunları yakalar:

- Private key izleri
- Service account private key izleri
- Literal Google API key izleri
- APK/AAB/IPA/JKS/keystore gibi build veya signing artefactleri
- Firestore rules, Storage rules ve Firestore index sözleşmesi

## Build Kuralı

Kullanıcı açıkça istemeden production web build, Android build, iOS build veya Windows build alınmaz. Kök `package.json` içinde build scriptleri bilinçli olarak tutulmaz.
