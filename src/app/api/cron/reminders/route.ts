import { NextResponse } from "next/server";
import { collections } from "@/lib/db";
import { sendReminder } from "@/lib/email";
import { addDays, nowInIST } from "@/lib/time";

export const dynamic = "force-dynamic";

// Runs daily (see vercel.json) and emails everyone booked for tomorrow.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tomorrow = addDays(nowInIST().date, 1);
  const { bookings } = await collections();
  const due = await bookings
    .find({ date: tomorrow, status: "confirmed", reminderSentAt: { $exists: false } })
    .toArray();

  const base = (process.env.APP_URL || new URL(req.url).origin).replace(/\/$/, "");
  let sent = 0;
  for (const b of due) {
    try {
      if (await sendReminder(b, `${base}/pass/${b.code}`)) {
        await bookings.updateOne({ _id: b._id }, { $set: { reminderSentAt: new Date() } });
        sent++;
      }
    } catch (e) {
      console.error("reminder failed", b.code, e);
    }
  }
  return NextResponse.json({ date: tomorrow, due: due.length, sent });
}
