import Link from "next/link";
import { getDayBoard } from "@/lib/slots";
import { formatDate, nowInIST } from "@/lib/time";

/** Server-rendered pit-wall board: today's sessions with live places left. */
export async function DayBoard() {
  const today = nowInIST().date;
  let board: Awaited<ReturnType<typeof getDayBoard>> | null = null;
  try {
    board = await getDayBoard(today);
  } catch {
    board = null;
  }

  return (
    <div className="overflow-hidden rounded-md bg-tarmac text-white shadow-[0_24px_60px_-30px_rgba(30,35,39,.8)]">
      <div className="flex items-baseline justify-between border-b border-white/10 px-5 py-3">
        <p className="font-display text-xl font-semibold">Today on track</p>
        <p className="text-sm text-white/60">{formatDate(today)}, places left per session</p>
      </div>
      {!board ? (
        <p className="px-5 py-8 text-white/70">
          Live availability appears here once the database is connected.
        </p>
      ) : (
        <ul>
          {board.map(({ experience, slots }, i) => {
            const open = slots.filter((s) => !s.past);
            return (
              <li
                key={experience.id}
                className="board-row border-b border-white/10 px-5 py-3 last:border-0"
                style={{ animationDelay: `${300 + i * 90}ms` }}
              >
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <Link href={`/book?experience=${experience.id}`} className="font-display text-lg font-semibold hover:underline">
                    {experience.name}
                  </Link>
                  <span className="text-xs text-white/50">{experience.capacity} cars per session</span>
                </div>
                {open.length === 0 ? (
                  <p className="text-sm text-white/50">Done for today. Tomorrow's sessions are open.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {open.map((s) => {
                      const full = s.remaining === 0;
                      const low = !full && s.remaining <= 3;
                      return (
                        <span
                          key={s.time}
                          className={`rounded-[3px] px-2 py-1 font-display text-[15px] tabular-nums ${
                            full ? "bg-white/5 text-white/35 line-through" : low ? "bg-flag text-tarmac" : "bg-white/10"
                          }`}
                          title={full ? "Full" : `${s.remaining} places left`}
                        >
                          {s.time} <span className="font-semibold">{full ? "full" : s.remaining}</span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
