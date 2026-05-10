import { callable } from "./functions";
import type { UserRole } from "@nar/core";
import { auth, db } from "./firebase";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

export function resolveBootstrapRoleByEmail(email?: string | null) {
  const normalized = String(email ?? "").trim().toLowerCase();
  if (normalized === "admin.test@narrehberi.com" || normalized === "master@narrehberi.com") return "admin" as const;
  if (normalized === "business.test@narrehberi.com") return "business" as const;
  if (normalized === "theater.test@narrehberi.com") return "theater" as const;
  return null;
}

export async function ensureUserProfile(requestedRole?: Exclude<UserRole, "admin">) {
  const call = callable<{ requestedRole?: Exclude<UserRole, "admin"> }, { id: string; created: boolean; role: UserRole }>("ensureUserProfile");
  const shouldUseCallable =
    typeof window === "undefined"
      ? true
      : !["localhost", "127.0.0.1"].includes(window.location.hostname);

  try {
    if (shouldUseCallable) {
      return await call(requestedRole ? { requestedRole } : {});
    }
    throw new Error("local-fallback");
  } catch {
    const user = auth.currentUser;
    if (!user) throw new Error("Kullanıcı oturumu bulunamadı.");

    const allowedSelfServiceRoles: Array<Exclude<UserRole, "admin">> = ["individual", "business", "theater"];
    const bootstrapRole = resolveBootstrapRoleByEmail(user.email);
    const role: UserRole = bootstrapRole
      ? bootstrapRole
      : requestedRole && allowedSelfServiceRoles.includes(requestedRole)
        ? requestedRole
        : "individual";
    const userRef = doc(db, "users", user.uid);
    const existing = await getDoc(userRef);

    if (!existing.exists()) {
      await setDoc(userRef, {
        id: user.uid,
        role,
        displayName: user.displayName ?? "Nar kullanıcısı",
        email: user.email ?? "",
        city: "Antalya",
        preferredLocale: "tr",
        points: 500,
        qrCodeId: `nar-${user.uid}`,
        favoritePlaceIds: [],
        favoriteEventIds: [],
        badges: [],
        notificationPreferences: {
          offers: true,
          events: true,
          theater: true,
          reminders: true
        },
        createdAt: serverTimestamp()
      }, { merge: true });
      return { data: { id: user.uid, created: true, role } };
    }

    const existingData = existing.data() ?? {};
    if (bootstrapRole && existingData.role !== bootstrapRole) {
      await setDoc(userRef, {
        role: bootstrapRole,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return { data: { id: user.uid, created: false, role: bootstrapRole } };
    }

    const existingRole = String(existingData.role ?? "individual") as UserRole;
    return { data: { id: user.uid, created: false, role: existingRole } };
  }
}
