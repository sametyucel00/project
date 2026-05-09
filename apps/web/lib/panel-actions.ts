import { type AncientGuideStop, type EventItem, type GooglePlaceSnapshot, type ImportKind, type NotificationAudiencePreview, type NotificationTarget, type LocalizedText, type OrderStatus, type PublishStatus, type PushPreferences, type SurvivalKitItem, type UserRole } from "@nar/core";
import { arrayUnion, collection, doc, getDocs, increment, runTransaction, serverTimestamp, setDoc } from "firebase/firestore";
import { callable } from "./functions";
import { auth, db } from "./firebase";

export interface ApprovalDecisionInput {
  approvalId: string;
  decision: "approved" | "rejected";
  note?: string;
  rejectionReason?: string;
}

export interface ApprovalSubmitInput {
  entityType: "place" | "event" | "offer" | "story" | "category";
  entityId: string;
  title: string;
  note?: string;
}

export interface NotificationScheduleInput {
  title: LocalizedText;
  body: LocalizedText;
  target: NotificationTarget;
  scheduledAt: string;
}

export interface NotificationSendInput {
  title: LocalizedText;
  body: LocalizedText;
  target: NotificationTarget;
  tokens?: string[];
}

export interface ImportPreviewInput {
  kind: ImportKind;
  rows: Array<Record<string, unknown>>;
}

export interface ImportCommitInput {
  importId: string;
  kind: ImportKind;
  rows: Array<Record<string, unknown>>;
}

export interface XlsxImportPreviewInput {
  kind: ImportKind;
  workbookBase64: string;
  sheetName?: string;
}

export interface ExportManifestInput {
  kind: ImportKind;
  format: "csv" | "json" | "xlsx";
}

export interface DiscoveryCategoryInput {
  id: string;
  target: "place" | "event";
  title: LocalizedText;
  status: PublishStatus;
  sortOrder?: number;
}

export interface DiscoveryCategoryRecord extends DiscoveryCategoryInput {
  createdAt: string;
  updatedAt: string;
}

export interface TouristSurvivalKitInput extends SurvivalKitItem {
  status?: PublishStatus;
}

export interface AncientGuideStopInput extends AncientGuideStop {
  status?: PublishStatus;
}

export interface TheaterEventDraftInput {
  categoryId?: string;
  title: LocalizedText;
  description: LocalizedText;
  synopsis?: LocalizedText;
  type: EventItem["type"];
  district: string;
  venueName: string;
  startsAt: string;
  endsAt?: string;
  priceType: EventItem["priceType"];
  ticketUrl?: string;
  cast: string[];
  coverImage: string;
  videoUrl?: string;
  status?: EventItem["status"];
  notificationLimit?: number;
}

export interface GooglePlaceSnapshotInput {
  placeId: string;
  snapshot: GooglePlaceSnapshot;
}

export interface TheaterNotificationInput {
  eventId: string;
  title: LocalizedText;
  body: LocalizedText;
}

export interface OfferRedeemInput {
  offerId: string;
  offerTitle: string;
  businessId: string;
  placeId: string;
  amountLabel?: string;
}

export interface OfferCampaignInput {
  placeId: string;
  businessId?: string;
  title: LocalizedText;
  description: LocalizedText;
  discountLabel: string;
  startsAt: string;
  endsAt: string;
  conditions: LocalizedText;
  requiresQr: boolean;
  pointCost?: number;
  storyEnabled?: boolean;
  storyPriority?: number;
  storyImage?: string;
  useLimit?: number;
  featured?: boolean;
  status?: PublishStatus;
}

export interface TicketOrderInput {
  eventId: string;
  eventTitle: string;
  ticketUrl?: string;
}

export interface QrTransactionInput {
  userId: string;
  placeId: string;
  offerId?: string | null;
  pointsDelta: number;
  scanId?: string;
  note?: string;
}

