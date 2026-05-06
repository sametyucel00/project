import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { badges, compactValue, defaultPushPreferences, getEventById, getOfferById, getPlaceById, userTasks } from "@nar/core";
import { ActionPill, ActionRow, DetailPreview, StatStrip } from "../components/ui";
import { completeUserTask, deleteCurrentAccount, fetchUserOrders, fetchUserQrTransactions, logout, resetCurrentUserScanHistory, useQrTransaction } from "../services";
import { loadStoredAppSettings, saveStoredAppSettings } from "../services/appSettings";
import { saveMobilePreferences, type MobileThemeMode } from "../services/preferences";
import { db } from "../firebase";
import { styles } from "../styles";
import { getMobileLocale, setMobileLocale } from "../locale";
import { getMobileThemeMode, getMobileThemeVersion, setMobileThemeMode } from "../theme";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import type { MobileScreenProps } from "./types";

type ProfileLocale = "tr" | "en" | "ru" | "de";

export function ProfileScreen({ feed, session, onOpenAuth, onOpenLegal }: MobileScreenProps) {
  const isGuest = !session || session.isAnonymous;
  const points = isGuest ? 0 : session?.points ?? 500;
  const uid = session?.uid;
  const samplePlace = feed.places[0];

  const [preferences, setPreferences] = useState(session?.notificationPreferences ?? defaultPushPreferences);
  const [themeMode, setThemeMode] = useState<MobileThemeMode>(getMobileThemeMode());
  const [language, setLanguage] = useState<ProfileLocale>((getMobileLocale() as ProfileLocale) ?? "tr");
  const [qrRows, setQrRows] = useState<Array<[string, string]>>([]);
  const [orderRows, setOrderRows] = useState<Array<[string, string]>>([]);
  const [favoriteRows, setFavoriteRows] = useState<Array<[string, string]>>([]);
  const [status, setStatus] = useState("Profil bilgilerin hazır.");
  const [saving, setSaving] = useState(false);
  const lastSavedRef = useRef("");
  const languageRef = useRef(language);
  const themeModeRef = useRef(themeMode);
  const preferencesRef = useRef(preferences);
  const favoriteTitleLookupRef = useRef(new Map<string, string>());
  const userEditedSettingsRef = useRef(false);
  const hydratedRef = useRef(false);
  const copy = getProfileCopy(language);
  const ui = getProfileUi(language);
  const markSettingsEdited = () => {
    userEditedSettingsRef.current = true;
  };

  useEffect(() => {
    let active = true;
    async function loadHistory() {
      if (!uid) {
        setQrRows([]);
        setOrderRows([]);
        return;
      }
      try {
        const [liveQrTransactions, liveOrders] = await Promise.all([
          fetchUserQrTransactions(uid),
          fetchUserOrders(uid)
        ]);
        if (!active) return;
        setQrRows(liveQrTransactions.map((transaction) => [
          transaction.placeId,
          `${transaction.pointsDelta} puan · bakiye ${transaction.balanceAfter ?? "Belirlenmemiş"}`
        ]));
        setOrderRows(liveOrders.map((order) => [
          order.entityTitle,
          `${translateOrderType(order.type)} · ${translateOrderStatus(order.status)} · ${order.amountLabel ?? "Belirlenmemiş"}`
        ]));
      } catch {
        if (!active) return;
        setQrRows([]);
        setOrderRows([]);
      }
    }
    void loadHistory();
    return () => {
      active = false;
    };
  }, [uid]);

  useEffect(() => {
    const lookup = new Map<string, string>();
    for (const place of feed.places) lookup.set(`place:${place.id}`, place.title.tr);
    for (const event of feed.events) lookup.set(`event:${event.id}`, event.title.tr);
    for (const offer of feed.offers) lookup.set(`offer:${offer.id}`, offer.title.tr);
    favoriteTitleLookupRef.current = lookup;
  }, [feed.places, feed.events, feed.offers]);

  useEffect(() => {
    if (!uid) {
      setFavoriteRows([]);
      return;
    }

    let active = true;
    void getDocs(query(collection(db, "users", uid, "favorites"), orderBy("createdAt", "desc")))
      .then((snapshot) => {
        if (!active) return;
        const rows = snapshot.docs.map((favorite) => {
          const data = favorite.data() as { entityType?: string; entityId?: string };
          return [
            resolveFavoriteTitle(data.entityType ?? "", data.entityId ?? "", favoriteTitleLookupRef.current),
            translateFavoriteType(data.entityType ?? "", language)
          ] as [string, string];
        });
        setFavoriteRows(rows);
      })
      .catch(() => {
        if (active) setFavoriteRows([]);
      });

    return () => {
      active = false;
    };
  }, [language, uid]);

  useEffect(() => {
    const requestedThemeVersion = getMobileThemeVersion();
    let active = true;
    void loadStoredAppSettings().then((stored) => {
      if (!active) return;
      if (getMobileThemeMode() !== "system") return;
      if (getMobileThemeVersion() !== requestedThemeVersion) return;
      if (userEditedSettingsRef.current) return;
      const nextLanguage = (stored.preferredLocale ?? getMobileLocale() ?? languageRef.current) as ProfileLocale;
      const nextTheme = stored.themeMode ?? getMobileThemeMode();
      const nextPreferences = stored.notificationPreferences ?? preferencesRef.current;
      if (stored.preferredLocale) setLanguage(nextLanguage);
      if (stored.themeMode) setThemeMode(nextTheme);
      if (stored.notificationPreferences) setPreferences(nextPreferences);
      setMobileLocale(nextLanguage as "tr" | "en" | "ru" | "de");
      setMobileThemeMode(nextTheme);
      lastSavedRef.current = serializeSettings({
        language: nextLanguage,
        themeMode: nextTheme,
        preferences: nextPreferences
      });
      hydratedRef.current = true;
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    languageRef.current = language;
    setMobileLocale(language as "tr" | "en" | "ru" | "de");
  }, [language]);

  useEffect(() => {
    themeModeRef.current = themeMode;
    setMobileThemeMode(themeMode);
  }, [themeMode]);

  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    const snapshot = serializeSettings({ language, themeMode, preferences });
    if (snapshot === lastSavedRef.current) return;
    const timer = setTimeout(() => {
      void saveSettings({ language, themeMode, preferences, snapshot });
    }, 450);
    return () => clearTimeout(timer);
  }, [language, themeMode, preferences]);

  async function saveSettings(next?: {
    language?: ProfileLocale;
    themeMode?: MobileThemeMode;
    preferences?: typeof defaultPushPreferences;
    snapshot?: string;
  }) {
    const resolvedLanguage = next?.language ?? language;
    const resolvedThemeMode = next?.themeMode ?? themeModeRef.current;
    const resolvedPreferences = next?.preferences ?? preferencesRef.current;
    const snapshot = next?.snapshot ?? serializeSettings({
      language: resolvedLanguage,
      themeMode: resolvedThemeMode,
      preferences: resolvedPreferences
    });
    userEditedSettingsRef.current = true;
    lastSavedRef.current = snapshot;
    setSaving(true);
    setStatus(copy.savingButton);
    try {
      await saveStoredAppSettings({
        preferredLocale: resolvedLanguage as "tr" | "en" | "ru" | "de",
        themeMode: resolvedThemeMode,
        notificationPreferences: resolvedPreferences
      });
      if (uid) {
        await saveMobilePreferences(uid, {
          preferredLocale: resolvedLanguage as "tr" | "en" | "ru" | "de",
          themeMode: resolvedThemeMode,
          notificationPreferences: resolvedPreferences
        });
      }
      setStatus(copy.savedSettings);
    } catch {
      setStatus(copy.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function resetScanData() {
    setStatus(ui.resettingScan);
    try {
      await resetCurrentUserScanHistory();
      setQrRows([]);
      setStatus(ui.resetScanDone);
    } catch {
      setStatus(ui.resetScanFailed);
    }
  }

  async function addQrPoints() {
    if (isGuest) {
      setStatus(copy.guestLocked);
      return;
    }
    if (!uid || !samplePlace) {
      setStatus(copy.qrRequired);
      return;
    }
    setStatus(copy.qrSaving);
    try {
      await useQrTransaction({
        userId: uid,
        placeId: samplePlace.id,
        pointsDelta: 25,
        scanId: `mobile-${uid}-${Date.now()}`,
        note: "Mobil profil QR işlemi"
      });
      setStatus(copy.qrSaved);
    } catch {
      setStatus(copy.qrFailed);
    }
  }

  async function finishTask() {
    if (isGuest) {
      setStatus(copy.guestLocked);
      return;
    }
    const task = userTasks[0];
    setStatus(copy.taskSaving);
    try {
      await completeUserTask({ taskId: task.id, rewardPoints: task.rewardPoints, badgeId: task.badgeId });
      setStatus(copy.taskSaved);
    } catch {
      setStatus(copy.taskFailed);
    }
  }

  async function deleteAccount() {
    setStatus(ui.deleteAccountPending);
    try {
      await deleteCurrentAccount();
      setStatus(ui.deleteAccountDone);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : ui.deleteAccountFailed);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: 120 }]} showsVerticalScrollIndicator={false}>
    <View style={styles.profileSurface}>
      <Text style={styles.profilePoints}>{points}</Text>
      <Text style={styles.profileTitle}>{!isGuest ? `${session?.displayName}, ${copy.pointsReady}` : copy.guestPoints}</Text>
      <Text style={styles.profileText}>{copy.profileLead}</Text>
      <StatStrip items={[
        [copy.city, session?.city ?? "Antalya"],
        [isGuest ? "Durum" : copy.task, isGuest ? "Misafir modu" : String(userTasks.length)],
        [isGuest ? "Kısıt" : copy.badge, isGuest ? "Aktif değil" : String(badges.length)]
      ]} />

      {isGuest ? (
        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>{ui.accountTitle}</Text>
          <Text style={styles.profileText}>{ui.accountLead}</Text>
          <ActionPill label={ui.signInButton} onPress={() => onOpenAuth?.()} />
        </View>
      ) : (
        <ActionRow>
          <ActionPill label={copy.qrAction} onPress={addQrPoints} />
          <ActionPill label={copy.taskAction} variant="secondary" onPress={finishTask} />
          <ActionPill label={copy.logout} variant="secondary" onPress={() => void logout()} />
        </ActionRow>
      )}

      <Text style={styles.profileText}>{status}</Text>

      <SettingsCard title={copy.personalInfo}>
        <SettingsRow label={copy.name} value={session?.displayName ?? copy.notSignedIn} />
        <SettingsRow label={copy.email} value={session?.email ?? copy.unspecified} />
        <SettingsRow label={copy.role} value={translateRole(session?.role, language)} />
      </SettingsCard>

      <SettingsCard title={copy.languageTheme}>
        <ChoiceGrid
          label={copy.language}
          value={language}
          displayValue={translateLocale(language, language)}
          choices={["tr", "en", "ru", "de"]}
          locale={language}
          onSelect={(value) => {
            const next = value as ProfileLocale;
            markSettingsEdited();
            setLanguage(next);
            setMobileLocale(next);
            setStatus(getProfileCopy(next).saveButton);
            void saveSettings({ language: next });
          }}
        />
        <ChoiceGrid
          label={copy.theme}
          value={themeMode}
          displayValue={translateTheme(themeMode, language)}
          choices={["system", "light", "dark"]}
          locale={language}
          onSelect={(value) => {
            const next = value as MobileThemeMode;
            markSettingsEdited();
            setThemeMode(next);
            setMobileThemeMode(next);
            setStatus(copy.saveButton);
            void saveSettings({ themeMode: next });
          }}
        />
      </SettingsCard>

      <SettingsCard title={copy.notifications}>
        <ToggleRow label={copy.offers} value={preferences.offers} locale={language} onPress={() => { markSettingsEdited(); setPreferences((current) => ({ ...current, offers: !current.offers })); }} />
        <ToggleRow label={copy.events} value={preferences.events} locale={language} onPress={() => { markSettingsEdited(); setPreferences((current) => ({ ...current, events: !current.events })); }} />
        <ToggleRow label={copy.theater} value={preferences.theater} locale={language} onPress={() => { markSettingsEdited(); setPreferences((current) => ({ ...current, theater: !current.theater })); }} />
        <ToggleRow label={copy.reminders} value={preferences.reminders} locale={language} onPress={() => { markSettingsEdited(); setPreferences((current) => ({ ...current, reminders: !current.reminders })); }} />
        <ActionPill label={saving ? copy.savingButton : copy.saveButton} onPress={() => void saveSettings()} />
      </SettingsCard>

      <SettingsCard title={ui.dataTools}>
        <ActionPill label={ui.resetScanButton} variant="secondary" onPress={() => void resetScanData()} />
        <ActionPill label={ui.openPrivacy} variant="secondary" onPress={() => onOpenLegal?.("privacy")} />
        <ActionPill label={ui.openTerms} variant="secondary" onPress={() => onOpenLegal?.("terms")} />
        {!isGuest ? <ActionPill label={ui.deleteAccountButton} variant="secondary" onPress={() => void deleteAccount()} /> : null}
      </SettingsCard>

      {!isGuest ? (
        <>
          <DetailPreview title={copy.tasks} rows={userTasks.map((task) => [task.title.tr, `${task.rewardPoints} puan`])} />
          <DetailPreview title={copy.badges} rows={badges.map((badge) => [badge.title.tr, `${translateBadgeLevel(badge.level)} · ${badge.description.tr}`])} />
          <DetailPreview title={copy.qrHistory} rows={qrRows.length ? qrRows : [["Geçmiş", copy.noQrHistory]]} />
          <DetailPreview title={copy.orderHistory} rows={orderRows.length ? orderRows : [["Geçmiş", copy.noOrderHistory]]} />
          <DetailPreview title="Favoriler" rows={favoriteRows.length ? favoriteRows : [["Favoriler", "Henüz kaydedilen favori yok"]]} />
        </>
      ) : (
        <Text style={styles.emptyText}>{copy.guestLocked}</Text>
      )}
    </View>
    </ScrollView>
  );
}

function SettingsCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.settingsCard}>
      <Text style={styles.settingsTitle}>{title}</Text>
      {children}
    </View>
  );
}

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.settingsRow}>
      <Text style={styles.settingsLabel}>{label}</Text>
      <Text style={styles.settingsValue}>{value}</Text>
    </View>
  );
}

function ToggleRow({ label, value, locale, onPress }: { label: string; value: boolean; locale: ProfileLocale; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: value }} onPress={onPress} style={styles.settingsRow}>
      <Text style={styles.settingsLabel}>{label}</Text>
      <Text style={styles.settingsValue}>{translateToggle(value, locale)}</Text>
    </Pressable>
  );
}

function ChoiceGrid({
  label,
  value,
  displayValue,
  choices,
  locale,
  onSelect
}: {
  label: string;
  value: string;
  displayValue: string;
  choices: string[];
  locale: ProfileLocale;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={{ gap: 10 }}>
      <View style={styles.settingsRow}>
        <Text style={styles.settingsLabel}>{label}</Text>
        <Text style={styles.settingsValue}>{displayValue}</Text>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {choices.map((choice) => {
          const active = choice === value;
          return (
            <Pressable
              key={choice}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onSelect(choice)}
              style={[styles.onboardingChoice, { minWidth: 78 }, active && styles.onboardingChoiceActive]}
            >
              <Text style={active ? styles.onboardingChoiceTextActive : styles.onboardingChoiceText}>{translateChoice(choice, locale)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function translateTheme(value: MobileThemeMode, locale: ProfileLocale = "tr") {
  const labels: Record<ProfileLocale, Record<MobileThemeMode, string>> = {
    tr: { system: "Sistem", light: "Açık", dark: "Koyu" },
    en: { system: "System", light: "Light", dark: "Dark" },
    ru: { system: "Система", light: "Светлая", dark: "Темная" },
    de: { system: "System", light: "Hell", dark: "Dunkel" }
  };
  return labels[locale][value];
}

function translateLocale(value: string, locale: ProfileLocale = "tr") {
  const labels: Record<ProfileLocale, Record<string, string>> = {
    tr: { tr: "Türkçe", en: "İngilizce", ru: "Rusça", de: "Almanca" },
    en: { tr: "Turkish", en: "English", ru: "Russian", de: "German" },
    ru: { tr: "Турецкий", en: "Английский", ru: "Русский", de: "Немецкий" },
    de: { tr: "Türkisch", en: "Englisch", ru: "Russisch", de: "Deutsch" }
  };
  return labels[locale][value] ?? compactValue(value);
}

function translateRole(value?: string, locale: ProfileLocale = "tr") {
  const labels: Record<ProfileLocale, Record<string, string>> = {
    tr: { business: "İşletme", theater: "Tiyatro", admin: "Yönetici", individual: "Bireysel" },
    en: { business: "Business", theater: "Theater", admin: "Admin", individual: "Individual" },
    ru: { business: "Бизнес", theater: "Театр", admin: "Админ", individual: "Личный" },
    de: { business: "Unternehmen", theater: "Theater", admin: "Admin", individual: "Privat" }
  };
  return labels[locale][value ?? "individual"] ?? labels.tr.individual;
}

function translateChoice(value: string, locale: ProfileLocale = "tr") {
  if (value === "tr" || value === "en" || value === "ru" || value === "de") return translateLocale(value, locale);
  if (value === "system" || value === "light" || value === "dark") return translateTheme(value as MobileThemeMode, locale);
  return compactValue(value);
}

function translateToggle(value: boolean, locale: ProfileLocale) {
  const labels: Record<ProfileLocale, [string, string]> = {
    tr: ["Açık", "Kapalı"],
    en: ["On", "Off"],
    ru: ["Вкл.", "Выкл."],
    de: ["Ein", "Aus"]
  };
  return value ? labels[locale][0] : labels[locale][1];
}

function serializeSettings({
  language,
  themeMode,
  preferences
}: {
  language: string;
  themeMode: string;
  preferences: typeof defaultPushPreferences;
}) {
  return JSON.stringify({
    language,
    themeMode,
    preferences
  });
}

function resolveFavoriteTitle(entityType: string, entityId: string, lookup: Map<string, string>) {
  const cachedTitle = lookup.get(`${entityType}:${entityId}`);
  if (cachedTitle) return cachedTitle;
  if (entityType === "place") return getPlaceById(entityId)?.title.tr ?? entityId;
  if (entityType === "event") return getEventById(entityId)?.title.tr ?? entityId;
  if (entityType === "offer") return getOfferById(entityId)?.title.tr ?? entityId;
  return entityId || "Belirtilmemiş";
}

function translateFavoriteType(entityType: string, locale: ProfileLocale) {
  const labels: Record<ProfileLocale, Record<string, string>> = {
    tr: { place: "Mekan", event: "Etkinlik", offer: "Fırsat" },
    en: { place: "Place", event: "Event", offer: "Offer" },
    ru: { place: "Место", event: "Событие", offer: "Предложение" },
    de: { place: "Ort", event: "Veranstaltung", offer: "Angebot" }
  };
  return labels[locale][entityType] ?? compactValue(entityType);
}

function translateBadgeLevel(value: string) {
  if (value === "bronze") return "Bronz";
  if (value === "silver") return "Gümüş";
  if (value === "gold") return "Altın";
  return compactValue(value);
}

function translateOrderType(value: string) {
  if (value === "ticket") return "Bilet";
  if (value === "offer") return "Fırsat";
  if (value === "points") return "Puan";
  return compactValue(value);
}

function translateOrderStatus(value: string) {
  if (value === "created") return "Oluşturuldu";
  if (value === "confirmed") return "Onaylandı";
  if (value === "used") return "Kullanıldı";
  if (value === "cancelled") return "İptal edildi";
  if (value === "refunded") return "İade edildi";
  return compactValue(value);
}

const profileUiTr = {
  accountTitle: "Hesap bağlantısı",
  accountLead: "Hesabın yoksa misafir olarak kalabilir, sonra giriş yapabilirsin.",
  signInButton: "Giriş / Kayıt ol",
  dataTools: "Veri araçları",
  resetScanButton: "Tarama verilerini sıfırla",
  openPrivacy: "Gizlilik ve koşullar",
  openTerms: "Kullanım koşulları",
  resettingScan: "Tarama verileri temizleniyor...",
  resetScanDone: "Tarama verileri temizlendi.",
  resetScanFailed: "Tarama verileri temizlenemedi.",
  deleteAccountButton: "Hesabı sil",
  deleteAccountPending: "Hesap siliniyor...",
  deleteAccountDone: "Hesap silindi.",
  deleteAccountFailed: "Hesap silinemedi."
};

const profileCopyTr = {
  pointsReady: "puanların hazır",
  guestPoints: "Puanların burada görünecek",
  profileLead: "QR kodunla puan kazanabilir, fırsat kullanabilir ve görevlerden rozet açabilirsin.",
  city: "Şehir",
  task: "Görev",
  badge: "Rozet",
  qrAction: "QR puan işle",
  taskAction: "Görev tamamla",
  logout: "Oturumu kapat",
  personalInfo: "Kişisel bilgiler",
  name: "Ad soyad",
  email: "E-posta",
  role: "Rol",
  languageTheme: "Dil ve tema",
  language: "Dil",
  theme: "Tema",
  notifications: "Bildirim tercihleri",
  offers: "Fırsatlar",
  events: "Etkinlikler",
  theater: "Tiyatro",
  reminders: "Hatırlatıcılar",
  saveButton: "Ayarları kaydet",
  savingButton: "Kaydediliyor...",
  savedSettings: "Ayarlar kaydedildi.",
  saveFailed: "Ayarlar kaydedilemedi. Lütfen tekrar dene.",
  qrRequired: "QR işlemi için giriş ve mekan bilgisi gerekiyor.",
  qrSaving: "QR puanı işleniyor...",
  qrSaved: "QR puanı işlendi.",
  qrFailed: "QR işlemi tamamlanamadı.",
  taskSaving: "Görev tamamlanıyor...",
  taskSaved: "Görev tamamlandı, puan hesabına işlendi.",
  taskFailed: "Görev tamamlanamadı.",
  notSignedIn: "Giriş yapılmadı",
  unspecified: "Belirtilmemiş",
  tasks: "Görevler",
  badges: "Rozetler",
  qrHistory: "QR işlem geçmişi",
  orderHistory: "Sipariş ve kullanım geçmişi",
  noQrHistory: "Henüz QR işlemi yok",
  noOrderHistory: "Henüz sipariş kaydı yok",
  guestLocked: "Misafir oturumunda puan, favori, takvim ve görev işlemleri kapalıdır."
};

const profileUiTranslations = {
  tr: profileUiTr,
  en: {
    ...profileUiTr,
    accountTitle: "Account",
    accountLead: "You can browse as a guest and sign in later.",
    signInButton: "Sign in / Register",
    dataTools: "Data and privacy",
    resetScanButton: "Clear scan history",
    openPrivacy: "Privacy policy",
    openTerms: "Terms of use",
    resettingScan: "Clearing scan history...",
    resetScanDone: "Scan history cleared.",
    resetScanFailed: "Scan history could not be cleared.",
    deleteAccountButton: "Delete account",
    deleteAccountPending: "Deleting account...",
    deleteAccountDone: "Account deleted.",
    deleteAccountFailed: "Account could not be deleted."
  },
  ru: {
    ...profileUiTr,
    accountTitle: "Аккаунт",
    accountLead: "Можно продолжить как гость и войти позже.",
    signInButton: "Войти / регистрация",
    dataTools: "Данные и приватность",
    resetScanButton: "Очистить историю сканов",
    openPrivacy: "Политика конфиденциальности",
    openTerms: "Условия использования",
    resettingScan: "История сканов очищается...",
    resetScanDone: "История сканов очищена.",
    resetScanFailed: "Не удалось очистить историю сканов.",
    deleteAccountButton: "Удалить аккаунт",
    deleteAccountPending: "Аккаунт удаляется...",
    deleteAccountDone: "Аккаунт удалён.",
    deleteAccountFailed: "Не удалось удалить аккаунт."
  },
  de: {
    ...profileUiTr,
    accountTitle: "Konto",
    accountLead: "Du kannst als Gast bleiben und dich später anmelden.",
    signInButton: "Anmelden / Registrieren",
    dataTools: "Daten und Datenschutz",
    resetScanButton: "Scanverlauf löschen",
    openPrivacy: "Datenschutz",
    openTerms: "Nutzungsbedingungen",
    resettingScan: "Scanverlauf wird gelöscht...",
    resetScanDone: "Scanverlauf gelöscht.",
    resetScanFailed: "Scanverlauf konnte nicht gelöscht werden.",
    deleteAccountButton: "Konto löschen",
    deleteAccountPending: "Konto wird gelöscht...",
    deleteAccountDone: "Konto gelöscht.",
    deleteAccountFailed: "Konto konnte nicht gelöscht werden."
  }
} as const;

const profileCopyTranslations = {
  tr: profileCopyTr,
  en: {
    ...profileCopyTr,
    pointsReady: "your points are ready",
    guestPoints: "Your points will appear here",
    profileLead: "Earn points with your QR, use offers, and unlock badges from tasks.",
    city: "City",
    task: "Task",
    badge: "Badge",
    qrAction: "Process QR points",
    taskAction: "Complete task",
    logout: "Sign out",
    personalInfo: "Personal information",
    name: "Full name",
    email: "E-mail",
    role: "Role",
    languageTheme: "Language and theme",
    language: "Language",
    theme: "Theme",
    notifications: "Notification preferences",
    offers: "Offers",
    events: "Events",
    theater: "Theater",
    reminders: "Reminders",
    saveButton: "Save settings",
    savingButton: "Saving...",
    savedSettings: "Settings saved.",
    saveFailed: "Settings could not be saved. Please try again.",
    qrRequired: "Sign-in and a place are required for QR actions.",
    qrSaving: "Processing QR points...",
    qrSaved: "QR points processed.",
    qrFailed: "QR action could not be completed.",
    taskSaving: "Completing task...",
    taskSaved: "Task completed and points added.",
    taskFailed: "Task could not be completed.",
    notSignedIn: "Not signed in",
    unspecified: "Not specified",
    tasks: "Tasks",
    badges: "Badges",
    qrHistory: "QR history",
    orderHistory: "Orders and usage history",
    noQrHistory: "No QR action yet",
    noOrderHistory: "No order record yet",
    guestLocked: "Points, favorites, calendar, and tasks are disabled in guest mode."
  },
  ru: {
    ...profileCopyTr,
    pointsReady: "баллы готовы",
    guestPoints: "Ваши баллы появятся здесь",
    profileLead: "Получайте баллы через QR, используйте предложения и открывайте значки.",
    city: "Город",
    task: "Задание",
    badge: "Значок",
    qrAction: "Начислить QR-баллы",
    taskAction: "Выполнить задание",
    logout: "Выйти",
    personalInfo: "Личные данные",
    name: "Имя",
    email: "E-mail",
    role: "Роль",
    languageTheme: "Язык и тема",
    language: "Язык",
    theme: "Тема",
    notifications: "Настройки уведомлений",
    offers: "Предложения",
    events: "События",
    theater: "Театр",
    reminders: "Напоминания",
    saveButton: "Сохранить настройки",
    savingButton: "Сохранение...",
    savedSettings: "Настройки сохранены.",
    saveFailed: "Не удалось сохранить настройки. Повторите попытку.",
    qrRequired: "Для QR нужен вход и место.",
    qrSaving: "QR-баллы обрабатываются...",
    qrSaved: "QR-баллы начислены.",
    qrFailed: "Не удалось выполнить QR-действие.",
    taskSaving: "Задание выполняется...",
    taskSaved: "Задание выполнено, баллы добавлены.",
    taskFailed: "Не удалось выполнить задание.",
    notSignedIn: "Вход не выполнен",
    unspecified: "Не указано",
    tasks: "Задания",
    badges: "Значки",
    qrHistory: "История QR",
    orderHistory: "История заказов",
    noQrHistory: "QR-действий пока нет",
    noOrderHistory: "Заказов пока нет",
    guestLocked: "Баллы, избранное, календарь и задания недоступны в гостевом режиме."
  },
  de: {
    ...profileCopyTr,
    pointsReady: "deine Punkte sind bereit",
    guestPoints: "Deine Punkte erscheinen hier",
    profileLead: "Sammle Punkte per QR, nutze Angebote und schalte Abzeichen frei.",
    city: "Stadt",
    task: "Aufgabe",
    badge: "Abzeichen",
    qrAction: "QR-Punkte buchen",
    taskAction: "Aufgabe abschließen",
    logout: "Abmelden",
    personalInfo: "Persönliche Daten",
    name: "Name",
    email: "E-Mail",
    role: "Rolle",
    languageTheme: "Sprache und Design",
    language: "Sprache",
    theme: "Design",
    notifications: "Benachrichtigungen",
    offers: "Angebote",
    events: "Veranstaltungen",
    theater: "Theater",
    reminders: "Erinnerungen",
    saveButton: "Einstellungen speichern",
    savingButton: "Wird gespeichert...",
    savedSettings: "Einstellungen gespeichert.",
    saveFailed: "Einstellungen konnten nicht gespeichert werden. Bitte erneut versuchen.",
    qrRequired: "Für QR-Aktionen sind Anmeldung und ein Ort erforderlich.",
    qrSaving: "QR-Punkte werden verarbeitet...",
    qrSaved: "QR-Punkte verarbeitet.",
    qrFailed: "QR-Aktion konnte nicht abgeschlossen werden.",
    taskSaving: "Aufgabe wird abgeschlossen...",
    taskSaved: "Aufgabe abgeschlossen, Punkte wurden gutgeschrieben.",
    taskFailed: "Aufgabe konnte nicht abgeschlossen werden.",
    notSignedIn: "Nicht angemeldet",
    unspecified: "Nicht angegeben",
    tasks: "Aufgaben",
    badges: "Abzeichen",
    qrHistory: "QR-Verlauf",
    orderHistory: "Bestell- und Nutzungsverlauf",
    noQrHistory: "Noch keine QR-Aktion",
    noOrderHistory: "Noch kein Bestelleintrag",
    guestLocked: "Punkte, Favoriten, Kalender und Aufgaben sind im Gastmodus deaktiviert."
  }
} as const;

function getProfileUi(locale: ProfileLocale) {
  return profileUiTranslations[locale] ?? profileUiTranslations.tr;
}

function getProfileCopy(locale: ProfileLocale) {
  return profileCopyTranslations[locale] ?? profileCopyTranslations.tr;
}
