import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { Component, type ErrorInfo, type ReactElement, type ReactNode, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
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
import { t } from "@nar/core";

WebBrowser.maybeCompleteAuthSession();

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
  { label: "Ana Sayfa", icon: "home-outline", screen: HomeScreen },
  { label: "Mekanlar", icon: "location-outline", screen: PlacesScreen },
  { label: "Etkinlikler", icon: "calendar-outline", screen: EventsScreen },
  { label: "Fırsatlar", icon: "gift-outline", screen: OffersScreen },
  { label: "Profil", icon: "person-outline", screen: ProfileScreen }
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

function MobileApp() {
  const [activeTab, setActiveTab] = useState<TabLabel>("Ana Sayfa");
  const [surface, setSurface] = useState<Surface>({ kind: "tab", tab: "Ana Sayfa" });
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const { session, loading: sessionLoading } = useSession();
  const shouldLoadFeed = onboardingCompleted === true && Boolean(session);
  const feed = useDiscoveryFeed(shouldLoadFeed);
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
    void (Ionicons as typeof Ionicons & { loadFont?: () => Promise<void> }).loadFont?.();
  }, []);

  useEffect(() => {
    const requestedThemeVersion = getMobileThemeVersion();
    let active = true;
    void loadStoredAppSettings().then((stored) => {
      if (!active) return;
      if (getMobileThemeMode() !== "system") return;
      if (getMobileThemeVersion() !== requestedThemeVersion) return;
      const locale = stored.preferredLocale ?? deviceLocale;
      const themeMode = stored.themeMode ?? "system";
      setMobileLocale(locale);
      setMobileThemeMode(themeMode);
    });
    return () => {
      active = false;
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

  const showAuth = surface.kind === "auth" || (!needsOnboarding && !session);
  const showLegal = surface.kind === "legal";

  const ActiveScreen = (tabs.find((tab) => tab.label === activeTab)?.screen ?? HomeScreen) as ScreenComponent;
  const isTabSurface = surface.kind === "tab";
  const pageTitle = surface.kind === "tourist" ? t(locale, "touristSurvivalKit")
    : surface.kind === "ancient" ? t(locale, "ancientGuide")
      : surface.kind === "place" ? "Mekan Detayı"
        : surface.kind === "event" ? "Etkinlik Detayı"
          : surface.kind === "offer" ? "Fırsat Detayı"
            : t(locale, "appName");

  const openTab = useCallback((tab: TabLabel) => {
    setActiveTab(tab);
    setSurface({ kind: "tab", tab });
  }, []);

  const openPlace = useCallback((placeId: string) => {
    setActiveTab("Mekanlar");
    setSurface({ kind: "place", placeId });
  }, []);

  const openEvent = useCallback((eventId: string) => {
    setActiveTab("Etkinlikler");
    setSurface({ kind: "event", eventId });
  }, []);

  const openOffer = useCallback((offerId: string) => {
    setActiveTab("Fırsatlar");
    setSurface({ kind: "offer", offerId });
  }, []);

  const openTouristGuide = useCallback(() => {
    setSurface({ kind: "tourist" });
  }, []);

  const openAncientGuide = useCallback(() => {
    setSurface({ kind: "ancient" });
  }, []);

  const openAuth = useCallback(() => {
    setSurface({ kind: "auth" });
  }, []);

  const openLegal = useCallback((page: "privacy" | "terms") => {
    setSurface({ kind: "legal", page });
  }, []);

  function backToTabs() {
    setSurface({ kind: "tab", tab: activeTab });
  }

  async function completeOnboarding() {
    await markOnboardingCompleted();
    setOnboardingCompleted(true);
    setSurface({ kind: "auth" });
  }

  async function grantLocationAccess() {
    await requestLocationAccess();
  }

  const screenProps: MobileScreenProps = useMemo(() => ({
    feed,
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
  }), [feed, session, userLocation, openPlace, openEvent, openOffer, openTouristGuide, openAncientGuide, openTab, openAuth, openLegal]);

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
        <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            {isTabSurface ? (
              <View>
                <Text style={styles.logo}>{t(locale, "appName")}</Text>
                <Text style={styles.location}>{session?.city ?? "Antalya"} · bugün</Text>
              </View>
            ) : (
              <Pressable accessibilityRole="button" onPress={backToTabs} style={styles.headerBack}>
                <Ionicons name="arrow-back" size={20} color={theme.ink} />
                <Text style={styles.headerBackText}>{pageTitle}</Text>
              </Pressable>
            )}
            <Pressable style={styles.iconButton} accessibilityRole="button" accessibilityLabel="QR kodunu aç">
              <Ionicons name="qr-code-outline" size={22} color={theme.ink} />
            </Pressable>
          </View>

          {surface.kind === "tab" ? (
            <ActiveScreen {...screenProps} />
          ) : surface.kind === "tourist" ? (
            <GuideScreen {...screenProps} mode="tourist" onBack={backToTabs} />
          ) : surface.kind === "ancient" ? (
            <GuideScreen {...screenProps} mode="ancient" onBack={backToTabs} />
          ) : surface.kind === "place" ? (
            <PlaceDetailScreen {...screenProps} placeId={surface.placeId} onBack={backToTabs} />
          ) : surface.kind === "event" ? (
            <EventDetailScreen {...screenProps} eventId={surface.eventId} onBack={backToTabs} />
          ) : surface.kind === "offer" ? (
            <OfferDetailScreen {...screenProps} offerId={surface.offerId} onBack={backToTabs} />
          ) : null}

          {permissionGranted ? null : locationError ? (
            <View style={styles.settingsCard}>
              <Text style={styles.settingsTitle}>Konum erişimi</Text>
              <Text style={styles.profileText}>{locationError}</Text>
            </View>
          ) : null}
        </ScrollView>

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
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