export interface AdminUserSummary {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  city: string;
  points: number;
  disabled: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface AdminDashboardSummary {
  activeUsers: number;
  publishedPlaces: number;
  publishedEvents: number;
  publishedOffers: number;
  qrUsage: number;
  notificationCount: number;
  orderCount: number;
  languageUse: Record<string, number>;
}

function isLocalWeb() {
  return typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);
}

function requireAuthUserId() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Oturum bulunamadı.");
  return uid;
}

export async function scheduleNotification(input: NotificationScheduleInput) {
  if (isLocalWeb()) {
    const id = doc(collection(db, "notifications")).id;
    await setDoc(doc(db, "notifications", id), {
      id,
      ...input,
      status: "scheduled",
      createdBy: requireAuthUserId(),
      createdAt: serverTimestamp()
    }, { merge: true });
    return { data: { id } };
  }
  const call = callable<NotificationScheduleInput, { id: string }>("scheduleNotification");
  return call(input);
}

export async function sendNotification(input: NotificationSendInput) {
  if (isLocalWeb()) {
    const id = doc(collection(db, "notifications")).id;
    await setDoc(doc(db, "notifications", id), {
      id,
      ...input,
      status: "sent",
      sentAt: serverTimestamp(),
      createdBy: requireAuthUserId()
    }, { merge: true });
    return { data: { id, deliveryCount: 0 } };
  }
  const call = callable<NotificationSendInput, { id: string; deliveryCount?: number }>("sendNotification");
  return call(input);
}

export async function estimateNotificationAudience(input: { target: NotificationTarget }) {
  if (isLocalWeb()) {
    return { data: { target: input.target, estimatedUsers: 0, estimatedTokens: 0, detail: "Yerel önizleme" } };
  }
  const call = callable<{ target: NotificationTarget }, NotificationAudiencePreview>("estimateNotificationAudience");
  return call(input);
}

export async function saveFcmToken(input: { token: string; platform: "web"; locale?: string }) {
  if (isLocalWeb()) {
    const uid = requireAuthUserId();
    await setDoc(doc(db, `users/${uid}/fcmTokens/${input.token}`), {
      token: input.token,
      platform: input.platform,
      locale: input.locale ?? "tr",
      updatedAt: serverTimestamp()
    }, { merge: true });
    return { data: { ok: true } };
  }
  const call = callable<{ token: string; platform: "web"; locale?: string }, { ok: boolean }>("saveFcmToken");
  return call(input);
}

export async function markNotificationOpened(input: { notificationId: string; deliveryId?: string }) {
  if (isLocalWeb()) {
    const uid = requireAuthUserId();
    const deliveryId = input.deliveryId || uid;
    await setDoc(doc(db, `notifications/${input.notificationId}/deliveries/${deliveryId}`), {
      id: deliveryId,
      notificationId: input.notificationId,
      userId: uid,
      status: "opened",
      openedAt: serverTimestamp()
    }, { merge: true });
    return { data: { ok: true } };
  }
  const call = callable<{ notificationId: string; deliveryId?: string }, { ok: boolean }>("markNotificationOpened");
  return call(input);
}

