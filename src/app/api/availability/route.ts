import { NextResponse } from "next/server";
import { getAvailability } from "@/lib/slots";
import { getExperience } from "@/lib/experiences";
import { isValidDate } from "@/lib/time";
import { errorResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const experience = url.searchParams.get("experience") ?? "";
    const date = url.searchParams.get("date") ?? "";
    if (!getExperience(experience) || !isValidDate(date))
      return NextResponse.json({ error: "Choose an experience and a date." }, { status: 400 });
    return NextResponse.json({ slots: await getAvailability(experience, date) });
  } catch (e) {
    return errorResponse(e);
  }
}
