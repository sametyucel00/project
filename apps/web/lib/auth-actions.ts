import { callable } from "./functions";
import type { UserRole } from "@nar/core";
import { auth, db } from "./firebase";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

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
    const role: Exclude<UserRole, "admin"> = requestedRole && allowedSelfServiceRoles.includes(requestedRole)
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

    const existingRole = String(existing.data()?.role ?? "individual") as UserRole;
    return { data: { id: user.uid, created: false, role: existingRole } };
  }
}