export async function updatePushPreferences(input: { preferences: PushPreferences }) {
  const isLocal = typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);
  if (isLocal) {
    const user = auth.currentUser;
    if (!user) throw new Error("Oturum bulunamadı.");
    await setDoc(doc(db, "users", user.uid), {
      notificationPreferences: input.preferences,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return { data: { ok: true } };
  }
  const call = callable<{ preferences: PushPreferences }, { ok: boolean }>("updatePushPreferences");
  return call(input);
}

export async function previewImport(input: ImportPreviewInput) {
  const call = callable<ImportPreviewInput, { id: string; errors: Array<{ row: number; message: string }> }>("previewImport");
  return call(input);
}

export async function commitImport(input: ImportCommitInput) {
  const call = callable<ImportCommitInput, { count: number }>("commitImport");
  return call(input);
}

export async function previewXlsxImport(input: XlsxImportPreviewInput) {
  const call = callable<XlsxImportPreviewInput, { id: string; rows: Array<Record<string, unknown>>; errors: Array<{ row: number; message: string }> }>("previewXlsxImport");
  return call(input);
}

export async function createExportManifest(input: ExportManifestInput) {
  const call = callable<ExportManifestInput, { id: string }>("createExportManifest");
  return call(input);
}

export async function saveDiscoveryCategory(input: DiscoveryCategoryInput) {
  const now = new Date().toISOString();
  const categoryRef = doc(db, "categories", input.id);
  const payload: DiscoveryCategoryRecord = {
    ...input,
    sortOrder: input.sortOrder ?? 0,
    createdAt: now,
    updatedAt: now
  };
  await setDoc(categoryRef, payload, { merge: true });
  return { data: payload };
}

export async function listDiscoveryCategories() {
  const snapshot = await getDocs(collection(db, "categories"));
  const categories = snapshot.docs
    .map((entry) => entry.data() as DiscoveryCategoryRecord)
    .sort((first, second) => {
      if (first.target !== second.target) return first.target.localeCompare(second.target);
      return (first.sortOrder ?? 0) - (second.sortOrder ?? 0) || first.title.tr.localeCompare(second.title.tr, "tr-TR");
    });
  return { data: { categories } };
}

export async function saveTouristSurvivalKitItem(input: TouristSurvivalKitInput) {
  if (isLocalWeb()) {
    await setDoc(doc(db, "touristSurvivalKit", input.id), {
      ...input,
      updatedAt: serverTimestamp(),
      updatedBy: requireAuthUserId()
    }, { merge: true });
    return { data: { id: input.id, status: input.status ?? "draft" } };
  }
  const call = callable<TouristSurvivalKitInput, { id: string; status: PublishStatus }>("saveTouristSurvivalKitItem");
  return call(input);
}

export async function saveAncientGuideStop(input: AncientGuideStopInput) {
  if (isLocalWeb()) {
    await setDoc(doc(db, "ancientGuideStops", input.id), {
      ...input,
      updatedAt: serverTimestamp(),
      updatedBy: requireAuthUserId()
    }, { merge: true });
    return { data: { id: input.id, status: input.status ?? "draft" } };
  }
  const call = callable<AncientGuideStopInput, { id: string; status: PublishStatus }>("saveAncientGuideStop");
  return call(input);
}

export async function submitForApproval(input: ApprovalSubmitInput) {
  if (isLocalWeb()) {
    const id = doc(collection(db, "approvalQueue")).id;
    await setDoc(doc(db, "approvalQueue", id), {
      id,
      ...input,
      ownerId: requireAuthUserId(),
      status: "pendingReview",
      submittedAt: serverTimestamp()
    }, { merge: true });
    return { data: { id } };
  }
  const call = callable<ApprovalSubmitInput, { id: string }>("submitForApproval");
  return call(input);
}

export async function reviewApproval(input: ApprovalDecisionInput) {
  if (isLocalWeb()) {
    await setDoc(doc(db, "approvalQueue", input.approvalId), {
      status: input.decision,
      note: input.note ?? "",
      rejectionReason: input.decision === "rejected" ? (input.rejectionReason ?? input.note ?? "") : null,
      reviewedAt: serverTimestamp(),
      reviewerId: requireAuthUserId()
    }, { merge: true });
    return { data: { ok: true } };
  }
  const call = callable<ApprovalDecisionInput, { ok: boolean }>("reviewApproval");
  return call(input);
}

export async function completeUserTask(input: { taskId: string; rewardPoints: number; badgeId?: string }) {
  const isLocal = typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);
  if (isLocal) {
    const user = auth.currentUser;
    if (!user) throw new Error("Oturum bulunamadı.");
    await runTransaction(db, async (tx) => {
      const userRef = doc(db, "users", user.uid);
      const completionRef = doc(db, `users/${user.uid}/taskCompletions/${input.taskId}`);
      const completion = await tx.get(completionRef);
      if (completion.exists()) return;
      tx.set(completionRef, {
        id: input.taskId,
        rewardPoints: input.rewardPoints,
        badgeId: input.badgeId ?? null,
        completedAt: serverTimestamp()
      }, { merge: true });
      const userPatch: Record<string, unknown> = {
        points: increment(input.rewardPoints),
        updatedAt: serverTimestamp()
      };
      if (input.badgeId) userPatch.badges = arrayUnion(input.badgeId);
      tx.set(userRef, userPatch, { merge: true });
    });
    return { data: { ok: true } };
  }
  const call = callable<{ taskId: string; rewardPoints: number; badgeId?: string }, { ok: boolean }>("completeUserTask");
  return call(input);
}

