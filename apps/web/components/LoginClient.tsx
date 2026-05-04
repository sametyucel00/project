"use client";

import { ensureUserProfile } from "@/lib/auth-actions";
import { AppleLogo, GoogleLogo } from "@/components/BrandIcons";
import { appleProvider, auth, googleProvider } from "@/lib/firebase";
import { resolveRoleHome } from "@/lib/routes";
import type { UserRole } from "@nar/core";
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import type { FirebaseError } from "firebase/app";
import { Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLocale } from "./LocaleProvider";

type AuthMode = "login" | "register";
type SelfServiceRole = Exclude<UserRole, "admin">;

const loginCopy = {
  tr: {
    tabLogin: "Giriş",
    tabRegister: "Üyelik",
    email: "E-Posta",
    password: "Şifre",
    emailPlaceholder: "ornek@narrehberi.com",
    passwordPlaceholder: "En az 6 karakter",
    accountType: "Hesap tipini seç",
    profileHint: "Admin hesapları güvenlik nedeniyle yalnızca mevcut yönetici tarafından atanır.",
    emailLogin: "E-posta ile giriş",
    register: "Üyelik oluştur",
    google: "Google",
    apple: "Apple",
    forgot: "Şifremi sıfırla",
    messageDefault: "Hesabın, seçtiğin kullanım tipine göre açılır.",
    checking: "Bilgiler kontrol ediliyor.",
    forgotPrompt: "Şifre sıfırlama için e-posta adresini yaz.",
    forgotInvalid: "Geçerli bir e-posta adresi yaz.",
    forgotSending: "Şifre sıfırlama bağlantısı hazırlanıyor.",
    forgotSent: "Şifre sıfırlama bağlantısı e-posta adresine gönderildi.",
    googlePending: "Google ile devam ediliyor.",
    applePending: "Apple ile devam ediliyor."
  },
  en: {
    tabLogin: "Sign in",
    tabRegister: "Membership",
    email: "E-mail",
    password: "Password",
    emailPlaceholder: "example@narrehberi.com",
    passwordPlaceholder: "At least 6 characters",
    accountType: "Choose account type",
    profileHint: "Admin accounts are assigned only by the current administrator for security.",
    emailLogin: "Sign in with email",
    register: "Create account",
    google: "Google",
    apple: "Apple",
    forgot: "Reset password",
    messageDefault: "Your account opens according to the usage type you choose.",
    checking: "Checking details.",
    forgotPrompt: "Enter your e-mail address to reset the password.",
    forgotInvalid: "Enter a valid e-mail address.",
    forgotSending: "Preparing the password reset link.",
    forgotSent: "Password reset link was sent to your e-mail address.",
    googlePending: "Continuing with Google.",
    applePending: "Continuing with Apple."
  },
  ru: {
    tabLogin: "Вход",
    tabRegister: "Регистрация",
    email: "E-mail",
    password: "Пароль",
    emailPlaceholder: "example@narrehberi.com",
    passwordPlaceholder: "Минимум 6 символов",
    accountType: "Выберите тип аккаунта",
    profileHint: "Админ-аккаунты назначаются только текущим администратором из соображений безопасности.",
    emailLogin: "Войти по e-mail",
    register: "Создать аккаунт",
    google: "Google",
    apple: "Apple",
    forgot: "Сбросить пароль",
    messageDefault: "Аккаунт открывается в зависимости от выбранного типа использования.",
    checking: "Проверяем данные.",
    forgotPrompt: "Введите e-mail для сброса пароля.",
    forgotInvalid: "Введите действительный e-mail.",
    forgotSending: "Подготавливается ссылка для сброса пароля.",
    forgotSent: "Ссылка для сброса пароля отправлена на ваш e-mail.",
    googlePending: "Продолжаем через Google.",
    applePending: "Продолжаем через Apple."
  },
  de: {
    tabLogin: "Anmelden",
    tabRegister: "Registrierung",
    email: "E-Mail",
    password: "Passwort",
    emailPlaceholder: "example@narrehberi.com",
    passwordPlaceholder: "Mindestens 6 Zeichen",
    accountType: "Kontotyp wählen",
    profileHint: "Admin-Konten werden aus Sicherheitsgründen nur vom aktuellen Administrator vergeben.",
    emailLogin: "Mit E-Mail anmelden",
    register: "Konto erstellen",
    google: "Google",
    apple: "Apple",
    forgot: "Passwort zurücksetzen",
    messageDefault: "Dein Konto öffnet sich je nach gewähltem Nutzungstyp.",
    checking: "Daten werden geprüft.",
    forgotPrompt: "Bitte E-Mail-Adresse zum Zurücksetzen eingeben.",
    forgotInvalid: "Bitte eine gültige E-Mail-Adresse eingeben.",
    forgotSending: "Passwort-Reset-Link wird vorbereitet.",
    forgotSent: "Der Passwort-Reset-Link wurde an deine E-Mail gesendet.",
    googlePending: "Weiter mit Google.",
    applePending: "Weiter mit Apple."
  }
} as const;

const accountTypes = {
  tr: [
    { role: "individual", title: "Bireysel", text: "Puan, QR, favoriler ve etkinlik hatırlatıcıları." },
    { role: "business", title: "İşletme", text: "Mekan, kampanya ve QR sadakat yönetimi." },
    { role: "theater", title: "Tiyatro", text: "Oyun, bilet bağlantısı, kadro ve duyuru yönetimi." }
  ],
  en: [
    { role: "individual", title: "Individual", text: "Points, QR, favorites and event reminders." },
    { role: "business", title: "Business", text: "Venue, campaign and QR loyalty management." },
    { role: "theater", title: "Theater", text: "Play, ticket link, cast and announcement management." }
  ],
  ru: [
    { role: "individual", title: "Личный", text: "Баллы, QR, избранное и напоминания о событиях." },
    { role: "business", title: "Бизнес", text: "Управление местом, кампанией и QR-лояльностью." },
    { role: "theater", title: "Театр", text: "Управление спектаклем, ссылкой на билет, составом и объявлениями." }
  ],
  de: [
    { role: "individual", title: "Persönlich", text: "Punkte, QR, Favoriten und Event-Erinnerungen." },
    { role: "business", title: "Business", text: "Ort-, Kampagnen- und QR-Loyalty-Verwaltung." },
    { role: "theater", title: "Theater", text: "Stück-, Ticket-, Cast- und Ankündigungsverwaltung." }
  ]
} as const;

