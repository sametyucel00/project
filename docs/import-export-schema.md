# Import / Export Şeması

Desteklenen türler: `places`, `events`, `theaterPlays`, `offers`, `categories`.

Desteklenen formatlar: `csv`, `json`, `xlsx`.

## Çok Dilli Alanlar

CSV ve XLSX başlıklarında noktalı alan yolu kullanılır:

```csv
title.tr,title.en,description.tr,description.en,categoryId,district,address
Örnek Mekan,Sample Place,Örnek açıklama,Sample description,coffee,Muratpaşa,Kaleiçi
```

JSON importlarında aynı alanlar nested obje olarak tutulur:

```json
{
  "title": {
    "tr": "Başlık",
    "en": "Title",
    "ru": "Заголовок",
    "de": "Titel"
  },
  "description": {
    "tr": "Açıklama",
    "en": "Description",
    "ru": "Описание",
    "de": "Beschreibung"
  }
}
```

## Mekan Minimum Alanları

- `title.tr`
- `description.tr`
- `categoryId`
- `district`
- `address`
- `ownerId`
- `status`

## Etkinlik Minimum Alanları

- `title.tr`
- `description.tr`
- `type`
- `district`
- `venueName`
- `startsAt`
- `priceType`
- `status`

## XLSX Akışı

- İlk satır kolon başlıklarıdır.
- Kolon başlıkları CSV ile aynı noktalı alan yolunu kullanır.
- Panel XLSX dosyasını base64 payload olarak `previewXlsxImport` fonksiyonuna gönderir.
- Workbook okuma Firebase Functions tarafındaki `xlsx` bağımlılığıyla yapılır.
- Core katmanında `parseXlsxMatrixRows` matrisi nested import satırlarına çevirir.

## Önizleme Kuralları

- Eksik Türkçe başlık veya açıklama hata satırı üretir.
- Bozuk karakterler import onayını engeller.
- Tarihler ISO-8601 formatına normalize edilir.
- Yayına alma admin onayı veya ilgili rol yetkisiyle yapılır.
