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
import { useState } from "react";

type AuthMode = "login" | "register";
type SelfServiceRole = Exclude<UserRole, "admin">;

const accountTypes: Array<{ role: SelfServiceRole; title: string; text: string }> = [
  { role: "individual", title: "Bireysel", text: "Puan, QR, favoriler ve etkinlik hatırlatıcıları." },
  { role: "business", title: "İşletme", text: "Mekan, kampanya ve QR sadakat yönetimi." },
  { role: "theater", title: "Tiyatro", text: "Oyun, bilet bağlantısı, kadro ve duyuru yönetimi." }
];

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
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [requestedRole, setRequestedRole] = useState<SelfServiceRole>("individual");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("Hesabın, seçtiğin kullanım tipine göre açılır.");
  const [busy, setBusy] = useState(false);

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
    setMessage("Bilgiler kontrol ediliyor.");
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
    setMessage(`${provider === "google" ? "Google" : "Apple"} ile devam ediliyor.`);
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
      setMessage("Şifre sıfırlama için e-posta adresini yaz.");
      return;
    }
    if (!safeEmail.includes("@")) {
      setMessage("Geçerli bir e-posta adresi yaz.");
      return;
    }
    setBusy(true);
    setMessage("Şifre sıfırlama bağlantısı hazırlanıyor.");
    try {
      await sendPasswordResetEmail(auth, safeEmail, {
        url: `${window.location.origin}/giris`,
        handleCodeInApp: false
      });
      setMessage("Şifre sıfırlama bağlantısı e-posta adresine gönderildi.");
    } catch (error) {
      setMessage(normalizeError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-surface">
      <div className="segmented" role="tablist" aria-label="Giriş modu">
        <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")} role="tab" aria-selected={mode === "login"}>Giriş</button>
        <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")} role="tab" aria-selected={mode === "register"}>Üyelik</button>
      </div>
      <label>
        E-Posta
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ornek@narrehberi.com" type="email" autoComplete="email" />
      </label>
      <label>
        Şifre
        <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="En az 6 karakter" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} />
      </label>
      {mode === "register" && (
        <div className="account-type" aria-label="Hesap tipi">
          <span>Hesap tipini seç</span>
          <div className="account-type-grid">
            {accountTypes.map((type) => (
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
          <p className="meta">Admin hesapları güvenlik nedeniyle yalnızca mevcut yönetici tarafından atanır.</p>
        </div>
      )}
      <div className="hero-actions" aria-label="Giriş aksiyonları">
        <button className="primary" disabled={busy || !email || password.length < 6} onClick={submitEmail}>
          <Mail size={18} />
          <span>{mode === "login" ? "E-posta ile giriş" : "Üyelik oluştur"}</span>
        </button>
        <button className="secondary" disabled={busy} onClick={() => submitProvider("google")}>
          <GoogleLogo size={18} />
          <span>Google</span>
        </button>
        <button className="secondary" disabled={busy} onClick={() => submitProvider("apple")}>
          <AppleLogo size={18} />
          <span>Apple</span>
        </button>
      </div>
      <button className="link-button" disabled={busy || !email.trim()} onClick={resetPassword}>Şifremi sıfırla</button>
      <p className="meta" aria-live="polite">{message}</p>
    </div>
  );
}
