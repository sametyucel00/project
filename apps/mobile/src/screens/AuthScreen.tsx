import { Ionicons } from "@expo/vector-icons";
import { t, type Locale } from "@nar/core";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { loginAnonymously, loginWithApplePopup, loginWithEmail, loginWithGooglePopup, registerWithEmailAndRole, resetPassword } from "../services";
import { styles } from "../styles";
import { theme } from "../theme";
import type { SelfServiceRole } from "../services";

type AuthProps = {
  locale: Locale;
  onSignedIn: () => void;
  onOpenLegal: (kind: "privacy" | "terms") => void;
};

type AuthMode = "login" | "register";

const copy = {
  tr: {
    title: "Hesabınla devam et",
    subtitle: "E-posta ile giriş yapabilir, yeni hesap açabilir ya da misafir olarak devam edebilirsin.",
    email: "E-posta",
    password: "Şifre",
    name: "Ad soyad",
    login: "Giriş yap",
    register: "Kayıt ol",
    google: "Google ile devam et",
    apple: "Apple ile devam et",
    guest: "Misafir olarak devam et",
    forgot: "Şifremi unuttum",
    continue: "Devam et",
    accountType: "Hesap tipi",
    individual: "Bireysel",
    business: "İşletme",
    theater: "Tiyatro",
    privacy: "Gizlilik",
    terms: "Koşullar",
    statusSigning: "Oturum açılıyor...",
    statusResetSent: "Şifre sıfırlama e-postası gönderildi.",
    statusError: "İşlem tamamlanamadı."
  },
  en: {
    title: "Continue with your account",
    subtitle: "Sign in with email, create a new account, or continue as a guest.",
    email: "Email",
    password: "Password",
    name: "Full name",
    login: "Sign in",
    register: "Create account",
    google: "Continue with Google",
    apple: "Continue with Apple",
    guest: "Continue as guest",
    forgot: "Forgot password",
    continue: "Continue",
    accountType: "Account type",
    individual: "Individual",
    business: "Business",
    theater: "Theater",
    privacy: "Privacy",
    terms: "Terms",
    statusSigning: "Signing in...",
    statusResetSent: "Password reset email sent.",
    statusError: "Action could not be completed."
  },
  ru: {
    title: "Продолжить с аккаунтом",
    subtitle: "Войдите по e-mail, создайте аккаунт или продолжите как гость.",
    email: "E-mail",
    password: "Пароль",
    name: "Имя и фамилия",
    login: "Войти",
    register: "Регистрация",
    google: "Продолжить через Google",
    apple: "Продолжить через Apple",
    guest: "Продолжить как гость",
    forgot: "Забыл пароль",
    continue: "Продолжить",
    accountType: "Тип аккаунта",
    individual: "Личный",
    business: "Бизнес",
    theater: "Театр",
    privacy: "Конфиденциальность",
    terms: "Условия",
    statusSigning: "Выполняется вход...",
    statusResetSent: "Письмо для сброса пароля отправлено.",
    statusError: "Не удалось выполнить действие."
  },
  de: {
    title: "Mit deinem Konto fortfahren",
    subtitle: "Mit E-Mail anmelden, ein Konto erstellen oder als Gast fortfahren.",
    email: "E-Mail",
    password: "Passwort",
    name: "Name",
    login: "Anmelden",
    register: "Konto erstellen",
    google: "Mit Google fortfahren",
    apple: "Mit Apple fortfahren",
    guest: "Als Gast fortfahren",
    forgot: "Passwort vergessen",
    continue: "Weiter",
    accountType: "Kontotyp",
    individual: "Privat",
    business: "Unternehmen",
    theater: "Theater",
    privacy: "Datenschutz",
    terms: "Nutzungsbedingungen",
    statusSigning: "Anmeldung läuft...",
    statusResetSent: "E-Mail zum Zurücksetzen wurde gesendet.",
    statusError: "Aktion konnte nicht abgeschlossen werden."
  }
} as const;

