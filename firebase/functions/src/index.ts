import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore, type DocumentReference, type Query } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as XLSX from "xlsx";

initializeApp();

const db = getFirestore();

function resolveBootstrapRoleByEmail(email?: string | null) {
  const normalized = String(email ?? "").trim().toLowerCase();
  if (normalized === "admin.test@narrehberi.com" || normalized === "master@narrehberi.com") return "admin" as const;
  if (normalized === "business.test@narrehberi.com") return "business" as const;
  if (normalized === "theater.test@narrehberi.com") return "theater" as const;
  return null;
}

function assertSignedIn(uid?: string) {
  if (!uid) throw new HttpsError("unauthenticated", "Giriş gerekli.");
}

async function assertAdmin(uid?: string) {
  assertSignedIn(uid);
  const user = await db.doc(`users/${uid}`).get();
  if (user.data()?.role !== "admin") throw new HttpsError("permission-denied", "Admin yetkisi gerekli.");
}

async function assertRateLimit(uid: string, action: string, maxCount: number, windowSeconds: number) {
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  const ref = db.doc(`rateLimits/${uid}_${action}_${bucket}`);
  await db.runTransaction(async (tx) => {
    const snapshot = await tx.get(ref);
    const count = Number(snapshot.data()?.count ?? 0);
    if (count >= maxCount) {
      throw new HttpsError("resource-exhausted", "İşlem limiti aşıldı. Lütfen biraz sonra tekrar deneyin.");
    }
    tx.set(ref, {
      uid,
      action,
      bucket,
      count: FieldValue.increment(1),
      expiresAt: new Date(Date.now() + windowSeconds * 1000).toISOString(),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
  });
}

type GroqLocalizedText = { tr: string; en: string; ru: string; de: string };
type GroqTranslationResult = {
  title: GroqLocalizedText;
  description: GroqLocalizedText;
  synopsis: GroqLocalizedText;
  notificationTitle: GroqLocalizedText;
  notificationBody: GroqLocalizedText;
};

function normalizeGroqLocalizedText(value: unknown): GroqLocalizedText | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const localized = {
    tr: String(record.tr ?? "").trim(),
    en: String(record.en ?? "").trim(),
    ru: String(record.ru ?? "").trim(),
    de: String(record.de ?? "").trim()
  };
  return localized.tr || localized.en || localized.ru || localized.de ? localized : null;
}

function safeParseGroqTranslation(content: string): GroqTranslationResult | null {
  const trimmed = content.trim();
  if (!trimmed) return null;
  const fenced = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = fenced.indexOf("{");
  const end = fenced.lastIndexOf("}");
  if (start < 0 || end <= start) return null;

  try {
    const parsed = JSON.parse(fenced.slice(start, end + 1)) as Partial<Record<keyof GroqTranslationResult, unknown>>;
    const result: Partial<GroqTranslationResult> = {};
    for (const key of ["title", "description", "synopsis", "notificationTitle", "notificationBody"] as const) {
      const localized = normalizeGroqLocalizedText(parsed[key]);
      if (!localized) return null;
      result[key] = localized;
    }
    return result as GroqTranslationResult;
  } catch {
    return null;
  }
}

export const ensureUserProfile = onCall(async (request) => {
  assertSignedIn(request.auth?.uid);
  const uid = request.auth!.uid;
  const userRef = db.doc(`users/${uid}`);
  const bootstrapRole = resolveBootstrapRoleByEmail(request.auth?.token.email);
  const existing = await userRef.get();
  if (existing.exists) {
    const data = existing.data() ?? {};
    const isAnonymous = request.auth?.token.firebase?.sign_in_provider === "anonymous";
    const currentPoints = typeof data.points === "number" ? data.points : null;
    if (bootstrapRole && data.role !== bootstrapRole) {
      await userRef.set({
        role: bootstrapRole,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
      return {
        id: uid,
        created: false,
        role: bootstrapRole,
        points: isAnonymous ? 0 : data.points ?? 500
      };
    }
    if (!isAnonymous && (currentPoints === null || currentPoints < 500) && !data.initialPointsGrantedAt) {
      await userRef.set({
        points: 500,
        initialPointsGrantedAt: FieldValue.serverTimestamp(),
        pointsSeededAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
      return { id: uid, created: false, role: data.role ?? "individual", points: 500 };
    }
    return { id: uid, created: false, role: data.role ?? "individual", points: isAnonymous ? 0 : data.points ?? 500 };
  }

  const requestedRole = String(request.data?.requestedRole ?? "individual");
  const allowedSelfServiceRoles = ["individual", "business", "theater"];
  const role = bootstrapRole ?? (allowedSelfServiceRoles.includes(requestedRole) ? requestedRole : "individual");

  await userRef.set({
    id: uid,
    role,
    displayName: request.auth?.token.name ?? "Nar kullanıcısı",
    email: request.auth?.token.email ?? "",
    city: "Antalya",
    preferredLocale: "tr",
    points: request.auth?.token.firebase?.sign_in_provider === "anonymous" ? 0 : 500,
    initialPointsGrantedAt: request.auth?.token.firebase?.sign_in_provider === "anonymous" ? null : FieldValue.serverTimestamp(),
    pointsSeededAt: request.auth?.token.firebase?.sign_in_provider === "anonymous" ? null : FieldValue.serverTimestamp(),
    qrCodeId: `nar-${uid}`,
    favoritePlaceIds: [],
    favoriteEventIds: [],
    badges: [],
    notificationPreferences: {
      offers: true,
      events: true,
      theater: true,
      reminders: true
    },
    createdAt: FieldValue.serverTimestamp()
  });

  return { id: uid, created: true, role };
});

export const deleteCurrentAccount = onCall(async (request) => {
  assertSignedIn(request.auth?.uid);
  const uid = request.auth!.uid;
  const userRef = db.doc(`users/${uid}`);

  await deleteDocumentTree(userRef);
  try {
    await getAuth().deleteUser(uid);
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code !== "auth/user-not-found") throw error;
  }

  await db.collection("auditLogs").add({
    actorId: uid,
    action: "user.account.delete",
    entityType: "user",
    entityId: uid,
    createdAt: FieldValue.serverTimestamp()
  });

  return { ok: true };
});

export const resetCurrentUserScanHistory = onCall(async (request) => {
  assertSignedIn(request.auth?.uid);
  const uid = request.auth!.uid;

  const snapshot = await db.collection("qrTransactions").where("userId", "==", uid).get();
  if (!snapshot.empty) {
    await Promise.all(snapshot.docs.map((doc) => deleteDocumentTree(doc.ref)));
  }

  await db.collection("auditLogs").add({
    actorId: uid,
    action: "user.scanHistory.reset",
    entityType: "user",
    entityId: uid,
    createdAt: FieldValue.serverTimestamp()
  });

  return { ok: true, deletedCount: snapshot.size };
});

export const updateUserRole = onCall(async (request) => {
  await assertAdmin(request.auth?.uid);
  const { userId, role } = request.data ?? {};
  const allowedRoles = ["individual", "business", "theater", "admin"];
  if (!userId || !allowedRoles.includes(role)) {
    throw new HttpsError("invalid-argument", "Kullanıcı kimliği ve geçerli rol gerekli.");
  }

  await db.doc(`users/${userId}`).set({
    role,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: request.auth?.uid
  }, { merge: true });

  await db.collection("auditLogs").add({
    actorId: request.auth?.uid,
    action: "user.role.update",
    entityType: "user",
    entityId: userId,
    createdAt: FieldValue.serverTimestamp()
  });

  return { ok: true, userId, role };
});

export const listAdminUsers = onCall(async (request) => {
  await assertAdmin(request.auth?.uid);
  const { search = "", role, limit = 25 } = request.data ?? {};
  const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 50);
  let userQuery: Query = db.collection("users").orderBy("createdAt", "desc").limit(100);
  const allowedRoles = ["individual", "business", "theater", "admin"];
  if (role && allowedRoles.includes(role)) {
    userQuery = db.collection("users").where("role", "==", role).orderBy("createdAt", "desc").limit(100);
  }

  const normalizedSearch = String(search).trim().toLocaleLowerCase("tr-TR");
  const snapshot = await userQuery.get();
  const users = snapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        displayName: data.displayName ?? "Belirtilmemiş",
        email: data.email ?? "",
        role: data.role ?? "individual",
        city: data.city ?? "Belirtilmemiş",
        points: data.points ?? 0,
        disabled: data.disabled === true,
        createdAt: data.createdAt?.toDate?.().toISOString?.() ?? null,
        updatedAt: data.updatedAt?.toDate?.().toISOString?.() ?? null
      };
    })
    .filter((user) => {
      if (!normalizedSearch) return true;
      const haystack = `${user.id} ${user.displayName} ${user.email} ${user.city}`.toLocaleLowerCase("tr-TR");
      return haystack.includes(normalizedSearch);
    })
    .slice(0, safeLimit);

  return { users };
});

