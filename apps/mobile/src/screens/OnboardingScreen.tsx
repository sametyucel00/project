import { Ionicons } from "@expo/vector-icons";
import { t } from "@nar/core";
import { Pressable, ScrollView, Text, View } from "react-native";
import { styles } from "../styles";
import { theme } from "../theme";

const languageChoices = [
  { code: "tr", label: "Türkçe" },
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
  { code: "de", label: "Deutsch" }
] as const;

type OnboardingProps = {
  locale: "tr" | "en" | "ru" | "de";
  locationStatus: string;
  locationGranted: boolean;
  onSelectLocale: (locale: "tr" | "en" | "ru" | "de") => void;
  onGrantLocation: () => void;
  onSkip: () => void;
};

export function OnboardingScreen({
  locale,
  locationStatus,
  locationGranted,
  onSelectLocale,
  onGrantLocation,
  onSkip
}: OnboardingProps) {
  return (
    <View style={styles.startupScreen}>
      <ScrollView style={styles.startupScroll} contentContainerStyle={styles.startupContent} showsVerticalScrollIndicator={false}>
        <View style={styles.onboardingCard}>
          <View style={styles.splashBrandRow}>
            <View>
              <Text style={styles.splashBadge}>Nar Rehberi</Text>
              <Text style={styles.splashLogo}>{t(locale, "appName")}</Text>
            </View>
            <Ionicons name="compass-outline" size={30} color={theme.nar} />
          </View>

          <Text style={styles.onboardingTitle}>{t(locale, "onboardingTitle")}</Text>
          <Text style={styles.onboardingText}>{t(locale, "onboardingSubtitle")}</Text>

          <View>
            <Text style={styles.onboardingSectionTitle}>{t(locale, "onboardingLanguage")}</Text>
            <View style={styles.onboardingChoiceRow}>
              {languageChoices.map((choice) => (
                <Pressable
                  key={choice.code}
                  accessibilityRole="button"
                  onPress={() => onSelectLocale(choice.code)}
                  style={[styles.onboardingChoice, locale === choice.code && styles.onboardingChoiceActive]}
                >
                  <Text style={locale === choice.code ? styles.onboardingChoiceTextActive : styles.onboardingChoiceText}>{choice.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View>
            <Text style={styles.onboardingSectionTitle}>{t(locale, "onboardingLocationTitle")}</Text>
            <View style={styles.onboardingList}>
              <View style={styles.onboardingListItem}>
                <Ionicons name="location-outline" size={18} color={theme.sea} />
                <Text style={styles.onboardingListText}>{t(locale, "onboardingLocationBody")}</Text>
              </View>
              <View style={styles.onboardingListItem}>
                <Ionicons name="language-outline" size={18} color={theme.sea} />
                <Text style={styles.onboardingListText}>{t(locale, "onboardingLocaleBody")}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.onboardingText}>{locationStatus}</Text>

          <Pressable accessibilityRole="button" onPress={onGrantLocation} style={styles.onboardingAction}>
            <Text style={styles.onboardingActionText}>
              {locationGranted ? t(locale, "onboardingLocationGranted") : t(locale, "onboardingAllowLocation")}
            </Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onSkip} style={[styles.onboardingAction, styles.onboardingActionSecondary]}>
            <Text style={styles.onboardingActionTextSecondary}>
              {locationGranted ? t(locale, "onboardingContinue") : t(locale, "onboardingSkipLocation")}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
