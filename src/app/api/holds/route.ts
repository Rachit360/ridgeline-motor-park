import { NextResponse } from "next/server";
import { z } from "zod";
import { createHold, releaseHold } from "@/lib/slots";
import { addDays, BOOKING_WINDOW_DAYS, isValidDate, nowInIST } from "@/lib/time";
import { errorResponse } from "@/lib/http";

const Body = z.object({
  experienceId: z.string().min(1),
  date: z.string().refine(isValidDate, "Choose a valid date."),
  time: z.string().regex(/^\d{2}:\d{2}$/),
});

export async function POST(req: Request) {
  try {
    const { experienceId, date, time } = Body.parse(await req.json());
    if (date > addDays(nowInIST().date, BOOKING_WINDOW_DAYS))
      return NextResponse.json({ error: `Bookings open ${BOOKING_WINDOW_DAYS} days ahead.` }, { status: 400 });
    const hold = await createHold(experienceId, date, time);
    return NextResponse.json({ holdId: hold._id, expiresAt: hold.expiresAt }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(req: Request) {
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (id) await releaseHold(id);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return errorResponse(e);
  }
}