export const setUserDisabled = onCall(async (request) => {
  await assertAdmin(request.auth?.uid);
  const { userId, disabled } = request.data ?? {};
  if (!userId || typeof disabled !== "boolean") {
    throw new HttpsError("invalid-argument", "Kullanıcı kimliği ve hesap durumu gerekli.");
  }
  if (userId === request.auth?.uid && disabled) {
    throw new HttpsError("failed-precondition", "Admin kendi hesabını pasifleştiremez.");
  }

  try {
    await getAuth().updateUser(userId, { disabled });
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code !== "auth/user-not-found") throw error;
  }

  await db.doc(`users/${userId}`).set({
    disabled,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: request.auth?.uid
  }, { merge: true });

  await db.collection("auditLogs").add({
    actorId: request.auth?.uid,
    action: disabled ? "user.disable" : "user.enable",
    entityType: "user",
    entityId: userId,
    createdAt: FieldValue.serverTimestamp()
  });

  return { ok: true, userId, disabled };
});

export const sendNotification = onCall(async (request) => {
  await assertAdmin(request.auth?.uid);
  await assertRateLimit(request.auth!.uid, "notification.send", 30, 3600);
  const { title, body, target, tokens = [] } = request.data ?? {};
  if (!title?.tr || !body?.tr || !target?.kind) {
    throw new HttpsError("invalid-argument", "Başlık, gövde ve hedef gerekli.");
  }

  const ref = await db.collection("notifications").add({
    title,
    body,
    target,
    status: "sent",
    sentAt: FieldValue.serverTimestamp(),
    createdBy: request.auth?.uid
  });

  if (tokens.length > 0) {
    const deliveryBatch = db.batch();
    const deliveries = tokens.map((token: string) => {
      const deliveryRef = ref.collection("deliveries").doc();
      deliveryBatch.set(deliveryRef, {
        id: deliveryRef.id,
        notificationId: ref.id,
        token,
        status: "queued",
        createdAt: FieldValue.serverTimestamp()
      });
      return { ref: deliveryRef, token };
    });

    const result = await getMessaging().sendEachForMulticast({
      tokens,
      notification: {
        title: title.tr,
        body: body.tr
      },
      data: {
        notificationId: ref.id,
        targetKind: target.kind
      }
    });

    result.responses.forEach((response, index) => {
      deliveryBatch.update(deliveries[index].ref, {
        status: response.success ? "sent" : "failed",
        errorMessage: response.error?.message ?? null,
        sentAt: FieldValue.serverTimestamp()
      });
    });
    deliveryBatch.update(ref, { deliveryCount: deliveries.length });
    await deliveryBatch.commit();
  }

  return { id: ref.id };
});

export const saveFcmToken = onCall(async (request) => {
  assertSignedIn(request.auth?.uid);
  const { token, platform, locale = "tr" } = request.data ?? {};
  if (!token || !platform) {
    throw new HttpsError("invalid-argument", "FCM token ve platform gerekli.");
  }

  await db.doc(`users/${request.auth!.uid}/fcmTokens/${token}`).set(
    {
      token,
      platform,
      locale,
      updatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  return { ok: true };
});

export const markNotificationOpened = onCall(async (request) => {
  assertSignedIn(request.auth?.uid);
  const { notificationId, deliveryId } = request.data ?? {};
  if (!notificationId) {
    throw new HttpsError("invalid-argument", "Bildirim kimliği gerekli.");
  }

  const uid = request.auth!.uid;
  const notificationRef = db.doc(`notifications/${notificationId}`);
  const deliveryRef = deliveryId
    ? notificationRef.collection("deliveries").doc(deliveryId)
    : notificationRef.collection("deliveries").doc(uid);

  await db.runTransaction(async (tx) => {
    tx.set(deliveryRef, {
      id: deliveryRef.id,
      notificationId,
      userId: uid,
      status: "opened",
      openedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    tx.set(notificationRef, {
      openCount: FieldValue.increment(1),
      lastOpenedAt: FieldValue.serverTimestamp()
    }, { merge: true });
  });

  await recordAnalyticsEvent({
    type: "notification_open",
    entityType: "notification",
    entityId: notificationId,
    userId: uid,
    platform: "unknown"
  });

  return { ok: true };
});

export const scheduleNotification = onCall(async (request) => {
  await assertAdmin(request.auth?.uid);
  await assertRateLimit(request.auth!.uid, "notification.schedule", 20, 3600);
  const { title, body, target, scheduledAt } = request.data ?? {};
  if (!title?.tr || !body?.tr || !target?.kind || !scheduledAt) {
    throw new HttpsError("invalid-argument", "Başlık, gövde, hedef ve zaman gerekli.");
  }

  const scheduledDate = new Date(scheduledAt);
  if (Number.isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) {
    throw new HttpsError("invalid-argument", "Zamanlanmış bildirim ileri bir tarih olmalı.");
  }

  const ref = await db.collection("notifications").add({
    title,
    body,
    target,
    scheduledAt,
    status: "scheduled",
    createdAt: FieldValue.serverTimestamp(),
    createdBy: request.auth?.uid
  });

  await db.collection("auditLogs").add({
    actorId: request.auth!.uid,
    action: "notification.schedule",
    entityType: "notification",
    entityId: ref.id,
    createdAt: FieldValue.serverTimestamp()
  });

  return { id: ref.id };
});

export const estimateNotificationAudience = onCall(async (request) => {
  await assertAdmin(request.auth?.uid);
  const { target } = request.data ?? {};
  if (!target?.kind) {
    throw new HttpsError("invalid-argument", "Hedef kitle gerekli.");
  }

  if (target.kind === "manual") {
    const userIds = Array.isArray(target.userIds) ? target.userIds.slice(0, 100) : [];
    const tokenLists = await Promise.all(userIds.map((uid: string) => db.collection(`users/${uid}/fcmTokens`).limit(20).get()));
    const estimatedTokens = tokenLists.reduce((total, list) => total + list.size, 0);
    return { target, estimatedUsers: userIds.length, estimatedTokens, detail: "Manuel kullanıcı seçimi" };
  }

  if (target.kind === "event" && target.eventId) {
    const favorites = await db.collectionGroup("favorites")
      .where("entityType", "==", "event")
      .where("entityId", "==", target.eventId)
      .limit(500)
      .get();
    const userIds = [...new Set(favorites.docs.map((doc) => doc.ref.parent.parent?.id).filter(Boolean) as string[])];
    const tokenLists = await Promise.all(userIds.map((uid) => db.collection(`users/${uid}/fcmTokens`).limit(10).get()));
    return {
      target,
      estimatedUsers: userIds.length,
      estimatedTokens: tokenLists.reduce((total, list) => total + list.size, 0),
      detail: "Etkinliği favorileyen kullanıcılar"
    };
  }

  let userQuery: Query = db.collection("users");
  if (target.kind === "role" && target.role) userQuery = userQuery.where("role", "==", target.role);
  if (target.kind === "city" && target.city) userQuery = userQuery.where("city", "==", target.city);
  if (target.kind === "favorites") {
    const favorites = await db.collectionGroup("favorites").limit(500).get();
    const userIds = [...new Set(favorites.docs.map((doc) => doc.ref.parent.parent?.id).filter(Boolean) as string[])];
    const tokenLists = await Promise.all(userIds.map((uid) => db.collection(`users/${uid}/fcmTokens`).limit(10).get()));
    return {
      target,
      estimatedUsers: userIds.length,
      estimatedTokens: tokenLists.reduce((total, list) => total + list.size, 0),
      detail: "Favori kaydı olan kullanıcılar"
    };
  }

  const users = await userQuery.limit(500).get();
  const tokenLists = await Promise.all(users.docs.map((user) => user.ref.collection("fcmTokens").limit(10).get()));
  return {
    target,
    estimatedUsers: users.size,
    estimatedTokens: tokenLists.reduce((total, list) => total + list.size, 0),
    detail: target.kind === "all" ? "İlk 500 aktif kullanıcı örneklemi" : "Hedef filtre örneklemi"
  };
});

export const getAdminDashboardSummary = onCall(async (request) => {
  await assertAdmin(request.auth?.uid);
  const [users, places, events, offers, qrTransactions, notifications, orders] = await Promise.all([
    db.collection("users").limit(1000).get(),
    db.collection("places").where("status", "==", "published").limit(1000).get(),
    db.collection("events").where("status", "==", "published").limit(1000).get(),
    db.collection("offers").where("status", "==", "published").limit(1000).get(),
    db.collection("qrTransactions").limit(1000).get(),
    db.collection("notifications").limit(1000).get(),
    db.collection("orders").limit(1000).get()
  ]);

  const languageUse = users.docs.reduce<Record<string, number>>((totals, doc) => {
    const locale = doc.data().preferredLocale ?? "tr";
    totals[locale] = (totals[locale] ?? 0) + 1;
    return totals;
  }, {});

  return {
    activeUsers: users.size,
    publishedPlaces: places.size,
    publishedEvents: events.size,
    publishedOffers: offers.size,
    qrUsage: qrTransactions.size,
    notificationCount: notifications.size,
    orderCount: orders.size,
    languageUse
  };
});

export const translateSynopsisDraft = onCall(async (request) => {
  assertSignedIn(request.auth?.uid);
  const uid = request.auth!.uid;
  const user = await db.doc(`users/${uid}`).get();
  if (!["theater", "admin"].includes(user.data()?.role)) {
    throw new HttpsError("permission-denied", "Tiyatro yetkisi gerekli.");
  }

  const { synopsisTr } = request.data ?? {};
  if (!synopsisTr || typeof synopsisTr !== "string") {
    throw new HttpsError("invalid-argument", "Türkçe sinopsis gerekli.");
  }

  return {
    synopsis: {
      tr: synopsisTr,
      en: `[Taslak çeviri] ${synopsisTr}`,
      ru: `[Taslak çeviri] ${synopsisTr}`,
      de: `[Taslak çeviri] ${synopsisTr}`
    }
  };
});

export const translateTheaterContent = onCall(async (request) => {
  assertSignedIn(request.auth?.uid);
  const uid = request.auth!.uid;
  const user = await db.doc(`users/${uid}`).get();
  if (!["theater", "admin"].includes(user.data()?.role)) {
    throw new HttpsError("permission-denied", "Tiyatro yetkisi gerekli.");
  }

  const payload = request.data ?? {};
  const titleTr = String(payload.titleTr ?? "").trim();
  const descriptionTr = String(payload.descriptionTr ?? "").trim();
  const synopsisTr = String(payload.synopsisTr ?? "").trim();
  const notificationTitleTr = String(payload.notificationTitleTr ?? titleTr).trim();
  const notificationBodyTr = String(payload.notificationBodyTr ?? descriptionTr).trim();

  if (!titleTr || !descriptionTr || !synopsisTr) {
    throw new HttpsError("invalid-argument", "Başlık, açıklama ve sinopsis gerekli.");
  }

  const groqKey = process.env.GROQ_API_KEY?.trim();
  const base = {
    title: { tr: titleTr, en: titleTr, ru: titleTr, de: titleTr },
    description: { tr: descriptionTr, en: descriptionTr, ru: descriptionTr, de: descriptionTr },
    synopsis: { tr: synopsisTr, en: synopsisTr, ru: synopsisTr, de: synopsisTr },
    notificationTitle: { tr: notificationTitleTr, en: notificationTitleTr, ru: notificationTitleTr, de: notificationTitleTr },
    notificationBody: { tr: notificationBodyTr, en: notificationBodyTr, ru: notificationBodyTr, de: notificationBodyTr }
  };

  if (!groqKey) {
    return base;
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqKey}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      max_completion_tokens: 1400,
      messages: [
        {
          role: "system",
          content:
            "Sen profesyonel bir çeviri motorusun. Sadece geçerli JSON döndür. Türkçe metinleri İngilizce, Rusça ve Almanca'ya doğal biçimde çevir. Özel adları ve marka adlarını koru. Çıktıda şu anahtarlar olsun: title, description, synopsis, notificationTitle, notificationBody. Her anahtarın içinde tr, en, ru, de alanları bulunsun."
        },
        {
          role: "user",
          content: JSON.stringify({
            titleTr,
            descriptionTr,
            synopsisTr,
            notificationTitleTr,
            notificationBodyTr
          })
        }
      ]
    })
  });

  if (!response.ok) {
    throw new HttpsError("internal", `Groq çeviri isteği başarısız oldu: ${response.status}`);
  }

  const json = await response.json() as { choices?: Array<{ message?: { content?: string | null } }> };
  const content = json.choices?.[0]?.message?.content?.trim() ?? "";
  const parsed = safeParseGroqTranslation(content);
  return parsed ?? base;
});

