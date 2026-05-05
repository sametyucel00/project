import { defaultPushPreferences, defaultUserPoints, type Locale, type UserRole } from "@nar/core";
import * as AppleAuthentication from "expo-apple-authentication";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
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
  signInWithRedirect,
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
import { Platform } from "react-native";
import { auth, db, functions } from "../firebase";
import { getAppleServiceId, getAuthCallbackBaseUrl, getGoogleWebClientId } from "../runtimeConfig";
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
export const AUTH_REDIRECT_STARTED = Symbol("AUTH_REDIRECT_STARTED");

const roleTabs: Record<UserRole, MobileTab> = {
  individual: "Ana Sayfa",
  business: "Mekanlar",
  theater: "Etkinlikler",
  admin: "Profil"
};

export function resolveRoleTab(role: UserRole): MobileTab {
  return roleTabs[role] ?? "Ana Sayfa";
}

function shouldUseRedirectAuth() {
  if (typeof window === "undefined") return false;
  const coarsePointer = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
  const smallViewport = typeof window.innerWidth === "number" && window.innerWidth < 960;
  return coarsePointer || smallViewport;
}

function isWebEnvironment() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function getGoogleRedirectUri() {
  return AuthSession.makeRedirectUri({
    scheme: "narrehberi",
    path: "auth/google"
  });
}

function getHostedAuthCallbackUrl(provider: "google" | "apple") {
  return `${getAuthCallbackBaseUrl().replace(/\/$/, "")}/auth/${provider}/callback`;
}

function buildGoogleAuthUrl(clientId: string) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getHostedAuthCallbackUrl("google"),
    response_type: "id_token token",
    scope: "openid profile email",
    include_granted_scopes: "true",
    prompt: "select_account"
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

function getAppleRedirectUri() {
  return AuthSession.makeRedirectUri({
    scheme: "narrehberi",
    path: "auth/apple"
  });
}

function buildAppleAuthUrl(serviceId: string) {
  const params = new URLSearchParams({
    client_id: serviceId,
    redirect_uri: getHostedAuthCallbackUrl("apple"),
    response_type: "code id_token",
    response_mode: "fragment",
    scope: "",
    state: "narrehberi-apple"
  });
  return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
}

function buildFallbackSession(user: User, requestedRole?: SelfServiceRole): MobileSession {
  const role: SelfServiceRole = user.isAnonymous ? "individual" : requestedRole ?? "individual";
  return {
    uid: user.uid,
    email: user.email ?? "",
    displayName: user.displayName ?? "Nar kullanıcısı",
    isAnonymous: user.isAnonymous,
    role,
    city: "Antalya",
    preferredLocale: "tr",
    themeMode: "system",
    notificationPreferences: defaultPushPreferences,
    points: user.isAnonymous ? 0 : defaultUserPoints,
    nextTab: resolveRoleTab(role)
  };
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
    points: user.isAnonymous ? 0 : typeof data.points === "number" ? data.points : defaultUserPoints,
    nextTab: resolveRoleTab(role)
  };
}

