import { NextResponse } from "next/server";
import { isStaff } from "@/lib/auth";
import { collections } from "@/lib/db";
import { errorResponse } from "@/lib/http";

export async function POST(req: Request) {
  try {
    if (!(await isStaff())) return NextResponse.json({ error: "Sign in as staff." }, { status: 401 });
    const { code } = (await req.json()) as { code?: string };
    const clean = (code ?? "").trim().toUpperCase();
    const { bookings } = await collections();
    const updated = await bookings.findOneAndUpdate(
      { code: clean, status: "confirmed" },
      { $set: { status: "checked_in", checkedInAt: new Date() } },
      { returnDocument: "after" },
    );
    if (updated) return NextResponse.json({ ok: true, name: updated.driver?.name });
    const existing = await bookings.findOne({ code: clean });
    if (existing?.status === "checked_in")
      return NextResponse.json({ error: `${existing.driver?.name} is already checked in.` }, { status: 409 });
    return NextResponse.json({ error: `No booking found for ${clean}.` }, { status: 404 });
  } catch (e) {
    return errorResponse(e);
  }
}