export const createContactRequest = onCall(async (request) => {
  const { name, email, subject, message } = request.data ?? {};
  if (!name || !email || !subject || !message) {
    throw new HttpsError("invalid-argument", "Ad, email, konu ve mesaj gerekli.");
  }

  const ref = await db.collection("contactRequests").add({
    name,
    email,
    subject,
    message,
    status: "new",
    createdAt: FieldValue.serverTimestamp()
  });

  return { id: ref.id };
});

export const submitForApproval = onCall(async (request) => {
  assertSignedIn(request.auth?.uid);
  const { entityType, entityId, title, note } = request.data ?? {};
  if (!entityType || !entityId || !title) {
    throw new HttpsError("invalid-argument", "İçerik türü, içerik kimliği ve başlık gerekli.");
  }

  const ref = await db.collection("approvalQueue").add({
    entityType,
    entityId,
    ownerId: request.auth!.uid,
    status: "pendingReview",
    title,
    note: note ?? "",
    submittedAt: FieldValue.serverTimestamp()
  });

  const collectionByType: Record<string, string> = {
    place: "places",
    event: "events",
    offer: "offers",
    story: "stories",
    category: "categories"
  };
  const collection = collectionByType[entityType];
  if (collection) {
    await db.doc(`${collection}/${entityId}`).set({
      status: "pending",
      approvalStatus: "pendingReview",
      submittedForApprovalAt: FieldValue.serverTimestamp()
    }, { merge: true });
  }

  await db.collection("auditLogs").add({
    actorId: request.auth!.uid,
    action: "approval.submit",
    entityType,
    entityId,
    createdAt: FieldValue.serverTimestamp()
  });

  return { id: ref.id };
});