export async function translateSynopsisDraft(synopsisTr: string) {
  if (isLocalWeb()) {
    return { data: { synopsis: { tr: synopsisTr, en: synopsisTr, ru: synopsisTr, de: synopsisTr } } };
  }
  const call = callable<{ synopsisTr: string }, { synopsis: LocalizedText }>("translateSynopsisDraft");
  return call({ synopsisTr });
}

export async function createTheaterEvent(input: TheaterEventDraftInput) {
  if (isLocalWeb()) {
    const id = doc(collection(db, "events")).id;
    await setDoc(doc(db, "events", id), {
      id,
      ...input,
      categoryId: input.categoryId ?? input.type,
      organizerId: requireAuthUserId(),
      notificationLimit: input.notificationLimit ?? 3,
      notificationUsed: 0,
      createdAt: serverTimestamp()
    }, { merge: true });
    return { data: { id } };
  }
  const call = callable<TheaterEventDraftInput, { id: string }>("createTheaterEvent");
  return call(input);
}

export async function sendTheaterEventNotification(input: TheaterNotificationInput) {
  if (isLocalWeb()) {
    const id = doc(collection(db, "notifications")).id;
    await setDoc(doc(db, "notifications", id), {
      id,
      title: input.title,
      body: input.body,
      target: { kind: "event", eventId: input.eventId },
      status: "sent",
      sentAt: serverTimestamp(),
      createdBy: requireAuthUserId()
    }, { merge: true });
    return { data: { id } };
  }
  const call = callable<TheaterNotificationInput, { id: string }>("sendTheaterEventNotification");
  return call(input);
}

export async function adjustTheaterNotificationLimit(input: { eventId: string; notificationLimit: number }) {
  if (isLocalWeb()) {
    await setDoc(doc(db, "events", input.eventId), {
      notificationLimit: input.notificationLimit,
      updatedAt: serverTimestamp(),
      updatedBy: requireAuthUserId()
    }, { merge: true });
    return { data: { ok: true, eventId: input.eventId, notificationLimit: input.notificationLimit } };
  }
  const call = callable<{ eventId: string; notificationLimit: number }, { ok: boolean; eventId: string; notificationLimit: number }>("adjustTheaterNotificationLimit");
  return call(input);
}

export async function saveGooglePlaceSnapshot(input: GooglePlaceSnapshotInput) {
  if (isLocalWeb()) {
    await setDoc(doc(db, "places", input.placeId), {
      googlePlaceId: input.snapshot.googlePlaceId,
      phone: input.snapshot.phone ?? null,
      website: input.snapshot.website ?? null,
      googleRating: input.snapshot.rating ?? null,
      googleReviewCount: input.snapshot.reviewCount ?? null,
      openingHours: input.snapshot.openingHours ?? [],
      gallery: input.snapshot.photoRefs ?? [],
      updatedAt: serverTimestamp()
    }, { merge: true });
    return { data: { ok: true } };
  }
  const call = callable<GooglePlaceSnapshotInput, { ok: boolean }>("saveGooglePlaceSnapshot");
  return call(input);
}