function normalizeError(error: unknown) {
  const code = (error as FirebaseError | undefined)?.code;
  if (!code) return error instanceof Error ? error.message : "İşlem tamamlanamadı.";
  if (code === "auth/invalid-email") return "E-posta adresi geçersiz görünüyor.";
  if (code === "auth/missing-email") return "Lütfen e-posta adresini yaz.";
  if (code === "auth/user-not-found") return "Bu e-posta ile kayıtlı kullanıcı bulunamadı.";
  if (code === "auth/network-request-failed") return "Ağ bağlantısı kurulamadı. İnterneti kontrol et.";
  if (code === "auth/too-many-requests") return "Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene.";
  if (code === "auth/unauthorized-continue-uri") return "Şifre sıfırlama yönlendirme alanı Firebase ayarlarında yetkili değil.";
  if (code === "auth/invalid-continue-uri") return "Şifre sıfırlama yönlendirme bağlantısı geçersiz.";
  return error instanceof Error ? error.message : "İşlem tamamlanamadı.";
}

export function LoginClient() {
  const { locale } = useLocale();
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [requestedRole, setRequestedRole] = useState<SelfServiceRole>("individual");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const copy = loginCopy[locale];
  const [message, setMessage] = useState<string>(copy.messageDefault);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMessage(copy.messageDefault);
  }, [copy.messageDefault]);

  async function completeAuth(roleForNewAccount?: SelfServiceRole) {
    const roleHint = roleForNewAccount ?? "individual";
    const timeout = new Promise<{ data: { role: UserRole } }>((resolve) =>
      setTimeout(() => resolve({ data: { role: roleHint } }), 1200)
    );
    const profile = await Promise.race([ensureUserProfile(roleForNewAccount), timeout]);
    const role = profile.data.role ?? roleHint;
    router.push(resolveRoleHome(role));
  }

  async function submitEmail() {
    setBusy(true);
    setMessage(copy.checking);
    try {
      if (mode === "register") {
        await createUserWithEmailAndPassword(auth, email, password);
        await completeAuth(requestedRole);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        await completeAuth();
      }
    } catch (error) {
      setMessage(normalizeError(error));
    } finally {
      setBusy(false);
    }
  }

  async function submitProvider(provider: "google" | "apple") {
    setBusy(true);
    setMessage(provider === "google" ? copy.googlePending : copy.applePending);
    try {
      await signInWithPopup(auth, provider === "google" ? googleProvider : appleProvider);
      await completeAuth(mode === "register" ? requestedRole : undefined);
    } catch (error) {
      setMessage(normalizeError(error));
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    const safeEmail = email.trim();
    if (!safeEmail) {
      setMessage(copy.forgotPrompt);
      return;
    }
    if (!safeEmail.includes("@")) {
      setMessage(copy.forgotInvalid);
      return;
    }
    setBusy(true);
    setMessage(copy.forgotSending);
    try {
      await sendPasswordResetEmail(auth, safeEmail, {
        url: `${window.location.origin}/giris`,
        handleCodeInApp: false
      });
      setMessage(copy.forgotSent);
    } catch (error) {
      setMessage(normalizeError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-surface">
      <div className="segmented" role="tablist" aria-label="Giriş modu">
        <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")} role="tab" aria-selected={mode === "login"}>{copy.tabLogin}</button>
        <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")} role="tab" aria-selected={mode === "register"}>{copy.tabRegister}</button>
      </div>
      <label>
        {copy.email}
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder={copy.emailPlaceholder} type="email" autoComplete="email" />
      </label>
      <label>
        {copy.password}
        <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder={copy.passwordPlaceholder} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} />
      </label>
      {mode === "register" && (
        <div className="account-type" aria-label="Hesap tipi">
          <span>{copy.accountType}</span>
          <div className="account-type-grid">
            {accountTypes[locale].map((type) => (
              <button
                key={type.role}
                type="button"
                className={requestedRole === type.role ? "active" : ""}
                aria-pressed={requestedRole === type.role}
                onClick={() => setRequestedRole(type.role)}
              >
                <strong>{type.title}</strong>
                <small>{type.text}</small>
              </button>
            ))}
          </div>
          <p className="meta">{copy.profileHint}</p>
        </div>
      )}
      <div className="hero-actions" aria-label="Giriş aksiyonları">
        <button className="primary" disabled={busy || !email || password.length < 6} onClick={submitEmail}>
          <Mail size={18} />
          <span>{mode === "login" ? copy.emailLogin : copy.register}</span>
        </button>
        <button className="secondary" disabled={busy} onClick={() => submitProvider("google")}>
          <GoogleLogo size={18} />
          <span>{copy.google}</span>
        </button>
        <button className="secondary" disabled={busy} onClick={() => submitProvider("apple")}>
          <AppleLogo size={18} />
          <span>{copy.apple}</span>
        </button>
      </div>
      <button className="link-button" disabled={busy || !email.trim()} onClick={resetPassword}>{copy.forgot}</button>
      <p className="meta" aria-live="polite">{message}</p>
    </div>
  );
}
