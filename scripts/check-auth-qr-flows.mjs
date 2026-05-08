import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

const core = read("packages/core/src/index.ts");
const webRoutes = read("apps/web/lib/routes.ts");
const webLogin = read("apps/web/components/LoginClient.tsx");
const mobileAuth = read("apps/mobile/src/services/auth.ts");
const mobileEngagement = read("apps/mobile/src/services/engagement.ts");
const mobileProfile = read("apps/mobile/src/screens/ProfileScreen.tsx");
const webPanelActions = read("apps/web/lib/panel-actions.ts");
const webRoleOps = read("apps/web/components/RoleOps.tsx");
const functions = read("firebase/functions/src/index.ts");
const rules = read("firebase/firestore.rules");

const failures = [];

const roleRoutes = {
  individual: "/panel/bireysel",
  business: "/panel/isletme",
  theater: "/panel/tiyatro",
  admin: "/panel/admin"
};

for (const [role, route] of Object.entries(roleRoutes)) {
  if (!core.includes(`${role}: "${route}"`)) failures.push(`Core roleHome eksik: ${role} -> ${route}`);
}

if (!webRoutes.includes("resolveRoleHome") || !webRoutes.includes("roleHome[role]")) {
  failures.push("Web rol yönlendirme helper bağlantısı eksik.");
}

if (!webRoutes.includes("protectedPanelRoutes") || !webRoutes.includes("Object.values(roleHome)")) {
  failures.push("Korunan panel rotaları roleHome üzerinden türetilmeli.");
}

const forbiddenNeedles = [
  [mobileAuth, "bağlanmalı", "Mobil provider login placeholder hata mesajı kalmamalı."]
];

for (const [text, needle, message] of forbiddenNeedles) {
  if (text.includes(needle)) failures.push(message);
}

const requiredNeedles = [
  [webLogin, "createUserWithEmailAndPassword", "Web email register eksik."],
  [webLogin, "signInWithEmailAndPassword", "Web email login eksik."],
  [webLogin, "signInWithPopup", "Web provider login eksik."],
  [webLogin, "sendPasswordResetEmail", "Web şifre sıfırlama eksik."],
  [webLogin, "Şifremi sıfırla", "Web şifre sıfırlama aksiyonu eksik."],
  [webLogin, "const role = profile.data.role", "Web login role bilgisini ensureUserProfile dönüşünden okumalı."],
  [webLogin, "router.push(resolveRoleHome(role))", "Web login role bazlı panel yönlendirmesi eksik."],
  [mobileAuth, "registerWithEmail", "Mobil email register servisi eksik."],
  [mobileAuth, "loginWithEmail", "Mobil email login servisi eksik."],
  [mobileAuth, "resetPassword", "Mobil şifre sıfırlama servisi eksik."],
  [mobileAuth, "sendPasswordResetEmail", "Mobil şifre sıfırlama Firebase bağlantısı eksik."],
  [mobileAuth, "GoogleAuthProvider.credential", "Mobil Google token credential eksik."],
  [mobileAuth, "new OAuthProvider(\"apple.com\")", "Mobil Apple OAuth provider eksik."],
  [mobileAuth, "signInWithCredential", "Mobil provider credential login eksik."],
  [mobileAuth, "ensureMobileUserProfile(result.user)", "Mobil provider sonrası profil garantisi eksik."],
  [mobileAuth, "defaultUserPoints", "Mobil 500 puan sözleşmesi eksik."],
  [mobileAuth, "qr_", "Mobil QR kimliği üretimi eksik."],
  [mobileEngagement, "useQrTransaction", "Mobil QR callable köprüsü eksik."],
  [mobileEngagement, "scanId", "Mobil QR tekrar okutma anahtarı eksik."],
  [mobileEngagement, "balanceAfter", "Mobil QR işlem sonrası bakiye dönüşü eksik."],
  [mobileEngagement, "fetchUserQrTransactions", "Mobil kullanıcı QR geçmişi Firestore okuması eksik."],
  [mobileEngagement, "fetchUserOrders", "Mobil kullanıcı sipariş geçmişi Firestore okuması eksik."],
  [webPanelActions, "useQrTransaction", "Web panel QR callable köprüsü eksik."],
  [webRoleOps, "QR işlemini kaydet", "İşletme panel QR işlem formu eksik."],
  [mobileEngagement, "redeemOffer", "Mobil fırsat kullanımı köprüsü eksik."],
  [mobileEngagement, "createTicketOrder", "Mobil bilet sipariş köprüsü eksik."],
  [mobileEngagement, "saveFcmToken", "Mobil FCM token köprüsü eksik."],
  [mobileProfile, "QR puan işle", "Mobil profil QR aksiyonu eksik."],
  [mobileProfile, "Ayarları kaydet", "Mobil profil bildirim tercih aksiyonu eksik."],
  [mobileProfile, "fetchUserQrTransactions", "Mobil profil QR geçmişi okuması eksik."],
  [mobileProfile, "fetchUserOrders", "Mobil profil sipariş geçmişi okuması eksik."],
  [mobileProfile, "Henüz QR işlemi yok", "Mobil profil boş QR geçmişi mesajı eksik."],
  [mobileProfile, "Henüz sipariş kaydı yok", "Mobil profil boş sipariş geçmişi mesajı eksik."],
  [functions, "points: 500", "Functions yeni kullanıcı 500 puan eksik."],
  [functions, "role: data.role ?? \"individual\"", "Functions mevcut kullanıcı role dönüşü eksik."],
  [functions, "allowedSelfServiceRoles", "Functions yeni kullanıcı hesap tipi kontrolü eksik."],
  [functions, "return { id: uid, created: true, role }", "Functions yeni kullanıcı role dönüşü eksik."],
  [functions, "qrCodeId", "Functions QR kimliği eksik."],
  [functions, "scanId", "QR tekrar okutma kontrolü eksik."],
  [functions, "Bu QR işlemi daha önce kaydedildi.", "Tekrarlanan QR işlem hatası eksik."],
  [functions, "transactionType", "QR işlem tipi üretimi eksik."],
  [functions, "balanceAfter", "QR işlem sonrası bakiye kaydı eksik."],
  [functions, "currentPoints + pointsDelta < 0", "Negatif puan koruması eksik."],
  [functions, "Puan bakiyesi negatife", "Negatif puan hata mesajı eksik."],
  [rules, "qrTransactions", "QR security rules eksik."],
  [rules, "business", "İşletme rol security izi eksik."],
  [rules, "theater", "Tiyatro rol security izi eksik."]
];

for (const [text, needle, message] of requiredNeedles) {
  if (!text.includes(needle)) failures.push(message);
}

if (failures.length > 0) {
  console.error("Auth / QR akış kontrolü başarısız:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Auth / QR akış kontrolü başarılı. Rol yönlendirme, provider login, 500 puan, QR ve mobil aksiyon köprüleri doğrulandı.");