export function AuthScreen({ locale, onSignedIn, onOpenLegal }: AuthProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<SelfServiceRole>("individual");
  const [status, setStatus] = useState("");

  const c = copy[locale] ?? copy.tr;

  async function runAuth(action: () => Promise<unknown>) {
    setStatus(c.statusSigning);
    try {
      await action();
      onSignedIn();
    } catch {
      setStatus(c.statusError);
    }
  }

  async function runUtility(action: () => Promise<unknown>, successMessage?: string) {
    setStatus(c.statusSigning);
    try {
      await action();
      setStatus(successMessage ?? c.statusResetSent);
    } catch {
      setStatus(c.statusError);
    }
  }

  return (
    <View style={styles.startupScreen}>
      <ScrollView style={styles.startupScroll} contentContainerStyle={styles.startupContent} showsVerticalScrollIndicator={false}>
        <View style={styles.splashCard}>
          <View style={styles.splashBrandRow}>
            <View>
              <Text style={styles.splashBadge}>Nar Rehberi</Text>
              <Text style={styles.splashLogo}>{t(locale, "appName")}</Text>
            </View>
            <Ionicons name="person-circle-outline" size={30} color={theme.nar} />
          </View>
          <Text style={styles.splashTagline}>{c.title}</Text>
          <Text style={styles.onboardingText}>{c.subtitle}</Text>
        </View>

        <View style={styles.onboardingCard}>
          <View style={styles.onboardingChoiceRow}>
            <Pressable accessibilityRole="button" onPress={() => setMode("login")} style={[styles.onboardingChoice, mode === "login" && styles.onboardingChoiceActive]}>
              <Text style={mode === "login" ? styles.onboardingChoiceTextActive : styles.onboardingChoiceText}>{c.login}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setMode("register")} style={[styles.onboardingChoice, mode === "register" && styles.onboardingChoiceActive]}>
              <Text style={mode === "register" ? styles.onboardingChoiceTextActive : styles.onboardingChoiceText}>{c.register}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => void runUtility(() => resetPassword(email.trim()), c.statusResetSent)} style={styles.onboardingChoice}>
              <Text style={styles.onboardingChoiceText}>{c.forgot}</Text>
            </Pressable>
          </View>

          <TextInput value={email} onChangeText={setEmail} placeholder={c.email} keyboardType="email-address" autoCapitalize="none" style={styles.authInput} />
          <TextInput value={password} onChangeText={setPassword} placeholder={c.password} secureTextEntry style={styles.authInput} />
          <TextInput value={displayName} onChangeText={setDisplayName} placeholder={c.name} style={styles.authInput} />
          {mode === "register" ? (
            <View style={styles.settingsCard}>
              <Text style={styles.settingsTitle}>{c.accountType}</Text>
              <View style={styles.onboardingChoiceRow}>
                <Pressable accessibilityRole="button" onPress={() => setRole("individual")} style={[styles.onboardingChoice, role === "individual" && styles.onboardingChoiceActive]}>
                  <Text style={role === "individual" ? styles.onboardingChoiceTextActive : styles.onboardingChoiceText}>{c.individual}</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => setRole("business")} style={[styles.onboardingChoice, role === "business" && styles.onboardingChoiceActive]}>
                  <Text style={role === "business" ? styles.onboardingChoiceTextActive : styles.onboardingChoiceText}>{c.business}</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => setRole("theater")} style={[styles.onboardingChoice, role === "theater" && styles.onboardingChoiceActive]}>
                  <Text style={role === "theater" ? styles.onboardingChoiceTextActive : styles.onboardingChoiceText}>{c.theater}</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={() => void runAuth(() => mode === "login"
              ? loginWithEmail(email.trim(), password)
              : registerWithEmailAndRole(email.trim(), password, displayName.trim(), role))}
            style={styles.onboardingAction}
          >
            <Text style={styles.onboardingActionText}>{c.continue}</Text>
          </Pressable>

          <View style={styles.onboardingChoiceRow}>
            <Pressable accessibilityRole="button" onPress={() => void runAuth(() => loginWithGooglePopup())} style={styles.onboardingChoice}>
              <Text style={styles.onboardingChoiceText}>{c.google}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => void runAuth(() => loginWithApplePopup())} style={styles.onboardingChoice}>
              <Text style={styles.onboardingChoiceText}>{c.apple}</Text>
            </Pressable>
          </View>

          <Pressable accessibilityRole="button" onPress={() => void runAuth(() => loginAnonymously())} style={styles.onboardingAction}>
            <Text style={styles.onboardingActionText}>{c.guest}</Text>
          </Pressable>

          <View style={styles.onboardingChoiceRow}>
            <Pressable accessibilityRole="button" onPress={() => onOpenLegal("privacy")} style={styles.onboardingChoice}>
              <Text style={styles.onboardingChoiceText}>{c.privacy}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => onOpenLegal("terms")} style={styles.onboardingChoice}>
              <Text style={styles.onboardingChoiceText}>{c.terms}</Text>
            </Pressable>
          </View>

          {status ? <Text style={styles.onboardingText}>{status}</Text> : null}
        </View>
      </ScrollView>
    </View>
  );
}
