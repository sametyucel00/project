"use client";

import { auth, db } from "@/lib/firebase";
import { updateOrderStatus } from "@/lib/panel-actions";
import { type NarOrder, type OrderStatus, type QrTransaction, type UserRole } from "@nar/core";
import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { ReceiptText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const orderStatuses: OrderStatus[] = ["created", "confirmed", "used", "cancelled"];
const orderStatusLabels: Record<OrderStatus, string> = {
  created: "Oluşturuldu",
  confirmed: "Onaylandı",
  used: "Kullanıldı",
  cancelled: "İptal edildi",
  refunded: "İade edildi"
};

const orderTypeLabels: Record<string, string> = {
  ticket: "Bilet",
  offer: "Fırsat",
  product: "Ürün"
};

export function OrdersOps({ role }: { role: UserRole }) {
  if (role === "theater") return null;
  const [liveOrders, setLiveOrders] = useState<NarOrder[]>([]);
  const [liveQrTransactions, setLiveQrTransactions] = useState<QrTransaction[]>([]);
  const [statusMessage, setStatusMessage] = useState("Sipariş ve QR geçmişi yükleniyor.");
  const title = role === "admin" ? "Siparişler ve Kullanımlar" : role === "business" ? "İşletme Kullanım Geçmişi" : "Siparişlerim";

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    const orderQuery = role === "individual" && uid
      ? query(collection(db, "orders"), where("userId", "==", uid), limit(24))
      : query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(24));
    const qrQuery = role === "individual" && uid
      ? query(collection(db, "qrTransactions"), where("userId", "==", uid), limit(24))
      : query(collection(db, "qrTransactions"), orderBy("createdAt", "desc"), limit(24));

    const unsubscribeOrders = onSnapshot(orderQuery, (snapshot) => {
      setLiveOrders(sortByCreatedAtDesc(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as NarOrder)));
      setStatusMessage("Canlı geçmiş kullanılıyor.");
    }, (error) => setStatusMessage(error.message));

    const unsubscribeQr = onSnapshot(qrQuery, (snapshot) => {
      setLiveQrTransactions(sortByCreatedAtDesc(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as QrTransaction)));
    }, (error) => setStatusMessage(error.message));

    return () => {
      unsubscribeOrders();
      unsubscribeQr();
    };
  }, [role]);

  const orders = useMemo(
    () => role === "business" ? liveOrders.filter((order) => order.businessId) : liveOrders,
    [liveOrders, role]
  );
  const qrTransactions = useMemo(
    () => role === "business" ? liveQrTransactions.filter((transaction) => transaction.businessId) : liveQrTransactions,
    [liveQrTransactions, role]
  );

  async function changeOrderStatus(orderId: string, status: OrderStatus) {
    setStatusMessage("Sipariş durumu güncelleniyor.");
    try {
      await updateOrderStatus({ orderId, status });
      setStatusMessage(`Sipariş durumu ${orderStatusLabels[status]} olarak güncellendi.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Sipariş durumu güncellenemedi.");
    }
  }

  return (
    <section className="orders-ops" id="orders">
      <div className="stats-head">
        <ReceiptText size={22} />
        <div>
          <h2>{title}</h2>
          <p>Bilet yönlendirmeleri, fırsat kullanımları, QR puan hareketleri ve kampanya doğrulamaları burada izlenir.</p>
        </div>
      </div>
      <div className="orders-list">
        {orders.length ? orders.map((order) => (
          <article key={order.id}>
            <div>
              <strong>{order.entityTitle}</strong>
              <span>{orderTypeLabels[order.type] ?? order.type} · {orderStatusLabels[order.status] ?? order.status} · {order.amountLabel ?? "Belirtilmemiş"}</span>
              <span>{order.type === "ticket" ? "Bilet yönlendirmesi" : "Kampanya kullanımı"} · {order.id}</span>
            </div>
            <div className="workflow-actions">
              {orderStatuses.map((status) => (
                <button key={status} onClick={() => changeOrderStatus(order.id, status)}>{orderStatusLabels[status]}</button>
              ))}
            </div>
            <small>{formatDate(order.createdAt)}</small>
          </article>
        )) : <p className="meta">Henüz sipariş kaydı yok.</p>}
      </div>
      <p className="meta" aria-live="polite">{statusMessage}</p>
      <div className="orders-list" aria-label="QR işlem geçmişi">
        {qrTransactions.length ? qrTransactions.map((transaction) => (
          <article key={transaction.id}>
            <div>
              <strong>{transaction.type === "earn" ? "Puan kazanımı" : transaction.offerId ? "Kampanya kullanımı" : "Puan harcama"}</strong>
              <span>{transaction.placeId} · {transaction.pointsDelta} puan · bakiye {transaction.balanceAfter ?? "Belirtilmemiş"}</span>
              <span>{transaction.note ?? "Not belirtilmemiş"}</span>
            </div>
            <small>{formatDate(transaction.createdAt)}</small>
          </article>
        )) : <p className="meta">Henüz QR işlem kaydı yok.</p>}
      </div>
    </section>
  );
}

function formatDate(value?: unknown) {
  if (!value) return "Belirtilmemiş";
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
    }
    return value;
  }
  if (typeof value === "object" && value && "toDate" in value && typeof value.toDate === "function") {
    return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(value.toDate());
  }
  return "Belirtilmemiş";
}

function sortByCreatedAtDesc<T extends { createdAt?: unknown }>(items: T[]) {
  return [...items].sort((first, second) => getDateMillis(second.createdAt) - getDateMillis(first.createdAt));
}

function getDateMillis(value?: unknown) {
  if (!value) return 0;
  if (typeof value === "string") {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === "object" && value && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().getTime();
  }
  return 0;
}
