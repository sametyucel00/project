"use client";

import { approvalQueue, businessDraftTemplates, contentLifecycleStates, theaterDraftTemplates, userTasks, type UserRole } from "@nar/core";
import { completeUserTask, reviewApproval, submitForApproval } from "@/lib/panel-actions";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

export function WorkflowOps({ role }: { role: UserRole }) {
  if (role === "admin") return <ApprovalQueue />;
  if (role === "business") return <DraftTemplates title="İşletme Taslakları" templates={businessDraftTemplates} entityType="place" />;
  if (role === "theater") return <DraftTemplates title="Tiyatro Taslakları" templates={theaterDraftTemplates} entityType="event" />;
  return <TaskCompletion />;
}

function ApprovalQueue() {
  const [items, setItems] = useState(approvalQueue);
  const [reviewNote, setReviewNote] = useState("Metin ve görseller kontrol edildi.");
  const [rejectionReason, setRejectionReason] = useState("Eksik görsel veya Türkçe açıklama düzenlenmeli.");
  const [status, setStatus] = useState("Onay kuyruğu yükleniyor.");

  useEffect(() => {
    let active = true;
    async function loadQueue() {
      try {
        const snapshot = await getDocs(query(
          collection(db, "approvalQueue"),
          where("status", "==", "pendingReview"),
          orderBy("submittedAt", "desc"),
          limit(24)
        ));
        if (!active) return;
        const liveItems = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })) as typeof approvalQueue;
        setItems(liveItems.length ? liveItems : approvalQueue);
        setStatus(liveItems.length ? "Canlı onay kuyruğu kullanılıyor." : "Onay kuyruğunda bekleyen kayıt yok.");
      } catch (error) {
        if (!active) return;
        setItems(approvalQueue);
        setStatus(error instanceof Error ? error.message : "Onay kuyruğu yüklenemedi.");
      }
    }
    void loadQueue();
    return () => {
      active = false;
    };
  }, []);

  async function review(approvalId: string, decision: "approved" | "rejected") {
    setStatus("Karar gönderiliyor.");
    try {
      await reviewApproval({
        approvalId,
        decision,
        note: reviewNote,
        rejectionReason: decision === "rejected" ? rejectionReason : undefined
      });
      setItems((current) => current.filter((item) => item.id !== approvalId));
      setStatus(decision === "approved" ? "İçerik onaylandı." : "İçerik reddedildi.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Karar kaydedilemedi.");
    }
  }

  return (
    <section className="workflow" id="approvals">
      <h2>İçerik Onay Kuyruğu</h2>
      <div className="role-flow" aria-label="İçerik yaşam döngüsü">
        {contentLifecycleStates.map((state) => <span key={state.id}>{state.label}</span>)}
      </div>
      <div className="mini-form">
        <label>
          İnceleme notu
          <input value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} />
        </label>
        <label>
          Red sebebi
          <input value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} />
        </label>
      </div>
      <div className="workflow-list">
        {items.map((item) => (
          <article key={item.id}>
            <div>
              <strong>{item.title}</strong>
              <span>{item.entityType} · {item.status} · {item.note}</span>
              <span>{item.rejectionReason ?? "Red sebebi yok"}</span>
            </div>
            <div className="workflow-actions">
              <button onClick={() => review(item.id, "approved")}>Onayla</button>
              <button onClick={() => review(item.id, "rejected")}>Reddet</button>
            </div>
          </article>
        ))}
      </div>
      <p className="meta">{status}</p>
    </section>
  );
}

function DraftTemplates({ title, templates, entityType }: { title: string; templates: Array<{ id: string; title: string; fields: string[] }>; entityType: "place" | "event" }) {
  const [status, setStatus] = useState("Taslaklar onay akışına hazır.");

  async function submit(templateId: string) {
    setStatus("Onay isteği gönderiliyor.");
    try {
      await submitForApproval({
        entityType,
        entityId: `draft-${templateId}`,
        title: `${title}: ${templateId}`,
        note: "Panel taslak onay isteği."
      });
      setStatus("Onay kuyruğuna gönderildi.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Onay isteği gönderilemedi.");
    }
  }

  return (
    <section className="workflow" id={entityType === "place" ? "new" : "preview"}>
      <h2>{title}</h2>
      <div className="role-flow" aria-label="Taslak yayın akışı">
        {contentLifecycleStates.map((state) => <span key={state.id}>{state.label}</span>)}
      </div>
      <div className="workflow-list">
        {templates.map((template) => (
          <article key={template.id}>
            <div>
              <strong>{template.title}</strong>
              <span>{template.fields.join(" · ")}</span>
            </div>
            <div className="workflow-actions">
              <button onClick={() => submit(template.id)}>Onaya gönder</button>
            </div>
          </article>
        ))}
      </div>
      <p className="meta">{status}</p>
    </section>
  );
}

function TaskCompletion() {
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState("Görevler tamamlanmaya hazır.");

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setStatus("Görevleri tamamlamak için giriş yapmalısın.");
      return;
    }
    const unsubscribe = onSnapshot(collection(db, `users/${uid}/taskCompletions`), (snapshot) => {
      setCompletedTaskIds(new Set(snapshot.docs.map((entry) => entry.id)));
      setStatus(snapshot.empty ? "Tamamlanmayı bekleyen görevler var." : "Görev durumu güncellendi.");
    }, (error) => {
      setStatus(error.message);
    });
    return unsubscribe;
  }, []);

  async function complete(taskId: string, rewardPoints: number, badgeId?: string) {
    if (completedTaskIds.has(taskId)) {
      setStatus("Bu görev zaten tamamlandı.");
      return;
    }
    setStatus("Görev tamamlanıyor.");
    try {
      await completeUserTask({ taskId, rewardPoints, badgeId });
      setCompletedTaskIds((current) => new Set([...current, taskId]));
      setStatus("Görev tamamlandı, puan işlendi.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Görev tamamlanamadı.");
    }
  }

  return (
    <section className="workflow" id="tasks">
      <h2>Görev Tamamlama</h2>
      <div className="workflow-list">
        {userTasks.map((task) => {
          const completed = completedTaskIds.has(task.id);
          return (
            <article key={task.id}>
              <div>
                <strong>{task.title.tr}</strong>
                <span>{task.description.tr} · {task.rewardPoints} puan</span>
                {completed ? <span>Tamamlandı</span> : null}
              </div>
              <div className="workflow-actions">
                <button disabled={completed} onClick={() => complete(task.id, task.rewardPoints, task.badgeId)}>
                  {completed ? "Tamamlandı" : "Tamamla"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <p className="meta">{status}</p>
    </section>
  );
}