export async function ensureMobileUserProfile(user: User, requestedRole?: SelfServiceRole): Promise<MobileSession> {
  try {
    const userRef = doc(db, "users", user.uid);
    const snapshot = await getDoc(userRef);
    const storedData = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : null;

    if (snapshot.exists() && !user.isAnonymous) {
      const storedPoints = typeof storedData?.points === "number" ? storedData.points : null;
      const hasSeedMarker = Boolean(storedData?.pointsSeededAt);
      if ((storedPoints === null || storedPoints === 0) && !hasSeedMarker) {
        await setDoc(
          userRef,
          {
            points: defaultUserPoints,
            pointsSeededAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          },
          { merge: true }
        );
        return {
          uid: user.uid,
          email: typeof storedData?.email === "string" ? storedData.email : user.email ?? "",
          displayName: typeof storedData?.displayName === "string" ? storedData.displayName : user.displayName ?? "Nar kullanıcısı",
          isAnonymous: user.isAnonymous,
          role: (storedData?.role ?? "individual") as UserRole,
          city: typeof storedData?.city === "string" ? storedData.city : "Antalya",
          preferredLocale: normalizeLocale(typeof storedData?.preferredLocale === "string" ? storedData.preferredLocale : null),
          themeMode: normalizeThemeMode(typeof storedData?.themeMode === "string" ? storedData.themeMode : null),
          notificationPreferences: {
            ...defaultPushPreferences,
            ...(typeof storedData?.notificationPreferences === "object" && storedData.notificationPreferences ? storedData.notificationPreferences : {})
          },
          points: defaultUserPoints,
          nextTab: resolveRoleTab((storedData?.role ?? "individual") as UserRole)
        };
      }
    }

    if (!snapshot.exists()) {
      const allowedRoles: SelfServiceRole[] = ["individual", "business", "theater"];
      const role: SelfServiceRole = requestedRole && allowedRoles.includes(requestedRole) ? requestedRole : "individual";
      const preferredLocale: Locale = "tr";
      const points = user.isAnonymous ? 0 : defaultUserPoints;
      const profile = {
        id: user.uid,
        role,
        displayName: user.displayName ?? "Nar kullanıcısı",
        email: user.email ?? "",
        city: "Antalya",
        preferredLocale,
        themeMode: "system",
        notificationPreferences: defaultPushPreferences,
        points,
        pointsSeededAt: user.isAnonymous ? null : serverTimestamp(),
        qrCodeId: "qr_" + user.uid,
        favoritePlaceIds: [],
        favoriteEventIds: [],
        favoriteOfferIds: [],
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
  } catch {
    return buildFallbackSession(user, requestedRole);
  }
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
  if (!isWebEnvironment()) {
    const clientId = getGoogleWebClientId();
    if (!clientId) {
      throw new Error("Google girişi için EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID gerekli.");
    }
    const authResult = await WebBrowser.openAuthSessionAsync(buildGoogleAuthUrl(clientId), getGoogleRedirectUri());
    if (authResult.type !== "success") {
      throw new Error("Google girişi iptal edildi.");
    }
    const authUrl = new URL(authResult.url);
    const fragmentParams = new URLSearchParams(authUrl.hash.replace(/^#/, ""));
    const idToken = authUrl.searchParams.get("id_token") ?? fragmentParams.get("id_token") ?? "";
    const accessToken = authUrl.searchParams.get("access_token") ?? fragmentParams.get("access_token") ?? "";
    if (!idToken) {
      throw new Error("Google kimlik bilgisi alınamadı.");
    }
    return loginWithGoogleToken({ idToken, accessToken: accessToken || undefined });
  }
  if (shouldUseRedirectAuth()) {
    await signInWithRedirect(auth, new GoogleAuthProvider());
    return AUTH_REDIRECT_STARTED;
  }
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
  if (!isWebEnvironment()) {
    if (Platform.OS === "ios") {
      const available = await AppleAuthentication.isAvailableAsync();
      if (!available) {
        throw new Error("Bu cihaz Apple ile giriş için uygun değil.");
      }
      const response = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL]
      });
      if (!response.identityToken) {
        throw new Error("Apple kimlik bilgisi alınamadı.");
      }
      return loginWithAppleToken({ identityToken: response.identityToken });
    }
    const serviceId = getAppleServiceId();
    if (!serviceId) {
      throw new Error("Android için Apple girişi yapılandırılmadı. EXPO_PUBLIC_APPLE_SERVICE_ID gerekli.");
    }
    const authResult = await WebBrowser.openAuthSessionAsync(buildAppleAuthUrl(serviceId), getAppleRedirectUri());
    if (authResult.type !== "success") {
      throw new Error("Apple girişi iptal edildi.");
    }
    const authUrl = new URL(authResult.url);
    const fragmentParams = new URLSearchParams(authUrl.hash.replace(/^#/, ""));
    const idToken = authUrl.searchParams.get("id_token") ?? fragmentParams.get("id_token") ?? "";
    if (!idToken) {
      throw new Error("Apple kimlik bilgisi alınamadı.");
    }
    return loginWithAppleToken({ identityToken: idToken });
  }
  if (shouldUseRedirectAuth()) {
    await signInWithRedirect(auth, new OAuthProvider("apple.com"));
    return AUTH_REDIRECT_STARTED;
  }
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
