"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

async function checkIn(code: string) {
  const res = await fetch("/api/admin/checkin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  }).catch(() => null);
  const body = await res?.json().catch(() => null);
  return res?.ok
    ? { ok: true as const, message: `${body.name} checked in.` }
    : { ok: false as const, message: body?.error ?? "Couldn't reach the server." };
}

export function CheckInButton({ code, large = false }: { code: string; large?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        className={large ? "btn-primary w-full" : "rounded-[3px] bg-tarmac px-3 py-1.5 text-sm font-medium text-white hover:bg-black disabled:opacity-50"}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const r = await checkIn(code);
          setMsg(r.ok ? null : r.message);
          setBusy(false);
          router.refresh();
        }}
      >
        {busy ? "Checking in…" : "Check in"}
      </button>
      {msg && <span className="text-sm text-kerb">{msg}</span>}
    </span>
  );
}

export function CodeCheckIn() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  return (
    <form
      className="flex flex-wrap items-start gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!code.trim()) return;
        const r = await checkIn(code);
        setResult(r);
        if (r.ok) setCode("");
        router.refresh();
      }}
    >
      <label className="sr-only" htmlFor="code">Pass code</label>
      <input
        id="code"
        className="field w-44 uppercase"
        placeholder="RL-XXXXXX"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <button className="btn-dark py-2.5 text-base">Check in</button>
      {result && (
        <p role="status" className={`w-full text-sm font-medium ${result.ok ? "text-pitgreen" : "text-kerb"}`}>
          {result.message}
        </p>
      )}
    </form>
  );
}
