import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, ...path), "utf8");
}

function readDirectoryText(path) {
  const absolutePath = join(root, ...path);
  return readdirSync(absolutePath)
    .flatMap((entry) => {
      const childPath = join(absolutePath, entry);
      const relativePath = [...path, entry];
      if (statSync(childPath).isDirectory()) return readDirectoryText(relativePath);
      if (!/\.(ts|tsx|js|mjs|json)$/.test(entry)) return [];
      return readFileSync(childPath, "utf8");
    })
    .join("\n");
}

const core = read(["packages", "core", "src", "index.ts"]);
const functions = read(["firebase", "functions", "src", "index.ts"]);
const rules = read(["firebase", "firestore.rules"]);
const mobile = [read(["apps", "mobile", "App.tsx"]), readDirectoryText(["apps", "mobile", "src"])].join("\n");
const webLogin = read(["apps", "web", "components", "LoginClient.tsx"]);
const webRoutes = read(["apps", "web", "lib", "routes.ts"]);
const webTheme = read(["apps", "web", "components", "ThemeProvider.tsx"]);
const webPanelActions = read(["apps", "web", "lib", "panel-actions.ts"]);
const webRoleOps = read(["apps", "web", "components", "RoleOps.tsx"]);
const webActionForms = read(["apps", "web", "components", "ActionForms.tsx"]);
const webBusinessOps = read(["apps", "web", "components", "BusinessOps.tsx"]);
const webIndividualOps = read(["apps", "web", "components", "IndividualOps.tsx"]);
const webPanelMetrics = read(["apps", "web", "components", "PanelMetrics.tsx"]);
const webObservabilityActions = read(["apps", "web", "lib", "observability-actions.ts"]);
const webLocalizationOps = read(["apps", "web", "components", "LocalizationOps.tsx"]);
const webLiveData = read(["apps", "web", "lib", "live-data.ts"]);
const webLiveDiscovery = read(["apps", "web", "components", "LiveDiscoveryList.tsx"]);
const webLiveDetail = read(["apps", "web", "components", "LiveDiscoveryDetail.tsx"]);
const webAdminStats = read(["apps", "web", "components", "AdminStats.tsx"]);
const importExport = read(["packages", "core", "src", "importExport.ts"]);
const legacy = read(["packages", "core", "src", "legacy.ts"]);

