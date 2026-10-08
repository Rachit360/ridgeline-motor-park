import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { BookingError } from "./slots";

export function errorResponse(e: unknown) {
  if (e instanceof BookingError) return NextResponse.json({ error: e.message }, { status: e.status });
  if (e instanceof ZodError)
    return NextResponse.json(
      { error: e.issues[0]?.message ?? "Some details are missing.", fields: e.flatten().fieldErrors },
      { status: 400 },
    );
  console.error(e);
  return NextResponse.json({ error: "Something failed on our side. Try again in a minute." }, { status: 500 });
}
