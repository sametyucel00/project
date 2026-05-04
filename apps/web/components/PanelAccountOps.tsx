"use client";

import { auth, db } from "@/lib/firebase";
import { type UserRole } from "@nar/core";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { signOut, updateProfile } from "firebase/auth";
import { LogOut, Save, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

export function PanelAccountOps({ role }: { role: UserRole }) {
  const [displayName, setDisplayName] = useState("");
  const [city, setCity] = useState("Antalya");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("Profil bilgileri yükleniyor.");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const user = auth.currentUser;
      if (!user) {
        setStatus("Profil bilgilerini düzenlemek için giriş yapmalısın.");
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
        setStatus("Profil bilgileri hazır.");
      } catch (error) {
        if (!active) return;
        setStatus(error instanceof Error ? error.message : "Profil bilgileri yüklenemedi.");
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
      setStatus("Profil bilgilerini güncellemek için giriş yapmalısın.");
      return;
    }

    setStatus("Profil bilgileri güncelleniyor.");
    try {
      await updateProfile(user, { displayName: displayName.trim() || undefined });
      await setDoc(doc(db, "users", user.uid), {
        displayName: displayName.trim() || "Belirtilmemiş",
        email: user.email ?? email,
        city: city.trim() || "Antalya",
        role,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setStatus("Profil bilgileri güncellendi.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Profil bilgileri güncellenemedi.");
    }
  }

  async function logout() {
    setStatus("Oturum kapatılıyor.");
    try {
      await signOut(auth);
      window.location.href = "/giris";
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Oturum kapatılamadı.");
    }
  }

  return (
    <section className="admin-ops" id="settings" aria-label="Panel ayarları">
      <div className="ops-block">
        <UserRound size={22} />
        <h2>Ayarlar ve Profil</h2>
        <p>Profil bilgilerini güncelleyebilir, şehir tercihini düzenleyebilir ve oturumunu güvenli şekilde kapatabilirsin.</p>
        <div className="mini-form">
          <label>
            Ad soyad
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Ad soyad" />
          </label>
          <label>
            E-posta
            <input value={email || "Belirtilmemiş"} readOnly />
          </label>
          <label>
            Şehir
            <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Antalya" />
          </label>
          <div className="hero-actions">
            <button className="secondary" onClick={saveProfile}><Save size={17} /> Bilgileri güncelle</button>
            <button className="secondary" onClick={logout}><LogOut size={17} /> Oturumu kapat</button>
          </div>
          <p className="meta" aria-live="polite">{status}</p>
        </div>
      </div>
    </section>
  );
}
