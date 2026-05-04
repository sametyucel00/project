import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

const core = read("packages/core/src/index.ts");
const functions = read("firebase/functions/src/index.ts");
const webOffers = [
  read("apps/web/app/firsatlar/page.tsx"),
  read("apps/web/components/OffersExplorer.tsx")
].join("\n");
const webOfferDetail = [
  read("apps/web/app/firsatlar/[id]/page.tsx"),
  read("apps/web/components/LiveDiscoveryDetail.tsx")
].join("\n");
const panelActions = read("apps/web/lib/panel-actions.ts");
const adminOps = read("apps/web/components/AdminOps.tsx");
const actionForms = read("apps/web/components/ActionForms.tsx");
const ordersOps = read("apps/web/components/OrdersOps.tsx");
const mobileOffers = read("apps/mobile/src/screens/OffersScreen.tsx");
const mobileOfferDetail = read("apps/mobile/src/screens/OfferDetailScreen.tsx");
const mobileEngagement = read("apps/mobile/src/services/engagement.ts");
const mobileDiscovery = read("apps/mobile/src/services/discovery.ts");
const rules = read("firebase/firestore.rules");

const failures = [];

const requiredNeedles = [
  [core, "interface Offer", "Offer sözleşmesi eksik."],
  [core, "discountLabel", "Fırsat indirim etiketi eksik."],
  [core, "requiresQr", "Fırsat QR şartı eksik."],
  [core, "pointCost", "Fırsat puan maliyeti eksik."],
  [core, "storyEnabled", "Fırsat hikaye vitrini sözleşmesi eksik."],
  [core, "storyPriority", "Fırsat hikaye önceliği sözleşmesi eksik."],
  [core, "useLimit", "Fırsat kullanım limiti sözleşmesi eksik."],
  [core, "usedCount", "Fırsat kullanım sayacı sözleşmesi eksik."],
  [core, "OfferStory", "Hikaye tarzı fırsat sözleşmesi eksik."],
  [core, "offerStories", "Hikaye tarzı fırsat örnek verisi eksik."],
  [core, "conditions", "Fırsat şartları eksik."],
  [core, "NarOrder", "Sipariş/kullanım geçmişi sözleşmesi eksik."],
  [core, "QrTransaction", "QR işlem sözleşmesi eksik."],
  [core, "sampleQrTransactions", "QR işlem geçmişi örnek verisi eksik."],
  [core, "balanceAfter", "QR işlem sonrası bakiye sözleşmesi eksik."],
  [core, "\"campaign_use\"", "Kampanya kullanım analytics tipi eksik."],
  [core, "\"qr_scan\"", "QR scan analytics tipi eksik."],
  [core, "sampleOrders", "Sipariş örnek verisi eksik."],
  [webOffers, "QR aktif", "Web fırsat filtrelerinde QR aktif eksik."],
  [webOffers, "Puanla kullan", "Web fırsat filtrelerinde puanla kullanım eksik."],
  [webOffers, "OfferStoriesRail", "Web fırsat hikaye vitrini eksik."],
  [webOfferDetail, "ActionStrip", "Fırsat detay aksiyon şeridi eksik."],
  [webOfferDetail, "discountLabel", "Fırsat detay indirim oranı eksik."],
  [webOfferDetail, "requiresQr", "Fırsat detay QR kullan izi eksik."],
  [webOfferDetail, "pointCost", "Fırsat detay puan maliyeti eksik."],
  [webOfferDetail, "Kalan kullanım", "Fırsat detay kalan kullanım eksik."],
  [webOfferDetail, "conditions", "Fırsat detay şartlar eksik."],
  [webOfferDetail, "featuredPlaces", "Fırsat detay işletme/konum bağlantısı eksik."],
  [mobileOffers, "StoryRail", "Mobil hikaye tarzı fırsat rail eksik."],
  [mobileOffers, "activeStory", "Mobil hikaye seçim durumu eksik."],
  [mobileOffers, "offerFilters", "Mobil fırsat filtreleri eksik."],
  [mobileOfferDetail, "QR ile kullan", "Mobil fırsat QR aksiyonu eksik."],
  [mobileOfferDetail, "Puan", "Mobil fırsat puan bilgisi eksik."],
  [mobileOfferDetail, "Kalan", "Mobil fırsat kalan kullanım bilgisi eksik."],
  [mobileOfferDetail, "conditions.tr", "Mobil fırsat şartları eksik."],
  [mobileEngagement, "redeemOffer", "Mobil fırsat kullan callable köprüsü eksik."],
  [mobileEngagement, "useQrTransaction", "Mobil QR işlem callable köprüsü eksik."],
  [mobileDiscovery, "fetchOffers", "Mobil fırsat Firestore okuma eksik."],
  [mobileDiscovery, "applyOfferFilters", "Mobil aktif fırsat filtreleme eksik."],
  [functions, "redeemOffer", "Functions fırsat kullanımı eksik."],
  [functions, "createOfferCampaign", "Functions kampanya oluşturma eksik."],
  [functions, "updateOfferStatus", "Functions kampanya yayın durumu güncelleme eksik."],
  [functions, "Fırsat kullanım limiti doldu.", "Fırsat kullanım limiti koruması eksik."],
  [functions, "usedCount: FieldValue.increment(1)", "Fırsat kullanım performans sayacı eksik."],
  [functions, "offer.create", "Fırsat oluşturma audit izi eksik."],
  [functions, "offer.status.", "Fırsat yayın durumu audit izi eksik."],
  [functions, "type: \"offer\"", "Fırsat kullanımı sipariş tipi eksik."],
  [functions, "status: \"used\"", "Fırsat kullanımı used durumu eksik."],
  [functions, "type: \"campaign_use\"", "Fırsat kullanım analytics kaydı eksik."],
  [functions, "useQrTransaction", "QR puan işlem fonksiyonu eksik."],
  [functions, "pointsDelta", "QR puan hareketi eksik."],
  [functions, "transactionType", "QR işlem tipi eksik."],
  [functions, "Bu QR işlemi daha önce kaydedildi.", "QR tekrar okutma kontrolü eksik."],
  [functions, "balanceAfter", "QR işlem sonrası bakiye eksik."],
  [functions, "entityTitle: \"QR kampanya kullanımı\"", "QR kampanya sipariş kaydı eksik."],
  [functions, "currentPoints + pointsDelta < 0", "Negatif puan koruması eksik."],
  [functions, "offerId: offerId ?? null", "QR işleminde offerId bağlantısı eksik."],
  [functions, "qrTransaction.create", "QR audit log izi eksik."],
  [functions, "updateOrderStatus", "Sipariş durum güncelleme fonksiyonu eksik."],
  [functions, "order.ticket.create", "Bilet yönlendirme audit izi eksik."],
  [functions, "order.status.update", "Sipariş durum güncelleme audit izi eksik."],
  [functions, "updatedBy: uid", "Sipariş durum güncelleyen kullanıcı izi eksik."],
  [functions, "order.data()?.businessId === uid", "İşletmenin kendi siparişini güncelleme yetkisi eksik."],
  [panelActions, "redeemOffer", "Web panel fırsat kullan callable köprüsü eksik."],
  [panelActions, "createOfferCampaign", "Web panel kampanya oluşturma köprüsü eksik."],
  [panelActions, "updateOfferStatus", "Web panel kampanya durum köprüsü eksik."],
  [panelActions, "useQrTransaction", "Web panel QR işlem callable köprüsü eksik."],
  [adminOps, "Fırsat ve Kampanya Yönetimi", "Admin fırsat kampanya yönetimi yüzeyi eksik."],
  [actionForms, "OfferCampaignForm", "Kampanya yönetimi formu eksik."],
  [actionForms, "Hikaye vitrininde göster", "Kampanya hikaye vitrini kontrolü eksik."],
  [ordersOps, "orders.length", "Web panel sipariş/geçmiş yüzeyi eksik."],
  [ordersOps, "qrTransactions.length", "Web panel QR işlem geçmişi yüzeyi eksik."],
  [ordersOps, "Canlı geçmiş kullanılıyor", "Web panel canlı sipariş/QR geçmişi eksik."],
  [ordersOps, "Henüz sipariş kaydı yok", "Web panel boş sipariş durumu eksik."],
  [ordersOps, "updateOrderStatus", "Web panel sipariş durum güncelleme aksiyonu eksik."],
  [ordersOps, "Bilet yönlendirmesi", "Web panel bilet yönlendirme geçmişi eksik."],
  [ordersOps, "Sipariş durumu güncelleniyor.", "Web panel sipariş durum feedback izi eksik."],
  [ordersOps, "businessId", "İşletme sipariş filtreleme izi eksik."],
  [rules, "qrTransactions", "Firestore QR transaction rule izi eksik."],
  [rules, "orders", "Firestore orders rule izi eksik."]
];

for (const [text, needle, message] of requiredNeedles) {
  if (!text.includes(needle)) failures.push(message);
}

if (failures.length > 0) {
  console.error("Fırsat / QR sadakat akış kontrolü başarısız:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Fırsat / QR sadakat akış kontrolü başarılı. Kampanya, QR, puan, sipariş ve analytics izleri doğrulandı.");
