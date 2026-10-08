import { NextResponse } from "next/server";
import { z } from "zod";
import { collections } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { isValidDate } from "@/lib/time";

const Body = z.object({
  company: z.string().trim().min(2, "Enter your company or group name."),
  name: z.string().trim().min(2, "Enter your name."),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z.string().trim().regex(/^[+\d][\d\s-]{8,15}$/, "Enter a valid phone number."),
  groupSize: z.coerce.number().int().min(6, "Group days start at 6 people.").max(400),
  preferredDate: z.string().optional().refine((d) => !d || isValidDate(d), "Choose a valid date."),
  notes: z.string().trim().max(1000).optional(),
});

export async function POST(req: Request) {
  try {
    const data = Body.parse(await req.json());
    const { leads } = await collections();
    await leads.insertOne({ ...data, status: "new", createdAt: new Date() });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
