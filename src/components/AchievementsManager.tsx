"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/lib/i18n/types";

type AchievementType = "HACKATHON" | "OLYMPIAD" | "COMPETITION" | "CONFERENCE" | "COURSE" | "OTHER";

export type AchievementItem = {
  id: string;
  title: string;
  eventName: string;
  type: AchievementType;
  achievedAt: string; // ISO
  description: string | null;
  certificateId: string | null;
  certificateApproved: boolean;
};

const TYPES: AchievementType[] = ["HACKATHON", "OLYMPIAD", "COMPETITION", "CONFERENCE", "COURSE", "OTHER"];

export function AchievementsManager({
  items,
  certificates,
  locale,
  dict,
}: {
  items: AchievementItem[];
  certificates: { id: string; title: string }[];
  locale: string;
  dict: Dictionary["achievements"];
}) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState("");
  const [eventName, setEventName] = useState("");
  const [type, setType] = useState<AchievementType>("HACKATHON");
  const [achievedAt, setAchievedAt] = useState(today);
  const [description, setDescription] = useState("");
  const [certificateId, setCertificateId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const TYPE_LABEL: Record<AchievementType, string> = {
    HACKATHON: dict.typeHackathon,
    OLYMPIAD: dict.typeOlympiad,
    COMPETITION: dict.typeCompetition,
    CONFERENCE: dict.typeConference,
    COURSE: dict.typeCourse,
    OTHER: dict.typeOther,
  };

  async function add(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          eventName,
          type,
          achievedAt,
          description: description || undefined,
          certificateId: certificateId || undefined,
        }),
      });
      if (!res.ok) {
        setError(dict.addError);
        return;
      }
      setTitle("");
      setEventName("");
      setDescription("");
      setCertificateId("");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/achievements/${id}`, { method: "DELETE" });
    router.refresh();
  }

  const dateFmt = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "en" ? "en-GB" : locale === "kk" ? "kk-KZ" : "ru-RU", {
      month: "long",
      year: "numeric",
    });

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-medium text-rose-700 dark:text-rose-200">{dict.title}</h2>
        <p className="text-sm text-muted">{dict.subtitle}</p>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {items.length === 0 && <li className="text-sm text-muted">{dict.empty}</li>}
        {items.map((a) => (
          <li key={a.id} className="card flex flex-col gap-1">
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium">{a.title}</span>
              <button
                type="button"
                onClick={() => remove(a.id)}
                aria-label={dict.delete}
                className="text-rose-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-muted">{a.eventName}</p>
            <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-rose-700">{TYPE_LABEL[a.type]}</span>
              <span>{dateFmt(a.achievedAt)}</span>
              {a.certificateApproved && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-800">✓ {dict.verified}</span>
              )}
            </p>
            {a.description && <p className="text-sm">{a.description}</p>}
            {a.certificateId && (
              <a href={`/api/certificates/${a.certificateId}/file`} target="_blank" rel="noreferrer" className="text-sm underline">
                {dict.viewCertificate}
              </a>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={add} className="card flex flex-col gap-3 hover:translate-y-0 hover:shadow-none">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            {dict.titleLabel}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={120}
              placeholder={dict.titlePlaceholder}
              className="input-field"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {dict.eventLabel}
            <input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              required
              maxLength={120}
              placeholder={dict.eventPlaceholder}
              className="input-field"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {dict.typeLabel}
            <select value={type} onChange={(e) => setType(e.target.value as AchievementType)} className="input-field">
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {dict.dateLabel}
            <input
              type="date"
              value={achievedAt}
              max={today}
              onChange={(e) => setAchievedAt(e.target.value)}
              required
              className="input-field"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          {dict.descriptionLabel}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={2}
            className="input-field"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {dict.certificateLabel}
          <select value={certificateId} onChange={(e) => setCertificateId(e.target.value)} className="input-field">
            <option value="">{dict.certificateNone}</option>
            {certificates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted">{dict.certificateHint}</span>
        </label>
        <button type="submit" disabled={pending} className="btn-primary self-start">
          {dict.add}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </section>
  );
}
