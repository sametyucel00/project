import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

const core = read("packages/core/src/index.ts");
const functions = read("firebase/functions/src/index.ts");
const webPanelActions = read("apps/web/lib/panel-actions.ts");
const webNotificationClient = read("apps/web/lib/notification-client.ts");
const webMessagingSw = read("apps/web/public/firebase-messaging-sw.js");
const webActionForms = read("apps/web/components/ActionForms.tsx");
const webNotificationStats = read("apps/web/components/NotificationStats.tsx");
const mobileEngagement = read("apps/mobile/src/services/engagement.ts");
const mobilePreferences = read("apps/mobile/src/services/preferences.ts");
const rules = read("firebase/firestore.rules");

const failures = [];

const requiredTargets = ["all", "role", "city", "event", "favorites", "manual"];
for (const target of requiredTargets) {
  if (!core.includes(`"${target}"`)) failures.push(`Bildirim hedef tipi eksik: ${target}`);
}

const requiredNeedles = [
  [core, "NotificationDraft", "NotificationDraft sözleşmesi eksik."],
  [core, "NotificationDelivery", "NotificationDelivery sözleşmesi eksik."],
  [core, "NotificationAudiencePreview", "NotificationAudiencePreview sözleşmesi eksik."],
  [core, "PushPreferences", "PushPreferences sözleşmesi eksik."],
  [core, "notificationPerformance", "Bildirim performans örnekleri eksik."],
  [core, "notificationHistorySamples", "Bildirim geçmişi örnekleri eksik."],
  [core, "notificationDeliverySamples", "Bildirim delivery örnekleri eksik."],
  [core, "notificationAudiencePreviews", "Bildirim hedef kitle önizleme örnekleri eksik."],
  [functions, "sendNotification", "Anlık bildirim fonksiyonu eksik."],
  [functions, "scheduleNotification", "Zamanlanmış bildirim fonksiyonu eksik."],
  [functions, "estimateNotificationAudience", "Hedef kitle önizleme fonksiyonu eksik."],
  [functions, "processScheduledNotifications", "Zamanlanmış bildirim processor eksik."],
  [functions, "saveFcmToken", "FCM token kayıt fonksiyonu eksik."],
  [functions, "markNotificationOpened", "Bildirim açılma fonksiyonu eksik."],
  [functions, "updatePushPreferences", "Push tercih fonksiyonu eksik."],
  [functions, "collectTargetTokens", "Bildirim hedef token toplama fonksiyonu eksik."],
  [functions, "sendEachForMulticast", "FCM multicast gönderim izi eksik."],
  [functions, "deliveries", "Bildirim delivery geçmişi eksik."],
  [functions, "status: \"queued\"", "Delivery queued durumu eksik."],
  [functions, "status: \"opened\"", "Delivery opened durumu eksik."],
  [functions, "status: response.success ? \"sent\" : \"failed\"", "Delivery sent/failed durumu eksik."],
  [functions, "target.kind === \"role\"", "Role göre hedefleme eksik."],
  [functions, "target.kind === \"city\"", "Şehre göre hedefleme eksik."],
  [functions, "target.kind === \"manual\"", "Manuel kullanıcı hedefleme eksik."],
  [functions, "target.kind === \"event\"", "Etkinliğe göre hedefleme eksik."],
  [functions, "target.kind === \"favorites\"", "Favorilere göre hedefleme eksik."],
  [functions, "estimatedUsers", "Hedef kitle kullanıcı tahmini eksik."],
  [functions, "estimatedTokens", "Hedef kitle token tahmini eksik."],
  [functions, "notification_open", "Bildirim açılma analytics izi eksik."],
  [webPanelActions, "sendNotification", "Web panel anlık bildirim gönderim köprüsü eksik."],
  [webPanelActions, "scheduleNotification", "Web panel bildirim schedule köprüsü eksik."],
  [webPanelActions, "estimateNotificationAudience", "Web panel hedef kitle önizleme köprüsü eksik."],
  [webPanelActions, "saveFcmToken", "Web FCM token kayıt köprüsü eksik."],
  [webPanelActions, "markNotificationOpened", "Web bildirim açılma köprüsü eksik."],
  [webPanelActions, "updatePushPreferences", "Web push tercih köprüsü eksik."],
  [webNotificationClient, "requestWebPushPermission", "Web push izin istemci servisi eksik."],
  [webNotificationClient, "getToken", "Web FCM token alma izi eksik."],
  [webNotificationClient, "NEXT_PUBLIC_FCM_VAPID_KEY", "Web FCM VAPID env izi eksik."],
  [webNotificationClient, "serviceWorker.register(\"/firebase-messaging-sw.js\")", "Web messaging service worker kaydı eksik."],
  [webMessagingSw, "showNotification", "Web messaging service worker notification gösterimi eksik."],
  [webMessagingSw, "notificationclick", "Web messaging notification click izi eksik."],
  [webActionForms, "NotificationForm", "Admin bildirim formu eksik."],
  [webActionForms, "notificationTargets", "Admin bildirim hedef seçimleri eksik."],
  [webActionForms, "Hedef kitleyi önizle", "Admin hedef kitle önizleme aksiyonu eksik."],
  [webActionForms, "Hemen gönder", "Admin anlık bildirim gönderim aksiyonu eksik."],
  [webNotificationStats, "Bildirim geçmişi", "Admin bildirim geçmişi görünümü eksik."],
  [webNotificationStats, "Teslim geçmişi", "Admin teslim geçmişi görünümü eksik."],
  [webNotificationStats, "collectionGroup", "Admin delivery canlı Firestore okuması eksik."],
  [webNotificationStats, "Canlı bildirim kayıtları", "Admin canlı bildirim durumu eksik."],
  [webNotificationStats, "Henüz bildirim kaydı yok", "Admin boş bildirim durumu eksik."],
  [webNotificationStats, "Push tercihleri", "Admin push tercihleri görünümü eksik."],
  [mobileEngagement, "saveFcmToken", "Mobil FCM token köprüsü eksik."],
  [mobileEngagement, "updatePushPreferences", "Mobil push tercih köprüsü eksik."],
  [mobilePreferences, "defaultMobilePreferences", "Mobil varsayılan bildirim tercihleri eksik."],
  [mobilePreferences, "quietHoursStart", "Mobil sessiz saat başlangıcı eksik."],
  [mobilePreferences, "quietHoursEnd", "Mobil sessiz saat bitişi eksik."],
  [rules, "notifications", "Firestore notifications rule izi eksik."],
  [rules, "fcmTokens", "Firestore fcmTokens rule izi eksik."]
];

for (const [text, needle, message] of requiredNeedles) {
  if (!text.includes(needle)) failures.push(message);
}

if (failures.length > 0) {
  console.error("Bildirim akış kontrolü başarısız:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Bildirim akış kontrolü başarılı. Hedefleme, FCM, zamanlama, delivery, açılma, geçmiş ve tercih izleri doğrulandı.");
