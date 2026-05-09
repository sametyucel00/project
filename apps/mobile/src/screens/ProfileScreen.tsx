import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { InteractionManager, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { badges, compactValue, defaultPushPreferences, getEventById, getOfferById, getPlaceById, userTasks } from "@nar/core";
import { ActionPill, ActionRow, DetailPreview, StatStrip } from "../components/ui";
import { completeUserTask, deleteCurrentAccount, fetchUserOrders, fetchUserQrTransactions, logout, resetCurrentUserScanHistory, updateMobileProfileDetails, useQrTransaction } from "../services";
import { loadStoredAppSettings, saveStoredAppSettings } from "../services/appSettings";
import { saveMobilePreferences, type MobileThemeMode } from "../services/preferences";
import { db } from "../firebase";
import { styles } from "../styles";
import { getMobileLocale, setMobileLocale } from "../locale";
import { getMobileThemeMode, getMobileThemeVersion, setMobileThemeMode } from "../theme";
import { perfMark, perfMeasure } from "../services/perf";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import type { MobileScreenProps } from "./types";

type ProfileLocale = "tr" | "en" | "ru" | "de";
type FavoriteEntry = {
  entityType: string;
  entityId: string;
  title: string;
  kindLabel: string;
};

export function ProfileScreen({ feed, session, onOpenAuth, onOpenLegal, onOpenQr, onOpenPlace, onOpenEvent, onOpenOffer }: MobileScreenProps) {
  const isGuest = !session || session.isAnonymous;
  const isBusiness = session?.role === "business";
  const points = isGuest ? 0 : session?.points ?? 500;
  const uid = session?.uid;
  const ownedPlace = isBusiness && uid ? feed.places.find((place) => place.ownerId === uid) : null;

  const [preferences, setPreferences] = useState(session?.notificationPreferences ?? defaultPushPreferences);
  const [themeMode, setThemeMode] = useState<MobileThemeMode>(getMobileThemeMode());
  const [language, setLanguage] = useState<ProfileLocale>((getMobileLocale() as ProfileLocale) ?? "tr");
  const [profileName, setProfileName] = useState(session?.displayName ?? "");
  const [profileEmail, setProfileEmail] = useState(session?.email ?? "");
  const [qrRows, setQrRows] = useState<Array<[string, string]>>([]);
  const [orderRows, setOrderRows] = useState<Array<[string, string]>>([]);
  const [favoriteRows, setFavoriteRows] = useState<Array<[string, string]>>([]);
  const [favoriteEntries, setFavoriteEntries] = useState<Array<FavoriteEntry>>([]);
  const [status, setStatus] = useState("Profil bilgilerin hazÄ±r.");
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
  useEffect(() => {
    setProfileName(session?.displayName ?? "");
    setProfileEmail(session?.email ?? "");
  }, [session?.uid, session?.displayName, session?.email]);

  useEffect(() => {
    perfMark("profile:screenMount");
    perfMeasure("profile:navigationToMount", "nav:Profil:press");
    queueMicrotask(() => {
      perfMark("profile:firstPaint");
      perfMeasure("profile:mountToFirstPaint", "profile:screenMount");
      perfMeasure("profile:navigationToFirstPaint", "nav:Profil:press");
    });
  }, []);

  const markSettingsEdited = () => {
    userEditedSettingsRef.current = true;
  };

  useEffect(() => {
    let active = true;
    const task = InteractionManager.runAfterInteractions(() => {
      void (async () => {
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
            `${transaction.pointsDelta} puan Â· bakiye ${transaction.balanceAfter ?? "BelirlenmemiÅŸ"}`
          ]));
          setOrderRows(liveOrders.map((order) => [
            order.entityTitle,
            `${translateOrderType(order.type)} Â· ${translateOrderStatus(order.status)} Â· ${order.amountLabel ?? "BelirlenmemiÅŸ"}`
          ]));
        } catch {
          if (!active) return;
          setQrRows([]);
          setOrderRows([]);
        }
      })();
    });
    return () => {
      active = false;
      task.cancel();
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
      setFavoriteEntries([]);
      setFavoriteRows([]);
      return;
    }

    let unsubscribe: (() => void) | undefined;
    const task = InteractionManager.runAfterInteractions(() => {
      unsubscribe = onSnapshot(
        query(collection(db, "users", uid, "favorites"), orderBy("createdAt", "desc")),
        (snapshot) => {
          const entries = snapshot.docs.map((favorite) => {
            const data = favorite.data() as { entityType?: string; entityId?: string };
            const entityType = data.entityType ?? "";
            const entityId = data.entityId ?? "";
            return {
              entityType,
              entityId,
              title: resolveFavoriteTitle(entityType, entityId, favoriteTitleLookupRef.current),
              kindLabel: translateFavoriteType(entityType, language)
            } as FavoriteEntry;
          });
          const rows = entries.map((entry) => [entry.title, entry.kindLabel] as [string, string]);
          setFavoriteEntries(entries);
          setFavoriteRows(rows);
        },
        () => {
          setFavoriteEntries([]);
          setFavoriteRows([]);
        }
      );
    });

    return () => {
      unsubscribe?.();
      task.cancel();
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

  async function saveIdentity() {
    if (isGuest || !uid) {
      setStatus(copy.guestLocked);
      return;
    }
    const nextName = profileName.trim();
    const nextEmail = profileEmail.trim();
    if (!nextName || !nextEmail) {
      setStatus(ui.identityRequired);
      return;
    }
    setSaving(true);
    setStatus(ui.identitySaving);
    try {
      await updateMobileProfileDetails({ displayName: nextName, email: nextEmail });
      setStatus(ui.identitySaved);
    } catch {
      setStatus(ui.identityFailed);
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
    if (!isBusiness) {
      setStatus(ui.openQrHint);
      return;
    }
    if (!uid || !ownedPlace) {
      setStatus(ui.qrNoOwnedPlace);
      return;
    }
    setStatus(copy.qrSaving);
    try {
      await useQrTransaction({
        userId: uid,
        placeId: ownedPlace.id,
        pointsDelta: 25,
        scanId: `mobile-${uid}-${Date.now()}`,
        note: "Mobil profil QR iÅŸlemi"
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
        [isGuest ? "KÄ±sÄ±t" : copy.badge, isGuest ? "Aktif deÄŸil" : String(badges.length)]
      ]} />

      {isGuest ? (
        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>{ui.accountTitle}</Text>
          <Text style={styles.profileText}>{ui.accountLead}</Text>
          <ActionPill label={ui.signInButton} onPress={() => onOpenAuth?.()} />
        </View>
      ) : isBusiness ? (
        <ActionRow>
          <ActionPill label={copy.qrAction} onPress={addQrPoints} />
          <ActionPill label={ui.openQrCode} variant="secondary" onPress={() => onOpenQr?.()} />
          <ActionPill label={copy.taskAction} variant="secondary" onPress={finishTask} />
          <ActionPill label={copy.logout} variant="secondary" onPress={() => void logout()} />
        </ActionRow>
      ) : (
        <ActionRow>
          <ActionPill label={ui.openQrCode} onPress={() => onOpenQr?.()} />
          <ActionPill label={copy.taskAction} variant="secondary" onPress={finishTask} />
          <ActionPill label={copy.logout} variant="secondary" onPress={() => void logout()} />
        </ActionRow>
      )}

      <Text style={styles.profileText}>{status}</Text>

      <SettingsCard title={copy.personalInfo}>
        <TextInput
          value={profileName}
          onChangeText={setProfileName}
          placeholder={copy.name}
          style={styles.authInput}
        />
        <TextInput
          value={profileEmail}
          onChangeText={setProfileEmail}
          placeholder={copy.email}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.authInput}
        />
        <SettingsRow label={copy.role} value={translateRole(session?.role, language)} />
        {!isGuest ? <ActionPill label={saving ? ui.identitySaving : ui.identitySaveButton} onPress={() => void saveIdentity()} /> : null}
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
          <DetailPreview title={copy.badges} rows={badges.map((badge) => [badge.title.tr, `${translateBadgeLevel(badge.level)} Â· ${badge.description.tr}`])} />
          <DetailPreview title={copy.qrHistory} rows={qrRows.length ? qrRows : [["GeÃ§miÅŸ", copy.noQrHistory]]} />
          <DetailPreview title={copy.orderHistory} rows={orderRows.length ? orderRows : [["GeÃ§miÅŸ", copy.noOrderHistory]]} />
          <DetailPreview
            title="Favoriler"
            rows={favoriteRows.length ? favoriteRows : [["Favoriler", "Henüz kaydedilen favori yok"]]}
            onRowPress={(index) => {
              const entry = favoriteEntries[index];
              if (!entry) return;
              setStatus(`${entry.kindLabel} detayı açılıyor...`);
              if (entry.entityType === "place") onOpenPlace?.(entry.entityId);
              if (entry.entityType === "event") onOpenEvent?.(entry.entityId);
              if (entry.entityType === "offer") onOpenOffer?.(entry.entityId);
            }}
          />
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
    tr: { system: "Sistem", light: "AÃ§Ä±k", dark: "Koyu" },
    en: { system: "System", light: "Light", dark: "Dark" },
    ru: { system: "Ğ¡Ğ¸ÑÑ‚ĞµĞ¼Ğ°", light: "Ğ¡Ğ²ĞµÑ‚Ğ»Ğ°Ñ", dark: "Ğ¢ĞµĞ¼Ğ½Ğ°Ñ" },
    de: { system: "System", light: "Hell", dark: "Dunkel" }
  };
  return labels[locale][value];
}

function translateLocale(value: string, locale: ProfileLocale = "tr") {
  const labels: Record<ProfileLocale, Record<string, string>> = {
    tr: { tr: "TÃ¼rkÃ§e", en: "Ä°ngilizce", ru: "RusÃ§a", de: "Almanca" },
    en: { tr: "Turkish", en: "English", ru: "Russian", de: "German" },
    ru: { tr: "Ğ¢ÑƒÑ€ĞµÑ†ĞºĞ¸Ğ¹", en: "ĞĞ½Ğ³Ğ»Ğ¸Ğ¹ÑĞºĞ¸Ğ¹", ru: "Ğ ÑƒÑÑĞºĞ¸Ğ¹", de: "ĞĞµĞ¼ĞµÑ†ĞºĞ¸Ğ¹" },
    de: { tr: "TÃ¼rkisch", en: "Englisch", ru: "Russisch", de: "Deutsch" }
  };
  return labels[locale][value] ?? compactValue(value);
}

function translateRole(value?: string, locale: ProfileLocale = "tr") {
  const labels: Record<ProfileLocale, Record<string, string>> = {
    tr: { business: "Ä°ÅŸletme", theater: "Tiyatro", admin: "YÃ¶netici", individual: "Bireysel" },
    en: { business: "Business", theater: "Theater", admin: "Admin", individual: "Individual" },
    ru: { business: "Ğ‘Ğ¸Ğ·Ğ½ĞµÑ", theater: "Ğ¢ĞµĞ°Ñ‚Ñ€", admin: "ĞĞ´Ğ¼Ğ¸Ğ½", individual: "Ğ›Ğ¸Ñ‡Ğ½Ñ‹Ğ¹" },
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
    tr: ["AÃ§Ä±k", "KapalÄ±"],
    en: ["On", "Off"],
    ru: ["Ğ’ĞºĞ».", "Ğ’Ñ‹ĞºĞ»."],
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
  return entityId || "BelirtilmemiÅŸ";
}

function translateFavoriteType(entityType: string, locale: ProfileLocale) {
  const labels: Record<ProfileLocale, Record<string, string>> = {
    tr: { place: "Mekan", event: "Etkinlik", offer: "FÄ±rsat" },
    en: { place: "Place", event: "Event", offer: "Offer" },
    ru: { place: "ĞœĞµÑÑ‚Ğ¾", event: "Ğ¡Ğ¾Ğ±Ñ‹Ñ‚Ğ¸Ğµ", offer: "ĞŸÑ€ĞµĞ´Ğ»Ğ¾Ğ¶ĞµĞ½Ğ¸Ğµ" },
    de: { place: "Ort", event: "Veranstaltung", offer: "Angebot" }
  };
  return labels[locale][entityType] ?? compactValue(entityType);
}

function translateBadgeLevel(value: string) {
  if (value === "bronze") return "Bronz";
  if (value === "silver") return "GÃ¼mÃ¼ÅŸ";
  if (value === "gold") return "AltÄ±n";
  return compactValue(value);
}

function translateOrderType(value: string) {
  if (value === "ticket") return "Bilet";
  if (value === "offer") return "FÄ±rsat";
  if (value === "points") return "Puan";
  return compactValue(value);
}

function translateOrderStatus(value: string) {
  if (value === "created") return "OluÅŸturuldu";
  if (value === "confirmed") return "OnaylandÄ±";
  if (value === "used") return "KullanÄ±ldÄ±";
  if (value === "cancelled") return "Ä°ptal edildi";
  if (value === "refunded") return "Ä°ade edildi";
  return compactValue(value);
}

const profileUiTr = {
  accountTitle: "Hesap baÄŸlantÄ±sÄ±",
  accountLead: "HesabÄ±n yoksa misafir olarak kalabilir, sonra giriÅŸ yapabilirsin.",
  signInButton: "GiriÅŸ / KayÄ±t ol",
  dataTools: "Veri araÃ§larÄ±",
  resetScanButton: "Tarama verilerini sÄ±fÄ±rla",
  openPrivacy: "Gizlilik ve koÅŸullar",
  openTerms: "KullanÄ±m koÅŸullarÄ±",
  openQrCode: "QR kodumu aÃ§",
  identitySaveButton: "Ad ve e-postayÄ± kaydet",
  identitySaving: "Kaydediliyor...",
  identitySaved: "Profil bilgileri gÃ¼ncellendi.",
  identityFailed: "Profil bilgileri gÃ¼ncellenemedi.",
  identityRequired: "Ad soyad ve e-posta gerekli.",
  resettingScan: "Tarama verileri temizleniyor...",
  resetScanDone: "Tarama verileri temizlendi.",
  resetScanFailed: "Tarama verileri temizlenemedi.",
  openQrHint: "QR kodunu saÄŸ Ã¼stten aÃ§Ä±p iÅŸletmeye gÃ¶ster.",
  qrNoOwnedPlace: "Bu QR iÅŸlemi iÃ§in iÅŸletmeye ait mekan bulunamadÄ±.",
  deleteAccountButton: "HesabÄ± sil",
  deleteAccountPending: "Hesap siliniyor...",
  deleteAccountDone: "Hesap silindi.",
  deleteAccountFailed: "Hesap silinemedi."
};

const profileCopyTr = {
  pointsReady: "puanlarÄ±n hazÄ±r",
  guestPoints: "PuanlarÄ±n burada gÃ¶rÃ¼necek",
  profileLead: "QR kodunla puan kazanabilir, fÄ±rsat kullanabilir ve gÃ¶revlerden rozet aÃ§abilirsin.",
  city: "Åehir",
  task: "GÃ¶rev",
  badge: "Rozet",
  qrAction: "QR puan iÅŸle",
  taskAction: "GÃ¶rev tamamla",
  logout: "Oturumu kapat",
  personalInfo: "KiÅŸisel bilgiler",
  name: "Ad soyad",
  email: "E-posta",
  role: "Rol",
  languageTheme: "Dil ve tema",
  language: "Dil",
  theme: "Tema",
  notifications: "Bildirim tercihleri",
  offers: "FÄ±rsatlar",
  events: "Etkinlikler",
  theater: "Tiyatro",
  reminders: "HatÄ±rlatÄ±cÄ±lar",
  saveButton: "AyarlarÄ± kaydet",
  savingButton: "Kaydediliyor...",
  savedSettings: "Ayarlar kaydedildi.",
  saveFailed: "Ayarlar kaydedilemedi. LÃ¼tfen tekrar dene.",
  qrRequired: "QR iÅŸlemi iÃ§in giriÅŸ ve mekan bilgisi gerekiyor.",
  qrSaving: "QR puanÄ± iÅŸleniyor...",
  qrSaved: "QR puanÄ± iÅŸlendi.",
  qrFailed: "QR iÅŸlemi tamamlanamadÄ±.",
  taskSaving: "GÃ¶rev tamamlanÄ±yor...",
  taskSaved: "GÃ¶rev tamamlandÄ±, puan hesabÄ±na iÅŸlendi.",
  taskFailed: "GÃ¶rev tamamlanamadÄ±.",
  notSignedIn: "GiriÅŸ yapÄ±lmadÄ±",
  unspecified: "BelirtilmemiÅŸ",
  tasks: "GÃ¶revler",
  badges: "Rozetler",
  qrHistory: "QR iÅŸlem geÃ§miÅŸi",
  orderHistory: "SipariÅŸ ve kullanÄ±m geÃ§miÅŸi",
  noQrHistory: "HenÃ¼z QR iÅŸlemi yok",
  noOrderHistory: "HenÃ¼z sipariÅŸ kaydÄ± yok",
  guestLocked: "Misafir oturumunda puan, favori, takvim ve gÃ¶rev iÅŸlemleri kapalÄ±dÄ±r."
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
    openQrCode: "Open my QR code",
    identitySaveButton: "Save name and email",
    identitySaving: "Saving...",
    identitySaved: "Profile details updated.",
    identityFailed: "Profile details could not be updated.",
    identityRequired: "Name and email are required.",
    resettingScan: "Clearing scan history...",
    resetScanDone: "Scan history cleared.",
    resetScanFailed: "Scan history could not be cleared.",
    openQrHint: "Open your QR code from the top right and show it to the business.",
    qrNoOwnedPlace: "No business-owned place was found for this QR action.",
    deleteAccountButton: "Delete account",
    deleteAccountPending: "Deleting account...",
    deleteAccountDone: "Account deleted.",
    deleteAccountFailed: "Account could not be deleted."
  },
  ru: {
    ...profileUiTr,
    accountTitle: "ĞĞºĞºĞ°ÑƒĞ½Ñ‚",
    accountLead: "ĞœĞ¾Ğ¶Ğ½Ğ¾ Ğ¿Ñ€Ğ¾Ğ´Ğ¾Ğ»Ğ¶Ğ¸Ñ‚ÑŒ ĞºĞ°Ğº Ğ³Ğ¾ÑÑ‚ÑŒ Ğ¸ Ğ²Ğ¾Ğ¹Ñ‚Ğ¸ Ğ¿Ğ¾Ğ·Ğ¶Ğµ.",
    signInButton: "Ğ’Ğ¾Ğ¹Ñ‚Ğ¸ / Ñ€ĞµĞ³Ğ¸ÑÑ‚Ñ€Ğ°Ñ†Ğ¸Ñ",
    dataTools: "Ğ”Ğ°Ğ½Ğ½Ñ‹Ğµ Ğ¸ Ğ¿Ñ€Ğ¸Ğ²Ğ°Ñ‚Ğ½Ğ¾ÑÑ‚ÑŒ",
    resetScanButton: "ĞÑ‡Ğ¸ÑÑ‚Ğ¸Ñ‚ÑŒ Ğ¸ÑÑ‚Ğ¾Ñ€Ğ¸Ñ ÑĞºĞ°Ğ½Ğ¾Ğ²",
    openPrivacy: "ĞŸĞ¾Ğ»Ğ¸Ñ‚Ğ¸ĞºĞ° ĞºĞ¾Ğ½Ñ„Ğ¸Ğ´ĞµĞ½Ñ†Ğ¸Ğ°Ğ»ÑŒĞ½Ğ¾ÑÑ‚Ğ¸",
    openTerms: "Ğ£ÑĞ»Ğ¾Ğ²Ğ¸Ñ Ğ¸ÑĞ¿Ğ¾Ğ»ÑŒĞ·Ğ¾Ğ²Ğ°Ğ½Ğ¸Ñ",
    resettingScan: "Ğ˜ÑÑ‚Ğ¾Ñ€Ğ¸Ñ ÑĞºĞ°Ğ½Ğ¾Ğ² Ğ¾Ñ‡Ğ¸Ñ‰Ğ°ĞµÑ‚ÑÑ...",
    resetScanDone: "Ğ˜ÑÑ‚Ğ¾Ñ€Ğ¸Ñ ÑĞºĞ°Ğ½Ğ¾Ğ² Ğ¾Ñ‡Ğ¸Ñ‰ĞµĞ½Ğ°.",
    resetScanFailed: "ĞĞµ ÑƒĞ´Ğ°Ğ»Ğ¾ÑÑŒ Ğ¾Ñ‡Ğ¸ÑÑ‚Ğ¸Ñ‚ÑŒ Ğ¸ÑÑ‚Ğ¾Ñ€Ğ¸Ñ ÑĞºĞ°Ğ½Ğ¾Ğ².",
    deleteAccountButton: "Ğ£Ğ´Ğ°Ğ»Ğ¸Ñ‚ÑŒ Ğ°ĞºĞºĞ°ÑƒĞ½Ñ‚",
    deleteAccountPending: "ĞĞºĞºĞ°ÑƒĞ½Ñ‚ ÑƒĞ´Ğ°Ğ»ÑĞµÑ‚ÑÑ...",
    deleteAccountDone: "ĞĞºĞºĞ°ÑƒĞ½Ñ‚ ÑƒĞ´Ğ°Ğ»Ñ‘Ğ½.",
    deleteAccountFailed: "ĞĞµ ÑƒĞ´Ğ°Ğ»Ğ¾ÑÑŒ ÑƒĞ´Ğ°Ğ»Ğ¸Ñ‚ÑŒ Ğ°ĞºĞºĞ°ÑƒĞ½Ñ‚."
  },
  de: {
    ...profileUiTr,
    accountTitle: "Konto",
    accountLead: "Du kannst als Gast bleiben und dich spÃ¤ter anmelden.",
    signInButton: "Anmelden / Registrieren",
    dataTools: "Daten und Datenschutz",
    resetScanButton: "Scanverlauf lÃ¶schen",
    openPrivacy: "Datenschutz",
    openTerms: "Nutzungsbedingungen",
    resettingScan: "Scanverlauf wird gelÃ¶scht...",
    resetScanDone: "Scanverlauf gelÃ¶scht.",
    resetScanFailed: "Scanverlauf konnte nicht gelÃ¶scht werden.",
    deleteAccountButton: "Konto lÃ¶schen",
    deleteAccountPending: "Konto wird gelÃ¶scht...",
    deleteAccountDone: "Konto gelÃ¶scht.",
    deleteAccountFailed: "Konto konnte nicht gelÃ¶scht werden."
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
    pointsReady: "Ğ±Ğ°Ğ»Ğ»Ñ‹ Ğ³Ğ¾Ñ‚Ğ¾Ğ²Ñ‹",
    guestPoints: "Ğ’Ğ°ÑˆĞ¸ Ğ±Ğ°Ğ»Ğ»Ñ‹ Ğ¿Ğ¾ÑĞ²ÑÑ‚ÑÑ Ğ·Ğ´ĞµÑÑŒ",
    profileLead: "ĞŸĞ¾Ğ»ÑƒÑ‡Ğ°Ğ¹Ñ‚Ğµ Ğ±Ğ°Ğ»Ğ»Ñ‹ Ñ‡ĞµÑ€ĞµĞ· QR, Ğ¸ÑĞ¿Ğ¾Ğ»ÑŒĞ·ÑƒĞ¹Ñ‚Ğµ Ğ¿Ñ€ĞµĞ´Ğ»Ğ¾Ğ¶ĞµĞ½Ğ¸Ñ Ğ¸ Ğ¾Ñ‚ĞºÑ€Ñ‹Ğ²Ğ°Ğ¹Ñ‚Ğµ Ğ·Ğ½Ğ°Ñ‡ĞºĞ¸.",
    city: "Ğ“Ğ¾Ñ€Ğ¾Ğ´",
    task: "Ğ—Ğ°Ğ´Ğ°Ğ½Ğ¸Ğµ",
    badge: "Ğ—Ğ½Ğ°Ñ‡Ğ¾Ğº",
    qrAction: "ĞĞ°Ñ‡Ğ¸ÑĞ»Ğ¸Ñ‚ÑŒ QR-Ğ±Ğ°Ğ»Ğ»Ñ‹",
    taskAction: "Ğ’Ñ‹Ğ¿Ğ¾Ğ»Ğ½Ğ¸Ñ‚ÑŒ Ğ·Ğ°Ğ´Ğ°Ğ½Ğ¸Ğµ",
    logout: "Ğ’Ñ‹Ğ¹Ñ‚Ğ¸",
    personalInfo: "Ğ›Ğ¸Ñ‡Ğ½Ñ‹Ğµ Ğ´Ğ°Ğ½Ğ½Ñ‹Ğµ",
    name: "Ğ˜Ğ¼Ñ",
    email: "E-mail",
    role: "Ğ Ğ¾Ğ»ÑŒ",
    languageTheme: "Ğ¯Ğ·Ñ‹Ğº Ğ¸ Ñ‚ĞµĞ¼Ğ°",
    language: "Ğ¯Ğ·Ñ‹Ğº",
    theme: "Ğ¢ĞµĞ¼Ğ°",
    notifications: "ĞĞ°ÑÑ‚Ñ€Ğ¾Ğ¹ĞºĞ¸ ÑƒĞ²ĞµĞ´Ğ¾Ğ¼Ğ»ĞµĞ½Ğ¸Ğ¹",
    offers: "ĞŸÑ€ĞµĞ´Ğ»Ğ¾Ğ¶ĞµĞ½Ğ¸Ñ",
    events: "Ğ¡Ğ¾Ğ±Ñ‹Ñ‚Ğ¸Ñ",
    theater: "Ğ¢ĞµĞ°Ñ‚Ñ€",
    reminders: "ĞĞ°Ğ¿Ğ¾Ğ¼Ğ¸Ğ½Ğ°Ğ½Ğ¸Ñ",
    saveButton: "Ğ¡Ğ¾Ñ…Ñ€Ğ°Ğ½Ğ¸Ñ‚ÑŒ Ğ½Ğ°ÑÑ‚Ñ€Ğ¾Ğ¹ĞºĞ¸",
    savingButton: "Ğ¡Ğ¾Ñ…Ñ€Ğ°Ğ½ĞµĞ½Ğ¸Ğµ...",
    savedSettings: "ĞĞ°ÑÑ‚Ñ€Ğ¾Ğ¹ĞºĞ¸ ÑĞ¾Ñ…Ñ€Ğ°Ğ½ĞµĞ½Ñ‹.",
    saveFailed: "ĞĞµ ÑƒĞ´Ğ°Ğ»Ğ¾ÑÑŒ ÑĞ¾Ñ…Ñ€Ğ°Ğ½Ğ¸Ñ‚ÑŒ Ğ½Ğ°ÑÑ‚Ñ€Ğ¾Ğ¹ĞºĞ¸. ĞŸĞ¾Ğ²Ñ‚Ğ¾Ñ€Ğ¸Ñ‚Ğµ Ğ¿Ğ¾Ğ¿Ñ‹Ñ‚ĞºÑƒ.",
    qrRequired: "Ğ”Ğ»Ñ QR Ğ½ÑƒĞ¶ĞµĞ½ Ğ²Ñ…Ğ¾Ğ´ Ğ¸ Ğ¼ĞµÑÑ‚Ğ¾.",
    qrSaving: "QR-Ğ±Ğ°Ğ»Ğ»Ñ‹ Ğ¾Ğ±Ñ€Ğ°Ğ±Ğ°Ñ‚Ñ‹Ğ²Ğ°ÑÑ‚ÑÑ...",
    qrSaved: "QR-Ğ±Ğ°Ğ»Ğ»Ñ‹ Ğ½Ğ°Ñ‡Ğ¸ÑĞ»ĞµĞ½Ñ‹.",
    qrFailed: "ĞĞµ ÑƒĞ´Ğ°Ğ»Ğ¾ÑÑŒ Ğ²Ñ‹Ğ¿Ğ¾Ğ»Ğ½Ğ¸Ñ‚ÑŒ QR-Ğ´ĞµĞ¹ÑÑ‚Ğ²Ğ¸Ğµ.",
    taskSaving: "Ğ—Ğ°Ğ´Ğ°Ğ½Ğ¸Ğµ Ğ²Ñ‹Ğ¿Ğ¾Ğ»Ğ½ÑĞµÑ‚ÑÑ...",
    taskSaved: "Ğ—Ğ°Ğ´Ğ°Ğ½Ğ¸Ğµ Ğ²Ñ‹Ğ¿Ğ¾Ğ»Ğ½ĞµĞ½Ğ¾, Ğ±Ğ°Ğ»Ğ»Ñ‹ Ğ´Ğ¾Ğ±Ğ°Ğ²Ğ»ĞµĞ½Ñ‹.",
    taskFailed: "ĞĞµ ÑƒĞ´Ğ°Ğ»Ğ¾ÑÑŒ Ğ²Ñ‹Ğ¿Ğ¾Ğ»Ğ½Ğ¸Ñ‚ÑŒ Ğ·Ğ°Ğ´Ğ°Ğ½Ğ¸Ğµ.",
    notSignedIn: "Ğ’Ñ…Ğ¾Ğ´ Ğ½Ğµ Ğ²Ñ‹Ğ¿Ğ¾Ğ»Ğ½ĞµĞ½",
    unspecified: "ĞĞµ ÑƒĞºĞ°Ğ·Ğ°Ğ½Ğ¾",
    tasks: "Ğ—Ğ°Ğ´Ğ°Ğ½Ğ¸Ñ",
    badges: "Ğ—Ğ½Ğ°Ñ‡ĞºĞ¸",
    qrHistory: "Ğ˜ÑÑ‚Ğ¾Ñ€Ğ¸Ñ QR",
    orderHistory: "Ğ˜ÑÑ‚Ğ¾Ñ€Ğ¸Ñ Ğ·Ğ°ĞºĞ°Ğ·Ğ¾Ğ²",
    noQrHistory: "QR-Ğ´ĞµĞ¹ÑÑ‚Ğ²Ğ¸Ğ¹ Ğ¿Ğ¾ĞºĞ° Ğ½ĞµÑ‚",
    noOrderHistory: "Ğ—Ğ°ĞºĞ°Ğ·Ğ¾Ğ² Ğ¿Ğ¾ĞºĞ° Ğ½ĞµÑ‚",
    guestLocked: "Ğ‘Ğ°Ğ»Ğ»Ñ‹, Ğ¸Ğ·Ğ±Ñ€Ğ°Ğ½Ğ½Ğ¾Ğµ, ĞºĞ°Ğ»ĞµĞ½Ğ´Ğ°Ñ€ÑŒ Ğ¸ Ğ·Ğ°Ğ´Ğ°Ğ½Ğ¸Ñ Ğ½ĞµĞ´Ğ¾ÑÑ‚ÑƒĞ¿Ğ½Ñ‹ Ğ² Ğ³Ğ¾ÑÑ‚ĞµĞ²Ğ¾Ğ¼ Ñ€ĞµĞ¶Ğ¸Ğ¼Ğµ."
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
    taskAction: "Aufgabe abschlieÃŸen",
    logout: "Abmelden",
    personalInfo: "PersÃ¶nliche Daten",
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
    qrRequired: "FÃ¼r QR-Aktionen sind Anmeldung und ein Ort erforderlich.",
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






