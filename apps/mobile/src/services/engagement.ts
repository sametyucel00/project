import { type FavoriteEntityType, type NarOrder, type PushPreferences, type QrTransaction, type ReminderEntityType } from "@nar/core";
import { collection, deleteDoc, doc, getDocs, limit, orderBy, query, runTransaction, serverTimestamp, setDoc, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions } from "../firebase";

export interface QrTransactionInput {
  userId: string;
  placeId: string;
  offerId?: string | null;
  pointsDelta: number;
  scanId?: string;
  note?: string;
}

export interface ReminderInput {
  entityType: ReminderEntityType;
  entityId: string;
  remindAt: string;
  channel?: "push" | "email";
}

const useQrTransactionCallable = httpsCallable<QrTransactionInput, { ok: boolean; transactionId: string; type: string; balanceAfter: number }>(functions, "useQrTransaction");
const toggleFavoriteCallable = httpsCallable<{ entityType: FavoriteEntityType; entityId: string }, { active: boolean }>(functions, "toggleFavorite");
const scheduleReminderCallable = httpsCallable<ReminderInput, { id: string }>(functions, "scheduleReminder");
const updatePushPreferencesCallable = httpsCallable<{ preferences: PushPreferences }, { ok: boolean }>(functions, "updatePushPreferences");
const saveFcmTokenCallable = httpsCallable<{ token: string; platform: "ios" | "android"; locale?: string }, { ok: boolean }>(functions, "saveFcmToken");
const redeemOfferCallable = httpsCallable<
  { offerId: string; offerTitle: string; businessId: string; placeId: string; amountLabel?: string },
  { id: string }
>(functions, "redeemOffer");
const createTicketOrderCallable = httpsCallable<{ eventId: string; eventTitle: string; ticketUrl?: string }, { id: string }>(functions, "createTicketOrder");
const completeUserTaskCallable = httpsCallable<{ taskId: string; rewardPoints: number; badgeId?: string }, { ok: boolean }>(functions, "completeUserTask");
const resetCurrentUserScanHistoryCallable = httpsCallable<undefined, { ok: boolean; deletedCount: number }>(functions, "resetCurrentUserScanHistory");

export async function useQrTransaction(input: QrTransactionInput) {
  const result = await useQrTransactionCallable(input);
  return result.data;
}

export async function toggleFavorite(entityType: FavoriteEntityType, entityId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error("Oturum bulunamadı.");
  }

  const favoriteId = `${entityType}_${entityId}`;
  const favoriteRef = doc(db, "users", uid, "favorites", favoriteId);
  let active = false;

  await runTransaction(db, async (tx) => {
    const favorite = await tx.get(favoriteRef);
    if (favorite.exists()) {
      tx.delete(favoriteRef);
      active = false;
    } else {
      tx.set(favoriteRef, {
        id: favoriteId,
        userId: uid,
        entityType,
        entityId,
        createdAt: serverTimestamp()
      });
      active = true;
    }
  });

  return { active };
}

export async function scheduleReminder(input: ReminderInput) {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error("Oturum bulunamadı.");
  }

  const reminderRef = doc(collection(db, "users", uid, "reminders"));
  await setDoc(reminderRef, {
    id: reminderRef.id,
    userId: uid,
    entityType: input.entityType,
    entityId: input.entityId,
    remindAt: input.remindAt,
    channel: input.channel ?? "push",
    status: "scheduled",
    createdAt: serverTimestamp()
  });

  return { id: reminderRef.id };
}

export async function updatePushPreferences(preferences: PushPreferences) {
  const result = await updatePushPreferencesCallable({ preferences });
  return result.data;
}

export async function saveFcmToken(token: string, platform: "ios" | "android", locale = "tr") {
  const result = await saveFcmTokenCallable({ token, platform, locale });
  return result.data;
}

export async function redeemOffer(input: { offerId: string; offerTitle: string; businessId: string; placeId: string; amountLabel?: string }) {
  const result = await redeemOfferCallable(input);
  return result.data;
}

export async function createTicketOrder(input: { eventId: string; eventTitle: string; ticketUrl?: string }) {
  const result = await createTicketOrderCallable(input);
  return result.data;
}

export async function completeUserTask(input: { taskId: string; rewardPoints: number; badgeId?: string }) {
  const result = await completeUserTaskCallable(input);
  return result.data;
}

export async function resetCurrentUserScanHistory() {
  try {
    const result = await resetCurrentUserScanHistoryCallable();
    return result.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("not-found") || message.includes("functions/not-found")) {
      return { ok: true, deletedCount: 0 };
    }
    throw error;
  }
}

export async function fetchUserQrTransactions(userId: string, limitCount = 20) {
  const snapshot = await getDocs(query(
    collection(db, "qrTransactions"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  ));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as QrTransaction);
}

export async function fetchUserOrders(userId: string, limitCount = 20) {
  const snapshot = await getDocs(query(
    collection(db, "orders"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  ));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as NarOrder);
}
