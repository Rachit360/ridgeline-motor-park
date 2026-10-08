import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { collections } from "@/lib/db";
import { EXPERIENCES, getExperience, inr } from "@/lib/experiences";
import { getDayBoard } from "@/lib/slots";
import { addDays, formatDate, isValidDate, nowInIST } from "@/lib/time";
import { CheckInButton, CodeCheckIn } from "@/components/admin/CheckIn";

export const dynamic = "force-dynamic";
export const metadata = { title: "Operations · Ridgeline", robots: { index: false } };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  await requireStaff();
  const { date: qDate } = await searchParams;
  const today = nowInIST().date;
  const date = qDate && isValidDate(qDate) ? qDate : today;

  const { bookings, leads } = await collections();
  const [board, dayBookings, recentLeads] = await Promise.all([
    getDayBoard(date),
    bookings
      .find({ date, status: { $in: ["confirmed", "checked_in"] } })
      .sort({ time: 1, confirmedAt: 1 })
      .toArray(),
    leads.find().sort({ createdAt: -1 }).limit(8).toArray(),
  ]);

  const checkedIn = dayBookings.filter((b) => b.status === "checked_in").length;
  const revenue = dayBookings.reduce((sum, b) => sum + b.price, 0);
  const seats = board.reduce((s, b) => s + b.slots.reduce((a, x) => a + x.capacity, 0), 0);
  const filled = board.reduce((s, b) => s + b.slots.reduce((a, x) => a + (x.capacity - x.remaining), 0), 0);

  const stats = [
    { label: "Cars booked", value: String(dayBookings.length) },
    { label: "Checked in", value: `${checkedIn} of ${dayBookings.length}` },
    { label: "Track occupancy", value: seats ? `${Math.round((filled / seats) * 100)}%` : "0%" },
    { label: "Takings", value: inr(revenue) },
  ];

  return (
    <div className="min-h-screen">
      <header className="bg-tarmac text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <p className="font-display text-2xl font-bold">Ridgeline <span className="font-medium text-white/60">operations</span></p>
          <form action="/api/admin/logout" method="post">
            <button className="text-sm underline">Sign out</button>
          </form>
        </div>
        <div className="kerb h-2" />
      </header>

      <main className="mx-auto max-w-6xl space-y-12 px-5 py-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="font-display text-5xl font-bold leading-none">{formatDate(date)}</h1>
            <nav className="mt-3 flex gap-4 text-sm" aria-label="Change day">
              <Link className="underline" href={`/admin?date=${addDays(date, -1)}`}>Previous day</Link>
              {date !== today && <Link className="underline" href="/admin">Today</Link>}
              <Link className="underline" href={`/admin?date=${addDays(date, 1)}`}>Next day</Link>
            </nav>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Gate check-in by pass code</p>
            <CodeCheckIn />
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md bg-line ring-1 ring-line md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-paper px-5 py-4">
              <dt className="text-sm text-steel">{s.label}</dt>
              <dd className="font-display text-4xl font-semibold tabular-nums">{s.value}</dd>
            </div>
          ))}
        </dl>

        <section>
          <h2 className="font-display text-3xl font-bold">Track sheet</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {board.map(({ experience, slots }) => (
              <div key={experience.id} className="rounded-md bg-paper p-4 ring-1 ring-line">
                <h3 className="font-display text-xl font-semibold">{experience.name}</h3>
                <ul className="mt-3 space-y-2">
                  {slots.map((s) => {
                    const used = s.capacity - s.remaining;
                    return (
                      <li key={s.time} className="grid grid-cols-[3.5rem_1fr_3.5rem] items-center gap-3 text-sm">
                        <span className="font-display text-lg tabular-nums">{s.time}</span>
                        <span className="h-2.5 overflow-hidden rounded-[1px] bg-line">
                          <span
                            className={`block h-full ${s.remaining === 0 ? "bg-kerb" : "bg-tarmac"}`}
                            style={{ width: `${(used / s.capacity) * 100}%` }}
                          />
                        </span>
                        <span className="text-right tabular-nums text-steel">{used}/{s.capacity}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-3xl font-bold">Driver manifest</h2>
          {dayBookings.length === 0 ? (
            <p className="mt-3 text-steel">No cars booked for this day yet. Bookings appear here as soon as they're paid.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-md ring-1 ring-line">
              <table className="w-full min-w-[720px] bg-paper text-left text-sm">
                <thead className="bg-chalk text-steel">
                  <tr>
                    <th className="px-4 py-3 font-medium">Time</th>
                    <th className="px-4 py-3 font-medium">Session</th>
                    <th className="px-4 py-3 font-medium">Driver</th>
                    <th className="px-4 py-3 font-medium">Car</th>
                    <th className="px-4 py-3 font-medium">Pass</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {dayBookings.map((b) => (
                    <tr key={b._id}>
                      <td className="px-4 py-3 font-display text-base tabular-nums">{b.time}</td>
                      <td className="px-4 py-3">{getExperience(b.experienceId)?.name}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{b.driver?.name}</span>
                        <span className="block text-steel">{b.driver?.phone}</span>
                      </td>
                      <td className="px-4 py-3">
                        {b.car?.make} {b.car?.model} ({b.car?.year})
                        <span className="block text-steel">{b.car?.registration}</span>
                      </td>
                      <td className="px-4 py-3 font-medium tracking-wide">{b.code}</td>
                      <td className="px-4 py-3">
                        {b.status === "checked_in" ? (
                          <span className="font-medium text-pitgreen">Checked in</span>
                        ) : (
                          <CheckInButton code={b.code!} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <h2 className="font-display text-3xl font-bold">Group enquiries</h2>
          {recentLeads.length === 0 ? (
            <p className="mt-3 text-steel">No group enquiries yet. They arrive from the form on the home page.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line rounded-md bg-paper ring-1 ring-line">
              {recentLeads.map((l, i) => (
                <li key={i} className="grid gap-1 px-4 py-3 text-sm md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-center">
                  <span><span className="font-medium">{l.company}</span>, {l.groupSize} people</span>
                  <span>{l.name}<span className="block text-steel">{l.email}</span></span>
                  <span className="text-steel">{l.preferredDate ? `Wants ${formatDate(l.preferredDate)}` : "Date open"}</span>
                  <span className="text-steel">
                    {l.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-sm text-steel">Showing {EXPERIENCES.length} experiences. Expired 10-minute holds are released automatically.</p>
      </main>
    </div>
  );
}
