"use client";

import { useState } from "react";

export function GroupEnquiry() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setState("sending");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).catch(() => null);
    if (res?.ok) return setState("sent");
    const body = await res?.json().catch(() => null);
    setError(body?.error ?? "The enquiry didn't send. Check your connection and try again.");
    setState("idle");
  }

  if (state === "sent")
    return (
      <div className="self-center">
        <p className="font-display text-3xl font-semibold">Enquiry sent.</p>
        <p className="mt-2 text-tarmac/80">The events desk will reply within one working day.</p>
      </div>
    );

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="company">Company or group</label>
        <input className="field" id="company" name="company" required />
      </div>
      <div>
        <label className="label" htmlFor="lname">Your name</label>
        <input className="field" id="lname" name="name" autoComplete="name" required />
      </div>
      <div>
        <label className="label" htmlFor="groupSize">People</label>
        <input className="field" id="groupSize" name="groupSize" type="number" min={6} max={400} defaultValue={20} required />
      </div>
      <div>
        <label className="label" htmlFor="lemail">Email</label>
        <input className="field" id="lemail" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <label className="label" htmlFor="lphone">Phone</label>
        <input className="field" id="lphone" name="phone" type="tel" autoComplete="tel" required />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="preferredDate">Preferred date <span className="font-normal text-steel">(optional)</span></label>
        <input className="field" id="preferredDate" name="preferredDate" type="date" />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="notes">What are you planning? <span className="font-normal text-steel">(optional)</span></label>
        <textarea className="field min-h-24" id="notes" name="notes" />
      </div>
      {error && <p role="alert" className="text-sm font-medium text-kerb sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <button className="btn-dark" disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : "Send enquiry"}
        </button>
      </div>
    </form>
  );
}