const checks = [
  {
    name: "login/register email",
    ok: webLogin.includes("createUserWithEmailAndPassword") && webLogin.includes("signInWithEmailAndPassword")
  },
  {
    name: "web google/apple login",
    ok: webLogin.includes("googleProvider") && webLogin.includes("appleProvider") && webLogin.includes("signInWithPopup")
  },
  {
    name: "mobile google/apple credential login",
    ok: mobile.includes("GoogleAuthProvider.credential") && mobile.includes("OAuthProvider(\"apple.com\")") && mobile.includes("signInWithCredential")
  },
  {
    name: "role redirect",
    ok: core.includes("roleHome") && webRoutes.includes("resolveRoleHome") && webLogin.includes("router.push(resolveRoleHome(role))")
  },
  {
    name: "new user 500 points",
    ok: core.includes("defaultUserPoints = 500") && functions.includes("points: 500")
  },
  {
    name: "qr points protection",
    ok: functions.includes("useQrTransaction") && functions.includes("Puan bakiyesi negatife")
  },
  {
    name: "notification scheduling",
    ok: functions.includes("scheduleNotification") && functions.includes("processScheduledNotifications")
  },
  {
    name: "event filters and views",
    ok: core.includes("eventFilters") && core.includes("eventViewModes") && mobile.includes("eventViewModes")
  },
  {
    name: "place filters and empty state",
    ok: core.includes("placeFilters") && core.includes("compactValue") && mobile.includes("Belirtilmemiş")
  },
  {
    name: "import/export",
    ok: importExport.includes("parseCsvRows") && importExport.includes("exportRowsToCsv") && functions.includes("commitImport")
  },
  {
    name: "theme support",
    ok: webTheme.includes("nar-theme") && mobile.includes("Dil ve tema")
  },
  {
    name: "security rules roles",
    ok: rules.includes("role()") && rules.includes("isAdmin()") && rules.includes("business") && rules.includes("theater")
  },
  {
    name: "audit and error logging",
    ok: core.includes("AuditLog") && core.includes("ErrorLog") && functions.includes("logClientError")
  },
  {
    name: "mobile service bridge",
    ok: mobile.includes("watchAuthSession") && mobile.includes("fetchPlaces") && mobile.includes("trackMobileEvent")
  },
  {
    name: "mobile resilient discovery",
    ok: mobile.includes("useDiscoveryFeed") && mobile.includes("featuredPlaces") && mobile.includes("Keşif verisi alınamadı")
  },
  {
    name: "mobile engagement actions",
    ok: mobile.includes("toggleFavorite") && mobile.includes("scheduleReminder") && mobile.includes("redeemOffer") && mobile.includes("createTicketOrder") && mobile.includes("completeUserTask")
  },
  {
    name: "mobile push and qr actions",
    ok: mobile.includes("saveFcmToken") && mobile.includes("updatePushPreferences") && mobile.includes("useQrTransaction")
  },
  {
    name: "web panel service bridge",
    ok: webPanelActions.includes("scheduleNotification") && webPanelActions.includes("previewImport") && webPanelActions.includes("previewXlsxImport") && webPanelActions.includes("reviewApproval")
  },
  {
    name: "admin role management",
    ok: functions.includes("updateUserRole")
      && functions.includes("listAdminUsers")
      && functions.includes("setUserDisabled")
      && functions.includes("user.role.update")
      && functions.includes("user.disable")
      && functions.includes("user.enable")
      && webPanelActions.includes("updateUserRole")
      && webPanelActions.includes("listAdminUsers")
      && webPanelActions.includes("setUserDisabled")
      && webRoleOps.includes("Üye ve Rol Yönetimi")
  },
  {
    name: "web observability service bridge",
    ok: webObservabilityActions.includes("trackWebEvent") && webObservabilityActions.includes("logWebError") && webObservabilityActions.includes("trackAnalyticsEvent")
  },
  {
    name: "rate limited sensitive functions",
    ok: functions.includes("assertRateLimit")
      && functions.includes("notification.send")
      && functions.includes("qr.transaction")
      && functions.includes("import.commit")
  },
  {
    name: "localization management",
    ok: core.includes("missingLocales")
      && core.includes("createTranslationFallbackReport")
      && webLocalizationOps.includes("Çok Dil Yönetimi")
      && webLocalizationOps.includes("Eksik çeviri")
  },
  {
    name: "mobile detail surfaces",
    ok: mobile.includes("DetailHeroCard")
      && mobile.includes("StatStrip")
      && mobile.includes("SubsectionGrid")
      && mobile.includes("QR işlem geçmişi")
  },
  {
    name: "web live discovery fallback",
    ok: webLiveData.includes("fetchLivePlaces")
      && webLiveData.includes("fetchLiveEvents")
      && webLiveData.includes("fetchLiveOffers")
      && webLiveDiscovery.includes("setItems((result.length ? result : fallback)")
      && webLiveDiscovery.includes("setItems(fallback)")
  },
  {
    name: "web live detail fallback",
    ok: webLiveData.includes("fetchLivePlace")
      && webLiveData.includes("fetchLiveEvent")
      && webLiveData.includes("fetchLiveOffer")
      && webLiveDetail.includes("LivePlaceDetail")
      && webLiveDetail.includes("LiveEventDetail")
      && webLiveDetail.includes("LiveOfferDetail")
      && webLiveDetail.includes("MissingDetail")
  },
  {
    name: "admin live dashboard summary",
    ok: functions.includes("getAdminDashboardSummary")
      && webPanelActions.includes("getAdminDashboardSummary")
      && webAdminStats.includes("Canlı panel sayaçları")
  },
  {
    name: "business qr places offer operations",
    ok: webBusinessOps.includes("QrTransactionForm")
      && webBusinessOps.includes("GooglePlaceSnapshotForm")
      && webBusinessOps.includes("OfferCampaignForm")
      && webActionForms.includes("useQrTransaction")
      && webActionForms.includes("saveGooglePlaceSnapshot")
      && webActionForms.includes("Tekil işlem kimliği")
  },
  {
    name: "individual qr badges preferences operations",
    ok: webIndividualOps.includes("Puan ve QR")
      && webIndividualOps.includes("Rozetler ve Siparişler")
      && webIndividualOps.includes("Bildirim Tercihleri")
      && webIndividualOps.includes("Hızlı Bağlantılar")
      && webIndividualOps.includes("updatePushPreferences")
      && webIndividualOps.includes("useQrTransaction")
  },
  {
    name: "role live panel metrics",
    ok: webPanelMetrics.includes("Canlı panel verileri")
      && webPanelMetrics.includes("Panel verileri yüklenemedi")
      && webPanelMetrics.includes("getCountFromServer")
      && webPanelMetrics.includes("getAdminDashboardSummary")
  },
  {
    name: "admin mini module management",
    ok: functions.includes("saveTouristSurvivalKitItem")
      && functions.includes("saveAncientGuideStop")
      && functions.includes("touristSurvivalKit.upsert")
      && functions.includes("ancientGuideStop.upsert")
      && webPanelActions.includes("saveTouristSurvivalKitItem")
      && webPanelActions.includes("saveAncientGuideStop")
      && webActionForms.includes("MiniModuleManagementForm")
      && webActionForms.includes("Turist destek bilgisini kaydet")
      && webActionForms.includes("Antik Rehber durağı kaydet")
  },
  {
    name: "legacy firebase data compatibility",
    ok: legacy.includes("mapLegacyVenueToPlace")
      && legacy.includes("mapLegacyTheatrePlayToEvent")
      && legacy.includes("onay_durumu")
      && webLiveData.includes("collection(db, \"venues\")")
      && webLiveData.includes("collection(db, \"theatre_plays\")")
      && mobile.includes("mapLegacyVenueToPlace")
      && mobile.includes("mapLegacyTheatrePlayToEvent")
  }
];

const failures = checks.filter((check) => !check.ok);

if (failures.length > 0) {
  console.error("Product-flow kontrolü başarısız:");
  for (const failure of failures) console.error(`- ${failure.name}`);
  process.exit(1);
}

console.log(`Product-flow kontrolü başarılı. Kontrol edilen akış: ${checks.length}`);