export async function redeemOffer(input: OfferRedeemInput) {
  if (isLocalWeb()) {
    const id = doc(collection(db, "orders")).id;
    await setDoc(doc(db, "orders", id), {
      id,
      userId: requireAuthUserId(),
      type: "offer",
      status: "used",
      entityId: input.offerId,
      entityTitle: input.offerTitle,
      businessId: input.businessId,
      placeId: input.placeId,
      amountLabel: input.amountLabel ?? "QR",
      createdAt: serverTimestamp(),
      usedAt: serverTimestamp()
    }, { merge: true });
    return { data: { id } };
  }
  const call = callable<OfferRedeemInput, { id: string }>("redeemOffer");
  return call(input);
}

export async function createOfferCampaign(input: OfferCampaignInput) {
  if (isLocalWeb()) {
    const id = doc(collection(db, "offers")).id;
    await setDoc(doc(db, "offers", id), {
      id,
      ...input,
      businessId: input.businessId ?? requireAuthUserId(),
      status: input.status ?? "draft",
      createdAt: serverTimestamp()
    }, { merge: true });
    return { data: { id } };
  }
  const call = callable<OfferCampaignInput, { id: string }>("createOfferCampaign");
  return call(input);
}

export async function updateOfferStatus(input: { offerId: string; status: PublishStatus }) {
  if (isLocalWeb()) {
    await setDoc(doc(db, "offers", input.offerId), {
      status: input.status,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return { data: { ok: true, offerId: input.offerId, status: input.status } };
  }
  const call = callable<{ offerId: string; status: PublishStatus }, { ok: boolean; offerId: string; status: PublishStatus }>("updateOfferStatus");
  return call(input);
}

export async function createTicketOrder(input: TicketOrderInput) {
  if (isLocalWeb()) {
    const id = doc(collection(db, "orders")).id;
    await setDoc(doc(db, "orders", id), {
      id,
      userId: requireAuthUserId(),
      type: "ticket",
      status: "pending",
      entityId: input.eventId,
      entityTitle: input.eventTitle,
      ticketUrl: input.ticketUrl ?? null,
      amountLabel: "Bilet",
      createdAt: serverTimestamp()
    }, { merge: true });
    return { data: { id } };
  }
  const call = callable<TicketOrderInput, { id: string }>("createTicketOrder");
  return call(input);
}

export async function updateOrderStatus(input: { orderId: string; status: OrderStatus }) {
  if (isLocalWeb()) {
    await setDoc(doc(db, "orders", input.orderId), {
      status: input.status,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return { data: { ok: true } };
  }
  const call = callable<{ orderId: string; status: OrderStatus }, { ok: boolean }>("updateOrderStatus");
  return call(input);
}

export async function useQrTransaction(input: QrTransactionInput) {
  const isLocal = typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);
  if (isLocal) {
    if (!input.userId.trim()) throw new Error("QR işlemi için kullanıcı kimliği gerekli.");
    if (!input.placeId.trim()) throw new Error("QR işlemi için mekan kimliği gerekli.");
    const id = input.scanId || `qr-${Date.now()}`;
    const transactionRef = doc(db, "qrTransactions", id);
    const userRef = doc(db, "users", input.userId);
    let balanceAfter = 0;
    await runTransaction(db, async (tx) => {
      const userSnap = await tx.get(userRef);
      const currentPoints = Number(userSnap.data()?.points ?? 0);
      balanceAfter = currentPoints + input.pointsDelta;
      tx.set(transactionRef, {
        id,
        userId: input.userId,
        placeId: input.placeId,
        offerId: input.offerId ?? null,
        pointsDelta: input.pointsDelta,
        note: input.note ?? "Web panel yerel QR işlemi",
        type: input.offerId ? "spend" : input.pointsDelta >= 0 ? "earn" : "spend",
        balanceAfter,
        createdAt: serverTimestamp()
      }, { merge: true });
      tx.set(userRef, {
        points: increment(input.pointsDelta),
        updatedAt: serverTimestamp()
      }, { merge: true });
    });
    return { data: { ok: true, transactionId: id, type: input.offerId ? "spend" : input.pointsDelta >= 0 ? "earn" : "spend", balanceAfter } };
  }
  const call = callable<QrTransactionInput, { ok: boolean; transactionId: string; type: string; balanceAfter: number }>("useQrTransaction");
  return call(input);
}

export async function updateUserRole(input: { userId: string; role: UserRole }) {
  if (isLocalWeb()) {
    await setDoc(doc(db, "users", input.userId), {
      role: input.role,
      updatedAt: serverTimestamp(),
      updatedBy: requireAuthUserId()
    }, { merge: true });
    return { data: { ok: true, userId: input.userId, role: input.role } };
  }
  const call = callable<{ userId: string; role: UserRole }, { ok: boolean; userId: string; role: UserRole }>("updateUserRole");
  return call(input);
}

export async function listAdminUsers(input: { search?: string; role?: UserRole | "all"; limit?: number }) {
  const payload = {
    search: input.search ?? "",
    role: input.role === "all" ? undefined : input.role,
    limit: input.limit ?? 25
  };
  if (isLocalWeb()) {
    const normalizedSearch = payload.search.trim().toLocaleLowerCase("tr-TR");
    const snapshot = await getDocs(collection(db, "users"));
    const users = snapshot.docs
      .map((entry) => {
        const data = entry.data();
        return {
          id: entry.id,
          displayName: String(data.displayName ?? "Belirtilmemiş"),
          email: String(data.email ?? ""),
          role: String(data.role ?? "individual") as UserRole,
          city: String(data.city ?? "Belirtilmemiş"),
          points: Number(data.points ?? 0),
          disabled: data.disabled === true,
          createdAt: data.createdAt?.toDate?.().toISOString?.() ?? null,
          updatedAt: data.updatedAt?.toDate?.().toISOString?.() ?? null
        };
      })
      .filter((user) => !payload.role || user.role === payload.role)
      .filter((user) => {
        if (!normalizedSearch) return true;
        return `${user.id} ${user.displayName} ${user.email} ${user.city}`.toLocaleLowerCase("tr-TR").includes(normalizedSearch);
      })
      .slice(0, payload.limit);
    return { data: { users } };
  }
  const call = callable<typeof payload, { users: AdminUserSummary[] }>("listAdminUsers");
  return call(payload);
}

export async function setUserDisabled(input: { userId: string; disabled: boolean }) {
  if (isLocalWeb()) {
    await setDoc(doc(db, "users", input.userId), {
      disabled: input.disabled,
      updatedAt: serverTimestamp(),
      updatedBy: requireAuthUserId()
    }, { merge: true });
    return { data: { ok: true, userId: input.userId, disabled: input.disabled } };
  }
  const call = callable<{ userId: string; disabled: boolean }, { ok: boolean; userId: string; disabled: boolean }>("setUserDisabled");
  return call(input);
}

export async function getAdminDashboardSummary() {
  if (isLocalWeb()) {
    const [users, places, events, offers, qrTransactions, notifications, orders] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "places")),
      getDocs(collection(db, "events")),
      getDocs(collection(db, "offers")),
      getDocs(collection(db, "qrTransactions")),
      getDocs(collection(db, "notifications")),
      getDocs(collection(db, "orders"))
    ]);
    return {
      data: {
        activeUsers: users.size,
        publishedPlaces: places.size,
        publishedEvents: events.size,
        publishedOffers: offers.size,
        qrUsage: qrTransactions.size,
        notificationCount: notifications.size,
        orderCount: orders.size,
        languageUse: { tr: users.size }
      }
    };
  }
  const call = callable<Record<string, never>, AdminDashboardSummary>("getAdminDashboardSummary");
  return call({});
}
