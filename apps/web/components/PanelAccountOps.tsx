"use client";

import { auth, db } from "@/lib/firebase";
import { type UserRole } from "@nar/core";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { signOut, updateProfile } from "firebase/auth";
import { LogOut, Save, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocale } from "./LocaleProvider";

const accountCopy = {
  tr: {
    loading: "Profil bilgileri yükleniyor.",
    loginRequired: "Profil bilgilerini düzenlemek için giriş yapmalısın.",
    ready: "Profil bilgileri hazır.",
    loadFailed: "Profil bilgileri yüklenemedi.",
    updateRequired: "Profil bilgilerini güncellemek için giriş yapmalısın.",
    updating: "Profil bilgileri güncelleniyor.",
    updated: "Profil bilgileri güncellendi.",
    updateFailed: "Profil bilgileri güncellenemedi.",
    signingOut: "Oturum kapatılıyor.",
    signOutFailed: "Oturum kapatılamadı.",
    title: "Ayarlar ve Profil",
    body: "Profil bilgilerini güncelleyebilir, şehir tercihini düzenleyebilir ve oturumunu güvenli şekilde kapatabilirsin.",
    name: "Ad soyad",
    email: "E-posta",
    city: "Şehir",
    save: "Bilgileri güncelle",
    signOut: "Oturumu kapat"
  },
  en: {
    loading: "Loading profile details.",
    loginRequired: "You need to sign in to edit profile details.",
    ready: "Profile details are ready.",
    loadFailed: "Profile details could not be loaded.",
    updateRequired: "You need to sign in to update profile details.",
    updating: "Updating profile details.",
    updated: "Profile details updated.",
    updateFailed: "Profile details could not be updated.",
    signingOut: "Signing out.",
    signOutFailed: "Sign out could not be completed.",
    title: "Settings and Profile",
    body: "You can update your profile, adjust your city preference and sign out securely.",
    name: "Full name",
    email: "E-mail",
    city: "City",
    save: "Update info",
    signOut: "Sign out"
  },
  ru: {
    loading: "Загрузка профиля.",
    loginRequired: "Чтобы редактировать профиль, нужно войти.",
    ready: "Данные профиля готовы.",
    loadFailed: "Не удалось загрузить профиль.",
    updateRequired: "Чтобы обновить профиль, нужно войти.",
    updating: "Обновление профиля.",
    updated: "Профиль обновлен.",
    updateFailed: "Не удалось обновить профиль.",
    signingOut: "Выход из аккаунта.",
    signOutFailed: "Не удалось выйти из аккаунта.",
    title: "Настройки и профиль",
    body: "Можно обновить профиль, город и безопасно выйти из аккаунта.",
    name: "Имя и фамилия",
    email: "E-mail",
    city: "Город",
    save: "Обновить данные",
    signOut: "Выйти"
  },
  de: {
    loading: "Profildaten werden geladen.",
    loginRequired: "Zum Bearbeiten der Profildaten musst du angemeldet sein.",
    ready: "Profildaten sind bereit.",
    loadFailed: "Profildaten konnten nicht geladen werden.",
    updateRequired: "Zum Aktualisieren der Profildaten musst du angemeldet sein.",
    updating: "Profildaten werden aktualisiert.",
    updated: "Profildaten aktualisiert.",
    updateFailed: "Profildaten konnten nicht aktualisiert werden.",
    signingOut: "Abmeldung läuft.",
    signOutFailed: "Abmeldung konnte nicht abgeschlossen werden.",
    title: "Einstellungen und Profil",
    body: "Du kannst dein Profil aktualisieren, die Stadt anpassen und dich sicher abmelden.",
    name: "Vor- und Nachname",
    email: "E-Mail",
    city: "Stadt",
    save: "Daten aktualisieren",
    signOut: "Abmelden"
  }
} as const;

export function PanelAccountOps({ role }: { role: UserRole }) {
  const { locale } = useLocale();
  const copy = accountCopy[locale];
  const [displayName, setDisplayName] = useState("");
  const [city, setCity] = useState("Antalya");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string>(copy.loading);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const user = auth.currentUser;
      if (!user) {
        setStatus(copy.loginRequired);
        return;
      }

      setEmail(user.email ?? "");
      setDisplayName(user.displayName ?? "");
      try {
        const profile = await getDoc(doc(db, "users", user.uid));
        if (!active) return;
        const data = profile.data();
        setDisplayName(String(data?.displayName ?? user.displayName ?? ""));
        setCity(String(data?.city ?? "Antalya"));
        setStatus(copy.ready);
      } catch (error) {
        if (!active) return;
        setStatus(error instanceof Error ? error.message : copy.loadFailed);
      }
    }

    void loadProfile();
    return () => {
      active = false;
    };
  }, []);

  async function saveProfile() {
    const user = auth.currentUser;
    if (!user) {
      setStatus(copy.updateRequired);
      return;
    }

    setStatus(copy.updating);
    try {
      await updateProfile(user, { displayName: displayName.trim() || undefined });
      await setDoc(doc(db, "users", user.uid), {
        displayName: displayName.trim() || "Belirtilmemiş",
        email: user.email ?? email,
        city: city.trim() || "Antalya",
        role,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setStatus(copy.updated);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : copy.updateFailed);
    }
  }

  async function logout() {
    setStatus(copy.signingOut);
    try {
      await signOut(auth);
      window.location.href = "/giris";
    } catch (error) {
      setStatus(error instanceof Error ? error.message : copy.signOutFailed);
    }
  }

  return (
    <section className="admin-ops" id="settings" aria-label="Panel ayarları">
      <div className="ops-block">
        <UserRound size={22} />
        <h2>{copy.title}</h2>
        <p>{copy.body}</p>
        <div className="mini-form">
          <label>
            {copy.name}
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder={copy.name} />
          </label>
          <label>
            {copy.email}
            <input value={email || "Belirtilmemiş"} readOnly />
          </label>
          <label>
            {copy.city}
            <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Antalya" />
          </label>
          <div className="hero-actions">
            <button className="secondary" onClick={saveProfile}><Save size={17} /> {copy.save}</button>
            <button className="secondary" onClick={logout}><LogOut size={17} /> {copy.signOut}</button>
          </div>
          <p className="meta" aria-live="polite">{status}</p>
        </div>
      </div>
    </section>
  );
}
