"use client";

import { commitImport, createExportManifest, createOfferCampaign, estimateNotificationAudience, listDiscoveryCategories, previewImport, previewXlsxImport, saveAncientGuideStop, saveDiscoveryCategory, saveGooglePlaceSnapshot, saveTouristSurvivalKitItem, scheduleNotification, sendNotification, updateOfferStatus, useQrTransaction, type DiscoveryCategoryRecord } from "@/lib/panel-actions";
import { db } from "@/lib/firebase";
import { ancientGuideStops, importKinds, notificationTargets, parseCsvRows, parseJsonRows, previewRows, touristSurvivalKit, localizeText, type ExportManifest, type ImportExportFormat, type ImportKind, type NotificationTarget, type PublishStatus, type SurvivalKitItem } from "@nar/core";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

export function NotificationForm() {
  const [target, setTarget] = useState<NotificationTarget["kind"]>("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("Hedef kitle henüz hesaplanmadı.");
  const [status, setStatus] = useState("Taslak hazır.");

  async function schedule() {
    setStatus("Zamanlama isteği hazırlanıyor.");
    try {
      await scheduleNotification({
        title: { tr: title, en: title, ru: title, de: title },
        body: { tr: body, en: body, ru: body, de: body },
        target: { kind: target },
        scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      });
      setStatus("Bildirim zamanlandı.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Bildirim zamanlanamadı.");
    }
  }

  async function previewAudience() {
    setStatus("Hedef kitle önizleniyor.");
    try {
      const result = await estimateNotificationAudience({ target: { kind: target } });
      setAudience(`${result.data.estimatedUsers} kullanıcı · ${result.data.estimatedTokens} bildirim cihazı · ${result.data.detail}`);
      setStatus("Hedef kitle önizlemesi hazır.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Hedef kitle önizlenemedi.");
    }
  }

  async function sendNow() {
    setStatus("Anlık bildirim gönderiliyor.");
    try {
      const result = await sendNotification({
        title: { tr: title, en: title, ru: title, de: title },
        body: { tr: body, en: body, ru: body, de: body },
        target: { kind: target }
      });
      setStatus(`Bildirim gönderildi. Ulaşan cihaz: ${result.data.deliveryCount ?? 0}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Bildirim gönderilemedi.");
    }
  }

  return (
    <div className="mini-form">
      <label>
        Hedef
        <select value={target} onChange={(event) => setTarget(event.target.value as NotificationTarget["kind"])}>
          {notificationTargets.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
      <label>
        Başlık
        <input value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label>
        Gövde
        <input value={body} onChange={(event) => setBody(event.target.value)} />
      </label>
      <div className="hero-actions">
        <button className="secondary" onClick={previewAudience}>Hedef kitleyi önizle</button>
        <button className="secondary" onClick={sendNow}>Hemen gönder</button>
        <button className="primary" onClick={schedule}>Zamanla</button>
      </div>
      <p className="meta">{audience}</p>
      <p className="meta">{status}</p>
    </div>
  );
}

export function ImportPreviewForm() {
  const [kind, setKind] = useState<ImportKind>("places");
  const [format, setFormat] = useState<ImportExportFormat>("csv");
  const [raw, setRaw] = useState("");
  const [workbookBase64, setWorkbookBase64] = useState("");
  const [previewId, setPreviewId] = useState("");
  const [previewRowsState, setPreviewRowsState] = useState<Array<Record<string, unknown>>>([]);
  const [errors, setErrors] = useState<Array<{ row: number; message: string }>>([]);
  const [status, setStatus] = useState("Önizlemeye hazır.");

  async function preview() {
    setStatus("Önizleme isteği gönderiliyor.");
    try {
      if (format === "xlsx") {
        const result = await previewXlsxImport({ kind, workbookBase64, sheetName: undefined });
        setPreviewId(result.data.id);
        setPreviewRowsState(result.data.rows);
        setErrors(result.data.errors);
        setStatus("XLSX önizleme isteği oluşturuldu.");
        return;
      }

      const rows = format === "json" ? parseJsonRows(raw) : parseCsvRows(raw);
      const localPreview = previewRows(kind, rows);
      setPreviewRowsState(rows);
      setErrors(localPreview.flatMap((row) => row.messages.map((message) => ({ row: row.rowNumber, message }))));
      const result = await previewImport({ kind, rows });
      setPreviewId(result.data.id);
      setStatus("Önizleme oluşturuldu.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Önizleme oluşturulamadı.");
    }
  }

  async function commitPreview() {
    if (!previewId || previewRowsState.length === 0 || errors.length > 0) {
      setStatus("İçe aktarım için geçerli ve hatasız bir önizleme gerekli.");
      return;
    }
    setStatus("Kayıtlar içe aktarılıyor.");
    try {
      const result = await commitImport({ importId: previewId, kind, rows: previewRowsState });
      setStatus(`${result.data.count} satır içe aktarıldı.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Kayıtlar içe aktarılamadı.");
    }
  }

  return (
    <div className="mini-form">
      <label>
        İçe aktarım türü
        <select value={kind} onChange={(event) => setKind(event.target.value as ImportKind)}>
          {importKinds.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
      <label>
        Format
        <select value={format} onChange={(event) => setFormat(event.target.value as ImportExportFormat)}>
          <option value="csv">CSV</option>
          <option value="json">JSON</option>
          <option value="xlsx">XLSX</option>
        </select>
      </label>
      {format === "xlsx" ? (
        <label>
          XLSX dosya içeriği
          <textarea value={workbookBase64} onChange={(event) => setWorkbookBase64(event.target.value)} rows={4} />
        </label>
      ) : (
        <label>
          İçe aktarım verisi
          <textarea value={raw} onChange={(event) => setRaw(event.target.value)} rows={5} />
        </label>
      )}
      <div className="hero-actions">
        <button className="secondary" onClick={preview}>Önizleme oluştur</button>
        <button className="secondary" onClick={commitPreview}>İçe aktar</button>
      </div>
      {errors.length > 0 ? (
        <div className="error-list">
          {errors.map((error) => <span key={`${error.row}-${error.message}`}>Satır {error.row}: {error.message}</span>)}
        </div>
      ) : null}
      <p className="meta">Önizleme kaydı: {previewId || "Henüz yok"}</p>
      <p className="meta">{status}</p>
    </div>
  );
}

export function ExportManifestForm() {
  const [kind, setKind] = useState<ImportKind>("places");
  const [format, setFormat] = useState<ImportExportFormat>("csv");
  const [manifests, setManifests] = useState<ExportManifest[]>([]);
  const [status, setStatus] = useState("Dışa aktarım kaydı oluşturulmaya hazır.");

  useEffect(() => {
    let active = true;

    async function loadManifests() {
      try {
        const snapshot = await getDocs(query(collection(db, "exportManifests"), orderBy("requestedAt", "desc"), limit(12)));
        if (!active) return;
        const liveManifests = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as ExportManifest);
        setManifests(liveManifests);
        setStatus(liveManifests.length ? "Canlı dışa aktarım geçmişi kullanılıyor." : "Henüz dışa aktarım kaydı yok.");
      } catch (error) {
        if (!active) return;
        setManifests([]);
        setStatus(error instanceof Error ? error.message : "Dışa aktarım geçmişi yüklenemedi.");
      }
    }

    void loadManifests();

    return () => {
      active = false;
    };
  }, []);

  async function createManifest() {
    setStatus("Dışa aktarım kaydı oluşturuluyor.");
    try {
      await createExportManifest({ kind, format });
      setStatus("Dışa aktarım kaydı oluşturuldu.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Dışa aktarım kaydı oluşturulamadı.");
    }
  }

  return (
    <div className="mini-form">
      <label>
        Dışa aktarım türü
        <select value={kind} onChange={(event) => setKind(event.target.value as ImportKind)}>
          {importKinds.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
      <label>
        Format
        <select value={format} onChange={(event) => setFormat(event.target.value as ImportExportFormat)}>
          <option value="csv">CSV</option>
          <option value="json">JSON</option>
          <option value="xlsx">XLSX</option>
        </select>
      </label>
      <button className="secondary" onClick={createManifest}>Dışa aktarım kaydı oluştur</button>
      <div className="orders-list" aria-label="Dışa aktarım geçmişi">
        {manifests.length === 0 ? (
          <article>
            <div>
              <strong>Henüz kayıt yok</strong>
              <span>Dışa aktarım oluşturulduğunda burada görünür.</span>
            </div>
          </article>
        ) : manifests.map((manifest) => (
          <article key={manifest.id}>
            <div>
              <strong>{manifest.kind}</strong>
              <span>{manifest.format.toUpperCase()} · {formatPublishStatus(manifest.status as PublishStatus)}</span>
            </div>
            <small>{manifest.requestedBy}</small>
          </article>
        ))}
      </div>
      <p className="meta">{status}</p>
    </div>
  );
}

export function OfferCampaignForm() {
  const [offerId, setOfferId] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [discountLabel, setDiscountLabel] = useState("%25");
  const [useLimit, setUseLimit] = useState(250);
  const [storyEnabled, setStoryEnabled] = useState(true);
  const [featured, setFeatured] = useState(true);
  const [statusValue, setStatusValue] = useState<PublishStatus>("draft");
  const [status, setStatus] = useState("Kampanya haz?r.");

  const [places, setPlaces] = useState<Array<{ id: string; title: { tr: string; en?: string; ru?: string; de?: string }; district?: string }>>([]);

  useEffect(() => {
    let active = true;
    async function loadPlaces() {
      try {
        const snapshot = await getDocs(collection(db, "places"));
        if (!active) return;
        setPlaces(snapshot.docs.map((entry) => {
          const data = entry.data();
          return {
            id: entry.id,
            title: data.title ?? { tr: entry.id, en: entry.id, ru: entry.id, de: entry.id },
            district: data.district
          };
        }));
      } catch {
        if (!active) return;
        setPlaces([]);
      }
    }
    void loadPlaces();
    return () => {
      active = false;
    };
  }, []);

  async function createCampaign() {
    setStatus("Kampanya oluşturuluyor.");
    try {
      const result = await createOfferCampaign({
        placeId,
        title: { tr: "Yeni Nar fırsatı", en: "New Nar offer", ru: "Новое предложение Nar", de: "Neues Nar-Angebot" },
        description: { tr: "QR ile kullanılabilen sınırlı süreli kampanya.", en: "Limited-time campaign usable with QR.", ru: "Ограниченная по времени акция с QR.", de: "Zeitlich begrenzte Kampagne mit QR." },
        discountLabel,
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        conditions: { tr: "Günde bir kez kullanılabilir.", en: "Can be used once per day.", ru: "Можно использовать один раз в день.", de: "Einmal pro Tag nutzbar." },
        requiresQr: true,
        pointCost: 0,
        storyEnabled,
        storyPriority: 1,
        useLimit,
        featured,
        status: statusValue
      });
      setOfferId(result.data.id);
      setStatus("Kampanya taslağı oluşturuldu; hikaye vitrini ve kullanım limiti kaydedildi.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Kampanya oluşturulamadı.");
    }
  }

  async function changeStatus() {
    setStatus("Fırsat yayın durumu güncelleniyor.");
    try {
      await updateOfferStatus({ offerId, status: statusValue });
      setStatus(`Fırsat durumu ${formatPublishStatus(statusValue)} olarak güncellendi.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Fırsat durumu güncellenemedi.");
    }
  }

  return (
    <div className="mini-form">
      <label>
        Mekan kimliği
        <input value={placeId} onChange={(event) => setPlaceId(event.target.value)} />
      </label>
      <label>
        Fırsat kimliği
        <input value={offerId} onChange={(event) => setOfferId(event.target.value)} />
      </label>
      <label>
        İndirim
        <input value={discountLabel} onChange={(event) => setDiscountLabel(event.target.value)} />
      </label>
      <label>
        Kullanım limiti
        <input type="number" value={useLimit} onChange={(event) => setUseLimit(Number(event.target.value))} />
      </label>
      <label>
        Yayın durumu
        <select value={statusValue} onChange={(event) => setStatusValue(event.target.value as PublishStatus)}>
          <option value="draft">Taslak</option>
          <option value="pending">Onay bekliyor</option>
          <option value="published">Yayında</option>
          <option value="archived">Arşiv</option>
        </select>
      </label>
      <label>
        <input type="checkbox" checked={storyEnabled} onChange={(event) => setStoryEnabled(event.target.checked)} />
        Hikaye vitrininde göster
      </label>
      <label>
        <input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} />
        Ana sayfada öne çıkar
      </label>
      <div className="hero-actions">
        <button className="secondary" onClick={createCampaign}>Kampanya oluştur</button>
        <button className="secondary" onClick={changeStatus}>Durumu güncelle</button>
      </div>
      <p className="meta" aria-live="polite">{status}</p>
    </div>
  );
}

export function QrTransactionForm() {
  const [userId, setUserId] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [offerId, setOfferId] = useState("");
  const [pointsDelta, setPointsDelta] = useState(75);
  const [scanId, setScanId] = useState(`scan-${Date.now()}`);
  const [status, setStatus] = useState("QR işlemi hazır.");

  async function submitQrTransaction() {
    const trimmedUserId = userId.trim();
    const trimmedPlaceId = placeId.trim();
    const trimmedOfferId = offerId.trim();
    if (!trimmedUserId) {
      setStatus("QR işlemi için kullanıcı kimliği gerekli.");
      return;
    }
    if (!trimmedPlaceId) {
      setStatus("QR işlemi için mekan kimliği gerekli.");
      return;
    }
    setStatus("QR işlemi kaydediliyor.");
    try {
      const result = await useQrTransaction({
        userId: trimmedUserId,
        placeId: trimmedPlaceId,
        offerId: trimmedOfferId || null,
        pointsDelta,
        scanId: scanId.trim() || `scan-${Date.now()}`,
        note: pointsDelta >= 0 ? "İşletme panelinden puan kazanımı" : "İşletme panelinden puan kullanımı"
      });
      setStatus(`QR işlemi kaydedildi. Bakiye: ${result.data.balanceAfter}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "QR işlemi kaydedilemedi.");
    }
  }

  return (
    <div className="mini-form" aria-label="QR puan işlem formu">
      <label>
        Kullanıcı kimliği
        <input value={userId} onChange={(event) => setUserId(event.target.value)} />
      </label>
      <label>
        Mekan kimliği
        <input value={placeId} onChange={(event) => setPlaceId(event.target.value)} />
      </label>
      <label>
        Fırsat kimliği
        <input value={offerId} onChange={(event) => setOfferId(event.target.value)} />
      </label>
      <label>
        Puan değişimi
        <input type="number" value={pointsDelta} onChange={(event) => setPointsDelta(Number(event.target.value))} />
      </label>
      <label>
        Tekil işlem kimliği
        <input value={scanId} onChange={(event) => setScanId(event.target.value)} />
      </label>
      <button className="secondary" onClick={submitQrTransaction}>QR işlemini kaydet</button>
      <p className="meta" aria-live="polite">{status}</p>
    </div>
  );
}

export function GooglePlaceSnapshotForm() {
  const [placeId, setPlaceId] = useState("");
  const [googlePlaceId, setGooglePlaceId] = useState("");
  const [rating, setRating] = useState(4.7);
  const [reviewCount, setReviewCount] = useState(391);
  const [phone, setPhone] = useState("+90 242 000 00 02");
  const [website, setWebsite] = useState("https://example.com/liman-kahve");
  const [status, setStatus] = useState("Google mekan bilgisi hazır.");

  async function saveSnapshot() {
    setStatus("Google mekan bilgisi kaydediliyor.");
    try {
      await saveGooglePlaceSnapshot({
        placeId,
        snapshot: {
          googlePlaceId,
          phone,
          website,
          photoRefs: [],
          rating,
          reviewCount,
          address: "Liman, Antalya",
          location: { lat: 36.8407, lng: 30.6092 },
          openingHours: ["Her gün 08:00-22:30"],
          fetchedAt: new Date().toISOString()
        }
      });
      setStatus("Google mekan bilgisi kaydedildi ve mekan alanları güncellendi.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Google mekan bilgisi kaydedilemedi.");
    }
  }

  return (
    <div className="mini-form" aria-label="Google mekan bilgisi formu">
      <label>
        Mekan kimliği
        <input value={placeId} onChange={(event) => setPlaceId(event.target.value)} />
      </label>
      <label>
        Google mekan kimliği
        <input value={googlePlaceId} onChange={(event) => setGooglePlaceId(event.target.value)} />
      </label>
      <label>
        Telefon
        <input value={phone} onChange={(event) => setPhone(event.target.value)} />
      </label>
      <label>
        Web sitesi
        <input value={website} onChange={(event) => setWebsite(event.target.value)} />
      </label>
      <label>
        Google puanı
        <input type="number" step="0.1" value={rating} onChange={(event) => setRating(Number(event.target.value))} />
      </label>
      <label>
        Yorum sayısı
        <input type="number" value={reviewCount} onChange={(event) => setReviewCount(Number(event.target.value))} />
      </label>
      <button className="secondary" onClick={saveSnapshot}>Mekan bilgisini kaydet</button>
      <p className="meta" aria-live="polite">{status}</p>
    </div>
  );
}

export function MiniModuleManagementForm() {
  const [touristId, setTouristId] = useState(touristSurvivalKit[0]?.id ?? "emergency-112");
  const [touristCategory, setTouristCategory] = useState<SurvivalKitItem["category"]>("emergency");
  const [touristTitle, setTouristTitle] = useState("Acil Çağrı 112");
  const [touristDescription, setTouristDescription] = useState("Sağlık, polis, itfaiye ve acil durumlar için tek numara.");
  const [touristPhone, setTouristPhone] = useState("112");
  const [ancientId, setAncientId] = useState(ancientGuideStops[0]?.id ?? "hadrians-gate");
  const [ancientTitle, setAncientTitle] = useState("Hadrian Kapısı");
  const [ancientDescription, setAncientDescription] = useState("Kaleiçi girişinde Roma döneminden kalan şehir simgesi.");
  const [district, setDistrict] = useState("Muratpaşa");
  const [era, setEra] = useState("Roma");
  const [image, setImage] = useState("https://images.unsplash.com/photo-1604933762023-7213af7ff7a5");
  const [statusValue, setStatusValue] = useState<PublishStatus>("published");
  const [status, setStatus] = useState("Mini modül yönetimi canlı kayda hazır.");

  async function saveTourist() {
    setStatus("Turist destek bilgisi kaydediliyor.");
    try {
      const result = await saveTouristSurvivalKitItem({
        id: touristId,
        category: touristCategory,
        title: { tr: touristTitle, en: touristTitle, ru: touristTitle, de: touristTitle },
        description: { tr: touristDescription, en: touristDescription, ru: touristDescription, de: touristDescription },
        phone: touristPhone,
        status: statusValue
      });
      setStatus(`Turist destek bilgisi kaydedildi: ${result.data.id} · ${formatPublishStatus(result.data.status as PublishStatus)}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Turist destek bilgisi kaydedilemedi.");
    }
  }

  async function saveAncient() {
    setStatus("Antik Rehber durağı kaydediliyor.");
    try {
      const result = await saveAncientGuideStop({
        id: ancientId,
        title: { tr: ancientTitle, en: ancientTitle, ru: ancientTitle, de: ancientTitle },
        description: { tr: ancientDescription, en: ancientDescription, ru: ancientDescription, de: ancientDescription },
        district,
        era,
        image,
        status: statusValue
      });
      setStatus(`Antik Rehber durağı kaydedildi: ${result.data.id} · ${formatPublishStatus(result.data.status as PublishStatus)}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Antik Rehber durağı kaydedilemedi.");
    }
  }

  return (
    <div className="mini-form" aria-label="Mini modül yönetimi">
      <label>
        Yayın durumu
        <select value={statusValue} onChange={(event) => setStatusValue(event.target.value as PublishStatus)}>
          <option value="draft">Taslak</option>
          <option value="pending">Onay bekliyor</option>
          <option value="published">Yayında</option>
          <option value="archived">Arşiv</option>
        </select>
      </label>

      <label>
        Turist destek kimliği
        <input value={touristId} onChange={(event) => setTouristId(event.target.value)} />
      </label>
      <label>
        Turist destek kategorisi
        <select value={touristCategory} onChange={(event) => setTouristCategory(event.target.value as SurvivalKitItem["category"])}>
          <option value="emergency">Acil</option>
          <option value="consulate">Konsolosluk</option>
          <option value="hospital">Hastane</option>
          <option value="pharmacy">Eczane</option>
          <option value="transport">Ulaşım</option>
          <option value="touristInfo">Turist bilgisi</option>
        </select>
      </label>
      <label>
        Turist destek başlığı
        <input value={touristTitle} onChange={(event) => setTouristTitle(event.target.value)} />
      </label>
      <label>
        Turist destek açıklaması
        <textarea value={touristDescription} onChange={(event) => setTouristDescription(event.target.value)} rows={3} />
      </label>
      <label>
        Telefon
        <input value={touristPhone} onChange={(event) => setTouristPhone(event.target.value)} />
      </label>
      <button className="secondary" onClick={saveTourist}>Turist destek bilgisini kaydet</button>

      <label>
        Antik durak kimliği
        <input value={ancientId} onChange={(event) => setAncientId(event.target.value)} />
      </label>
      <label>
        Antik başlık
        <input value={ancientTitle} onChange={(event) => setAncientTitle(event.target.value)} />
      </label>
      <label>
        Antik açıklama
        <textarea value={ancientDescription} onChange={(event) => setAncientDescription(event.target.value)} rows={3} />
      </label>
      <label>
        İlçe
        <input value={district} onChange={(event) => setDistrict(event.target.value)} />
      </label>
      <label>
        Dönem
        <input value={era} onChange={(event) => setEra(event.target.value)} />
      </label>
      <label>
        Görsel URL
        <input value={image} onChange={(event) => setImage(event.target.value)} />
      </label>
      <button className="secondary" onClick={saveAncient}>Antik Rehber durağı kaydet</button>
      <p className="meta" aria-live="polite">{status}</p>
    </div>
  );
}

export function CategoryManagementForm() {
  const [target, setTarget] = useState<"place" | "event">("place");
  const [id, setId] = useState("fine-dining");
  const [titleTr, setTitleTr] = useState("Fine Dining");
  const [titleEn, setTitleEn] = useState("Fine Dining");
  const [titleRu, setTitleRu] = useState("Файн Дайнинг");
  const [titleDe, setTitleDe] = useState("Fine Dining");
  const [statusValue, setStatusValue] = useState<PublishStatus>("published");
  const [sortOrder, setSortOrder] = useState(10);
  const [categories, setCategories] = useState<DiscoveryCategoryRecord[]>([]);
  const [status, setStatus] = useState("Kategori yönetimi hazır.");

  async function refreshCategories() {
    setStatus("Kategoriler yükleniyor.");
    try {
      const result = await listDiscoveryCategories();
      const visibleCategories = result.data.categories.filter(isRenderableCategory);
      setCategories(visibleCategories);
      setStatus(visibleCategories.length ? `${visibleCategories.length} kategori listelendi.` : "Henüz kayıtlı kategori yok.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Kategoriler yüklenemedi.");
    }
  }

  useEffect(() => {
    void refreshCategories();
  }, []);

  async function saveCategory() {
    setStatus("Kategori kaydediliyor.");
    try {
      await saveDiscoveryCategory({
        id,
        target,
        title: {
          tr: titleTr,
          en: titleEn || titleTr,
          ru: titleRu || titleTr,
          de: titleDe || titleTr
        },
        status: statusValue,
        sortOrder
      });
      setStatus("Kategori kaydedildi.");
      await refreshCategories();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Kategori kaydedilemedi.");
    }
  }

  return (
    <div className="mini-form" aria-label="Kategori yönetimi">
      <label>
        Hedef alan
        <select value={target} onChange={(event) => setTarget(event.target.value as "place" | "event")}>
          <option value="place">Mekan kategorisi</option>
          <option value="event">Etkinlik kategorisi</option>
        </select>
      </label>
      <label>
        Kategori kimliği
        <input value={id} onChange={(event) => setId(event.target.value)} />
      </label>
      <label>
        Türkçe başlık
        <input value={titleTr} onChange={(event) => setTitleTr(event.target.value)} />
      </label>
      <label>
        İngilizce başlık
        <input value={titleEn} onChange={(event) => setTitleEn(event.target.value)} />
      </label>
      <label>
        Rusça başlık
        <input value={titleRu} onChange={(event) => setTitleRu(event.target.value)} />
      </label>
      <label>
        Almanca başlık
        <input value={titleDe} onChange={(event) => setTitleDe(event.target.value)} />
      </label>
      <label>
        Sıralama
        <input type="number" value={sortOrder} onChange={(event) => setSortOrder(Number(event.target.value))} />
      </label>
      <label>
        Yayın durumu
        <select value={statusValue} onChange={(event) => setStatusValue(event.target.value as PublishStatus)}>
          <option value="draft">Taslak</option>
          <option value="pending">Onay bekliyor</option>
          <option value="published">Yayında</option>
          <option value="archived">Arşiv</option>
        </select>
      </label>
      <div className="hero-actions">
        <button className="secondary" onClick={saveCategory}>Kategoriyi kaydet</button>
        <button className="secondary" onClick={refreshCategories}>Listeyi yenile</button>
      </div>
      <div className="compact-list" aria-label="Kategori listesi">
        {categories.length === 0 ? (
          <article>
            <strong>Henüz kategori yok</strong>
            <span>Yeni bir mekan veya etkinlik kategorisi ekleyebilirsin.</span>
          </article>
        ) : categories.map((category, index) => (
          <article key={category.id && category.target ? `${category.target}-${category.id}` : `category-${index}`}>
            <div>
              <strong>{localizeText(category.title, "tr")}</strong>
              <span>{category.id} · {category.target === "place" ? "Mekan" : "Etkinlik"} · {formatPublishStatus(category.status)}</span>
            </div>
            <small>Sıra {category.sortOrder ?? 0}</small>
          </article>
        ))}
      </div>
      <p className="meta" aria-live="polite">{status}</p>
    </div>
  );
}

function formatPublishStatus(status?: PublishStatus | string) {
  if (status === "draft") return "Taslak";
  if (status === "pending") return "Onay bekliyor";
  if (status === "published") return "Yayında";
  if (status === "archived") return "Arşiv";
  if (status === "ready") return "Hazır";
  if (status === "failed") return "Başarısız";
  return "Durum belirtilmemiş";
}

function isRenderableCategory(category: DiscoveryCategoryRecord) {
  if (!category.id) return false;
  if (category.target !== "place" && category.target !== "event") return false;
  if (
    !hasRenderableTitle(category.title?.tr) &&
    !hasRenderableTitle(category.title?.en) &&
    !hasRenderableTitle(category.title?.ru) &&
    !hasRenderableTitle(category.title?.de)
  ) return false;
  return ["draft", "pending", "published", "archived", "ready", "failed"].includes(String(category.status ?? ""));
}

function hasRenderableTitle(value?: string | null) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return false;
  return ![
    "belirtilmemiş",
    "belirtilmemis",
    "not specified",
    "nicht angegeben",
    "не указано"
  ].includes(normalized);
}
