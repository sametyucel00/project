"use client";

import { db } from "@/lib/firebase";
import { collection, getDocs, limit, orderBy, query, Timestamp } from "firebase/firestore";
import { Mail, MailOpen, MessageSquareText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "./LocaleProvider";

type ContactRequest = {
  id: string;
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  status?: string;
  createdAt?: Timestamp | { toDate?: () => Date } | string | null;
};

const copy = {
  tr: {
    title: "İletişim Mesajları",
    lead: "İletişim formundan gelen kayıtlar burada görünür.",
    loading: "Mesajlar yükleniyor.",
    empty: "Henüz mesaj yok.",
    newLabel: "Yeni",
    readLabel: "Okundu",
    openLabel: "E-postayı aç",
    sender: "Gönderen",
    email: "E-posta",
    subject: "Konu",
    message: "Mesaj",
    date: "Tarih"
  },
  en: {
    title: "Contact Messages",
    lead: "Messages sent from the contact form appear here.",
    loading: "Loading messages.",
    empty: "No messages yet.",
    newLabel: "New",
    readLabel: "Read",
    openLabel: "Open email",
    sender: "Sender",
    email: "Email",
    subject: "Subject",
    message: "Message",
    date: "Date"
  },
  ru: {
    title: "Сообщения обратной связи",
    lead: "Заявки из формы обратной связи отображаются здесь.",
    loading: "Загрузка сообщений.",
    empty: "Пока сообщений нет.",
    newLabel: "Новое",
    readLabel: "Прочитано",
    openLabel: "Открыть почту",
    sender: "Отправитель",
    email: "Почта",
    subject: "Тема",
    message: "Сообщение",
    date: "Дата"
  },
  de: {
    title: "Kontaktnachrichten",
    lead: "Nachrichten aus dem Kontaktformular erscheinen hier.",
    loading: "Nachrichten werden geladen.",
    empty: "Noch keine Nachrichten.",
    newLabel: "Neu",
    readLabel: "Gelesen",
    openLabel: "E-Mail öffnen",
    sender: "Absender",
    email: "E-Mail",
    subject: "Betreff",
    message: "Nachricht",
    date: "Datum"
  }
} as const;

export function ContactInbox() {
  const { locale, t } = useLocale();
  const text = copy[locale];
  const [items, setItems] = useState<ContactRequest[]>([]);
  const [status, setStatus] = useState<string>(text.loading);

  useEffect(() => {
    let active = true;

    async function loadContactRequests() {
      try {
        const snapshot = await getDocs(query(collection(db, "contactRequests"), orderBy("createdAt", "desc"), limit(24)));
        if (!active) return;
        setItems(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as ContactRequest));
        setStatus(snapshot.size > 0 ? text.title : text.empty);
      } catch (error) {
        if (!active) return;
        setItems([]);
        setStatus(error instanceof Error ? error.message : text.empty);
      }
    }

    void loadContactRequests();

    return () => {
      active = false;
    };
  }, [text.empty, text.title]);

  const unreadCount = useMemo(() => items.filter((item) => item.status !== "read").length, [items]);

  return (
    <section className="system-logs" id="contact-inbox">
      <p className="meta" aria-live="polite">{status}</p>
      <div className="log-block">
        <div className="stats-head">
          <MessageSquareText size={22} />
          <div>
            <h2>{text.title}</h2>
            <p>{text.lead}</p>
          </div>
        </div>

        <div className="notification-metrics">
          <article>
            <span>{text.newLabel}</span>
            <strong>{String(unreadCount)}</strong>
            <small>{items.length ? `${items.length} kayıt` : t("common.noContent")}</small>
          </article>
          <article>
            <span>{text.readLabel}</span>
            <strong>{String(items.length - unreadCount)}</strong>
            <small>{items.length ? "İşlenmiş mesajlar" : "Henüz işlenmiş kayıt yok"}</small>
          </article>
        </div>

        <div className="scheduled-list" aria-label={text.title}>
          {items.length === 0 ? (
            <article>
              <Mail size={18} />
              <div>
                <strong>{text.empty}</strong>
                <span>{text.lead}</span>
              </div>
            </article>
          ) : items.map((item) => (
            <article key={item.id}>
              <MailOpen size={18} />
              <div>
                <strong>{item.subject || text.subject}</strong>
                <span>
                  {text.sender}: {item.name || t("common.unspecified")} · {text.email}: {item.email || t("common.unspecified")}
                </span>
                <span>
                  {text.message}: {item.message || t("common.unspecified")}
                </span>
                <span>{text.date}: {formatContactDate(item.createdAt)}</span>
                {item.email ? (
                  <a href={`mailto:${item.email}`} className="secondary" style={{ width: "fit-content", marginTop: 6 }}>
                    {text.openLabel}
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function formatContactDate(value?: ContactRequest["createdAt"]) {
  if (!value) return "Belirtilmemiş";
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(value.toDate());
  }
  return "Belirtilmemiş";
}
