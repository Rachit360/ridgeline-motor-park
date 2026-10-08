"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Experience } from "@/lib/experiences";

type Slot = { time: string; capacity: number; remaining: number; past: boolean };
type Hold = { id: string; expiresAt: number };

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
const dayLabel = (d: string) => {
  const date = new Date(d + "T00:00:00Z");
  return {
    weekday: date.toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" }),
    day: date.getUTCDate(),
    month: date.toLocaleDateString("en-IN", { month: "short", timeZone: "UTC" }),
  };
};

const STEPS = ["Session", "Driver and car", "Waiver and payment"];

export function BookingFlow({
  experiences,
  initialExperience,
  dates,
}: {
  experiences: Experience[];
  initialExperience: string;
  dates: string[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [experienceId, setExperienceId] = useState(initialExperience);
  const [date, setDate] = useState(dates[0]);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [hold, setHold] = useState<Hold | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", licenceNumber: "",
    make: "", model: "", year: "", registration: "",
    offroadConfirmed: false, accepted: false, signedName: "",
  });

  const exp = useMemo(() => experiences.find((e) => e.id === experienceId)!, [experiences, experienceId]);

  const loadSlots = useCallback(async () => {
    setSlots(null);
    const res = await fetch(`/api/availability?experience=${experienceId}&date=${date}`, { cache: "no-store" }).catch(() => null);
    const body = await res?.json().catch(() => null);
    if (!res?.ok) {
      setError(body?.error ?? "Couldn't load sessions. Check your connection.");
      setSlots([]);
      return;
    }
    setSlots(body.slots);
  }, [experienceId, date]);

  useEffect(() => {
    if (step === 0) loadSlots();
  }, [loadSlots, step]);

  // Hold countdown. When it hits zero the server has released the place too.
  useEffect(() => {
    if (!hold) return;
    const tick = () => {
      const s = Math.max(0, Math.round((hold.expiresAt - Date.now()) / 1000));
      setSecondsLeft(s);
      if (s === 0) {
        setHold(null);
        setTime(null);
        setStep(0);
        setError("Your 10-minute hold ran out and the place was released. Choose a session again.");
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [hold]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  async function chooseSlot(t: string) {
    setError(null);
    setBusy(true);
    setTime(t);
    const res = await fetch("/api/holds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ experienceId, date, time: t }),
    }).catch(() => null);
    const body = await res?.json().catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      setTime(null);
      setError(body?.error ?? "Couldn't hold that session. Try again.");
      loadSlots();
      return;
    }
    setHold({ id: body.holdId, expiresAt: new Date(body.expiresAt).getTime() });
    setStep(1);
  }

  async function changeSession() {
    if (hold) fetch(`/api/holds?id=${hold.id}`, { method: "DELETE" }).catch(() => {});
    setHold(null);
    setTime(null);
    setStep(0);
  }

  function driverNext(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (exp.needsOffroadVehicle && !form.offroadConfirmed)
      return setError("The dirt trail needs an SUV or 4x4 with low-range or terrain modes. Confirm your car qualifies.");
    setStep(2);
  }

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (!hold) return;
    setError(null);
    setBusy(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        holdId: hold.id,
        driver: { name: form.name, email: form.email, phone: form.phone, licenceNumber: form.licenceNumber },
        car: { make: form.make, model: form.model, year: form.year, registration: form.registration },
        waiver: { accepted: form.accepted, signedName: form.signedName },
        payment: { method: "demo" },
      }),
    }).catch(() => null);
    const body = await res?.json().catch(() => null);
    if (res?.ok) {
      router.push(`/pass/${body.code}?new=1`);
      return;
    }
    setBusy(false);
    setError(body?.error ?? "Payment didn't go through. Try again.");
    if (res?.status === 410) {
      setHold(null);
      setTime(null);
      setStep(0);
    } else if (body?.fields?.driver || body?.fields?.car) {
      setStep(1);
    }
  }

  const mm = String(Math.floor(secondsLeft / 60));
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="mt-6">
      {/* Progress as a kerb: each completed step fills its segment. */}
      <ol className="grid grid-cols-3 gap-1.5">
        {STEPS.map((label, i) => (
          <li key={label}>
            <div className={`h-2 rounded-[1px] ${i < step ? "bg-tarmac" : i === step ? "kerb" : "bg-line"}`} />
            <p className={`mt-2 text-sm ${i === step ? "font-semibold" : "text-steel"}`}>
              {i + 1}. {label}
            </p>
          </li>
        ))}
      </ol>

      {hold && step > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[3px] bg-tarmac px-4 py-3 text-white">
          <p>
            <span className="font-display text-lg font-semibold">{exp.name}</span>
            <span className="text-white/70">, {dayLabel(date).weekday} {dayLabel(date).day} {dayLabel(date).month} at {time}</span>
          </p>
          <p className="flex items-center gap-4 text-sm">
            <span>
              Place held for{" "}
              <span className={`font-display text-lg font-semibold tabular-nums ${secondsLeft < 120 ? "text-flag" : ""}`}>
                {mm}:{ss}
              </span>
            </span>
            <button onClick={changeSession} className="underline">Change session</button>
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-6 rounded-[3px] border-l-4 border-kerb bg-paper px-4 py-3 font-medium">
          {error}
        </p>
      )}

      {step === 0 && (
        <div className="mt-8 space-y-10">
          <fieldset>
            <legend className="font-display text-2xl font-semibold">Experience</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {experiences.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => { setExperienceId(e.id); setError(null); }}
                  aria-pressed={e.id === experienceId}
                  className={`rounded-[3px] border px-4 py-3 text-left transition-colors ${
                    e.id === experienceId ? "border-tarmac bg-tarmac text-white" : "border-line bg-paper hover:border-tarmac"
                  }`}
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-display text-xl font-semibold">{e.name}</span>
                    <span className="tabular-nums">{inr(e.price)}</span>
                  </span>
                  <span className={`text-sm ${e.id === experienceId ? "text-white/70" : "text-steel"}`}>{e.duration}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="font-display text-2xl font-semibold">Date</legend>
            <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-2">
              {dates.map((d) => {
                const l = dayLabel(d);
                const on = d === date;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => { setDate(d); setError(null); }}
                    aria-pressed={on}
                    className={`min-w-[4.25rem] shrink-0 rounded-[3px] border px-2 py-2 text-center ${
                      on ? "border-tarmac bg-tarmac text-white" : "border-line bg-paper hover:border-tarmac"
                    }`}
                  >
                    <span className="block text-xs">{l.weekday}</span>
                    <span className="block font-display text-2xl font-semibold leading-tight">{l.day}</span>
                    <span className="block text-xs">{l.month}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="font-display text-2xl font-semibold">Session time</legend>
            <p className="mt-1 text-sm text-steel">{exp.carRule}</p>
            {!slots ? (
              <p className="mt-4 text-steel">Checking places…</p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {slots.map((s) => {
                  const disabled = s.past || s.remaining === 0 || busy;
                  return (
                    <button
                      key={s.time}
                      type="button"
                      disabled={disabled}
                      onClick={() => chooseSlot(s.time)}
                      className="rounded-[3px] border border-line bg-paper px-3 py-3 text-left enabled:hover:border-kerb disabled:opacity-45"
                    >
                      <span className="block font-display text-2xl font-semibold tabular-nums">{s.time}</span>
                      <span className={`text-sm ${!s.past && s.remaining > 0 && s.remaining <= 3 ? "font-semibold text-kerb" : "text-steel"}`}>
                        {s.past ? "Started" : s.remaining === 0 ? "Full" : `${s.remaining} of ${s.capacity} places left`}
                      </span>
                      {busy && time === s.time && <span className="block text-sm">Holding…</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </fieldset>
        </div>
      )}

      {step === 1 && (
        <form onSubmit={driverNext} className="mt-8 grid gap-10 md:grid-cols-2">
          <fieldset className="space-y-4">
            <legend className="font-display text-2xl font-semibold">Driver</legend>
            <div><label className="label" htmlFor="name">Full name, as on licence</label><input className="field" id="name" value={form.name} onChange={set("name")} autoComplete="name" required minLength={2} /></div>
            <div><label className="label" htmlFor="email">Email</label><input className="field" id="email" type="email" value={form.email} onChange={set("email")} autoComplete="email" required /></div>
            <div><label className="label" htmlFor="phone">Phone</label><input className="field" id="phone" type="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" required /></div>
            <div><label className="label" htmlFor="licence">Driving licence number</label><input className="field" id="licence" value={form.licenceNumber} onChange={set("licenceNumber")} required minLength={6} /></div>
          </fieldset>
          <fieldset className="space-y-4">
            <legend className="font-display text-2xl font-semibold">Car</legend>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label" htmlFor="make">Make</label><input className="field" id="make" placeholder="Mahindra" value={form.make} onChange={set("make")} required /></div>
              <div><label className="label" htmlFor="model">Model</label><input className="field" id="model" placeholder="Thar" value={form.model} onChange={set("model")} required /></div>
              <div><label className="label" htmlFor="year">Year</label><input className="field" id="year" type="number" inputMode="numeric" min={1960} max={new Date().getFullYear() + 1} value={form.year} onChange={set("year")} required /></div>
              <div><label className="label" htmlFor="reg">Registration</label><input className="field uppercase" id="reg" placeholder="KA01AB1234" value={form.registration} onChange={set("registration")} required /></div>
            </div>
            {exp.needsOffroadVehicle && (
              <label className="flex gap-3 rounded-[3px] bg-paper p-3 ring-1 ring-line">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-kerb" checked={form.offroadConfirmed} onChange={set("offroadConfirmed")} />
                <span className="text-sm">My car is an SUV or 4x4 with low-range or terrain modes.</span>
              </label>
            )}
            <p className="text-sm text-steel">Scrutineers check this car on arrival. Bringing a different car means re-registering at the desk.</p>
          </fieldset>
          <div className="md:col-span-2">
            <button className="btn-primary">Continue to waiver</button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={pay} className="mt-8 grid gap-10 md:grid-cols-[1.4fr_1fr]">
          <fieldset>
            <legend className="font-display text-2xl font-semibold">Waiver</legend>
            <div className="mt-3 max-h-64 space-y-3 overflow-y-auto rounded-[3px] bg-paper p-4 text-sm leading-relaxed ring-1 ring-line">
              <p>Motorsport is dangerous. By signing, I accept that driving on the circuit, drag strip, trail or skid pan carries a risk of damage to my vehicle and of injury.</p>
              <p>I confirm I hold a valid driving licence, that the car I registered is road-legal and insured, and that I am not under the influence of alcohol or any substance that affects driving.</p>
              <p>I will follow marshal flags and instructor directions at all times. Staff may stop my session if my driving or my car is unsafe, and no refund is due in that case.</p>
              <p>This waiver is part of a portfolio demo and has no legal effect.</p>
            </div>
            <label className="mt-4 flex gap-3">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-kerb" checked={form.accepted} onChange={set("accepted")} required />
              <span>I have read the waiver and accept it.</span>
            </label>
            <div className="mt-4">
              <label className="label" htmlFor="sig">Sign by typing your full name ({form.name || "as entered"})</label>
              <input className="field font-display text-2xl italic" id="sig" value={form.signedName} onChange={set("signedName")} required autoComplete="off" />
            </div>
          </fieldset>
          <div>
            <p className="font-display text-2xl font-semibold">Payment</p>
            <dl className="mt-3 divide-y divide-line border-y border-line text-[15px]">
              <div className="flex justify-between py-2"><dt>{exp.name}</dt><dd className="tabular-nums">{inr(exp.price)}</dd></div>
              <div className="flex justify-between py-2"><dt>Car</dt><dd>{form.make} {form.model}</dd></div>
              <div className="flex justify-between py-2 font-semibold"><dt>Total</dt><dd className="tabular-nums">{inr(exp.price)}</dd></div>
            </dl>
            <p className="mt-3 text-sm text-steel">Demo mode: no card is charged.</p>
            <button className="btn-primary mt-4 w-full" disabled={busy}>
              {busy ? "Confirming…" : `Pay ${inr(exp.price)} and confirm`}
            </button>
            <button type="button" onClick={() => setStep(1)} className="mt-3 w-full text-sm underline">Edit driver and car</button>
          </div>
        </form>
      )}
    </div>
  );
}
