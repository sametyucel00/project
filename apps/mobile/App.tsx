import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { Component, memo, type ErrorInfo, type ReactElement, type ReactNode, startTransition, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { InteractionManager, Pressable, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { HomeScreen } from "./src/screens/HomeScreen";
import { PlacesScreen } from "./src/screens/PlacesScreen";
import { EventsScreen } from "./src/screens/EventsScreen";
import { OffersScreen } from "./src/screens/OffersScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { GuideScreen } from "./src/screens/GuideScreen";
import { PlaceDetailScreen } from "./src/screens/PlaceDetailScreen";
import { EventDetailScreen } from "./src/screens/EventDetailScreen";
import { OfferDetailScreen } from "./src/screens/OfferDetailScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { AuthScreen } from "./src/screens/AuthScreen";
import { LegalScreen } from "./src/screens/LegalScreen";
import type { MobileScreenProps } from "./src/screens/types";
import { useDiscoveryFeed, useSession, useUserLocation } from "./src/hooks";
import { styles } from "./src/styles";
import { getMobileThemeMode, getMobileThemeVersion, reapplyMobileTheme, setMobileThemeMode, subscribeMobileTheme, theme } from "./src/theme";
import { getDeviceLocale, getMobileLocale, setMobileLocale, subscribeMobileLocale } from "./src/locale";
import { getOnboardingCompleted, markOnboardingCompleted } from "./src/services/onboarding";
import { loadStoredAppSettings } from "./src/services/appSettings";
import { perfMark } from "./src/services/perf";
import { t } from "@nar/core";
import { rememberLocationPromptSuppressed, clearLocationPromptSuppressed } from "./src/hooks/useUserLocation";

if (typeof window !== "undefined") {
  void WebBrowser.maybeCompleteAuthSession();
}

class MobileErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null };

  static getDerivedStateFromError(error: unknown) {
    return { error: error instanceof Error ? error.message : "Uygulama başlatılırken bir sorun oluştu." };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.warn("Nar Rehberi runtime error", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.startupScreen}>
          <View style={styles.onboardingCard}>
            <Text style={styles.splashBadge}>Nar Rehberi</Text>
            <Text style={styles.splashTagline}>Uygulama açılırken sorun oluştu</Text>
            <Text style={styles.onboardingText}>{this.state.error}</Text>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }
}

const tabs = [
  { label: "Ana Sayfa", icon: "home-outline", screen: memo(HomeScreen) },
  { label: "Mekanlar", icon: "location-outline", screen: memo(PlacesScreen) },
  { label: "Etkinlikler", icon: "calendar-outline", screen: memo(EventsScreen) },
  { label: "Fırsatlar", icon: "gift-outline", screen: memo(OffersScreen) },
  { label: "Profil", icon: "person-outline", screen: memo(ProfileScreen) }
] as const;

type TabLabel = (typeof tabs)[number]["label"];
type ScreenComponent = (props: MobileScreenProps) => ReactElement;
type Surface =
  | { kind: "tab"; tab: TabLabel }
  | { kind: "tourist" }
  | { kind: "ancient" }
  | { kind: "auth" }
  | { kind: "legal"; page: "privacy" | "terms" }
  | { kind: "place"; placeId: string }
  | { kind: "event"; eventId: string }
  | { kind: "offer"; offerId: string };

export default function App() {
  return (
    <MobileErrorBoundary>
      <MobileApp />
    </MobileErrorBoundary>
  );
}

function getRouteMark(surface: Surface, activeTab: TabLabel) {
  if (surface.kind === "tab") return `nav:${surface.tab}:route`;
  if (surface.kind === "place") return "nav:place-detail:route";
  if (surface.kind === "event") return "nav:event-detail:route";
  if (surface.kind === "offer") return "nav:offer-detail:route";
  if (surface.kind === "tourist") return "nav:tourist:route";
  if (surface.kind === "ancient") return "nav:ancient:route";
  if (surface.kind === "auth") return "nav:auth:route";
  if (surface.kind === "legal") return "nav:legal:route";
  return `nav:${activeTab}:route`;
}

