"use client";

import { useLocale } from "@/components/LocaleProvider";
import { firebaseApp } from "@/lib/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import { MessagesSquare } from "lucide-react";
import { useState } from "react";
import { SectionEyebrow } from "./SectionEyebrow";

const functions = getFunctions(firebaseApp);

export function ContactForm() {
  const { t } = useLocale();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("business");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  async function submit() {
    setStatus(t("contact.sending"));
    try {
      const call = httpsCallable(functions, "createContactRequest");
      await call({ name, email, subject, message });
      setStatus(t("contact.success"));
      setName("");
      setEmail("");
      setMessage("");
    } catch (error) {
      setStatus(error instanceof Error && error.message ? error.message : t("contact.error"));
    }
  }

  return (
    <div className="contact-form">
      <div>
        <SectionEyebrow icon={MessagesSquare}>{t("contact.eyebrow")}</SectionEyebrow>
        <h2>{t("contact.title")}</h2>
      </div>
      <label>
        {t("contact.name")}
        <input placeholder={t("contact.placeholder.name")} value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label>
        {t("contact.email")}
        <input placeholder={t("contact.placeholder.email")} type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <label>
        {t("contact.subject")}
        <select value={subject} onChange={(event) => setSubject(event.target.value)}>
          <option value="business">{t("contact.subject.business")}</option>
          <option value="theater">{t("contact.subject.theater")}</option>
          <option value="city">{t("contact.subject.city")}</option>
          <option value="support">{t("contact.subject.support")}</option>
        </select>
      </label>
      <label>
        {t("contact.message")}
        <textarea placeholder={t("contact.placeholder.message")} rows={5} value={message} onChange={(event) => setMessage(event.target.value)} />
      </label>
      <button className="primary" disabled={!name || !email || !message} type="button" onClick={submit}>{t("contact.send")}</button>
      {status ? <p className="meta">{status}</p> : null}
    </div>
  );
}
