"use client";

import { db } from "@/lib/firebase";
import { type AuditLog, type ErrorLog } from "@nar/core";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { FileWarning, ScrollText } from "lucide-react";
import { useEffect, useState } from "react";

export function SystemLogs() {
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [status, setStatus] = useState("İşlem kayıtları yükleniyor.");

  useEffect(() => {
    let active = true;

    async function loadLogs() {
      try {
        const [errorSnapshot, auditSnapshot] = await Promise.all([
          getDocs(query(collection(db, "errorLogs"), orderBy("createdAt", "desc"), limit(12))),
          getDocs(query(collection(db, "auditLogs"), orderBy("createdAt", "desc"), limit(12)))
        ]);
        if (!active) return;

        const liveErrors = errorSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as ErrorLog);
        const liveAudits = auditSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as AuditLog);
        setErrorLogs(liveErrors);
        setAuditLogs(liveAudits);
        setStatus(liveErrors.length || liveAudits.length ? "Canlı işlem kayıtları kullanılıyor." : "Henüz işlem kaydı yok.");
      } catch (error) {
        if (!active) return;
        setErrorLogs([]);
        setAuditLogs([]);
        setStatus(error instanceof Error ? error.message : "İşlem kayıtları yüklenemedi.");
      }
    }

    void loadLogs();

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="system-logs">
      <p className="meta" aria-live="polite">{status}</p>
      <div className="log-block">
        <div className="stats-head">
          <FileWarning size={22} />
          <div>
            <h2>Hata Kayıtları</h2>
            <p>Uygulama hataları ve beklenmeyen işlem sonuçları burada izlenir.</p>
          </div>
        </div>
        <div className="log-list">
          {errorLogs.length === 0 ? (
            <article>
              <strong>Henüz hata kaydı yok</strong>
              <span>Yeni bir kayıt oluştuğunda burada görünür.</span>
            </article>
          ) : errorLogs.map((log) => (
            <article key={log.id}>
              <strong>{log.severity} · {log.source}</strong>
              <span>{log.message}</span>
            </article>
          ))}
        </div>
      </div>
      <div className="log-block">
        <div className="stats-head">
          <ScrollText size={22} />
          <div>
            <h2>İşlem Geçmişi</h2>
            <p>Onay, içe aktarım, QR, görev ve panel aksiyonları burada izlenir.</p>
          </div>
        </div>
        <div className="log-list">
          {auditLogs.length === 0 ? (
            <article>
              <strong>Henüz işlem kaydı yok</strong>
              <span>Panelde yapılan işlemler burada görünür.</span>
            </article>
          ) : auditLogs.map((log) => (
            <article key={log.id}>
              <strong>{log.action}</strong>
              <span>{log.entityType} · {log.entityId} · {log.actorId ?? "sistem"}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
