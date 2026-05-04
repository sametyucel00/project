import { defaultPushPreferences, defaultUserPoints, type Locale, type UserRole } from "@nar/core";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User
} from "firebase/auth";
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type DocumentSnapshot,
  type FirestoreError
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions } from "../firebase";
import { normalizeLocale, normalizeThemeMode, type MobileUserPreferences } from "./preferences";

export type MobileTab = "Ana Sayfa" | "Mekanlar" | "Etkinlikler" | "Fırsatlar" | "Profil";

export interface MobileSession {
  uid: string;
  email: string;
  displayName: string;
  isAnonymous: boolean;
  role: UserRole;
  city: string;
  preferredLocale: Locale;
  themeMode: "light" | "dark" | "system";
  notificationPreferences: MobileUserPreferences["notificationPreferences"];
  points: number;
  nextTab: MobileTab;
}

export interface GoogleTokenInput {
  idToken: string;
  accessToken?: string;
}

export interface AppleTokenInput {
  identityToken: string;
  rawNonce?: string;
}

export type SelfServiceRole = Exclude<UserRole, "admin">;

const roleTabs: Record<UserRole, MobileTab> = {
  individual: "Ana Sayfa",
  business: "Mekanlar",
  theater: "Etkinlikler",
  admin: "Profil"
};

export function resolveRoleTab(role: UserRole): MobileTab {
  return roleTabs[role] ?? "Ana Sayfa";
}

function toSession(user: User, data: Record<string, unknown>): MobileSession {
  const role = (data.role ?? "individual") as UserRole;
  return {
    uid: user.uid,
    email: typeof data.email === "string" ? data.email : user.email ?? "",
    displayName: typeof data.displayName === "string" ? data.displayName : user.displayName ?? "Nar kullanıcısı",
    isAnonymous: user.isAnonymous,
    role,
    city: typeof data.city === "string" ? data.city : "Antalya",
    preferredLocale: normalizeLocale(typeof data.preferredLocale === "string" ? data.preferredLocale : null),
    themeMode: normalizeThemeMode(typeof data.themeMode === "string" ? data.themeMode : null),
    notificationPreferences: {
      ...defaultPushPreferences,
      ...(typeof data.notificationPreferences === "object" && data.notificationPreferences ? data.notificationPreferences : {})
    },
    points: typeof data.points === "number" ? data.points : defaultUserPoints,
    nextTab: resolveRoleTab(role)
  };
}

export async function ensureMobileUserProfile(user: User, requestedRole?: SelfServiceRole): Promise<MobileSession> {
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const allowedRoles: SelfServiceRole[] = ["individual", "business", "theater"];
    const role: SelfServiceRole = requestedRole && allowedRoles.includes(requestedRole) ? requestedRole : "individual";
    const preferredLocale: Locale = "tr";
    const profile = {
      id: user.uid,
      role,
      displayName: user.displayName ?? "Nar kullanıcısı",
      email: user.email ?? "",
      city: "Antalya",
      preferredLocale,
      themeMode: "system",
      notificationPreferences: defaultPushPreferences,
      points: defaultUserPoints,
      qrCodeId: `qr_${user.uid}`,
      favoritePlaceIds: [],
      favoriteEventIds: [],
      badges: [],
      createdAt: new Date().toISOString(),
      updatedAt: serverTimestamp()
    };

    await setDoc(userRef, profile);
    return {
      uid: user.uid,
      email: profile.email,
      displayName: profile.displayName,
      isAnonymous: user.isAnonymous,
      role: profile.role,
      city: profile.city,
      preferredLocale: profile.preferredLocale,
      themeMode: "system",
      notificationPreferences: profile.notificationPreferences,
      points: profile.points,
      nextTab: resolveRoleTab(profile.role)
    };
  }

  return toSession(user, snapshot.data() as Record<string, unknown>);
}

export async function registerWithEmail(email: string, password: string, displayName: string) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName.trim()) await updateProfile(credential.user, { displayName: displayName.trim() });
  return ensureMobileUserProfile(credential.user);
}

export async function registerWithEmailAndRole(email: string, password: string, displayName: string, role: SelfServiceRole) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName.trim()) await updateProfile(credential.user, { displayName: displayName.trim() });
  return ensureMobileUserProfile(credential.user, role);
}

export async function loginWithEmail(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return ensureMobileUserProfile(credential.user);
}

export async function loginAnonymously() {
  const credential = await signInAnonymously(auth);
  return ensureMobileUserProfile(credential.user);
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
  return { ok: true };
}

export async function loginWithGoogleToken(input: GoogleTokenInput | string) {
  const tokenInput = typeof input === "string" ? { idToken: input } : input;
  const credential = GoogleAuthProvider.credential(tokenInput.idToken, tokenInput.accessToken);
  const result = await signInWithCredential(auth, credential);
  return ensureMobileUserProfile(result.user);
}

export async function loginWithGooglePopup() {
  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  return ensureMobileUserProfile(result.user);
}

export async function loginWithAppleToken(input: AppleTokenInput | string) {
  const tokenInput = typeof input === "string" ? { identityToken: input } : input;
  const provider = new OAuthProvider("apple.com");
  const credential = provider.credential({
    idToken: tokenInput.identityToken,
    rawNonce: tokenInput.rawNonce
  });
  const result = await signInWithCredential(auth, credential);
  return ensureMobileUserProfile(result.user);
}

export async function loginWithApplePopup() {
  const result = await signInWithPopup(auth, new OAuthProvider("apple.com"));
  return ensureMobileUserProfile(result.user);
}

export async function logout() {
  await signOut(auth);
}

export async function deleteCurrentAccount() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Aktif bir hesap bulunamadı.");
  }

  const deleteCurrentAccountCallable = httpsCallable<undefined, { ok: boolean }>(functions, "deleteCurrentAccount");
  await deleteCurrentAccountCallable();
  await signOut(auth);
}

export function watchAuthSession(onSession: (session: MobileSession | null) => void, onError?: (error: Error) => void) {
  let unsubscribeProfile: (() => void) | undefined;
  const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
    try {
      unsubscribeProfile?.();
      unsubscribeProfile = undefined;

      if (!user) {
        onSession(null);
        return;
      }

      const current = await ensureMobileUserProfile(user);
      onSession(current);

      const userRef = doc(db, "users", user.uid);
      unsubscribeProfile = onSnapshot(
        userRef,
        (profileSnapshot: DocumentSnapshot) => {
          if (!profileSnapshot.exists()) return;
          onSession(toSession(user, profileSnapshot.data() as Record<string, unknown>));
        },
        (profileError: FirestoreError) => onError?.(profileError instanceof Error ? profileError : new Error("Profil okunamadı."))
      );
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error("Oturum profili okunamadı."));
    }
  });

  return () => {
    unsubscribeProfile?.();
    unsubscribeAuth();
  };
}