export const reviewApproval = onCall(async (request) => {
  await assertAdmin(request.auth?.uid);
  const { approvalId, decision, note, rejectionReason } = request.data ?? {};
  if (!approvalId || !["approved", "rejected"].includes(decision)) {
    throw new HttpsError("invalid-argument", "Onay kimliği ve karar gerekli.");
  }

  const approvalRef = db.doc(`approvalQueue/${approvalId}`);
  await db.runTransaction(async (tx) => {
    const approval = await tx.get(approvalRef);
    if (!approval.exists) throw new HttpsError("not-found", "Onay kaydı bulunamadı.");
    const data = approval.data()!;
    tx.update(approvalRef, {
      status: decision,
      note: note ?? data.note ?? "",
      rejectionReason: decision === "rejected" ? (rejectionReason ?? note ?? "Red sebebi belirtilmedi.") : null,
      reviewedAt: FieldValue.serverTimestamp(),
      reviewerId: request.auth?.uid
    });

    if (decision === "approved") {
      const collectionByType: Record<string, string> = {
        place: "places",
        event: "events",
        offer: "offers",
        story: "stories",
        category: "categories"
      };
      const collection = collectionByType[data.entityType];
      if (collection) {
        tx.set(db.doc(`${collection}/${data.entityId}`), { status: "published", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      }
    } else {
      const collectionByType: Record<string, string> = {
        place: "places",
        event: "events",
        offer: "offers",
        story: "stories",
        category: "categories"
      };
      const collection = collectionByType[data.entityType];
      if (collection) {
        tx.set(db.doc(`${collection}/${data.entityId}`), {
          status: "draft",
          approvalStatus: "rejected",
          rejectionReason: rejectionReason ?? note ?? "Red sebebi belirtilmedi.",
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
      }
    }

    tx.set(db.collection("auditLogs").doc(), {
      actorId: request.auth?.uid,
      action: `approval.${decision}`,
      entityType: data.entityType,
      entityId: data.entityId,
      createdAt: FieldValue.serverTimestamp()
    });
  });

  return { ok: true };
});

export const completeUserTask = onCall(async (request) => {
  assertSignedIn(request.auth?.uid);
  const { taskId, rewardPoints = 0, badgeId } = request.data ?? {};
  if (!taskId) throw new HttpsError("invalid-argument", "Görev kimliği gerekli.");

  const uid = request.auth!.uid;
  const completionRef = db.doc(`users/${uid}/taskCompletions/${taskId}`);
  await db.runTransaction(async (tx) => {
    const completion = await tx.get(completionRef);
    if (completion.exists) throw new HttpsError("already-exists", "Görev zaten tamamlandı.");
    tx.set(completionRef, {
      taskId,
      rewardPoints,
      badgeId: badgeId ?? null,
      completedAt: FieldValue.serverTimestamp()
    });
    tx.update(db.doc(`users/${uid}`), badgeId
      ? {
          points: FieldValue.increment(Number(rewardPoints) || 0),
          badges: FieldValue.arrayUnion(badgeId)
        }
      : {
          points: FieldValue.increment(Number(rewardPoints) || 0)
        });
    tx.set(db.collection("auditLogs").doc(), {
      actorId: uid,
      action: "task.complete",
      entityType: "userTask",
      entityId: taskId,
      createdAt: FieldValue.serverTimestamp()
    });
  });

  return { ok: true };
});

async function recordAnalyticsEvent(input: {
  type: string;
  entityType?: string | null;
  entityId?: string | null;
  userId?: string | null;
  city?: string;
  locale?: string;
  platform?: string;
}) {
  const {
    type,
    entityType = null,
    entityId = null,
    userId = null,
    city = "Antalya",
    locale = "tr",
    platform = "unknown"
  } = input;
  const eventRef = db.collection("analyticsEvents").doc();
  const counterId = [type, entityType, entityId].filter(Boolean).join("__");

  await db.runTransaction(async (tx) => {
    tx.set(eventRef, {
      id: eventRef.id,
      type,
      entityType,
      entityId,
      userId,
      city,
      locale,
      platform,
      createdAt: FieldValue.serverTimestamp()
    });
    tx.set(db.doc(`analyticsCounters/${counterId}`), {
      id: counterId,
      type,
      entityType,
      entityId,
      city,
      locale,
      platform,
      count: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
  });

  return { id: eventRef.id };
}

export const trackAnalyticsEvent = onCall(async (request) => {
  const {
    type,
    entityType = null,
    entityId = null,
    city = "Antalya",
    locale = "tr",
    platform = "unknown"
  } = request.data ?? {};

  if (!type) throw new HttpsError("invalid-argument", "Analitik event türü gerekli.");

  return recordAnalyticsEvent({
    type,
    entityType,
    entityId,
    userId: request.auth?.uid ?? null,
    city,
    locale,
    platform
  });
});

export const toggleFavorite = onCall(async (request) => {
  assertSignedIn(request.auth?.uid);
  const { entityType, entityId } = request.data ?? {};
  if (!entityType || !entityId) {
    throw new HttpsError("invalid-argument", "Favori türü ve içerik kimliği gerekli.");
  }

  const uid = request.auth!.uid;
  const favoriteId = `${entityType}_${entityId}`;
  const favoriteRef = db.doc(`users/${uid}/favorites/${favoriteId}`);
  let active = false;

  await db.runTransaction(async (tx) => {
    const favorite = await tx.get(favoriteRef);
    if (favorite.exists) {
      tx.delete(favoriteRef);
      active = false;
    } else {
      tx.set(favoriteRef, {
        id: favoriteId,
        userId: uid,
        entityType,
        entityId,
        createdAt: FieldValue.serverTimestamp()
      });
      active = true;
    }
    tx.set(db.collection("auditLogs").doc(), {
      actorId: uid,
      action: active ? "favorite.add" : "favorite.remove",
      entityType,
      entityId,
      createdAt: FieldValue.serverTimestamp()
    });
  });

  return { active };
});

export const scheduleReminder = onCall(async (request) => {
  assertSignedIn(request.auth?.uid);
  const { entityType, entityId, remindAt, channel = "push" } = request.data ?? {};
  if (!entityType || !entityId || !remindAt) {
    throw new HttpsError("invalid-argument", "Hatırlatıcı türü, içerik kimliği ve zaman gerekli.");
  }

  const date = new Date(remindAt);
  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
    throw new HttpsError("invalid-argument", "Hatırlatıcı ileri bir tarih olmalı.");
  }

  const uid = request.auth!.uid;
  const ref = db.collection(`users/${uid}/reminders`).doc();
  await ref.set({
    id: ref.id,
    userId: uid,
    entityType,
    entityId,
    remindAt,
    channel,
    status: "scheduled",
    createdAt: FieldValue.serverTimestamp()
  });

  return { id: ref.id };
});

export const updatePushPreferences = onCall(async (request) => {
  assertSignedIn(request.auth?.uid);
  const { preferences } = request.data ?? {};
  if (!preferences || typeof preferences !== "object") {
    throw new HttpsError("invalid-argument", "Bildirim tercihleri gerekli.");
  }

  await db.doc(`users/${request.auth!.uid}`).set({
    notificationPreferences: preferences,
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });

  return { ok: true };
});

export const saveGooglePlaceSnapshot = onCall(async (request) => {
  assertSignedIn(request.auth?.uid);
  const { placeId, snapshot } = request.data ?? {};
  if (!placeId || !snapshot?.googlePlaceId) {
    throw new HttpsError("invalid-argument", "Mekan kimliği ve Google snapshot gerekli.");
  }

  const uid = request.auth!.uid;
  const user = await db.doc(`users/${uid}`).get();
  const placeRef = db.doc(`places/${placeId}`);
  const place = await placeRef.get();
  const allowed = user.data()?.role === "admin" || place.data()?.ownerId === uid;
  if (!allowed) throw new HttpsError("permission-denied", "Bu mekan için Google Places güncellemesi yapılamaz.");

  await placeRef.set({
    googlePlaceId: snapshot.googlePlaceId,
    phone: snapshot.phone ?? null,
    website: snapshot.website ?? null,
    address: snapshot.address ?? place.data()?.address ?? "",
    location: snapshot.location ?? null,
    googleRating: snapshot.rating ?? null,
    googleReviewCount: snapshot.reviewCount ?? null,
    openingHours: snapshot.openingHours ?? [],
    googleOpeningHours: snapshot.openingHours ?? [],
    googlePhotoRefs: snapshot.photoRefs ?? [],
    googleFetchedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });

  await db.collection("auditLogs").add({
    actorId: uid,
    action: "googlePlaces.snapshot.save",
    entityType: "place",
    entityId: placeId,
    createdAt: FieldValue.serverTimestamp()
  });

  return { ok: true };
});

export const createTicketOrder = onCall(async (request) => {
  assertSignedIn(request.auth?.uid);
  await assertRateLimit(request.auth!.uid, "order.ticket.create", 30, 3600);
  const { eventId, eventTitle, ticketUrl } = request.data ?? {};
  if (!eventId || !eventTitle) {
    throw new HttpsError("invalid-argument", "Etkinlik kimliği ve başlığı gerekli.");
  }

  const ref = await db.collection("orders").add({
    userId: request.auth!.uid,
    type: "ticket",
    status: "created",
    entityId: eventId,
    entityTitle: eventTitle,
    amountLabel: "Bilet yönlendirmesi",
    ticketUrl: ticketUrl ?? null,
    createdAt: FieldValue.serverTimestamp()
  });

  await recordAnalyticsEvent({
    type: "ticket_click",
    entityType: "event",
    entityId: eventId,
    userId: request.auth!.uid,
    platform: "web"
  });

  await db.collection("auditLogs").add({
    actorId: request.auth!.uid,
    action: "order.ticket.create",
    entityType: "order",
    entityId: ref.id,
    createdAt: FieldValue.serverTimestamp()
  });

  return { id: ref.id };
});

export const redeemOffer = onCall(async (request) => {
  assertSignedIn(request.auth?.uid);
  await assertRateLimit(request.auth!.uid, "offer.redeem", 40, 3600);
  const { offerId, offerTitle, businessId, placeId, amountLabel = "Fırsat" } = request.data ?? {};
  if (!offerId || !offerTitle || !businessId || !placeId) {
    throw new HttpsError("invalid-argument", "Fırsat, işletme ve mekan bilgisi gerekli.");
  }

  const ref = db.collection("orders").doc();
  await db.runTransaction(async (tx) => {
    const offerRef = db.doc(`offers/${offerId}`);
    const offer = await tx.get(offerRef);
    const data = offer.data() ?? {};
    const useLimit = Number(data.useLimit ?? 0);
    const usedCount = Number(data.usedCount ?? 0);
    if (offer.exists && data.status !== "published") {
      throw new HttpsError("failed-precondition", "Fırsat yayında değil.");
    }
    if (useLimit > 0 && usedCount >= useLimit) {
      throw new HttpsError("failed-precondition", "Fırsat kullanım limiti doldu.");
    }
    tx.set(ref, {
      userId: request.auth!.uid,
      type: "offer",
      status: "used",
      entityId: offerId,
      entityTitle: offerTitle,
      businessId,
      placeId,
      amountLabel,
      createdAt: FieldValue.serverTimestamp(),
      usedAt: FieldValue.serverTimestamp()
    });
    tx.set(offerRef, {
      usedCount: FieldValue.increment(1),
      lastUsedAt: FieldValue.serverTimestamp()
    }, { merge: true });
  });

  await recordAnalyticsEvent({
    type: "campaign_use",
    entityType: "offer",
    entityId: offerId,
    userId: request.auth!.uid,
    platform: "web"
  });

  return { id: ref.id };
});

export const createOfferCampaign = onCall(async (request) => {
  assertSignedIn(request.auth?.uid);
  const uid = request.auth!.uid;
  const user = await db.doc(`users/${uid}`).get();
  const payload = request.data ?? {};
  if (!payload.placeId || !payload.title?.tr || !payload.description?.tr || !payload.discountLabel || !payload.startsAt || !payload.endsAt) {
    throw new HttpsError("invalid-argument", "Mekan, başlık, açıklama, indirim ve tarih aralığı gerekli.");
  }

  const place = await db.doc(`places/${payload.placeId}`).get();
  const isAdminUser = user.data()?.role === "admin";
  const isBusinessOwner = user.data()?.role === "business" && place.data()?.ownerId === uid;
  if (!isAdminUser && !isBusinessOwner) {
    throw new HttpsError("permission-denied", "Bu mekan için kampanya oluşturma yetkisi yok.");
  }

  const ref = await db.collection("offers").add({
    ...payload,
    businessId: payload.businessId ?? place.data()?.ownerId ?? uid,
    status: payload.status ?? "draft",
    storyEnabled: payload.storyEnabled === true,
    storyPriority: Number(payload.storyPriority ?? 0),
    useLimit: Number(payload.useLimit ?? 0),
    usedCount: 0,
    featured: payload.featured === true,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: uid
  });

  if (payload.storyEnabled === true) {
    await db.collection("stories").add({
      offerId: ref.id,
      title: payload.title,
      image: payload.storyImage ?? payload.coverImage ?? "",
      priority: Number(payload.storyPriority ?? 0),
      status: payload.status ?? "draft",
      createdAt: FieldValue.serverTimestamp(),
      createdBy: uid
    });
  }

  await db.collection("auditLogs").add({
    actorId: uid,
    action: "offer.create",
    entityType: "offer",
    entityId: ref.id,
    createdAt: FieldValue.serverTimestamp()
  });

  return { id: ref.id };
});

export const updateOfferStatus = onCall(async (request) => {
  assertSignedIn(request.auth?.uid);
  const uid = request.auth!.uid;
  const { offerId, status } = request.data ?? {};
  if (!offerId || !["draft", "pending", "published", "archived"].includes(status)) {
    throw new HttpsError("invalid-argument", "Fırsat kimliği ve yayın durumu gerekli.");
  }

  const user = await db.doc(`users/${uid}`).get();
  const offerRef = db.doc(`offers/${offerId}`);
  const offer = await offerRef.get();
  if (!offer.exists) throw new HttpsError("not-found", "Fırsat bulunamadı.");
  const isAdminUser = user.data()?.role === "admin";
  const isBusinessOwner = user.data()?.role === "business" && offer.data()?.businessId === uid;
  if (!isAdminUser && !isBusinessOwner) {
    throw new HttpsError("permission-denied", "Bu fırsatı güncelleme yetkisi yok.");
  }

  await offerRef.set({
    status,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: uid
  }, { merge: true });

  await db.collection("auditLogs").add({
    actorId: uid,
    action: `offer.status.${status}`,
    entityType: "offer",
    entityId: offerId,
    createdAt: FieldValue.serverTimestamp()
  });

  return { ok: true, offerId, status };
});

export const updateOrderStatus = onCall(async (request) => {
  assertSignedIn(request.auth?.uid);
  const { orderId, status } = request.data ?? {};
  if (!orderId || !status) throw new HttpsError("invalid-argument", "Sipariş kimliği ve durum gerekli.");

  const uid = request.auth!.uid;
  const user = await db.doc(`users/${uid}`).get();
  const orderRef = db.doc(`orders/${orderId}`);
  const order = await orderRef.get();
  const allowed = user.data()?.role === "admin" || order.data()?.businessId === uid;
  if (!allowed) throw new HttpsError("permission-denied", "Sipariş güncelleme yetkisi yok.");

  await orderRef.set({
    status,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: uid,
    usedAt: status === "used" ? FieldValue.serverTimestamp() : order.data()?.usedAt ?? null
  }, { merge: true });

  await db.collection("auditLogs").add({
    actorId: uid,
    action: "order.status.update",
    entityType: "order",
    entityId: orderId,
    createdAt: FieldValue.serverTimestamp()
  });

  return { ok: true };
});

export const logClientError = onCall(async (request) => {
  const { severity = "error", source = "web", message, context = {} } = request.data ?? {};
  if (!message || typeof message !== "string") {
    throw new HttpsError("invalid-argument", "Hata mesajı gerekli.");
  }

  const ref = await db.collection("errorLogs").add({
    severity,
    source,
    message: message.slice(0, 1000),
    context,
    userId: request.auth?.uid ?? null,
    createdAt: FieldValue.serverTimestamp()
  });

  return { id: ref.id };
});

export const processScheduledNotifications = onSchedule("every 5 minutes", async () => {
  const now = new Date().toISOString();
  const snapshot = await db.collection("notifications")
    .where("status", "==", "scheduled")
    .where("scheduledAt", "<=", now)
    .limit(20)
    .get();

  for (const doc of snapshot.docs) {
    const notification = doc.data();
    const tokens = await collectTargetTokens(notification.target ?? { kind: "all" });
    const deliveryBatch = db.batch();
    const deliveries = tokens.map((token) => {
      const ref = doc.ref.collection("deliveries").doc();
      deliveryBatch.set(ref, {
        id: ref.id,
        notificationId: doc.id,
        token,
        status: "queued",
        createdAt: FieldValue.serverTimestamp()
      });
      return { ref, token };
    });

    if (deliveries.length > 0) {
      const result = await getMessaging().sendEachForMulticast({
        tokens: deliveries.map((delivery) => delivery.token),
        notification: {
          title: notification.title?.tr ?? "Nar Rehberi",
          body: notification.body?.tr ?? ""
        },
        data: {
          notificationId: doc.id,
          targetKind: notification.target?.kind ?? "all"
        }
      });

      result.responses.forEach((response, index) => {
        deliveryBatch.update(deliveries[index].ref, {
          status: response.success ? "sent" : "failed",
          errorMessage: response.error?.message ?? null,
          sentAt: FieldValue.serverTimestamp()
        });
      });
    }

    deliveryBatch.update(doc.ref, {
      status: "sent",
      sentAt: FieldValue.serverTimestamp(),
      deliveryCount: deliveries.length
    });
    await deliveryBatch.commit();
  }
});

export const processScheduledReminders = onSchedule("every 5 minutes", async () => {
  const now = new Date().toISOString();
  const snapshot = await db.collectionGroup("reminders")
    .where("status", "==", "scheduled")
    .where("remindAt", "<=", now)
    .limit(50)
    .get();

  for (const doc of snapshot.docs) {
    const reminder = doc.data();
    const userId = doc.ref.parent.parent?.id;
    if (!userId) continue;

    const userRef = db.doc(`users/${userId}`);
    const user = await userRef.get();
    const preferences = user.data()?.notificationPreferences;
    if (preferences && preferences.reminders === false) {
      await doc.ref.set({
        status: "skipped",
        skipReason: "reminders-disabled",
        skippedAt: FieldValue.serverTimestamp()
      }, { merge: true });
      continue;
    }

    const tokensSnapshot = await userRef.collection("fcmTokens").limit(20).get();
    const tokens = tokensSnapshot.docs.map((tokenDoc) => tokenDoc.data().token).filter(Boolean);
    if (!tokens.length) {
      await doc.ref.set({
        status: "queued",
        deliveryCount: 0,
        queuedAt: FieldValue.serverTimestamp()
      }, { merge: true });
      continue;
    }

    const message = await buildReminderMessage(reminder);
    const result = await getMessaging().sendEachForMulticast({
      tokens,
      notification: message,
      data: {
        reminderId: doc.id,
        entityType: String(reminder.entityType ?? ""),
        entityId: String(reminder.entityId ?? "")
      }
    });

    await doc.ref.set({
      status: "sent",
      sentAt: FieldValue.serverTimestamp(),
      deliveryCount: tokens.length,
      lastDeliveryError: result.successCount < tokens.length ? "partial-failure" : null
    }, { merge: true });
  }
});

async function buildReminderMessage(reminder: Record<string, unknown>) {
  const entityType = String(reminder.entityType ?? "");
  const entityId = String(reminder.entityId ?? "");
  const title = await resolveReminderTitle(entityType, entityId);
  const remindAt = String(reminder.remindAt ?? "");
  const timeLabel = formatReminderTime(remindAt);
  return {
    title: "Nar Rehberi",
    body: title ? `${title} için hatırlatıcı zamanı geldi${timeLabel ? ` · ${timeLabel}` : ""}` : "Hatırlatıcı zamanı geldi"
  };
}

async function resolveReminderTitle(entityType: string, entityId: string) {
  if (!entityType || !entityId) return "";
  const collectionName = entityType === "offer" ? "offers" : entityType === "event" ? "events" : entityType === "place" ? "places" : "";
  if (!collectionName) return entityId;
  const snapshot = await db.doc(`${collectionName}/${entityId}`).get();
  const data = snapshot.data() as { title?: Record<string, string> } | undefined;
  return data?.title?.tr ?? data?.title?.en ?? entityId;
}

function formatReminderTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}

async function collectTargetTokens(target: { kind: string; role?: string; city?: string; eventId?: string; userIds?: string[] }) {
  let userQuery: Query = db.collection("users");
  if (target.kind === "role" && target.role) userQuery = userQuery.where("role", "==", target.role);
  if (target.kind === "city" && target.city) userQuery = userQuery.where("city", "==", target.city);
  if (target.kind === "manual" && target.userIds?.length) {
    const tokenLists = await Promise.all(target.userIds.slice(0, 100).map((uid) => db.collection(`users/${uid}/fcmTokens`).limit(20).get()));
    return tokenLists.flatMap((list) => list.docs.map((doc) => doc.data().token).filter(Boolean));
  }
  if (target.kind === "event" && "eventId" in target && target.eventId) {
    const favoriteUsers = await db.collectionGroup("favorites")
      .where("entityType", "==", "event")
      .where("entityId", "==", target.eventId)
      .limit(500)
      .get();
    const userIds = favoriteUsers.docs.map((doc) => doc.ref.parent.parent?.id).filter(Boolean) as string[];
    const tokenLists = await Promise.all(userIds.map((uid) => db.collection(`users/${uid}/fcmTokens`).limit(10).get()));
    return tokenLists.flatMap((list) => list.docs.map((doc) => doc.data().token).filter(Boolean));
  }
  if (target.kind === "favorites") {
    const favoriteUsers = await db.collectionGroup("favorites").limit(500).get();
    const userIds = [...new Set(favoriteUsers.docs.map((doc) => doc.ref.parent.parent?.id).filter(Boolean) as string[])];
    const tokenLists = await Promise.all(userIds.map((uid) => db.collection(`users/${uid}/fcmTokens`).limit(10).get()));
    return tokenLists.flatMap((list) => list.docs.map((doc) => doc.data().token).filter(Boolean));
  }

  const users = await userQuery.limit(500).get();
  const tokenLists = await Promise.all(users.docs.map((user) => user.ref.collection("fcmTokens").limit(10).get()));
  return tokenLists.flatMap((list) => list.docs.map((doc) => doc.data().token).filter(Boolean));
}

export const useQrTransaction = onCall(async (request) => {
  assertSignedIn(request.auth?.uid);
  await assertRateLimit(request.auth!.uid, "qr.transaction", 120, 3600);
  const { userId, placeId, offerId, pointsDelta, scanId, note } = request.data ?? {};
  if (!userId || !placeId || typeof pointsDelta !== "number") {
    throw new HttpsError("invalid-argument", "Kullanıcı, mekan ve puan hareketi gerekli.");
  }

  const businessId = request.auth!.uid;
  const place = await db.doc(`places/${placeId}`).get();
  if (place.data()?.ownerId !== businessId) {
    throw new HttpsError("permission-denied", "Bu mekan için QR işlemi yapamazsınız.");
  }

  const transactionType = offerId ? "spend" : pointsDelta > 0 ? "earn" : pointsDelta < 0 ? "spend" : "adjustment";
  let balanceAfter = 0;
  let transactionId = "";

  await db.runTransaction(async (tx) => {
    const userRef = db.doc(`users/${userId}`);
    const transactionRef = scanId ? db.collection("qrTransactions").doc(String(scanId)) : db.collection("qrTransactions").doc();
    const userSnapshot = await tx.get(userRef);
    const existingTransaction = await tx.get(transactionRef);
    if (existingTransaction.exists) {
      throw new HttpsError("already-exists", "Bu QR işlemi daha önce kaydedildi.");
    }
    const currentPoints = userSnapshot.data()?.points ?? 0;
    if (currentPoints + pointsDelta < 0) {
      throw new HttpsError("failed-precondition", "Puan bakiyesi negatife düşemez.");
    }
    balanceAfter = currentPoints + pointsDelta;
    transactionId = transactionRef.id;
    tx.update(userRef, { points: FieldValue.increment(pointsDelta) });
    tx.set(transactionRef, {
      id: transactionRef.id,
      userId,
      businessId,
      placeId,
      offerId: offerId ?? null,
      type: transactionType,
      pointsDelta,
      balanceAfter,
      note: note ?? null,
      createdAt: FieldValue.serverTimestamp()
    });
    if (offerId) {
      const orderRef = db.collection("orders").doc();
      tx.set(orderRef, {
        id: orderRef.id,
        userId,
        type: "offer",
        status: "used",
        entityId: offerId,
        entityTitle: "QR kampanya kullanımı",
        businessId,
        placeId,
        pointsDelta,
        amountLabel: "QR",
        createdAt: FieldValue.serverTimestamp(),
        usedAt: FieldValue.serverTimestamp()
      });
    }
    tx.set(db.collection("auditLogs").doc(), {
      actorId: businessId,
      action: "qrTransaction.create",
      entityType: "qrTransaction",
      entityId: transactionRef.id,
      createdAt: FieldValue.serverTimestamp()
    });
  });

  await recordAnalyticsEvent({
    type: "qr_scan",
    entityType: "place",
    entityId: placeId,
    userId,
    platform: "unknown"
  });

  if (offerId) {
    await recordAnalyticsEvent({
      type: "campaign_use",
      entityType: "offer",
      entityId: offerId,
      userId,
      platform: "unknown"
    });
  }

  return { ok: true, transactionId, type: transactionType, balanceAfter };
});

export const createTheaterEvent = onCall(async (request) => {
  assertSignedIn(request.auth?.uid);
  const uid = request.auth!.uid;
  const user = await db.doc(`users/${uid}`).get();
  if (!["theater", "admin"].includes(user.data()?.role)) {
    throw new HttpsError("permission-denied", "Tiyatro yetkisi gerekli.");
  }

  const payload = request.data ?? {};
  const notificationLimit = user.data()?.role === "admin" ? (payload.notificationLimit ?? 3) : 3;
  const ref = await db.collection("events").add({
    ...payload,
    organizerId: payload.organizerId ?? uid,
    notificationLimit,
    notificationUsed: 0,
    status: payload.status ?? "draft",
    createdAt: FieldValue.serverTimestamp()
  });

  return { id: ref.id };
});

export const updateTheaterEvent = onCall(async (request) => {
  assertSignedIn(request.auth?.uid);
  const uid = request.auth!.uid;
  const user = await db.doc(`users/${uid}`).get();
  if (!["theater", "admin"].includes(user.data()?.role)) {
    throw new HttpsError("permission-denied", "Tiyatro yetkisi gerekli.");
  }

  const payload = request.data ?? {};
  const eventId = payload.eventId;
  if (!eventId || typeof eventId !== "string") {
    throw new HttpsError("invalid-argument", "Etkinlik kimliği gerekli.");
  }

  const eventRef = db.doc(`events/${eventId}`);
  const existing = await eventRef.get();
  if (!existing.exists) {
    throw new HttpsError("not-found", "Etkinlik bulunamadı.");
  }

  const existingData = existing.data() ?? {};
  const isAdminUser = user.data()?.role === "admin";
  const isOwnerTheater = user.data()?.role === "theater" && existingData.organizerId === uid;
  if (!isAdminUser && !isOwnerTheater) {
    throw new HttpsError("permission-denied", "Bu etkinliği düzenleme yetkisi yok.");
  }

  await eventRef.set({
    ...payload,
    eventId: undefined,
    organizerId: existingData.organizerId ?? uid,
    categoryId: payload.categoryId ?? payload.type,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: uid
  }, { merge: true });

  return { id: eventId };
});

export const deleteTheaterEvent = onCall(async (request) => {
  assertSignedIn(request.auth?.uid);
  const uid = request.auth!.uid;
  const user = await db.doc(`users/${uid}`).get();
  if (!["theater", "admin"].includes(user.data()?.role)) {
    throw new HttpsError("permission-denied", "Tiyatro yetkisi gerekli.");
  }

  const { eventId } = request.data ?? {};
  if (!eventId || typeof eventId !== "string") {
    throw new HttpsError("invalid-argument", "Etkinlik kimliği gerekli.");
  }

  const eventRef = db.doc(`events/${eventId}`);
  const existing = await eventRef.get();
  if (!existing.exists) {
    throw new HttpsError("not-found", "Etkinlik bulunamadı.");
  }

  const existingData = existing.data() ?? {};
  const isAdminUser = user.data()?.role === "admin";
  const isOwnerTheater = user.data()?.role === "theater" && existingData.organizerId === uid;
  if (!isAdminUser && !isOwnerTheater) {
    throw new HttpsError("permission-denied", "Bu etkinliği silme yetkisi yok.");
  }

  await eventRef.set({
    status: "archived",
    deletedAt: FieldValue.serverTimestamp(),
    deletedBy: uid,
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });

  return { id: eventId };
});

export const sendTheaterEventNotification = onCall(async (request) => {
  assertSignedIn(request.auth?.uid);
  const uid = request.auth!.uid;
  const { eventId, title, body } = request.data ?? {};
  if (!eventId || !title?.tr || !body?.tr) {
    throw new HttpsError("invalid-argument", "Etkinlik, başlık ve bildirim metni gerekli.");
  }

  const user = await db.doc(`users/${uid}`).get();
  const eventRef = db.doc(`events/${eventId}`);
  const event = await eventRef.get();
  if (!event.exists) throw new HttpsError("not-found", "Etkinlik bulunamadı.");
  const eventData = event.data()!;
  const isAdminUser = user.data()?.role === "admin";
  const isOwnerTheater = user.data()?.role === "theater" && eventData.organizerId === uid;
  if (!isAdminUser && !isOwnerTheater) {
    throw new HttpsError("permission-denied", "Bu oyun için bildirim gönderme yetkisi yok.");
  }

  await db.runTransaction(async (tx) => {
    const freshEvent = await tx.get(eventRef);
    const data = freshEvent.data() ?? {};
    const notificationLimit = Number(data.notificationLimit ?? 3);
    const notificationUsed = Number(data.notificationUsed ?? 0);
    if (notificationUsed >= notificationLimit) {
      throw new HttpsError("failed-precondition", "Bu oyun için bildirim hakkı tükendi.");
    }
    tx.update(eventRef, {
      notificationUsed: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp()
    });
  });

  const notificationRef = await db.collection("notifications").add({
    title,
    body,
    target: { kind: "event", eventId },
    status: "sent",
    sentAt: FieldValue.serverTimestamp(),
    createdBy: uid,
    theaterEventId: eventId
  });

  const tokens = await collectTargetTokens({ kind: "event", eventId });
  if (tokens.length > 0) {
    const deliveryBatch = db.batch();
    const deliveries = tokens.map((token) => {
      const deliveryRef = notificationRef.collection("deliveries").doc();
      deliveryBatch.set(deliveryRef, {
        id: deliveryRef.id,
        notificationId: notificationRef.id,
        token,
        status: "queued",
        createdAt: FieldValue.serverTimestamp()
      });
      return { ref: deliveryRef, token };
    });

    const result = await getMessaging().sendEachForMulticast({
      tokens,
      notification: { title: title.tr, body: body.tr },
      data: { notificationId: notificationRef.id, targetKind: "event", eventId }
    });

    result.responses.forEach((response, index) => {
      deliveryBatch.update(deliveries[index].ref, {
        status: response.success ? "sent" : "failed",
        errorMessage: response.error?.message ?? null,
        sentAt: FieldValue.serverTimestamp()
      });
    });
    deliveryBatch.update(notificationRef, { deliveryCount: deliveries.length });
    await deliveryBatch.commit();
  }

  await db.collection("auditLogs").add({
    actorId: uid,
    action: "theater.notification.send",
    entityType: "event",
    entityId: eventId,
    createdAt: FieldValue.serverTimestamp()
  });

  return { id: notificationRef.id };
});

export const adjustTheaterNotificationLimit = onCall(async (request) => {
  await assertAdmin(request.auth?.uid);
  const { eventId, notificationLimit } = request.data ?? {};
  const nextLimit = Number(notificationLimit);
  if (!eventId || !Number.isInteger(nextLimit) || nextLimit < 0 || nextLimit > 20) {
    throw new HttpsError("invalid-argument", "Etkinlik kimliği ve 0-20 arası limit gerekli.");
  }

  const eventRef = db.doc(`events/${eventId}`);
  await db.runTransaction(async (tx) => {
    const event = await tx.get(eventRef);
    if (!event.exists) throw new HttpsError("not-found", "Etkinlik bulunamadı.");
    const used = Number(event.data()?.notificationUsed ?? 0);
    if (nextLimit < used) {
      throw new HttpsError("failed-precondition", "Limit kullanılan bildirim sayısından düşük olamaz.");
    }
    tx.update(eventRef, {
      notificationLimit: nextLimit,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: request.auth?.uid
    });
    tx.set(db.collection("auditLogs").doc(), {
      actorId: request.auth?.uid,
      action: "theater.notificationLimit.update",
      entityType: "event",
      entityId: eventId,
      createdAt: FieldValue.serverTimestamp()
    });
  });

  return { ok: true, eventId, notificationLimit: nextLimit };
});

function buildImportErrors(rows: Array<Record<string, unknown>>) {
  return rows.flatMap((row, index) => {
    const title = readNestedImportValue(row, "title.tr");
    const description = readNestedImportValue(row, "description.tr");
    const messages: string[] = [];
    if (!title) messages.push("Türkçe başlık eksik.");
    if (!description) messages.push("Türkçe açıklama eksik.");
    return messages.map((message) => ({ row: index + 1, message }));
  });
}

function matrixToImportRows(matrix: unknown[][]): Array<Record<string, unknown>> {
  const [headersRow, ...dataRows] = matrix;
  if (!headersRow) return [];
  const headers = headersRow.map((header) => String(header ?? "").trim()).filter(Boolean);
  return dataRows
    .filter((row) => row.some((value) => value !== undefined && value !== null && String(value).trim() !== ""))
    .map((values) => headers.reduce<Record<string, unknown>>((record, header, index) => {
      writeNestedImportValue(record, header, values[index] ?? "");
      return record;
    }, {}));
}

function readNestedImportValue(row: Record<string, unknown>, path: string) {
  return path.split(".").reduce<unknown>((value, key) => {
    if (value && typeof value === "object" && key in value) return (value as Record<string, unknown>)[key];
    return undefined;
  }, row);
}

function writeNestedImportValue(row: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split(".");
  let cursor = row;
  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      cursor[key] = value;
      return;
    }
    if (!cursor[key] || typeof cursor[key] !== "object" || Array.isArray(cursor[key])) cursor[key] = {};
    cursor = cursor[key] as Record<string, unknown>;
  });
}

export const previewImport = onCall(async (request) => {
  await assertAdmin(request.auth?.uid);
  const { rows, kind } = request.data ?? {};
  if (!Array.isArray(rows) || !kind) {
    throw new HttpsError("invalid-argument", "Önizleme için satırlar ve import türü gerekli.");
  }

  const errors = rows.flatMap((row, index) => {
    const messages: string[] = [];
    if (!row.title?.tr) messages.push("Türkçe başlık eksik.");
    if (!row.description?.tr) messages.push("Türkçe açıklama eksik.");
    return messages.map((message) => ({ row: index + 1, message }));
  });

  const ref = await db.collection("imports").add({
    kind,
    rowCount: rows.length,
    errors,
    status: errors.length ? "needs_review" : "ready",
    createdAt: FieldValue.serverTimestamp(),
    createdBy: request.auth?.uid
  });

  return { id: ref.id, errors };
});

export const previewXlsxImport = onCall(async (request) => {
  await assertAdmin(request.auth?.uid);
  const { workbookBase64, kind, sheetName } = request.data ?? {};
  if (!workbookBase64 || !kind) {
    throw new HttpsError("invalid-argument", "XLSX dosyası ve import türü gerekli.");
  }

  const workbook = XLSX.read(Buffer.from(String(workbookBase64), "base64"), { type: "buffer" });
  const selectedSheetName = sheetName && workbook.SheetNames.includes(sheetName) ? sheetName : workbook.SheetNames[0];
  const sheet = workbook.Sheets[selectedSheetName];
  if (!sheet) throw new HttpsError("invalid-argument", "XLSX içinde okunabilir sayfa bulunamadı.");

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
  const rows = matrixToImportRows(matrix);
  const errors = buildImportErrors(rows);

  const ref = await db.collection("imports").add({
    kind,
    format: "xlsx",
    sheetName: selectedSheetName,
    rowCount: rows.length,
    errors,
    status: errors.length ? "needs_review" : "ready",
    createdAt: FieldValue.serverTimestamp(),
    createdBy: request.auth?.uid
  });

  return { id: ref.id, rows, errors };
});

export const commitImport = onCall(async (request) => {
  await assertAdmin(request.auth?.uid);
  await assertRateLimit(request.auth!.uid, "import.commit", 10, 3600);
  const { importId, rows, kind } = request.data ?? {};
  if (!importId || !Array.isArray(rows) || !kind) {
    throw new HttpsError("invalid-argument", "Import kimliği, satırlar ve tür gerekli.");
  }

  const collectionByKind: Record<string, string> = {
    places: "places",
    events: "events",
    theaterPlays: "events",
    offers: "offers",
    categories: "categories"
  };
  const collection = collectionByKind[kind];
  if (!collection) throw new HttpsError("invalid-argument", "Desteklenmeyen import türü.");

  const batch = db.batch();
  rows.forEach((row: Record<string, unknown>, index: number) => {
    const id = typeof row.id === "string" && row.id ? row.id : `${kind}-${Date.now()}-${index}`;
    batch.set(db.doc(`${collection}/${id}`), {
      ...row,
      id,
      status: row.status ?? "draft",
      importedAt: FieldValue.serverTimestamp(),
      importedBy: request.auth?.uid
    }, { merge: true });
  });
  batch.update(db.doc(`imports/${importId}`), {
    status: "committed",
    committedAt: FieldValue.serverTimestamp(),
    committedBy: request.auth?.uid
  });
  batch.set(db.collection("auditLogs").doc(), {
    actorId: request.auth?.uid,
    action: "import.commit",
    entityType: kind,
    entityId: importId,
    createdAt: FieldValue.serverTimestamp()
  });
  await batch.commit();

  return { count: rows.length };
});

export const createExportManifest = onCall(async (request) => {
  await assertAdmin(request.auth?.uid);
  const { kind, format = "csv" } = request.data ?? {};
  if (!kind) throw new HttpsError("invalid-argument", "Export türü gerekli.");

  const ref = await db.collection("exportManifests").add({
    kind,
    format,
    status: "requested",
    requestedAt: FieldValue.serverTimestamp(),
    requestedBy: request.auth?.uid
  });

  await db.collection("auditLogs").add({
    actorId: request.auth?.uid,
    action: "export.request",
    entityType: kind,
    entityId: ref.id,
    createdAt: FieldValue.serverTimestamp()
  });

  return { id: ref.id };
});

function assertLocalizedText(value: unknown, fieldName: string) {
  const text = value as { tr?: unknown; en?: unknown; ru?: unknown; de?: unknown } | undefined;
  if (!text?.tr || typeof text.tr !== "string") {
    throw new HttpsError("invalid-argument", `${fieldName} için Türkçe metin gerekli.`);
  }

  return {
    tr: text.tr,
    en: typeof text.en === "string" && text.en.trim() ? text.en : text.tr,
    ru: typeof text.ru === "string" && text.ru.trim() ? text.ru : text.tr,
    de: typeof text.de === "string" && text.de.trim() ? text.de : text.tr
  };
}

function normalizePublishStatus(status: unknown) {
  const allowed = ["draft", "pending", "published", "archived"];
  return allowed.includes(String(status)) ? String(status) : "draft";
}

export const saveTouristSurvivalKitItem = onCall(async (request) => {
  await assertAdmin(request.auth?.uid);
  const payload = request.data ?? {};
  const id = typeof payload.id === "string" && payload.id.trim() ? payload.id.trim() : "";
  const allowedCategories = ["emergency", "consulate", "hospital", "pharmacy", "transport", "touristInfo"];
  if (!id || !allowedCategories.includes(payload.category)) {
    throw new HttpsError("invalid-argument", "Tourist Survival Kit kimliği ve kategori gerekli.");
  }

  const status = normalizePublishStatus(payload.status);
  await db.doc(`touristSurvivalKit/${id}`).set({
    id,
    category: payload.category,
    title: assertLocalizedText(payload.title, "Başlık"),
    description: assertLocalizedText(payload.description, "Açıklama"),
    phone: typeof payload.phone === "string" && payload.phone.trim() ? payload.phone.trim() : null,
    address: typeof payload.address === "string" && payload.address.trim() ? payload.address.trim() : null,
    location: payload.location ?? null,
    status,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: request.auth?.uid
  }, { merge: true });

  await db.collection("auditLogs").add({
    actorId: request.auth?.uid,
    action: "touristSurvivalKit.upsert",
    entityType: "touristSurvivalKit",
    entityId: id,
    createdAt: FieldValue.serverTimestamp()
  });

  return { id, status };
});

export const saveAncientGuideStop = onCall(async (request) => {
  await assertAdmin(request.auth?.uid);
  const payload = request.data ?? {};
  const id = typeof payload.id === "string" && payload.id.trim() ? payload.id.trim() : "";
  if (!id || !payload.district || !payload.era || !payload.image) {
    throw new HttpsError("invalid-argument", "Antik Rehber kimliği, ilçe, dönem ve görsel gerekli.");
  }

  const status = normalizePublishStatus(payload.status);
  await db.doc(`ancientGuideStops/${id}`).set({
    id,
    title: assertLocalizedText(payload.title, "Başlık"),
    description: assertLocalizedText(payload.description, "Açıklama"),
    district: String(payload.district),
    era: String(payload.era),
    image: String(payload.image),
    location: payload.location ?? null,
    status,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: request.auth?.uid
  }, { merge: true });

  await db.collection("auditLogs").add({
    actorId: request.auth?.uid,
    action: "ancientGuideStop.upsert",
    entityType: "ancientGuideStop",
    entityId: id,
    createdAt: FieldValue.serverTimestamp()
  });

  return { id, status };
});

async function deleteDocumentTree(docRef: DocumentReference) {
  const subcollections = await docRef.listCollections();
  for (const collectionRef of subcollections) {
    const snapshot = await collectionRef.get();
    for (const childDoc of snapshot.docs) {
      await deleteDocumentTree(childDoc.ref);
    }
  }
  await docRef.delete().catch(() => undefined);
}
