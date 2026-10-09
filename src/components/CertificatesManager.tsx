"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { format } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/types";

type Status = "PENDING" | "APPROVED" | "REJECTED";

export type CertificateItem = {
  id: string;
  title: string;
  status: Status;
  reviewNote: string | null;
  skillName: string | null;
  reviewerName: string | null;
};

const MAX_BYTES = 3 * 1024 * 1024;

const STATUS_STYLE: Record<Status, string> = {
  PENDING: "badge-warning",
  APPROVED: "badge-success",
  REJECTED: "badge-danger",
};

export function CertificatesManager({
  items,
  skills,
  dict,
}: {
  items: CertificateItem[];
  skills: { id: string; name: string }[];
  dict: Dictionary["certs"];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [skillId, setSkillId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const STATUS_LABEL: Record<Status, string> = {
    PENDING: dict.statusPending,
    APPROVED: dict.statusApproved,
    REJECTED: dict.statusRejected,
  };

  async function upload(e: FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file || !title.trim()) return;
    if (file.size > MAX_BYTES) {
      setError(dict.tooBig);
      return;
    }

    setPending(true);
    setError(null);
    try {
      const body = new FormData();
      body.set("title", title.trim());
      body.set("skillId", skillId);
      body.set("file", file);
      const res = await fetch("/api/certificates", { method: "POST", body });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error === "too_big" ? dict.tooBig : data.error === "bad_type" ? dict.badType : dict.uploadError);
        return;
      }
      setTitle("");
      setSkillId("");
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/certificates/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-medium text-rose-700 dark:text-rose-200">{dict.title}</h2>
        <p className="text-sm text-muted">{dict.subtitle}</p>
      </div>

      <ul className="flex flex-col gap-2">
        {items.length === 0 && <li className="text-sm text-muted">{dict.empty}</li>}
        {items.map((c) => (
          <li key={c.id} className="card flex flex-col gap-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">{c.title}</span>
              <span className={`text-xs font-medium ${STATUS_STYLE[c.status]}`}>
                {STATUS_LABEL[c.status]}
              </span>
            </div>
            {c.skillName && <p className="text-sm text-muted">{format(dict.forSkill, { skill: c.skillName })}</p>}
            {c.reviewNote && (
              <p className="text-sm text-muted">
                {dict.noteLabel}: {c.reviewNote}
              </p>
            )}
            {c.reviewerName && c.status !== "PENDING" && (
              <p className="text-xs text-muted">{format(dict.reviewedBy, { name: c.reviewerName })}</p>
            )}
            <div className="flex items-center gap-3 text-sm">
              <a href={`/api/certificates/${c.id}/file`} target="_blank" rel="noreferrer" className="underline">
                {dict.view}
              </a>
              <button type="button" onClick={() => remove(c.id)} className="text-rose-500 hover:text-red-600">
                {dict.delete}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={upload} className="card flex flex-col gap-3 hover:translate-y-0 hover:shadow-none">
        <label className="flex flex-col gap-1 text-sm">
          {dict.titleLabel}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            required
            placeholder={dict.titlePlaceholder}
            className="input-field"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {dict.skillLabel}
          <select value={skillId} onChange={(e) => setSkillId(e.target.value)} className="input-field">
            <option value="">{dict.skillNone}</option>
            {skills.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {dict.fileLabel}
          <input ref={fileRef} type="file" required accept="application/pdf,image/jpeg,image/png" className="text-sm" />
        </label>
        <button type="submit" disabled={pending} className="btn-primary self-start">
          {pending ? dict.uploading : dict.upload}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </section>
  );
}