function MobileApp() {
  const [activeTab, setActiveTab] = useState<TabLabel>("Ana Sayfa");
  const [mountedTabs, setMountedTabs] = useState<TabLabel[]>(["Ana Sayfa"]);
  const [surface, setSurface] = useState<Surface>({ kind: "tab", tab: "Ana Sayfa" });
  const [catalogEnabled, setCatalogEnabled] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const { session, loading: sessionLoading } = useSession();
  const shouldLoadFeed = onboardingCompleted === true && Boolean(session);
  const homeFeed = useDiscoveryFeed(shouldLoadFeed, "home");
  const catalogFeed = useDiscoveryFeed(shouldLoadFeed && catalogEnabled, "catalog");
  const { location: userLocation, permissionGranted, error: locationError, requestAccess: requestLocationAccess } = useUserLocation(onboardingCompleted === true);
  const themeSnapshot = useSyncExternalStore(subscribeMobileTheme, getMobileThemeVersion, getMobileThemeVersion);
  useSyncExternalStore(subscribeMobileLocale, getMobileLocale, getMobileLocale);
  const deviceLocale = getDeviceLocale();
  const locale = getMobileLocale();
  const needsOnboarding = onboardingCompleted !== true;

  useEffect(() => {
    reapplyMobileTheme();
  }, [themeSnapshot]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      void (Ionicons as typeof Ionicons & { loadFont?: () => Promise<void> }).loadFont?.();
    });
    return () => task.cancel();
  }, []);

  useEffect(() => {
    const requestedThemeVersion = getMobileThemeVersion();
    let active = true;
    const task = InteractionManager.runAfterInteractions(() => {
      void loadStoredAppSettings().then((stored) => {
        if (!active) return;
        if (getMobileThemeMode() !== "system") return;
        if (getMobileThemeVersion() !== requestedThemeVersion) return;
        const locale = stored.preferredLocale ?? deviceLocale;
        const themeMode = stored.themeMode ?? "system";
        setMobileLocale(locale);
        setMobileThemeMode(themeMode);
      });
    });
    return () => {
      active = false;
      task.cancel();
    };
  }, [deviceLocale]);

  useEffect(() => {
    let active = true;
    const fallbackTimer = setTimeout(() => {
      if (active) setOnboardingCompleted(false);
    }, 700);
    void getOnboardingCompleted().then((completed) => {
      if (!active) return;
      clearTimeout(fallbackTimer);
      setOnboardingCompleted(completed);
    });
    return () => {
      active = false;
      clearTimeout(fallbackTimer);
    };
  }, []);

  useEffect(() => {
    perfMark(getRouteMark(surface, activeTab));
  }, [activeTab, surface]);

  const showAuth = surface.kind === "auth" || (!needsOnboarding && !session);
  const showLegal = surface.kind === "legal";

  const isTabSurface = surface.kind === "tab";
  const pageTitle = surface.kind === "tourist" ? t(locale, "touristSurvivalKit")
    : surface.kind === "ancient" ? t(locale, "ancientGuide")
      : surface.kind === "place" ? "Mekan Detayı"
        : surface.kind === "event" ? "Etkinlik Detayı"
          : surface.kind === "offer" ? "Fırsat Detayı"
            : t(locale, "appName");

  const openTab = useCallback((tab: TabLabel) => {
    perfMark(`nav:${tab}:press`);
    perfMark(`nav:${tab}:handler`);
    if (tab !== "Ana Sayfa") setCatalogEnabled(true);
    perfMark(`nav:${tab}:navigate`);
    setActiveTab(tab);
    setSurface({ kind: "tab", tab });
    setMountedTabs((current) => (current.includes(tab) ? current : [...current, tab]));
  }, []);

  const openPlace = useCallback((placeId: string) => {
    perfMark("nav:place-detail:press", { placeId });
    perfMark("nav:place-detail:handler", { placeId });
    setCatalogEnabled(true);
    setActiveTab("Mekanlar");
    perfMark("nav:place-detail:navigate", { placeId });
    setSurface({ kind: "place", placeId });
  }, []);

  const openEvent = useCallback((eventId: string) => {
    perfMark("nav:event-detail:press", { eventId });
    perfMark("nav:event-detail:handler", { eventId });
    setCatalogEnabled(true);
    setActiveTab("Etkinlikler");
    perfMark("nav:event-detail:navigate", { eventId });
    setSurface({ kind: "event", eventId });
  }, []);

  const openOffer = useCallback((offerId: string) => {
    perfMark("nav:offer-detail:press", { offerId });
    perfMark("nav:offer-detail:handler", { offerId });
    setCatalogEnabled(true);
    setActiveTab("Fırsatlar");
    perfMark("nav:offer-detail:navigate", { offerId });
    setSurface({ kind: "offer", offerId });
  }, []);

  const openTouristGuide = useCallback(() => {
    perfMark("nav:tourist:press");
    perfMark("nav:tourist:handler");
    perfMark("nav:tourist:navigate");
    setSurface({ kind: "tourist" });
  }, []);

  const openAncientGuide = useCallback(() => {
    perfMark("nav:ancient:press");
    perfMark("nav:ancient:handler");
    perfMark("nav:ancient:navigate");
    setSurface({ kind: "ancient" });
  }, []);

  const openAuth = useCallback(() => {
    perfMark("nav:auth:press");
    perfMark("nav:auth:handler");
    perfMark("nav:auth:navigate");
    setSurface({ kind: "auth" });
  }, []);

  const openLegal = useCallback((page: "privacy" | "terms") => {
    perfMark("nav:legal:press", { page });
    perfMark("nav:legal:handler", { page });
    perfMark("nav:legal:navigate", { page });
    setSurface({ kind: "legal", page });
  }, []);

  function backToTabs() {
    perfMark("nav:back:press", { tab: activeTab });
    perfMark("nav:back:handler", { tab: activeTab });
    perfMark("nav:back:navigate", { tab: activeTab });
    setSurface({ kind: "tab", tab: activeTab });
  }

  async function completeOnboarding() {
    await markOnboardingCompleted();
    if (!permissionGranted) {
      await rememberLocationPromptSuppressed();
    } else {
      await clearLocationPromptSuppressed();
    }
    startTransition(() => {
      setOnboardingCompleted(true);
      setSurface({ kind: "auth" });
    });
  }

  async function grantLocationAccess() {
    await requestLocationAccess();
  }

  const homeScreenProps: MobileScreenProps = useMemo(() => ({
    feed: homeFeed,
    session,
    userLocation,
    onOpenPlace: openPlace,
    onOpenEvent: openEvent,
    onOpenOffer: openOffer,
    onOpenTouristGuide: openTouristGuide,
    onOpenAncientGuide: openAncientGuide,
    onOpenTab: openTab,
    onOpenAuth: openAuth,
    onOpenLegal: openLegal
  }), [homeFeed, session, userLocation, openPlace, openEvent, openOffer, openTouristGuide, openAncientGuide, openTab, openAuth, openLegal]);

  const catalogScreenProps: MobileScreenProps = useMemo(() => ({
    feed: catalogFeed,
    session,
    userLocation,
    onOpenPlace: openPlace,
    onOpenEvent: openEvent,
    onOpenOffer: openOffer,
    onOpenTouristGuide: openTouristGuide,
    onOpenAncientGuide: openAncientGuide,
    onOpenTab: openTab,
    onOpenAuth: openAuth,
    onOpenLegal: openLegal
  }), [catalogFeed, session, userLocation, openPlace, openEvent, openOffer, openTouristGuide, openAncientGuide, openTab, openAuth, openLegal]);

  if (onboardingCompleted === null || (!needsOnboarding && sessionLoading)) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.startupBlank} />
      </SafeAreaProvider>
    );
  }

  if (needsOnboarding) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.startupScreen}>
          <OnboardingScreen
            locale={locale}
            locationStatus={permissionGranted ? t(locale, "onboardingLocationReady") : locationError ?? t(locale, "onboardingLocationPending")}
            locationGranted={permissionGranted}
            onSelectLocale={(next) => setMobileLocale(next)}
            onGrantLocation={() => void grantLocationAccess()}
            onSkip={() => void completeOnboarding()}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (showLegal) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safe}>
          <LegalScreen locale={locale} kind={surface.page} onBack={() => setSurface(session ? { kind: "tab", tab: activeTab } : { kind: "auth" })} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (showAuth) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safe}>
          <AuthScreen
            locale={locale}
            onSignedIn={() => setSurface({ kind: "tab", tab: activeTab })}
            onOpenLegal={openLegal}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe}>
        <View style={styles.screen}>
          <View style={{ paddingHorizontal: 18 }}>
            <View style={styles.header}>
              {isTabSurface ? (
                <View>
                  <Text style={styles.logo}>{t(locale, "appName")}</Text>
                  <Text style={styles.location}>{session?.city ?? "Antalya"} · bugün</Text>
                </View>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Geri dön"
                  onPress={backToTabs}
                  hitSlop={12}
                  style={styles.headerBack}
                >
                  <Ionicons name="arrow-back" size={20} color={theme.ink} />
                  <Text style={styles.headerBackText}>{pageTitle}</Text>
                </Pressable>
              )}
              <Pressable style={styles.iconButton} accessibilityRole="button" accessibilityLabel="QR kodunu aç" onPress={() => (session ? openTab("Profil") : openAuth())}>
                <Ionicons name="qr-code-outline" size={22} color={theme.ink} />
              </Pressable>
            </View>
          </View>

          <View style={{ flex: 1 }}>
            {surface.kind === "tab" ? (
              <View style={{ flex: 1 }}>
                {tabs.map((tab) => {
                  const Screen = tab.screen as ScreenComponent;
                  const visible = tab.label === activeTab;
                  const screenProps = tab.label === "Ana Sayfa" ? homeScreenProps : catalogScreenProps;
                  if (!mountedTabs.includes(tab.label)) return null;
                  return (
                    <View
                      key={tab.label}
                      style={{ flex: 1, display: visible ? "flex" : "none", pointerEvents: visible ? "auto" : "none" }}
                    >
                      <Screen {...screenProps} />
                    </View>
                  );
                })}
              </View>
            ) : surface.kind === "tourist" ? (
              <GuideScreen {...homeScreenProps} mode="tourist" onBack={backToTabs} />
            ) : surface.kind === "ancient" ? (
              <GuideScreen {...homeScreenProps} mode="ancient" onBack={backToTabs} />
            ) : surface.kind === "place" ? (
              <PlaceDetailScreen {...catalogScreenProps} placeId={surface.placeId} onBack={backToTabs} />
            ) : surface.kind === "event" ? (
              <EventDetailScreen {...catalogScreenProps} eventId={surface.eventId} onBack={backToTabs} />
            ) : surface.kind === "offer" ? (
              <OfferDetailScreen {...catalogScreenProps} offerId={surface.offerId} onBack={backToTabs} />
            ) : null}
          </View>

          {permissionGranted ? null : locationError ? (
            <View style={{ paddingHorizontal: 18 }}>
              <View style={styles.settingsCard}>
                <Text style={styles.settingsTitle}>Konum erişimi</Text>
                <Text style={styles.profileText}>{locationError}</Text>
              </View>
            </View>
          ) : null}

          {isTabSurface ? (
          <View style={styles.tabBar}>
            {tabs.map((tab) => (
              <Pressable
                style={styles.tab}
                key={tab.label}
                onPress={() => openTab(tab.label)}
                accessibilityRole="button"
                accessibilityLabel={`${tab.label} sekmesi`}
              >
                <Ionicons name={tab.icon as keyof typeof Ionicons.glyphMap} size={21} color={tab.label === activeTab ? theme.nar : theme.muted} />
                <Text style={[styles.tabText, tab.label === activeTab && styles.tabActive]}>
                  {tab.label === "Ana Sayfa" ? t(locale, "homeTab")
                    : tab.label === "Mekanlar" ? t(locale, "placesTab")
                      : tab.label === "Etkinlikler" ? t(locale, "eventsTab")
                        : tab.label === "Fırsatlar" ? t(locale, "offersTab")
                          : t(locale, "profileTab")}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}


