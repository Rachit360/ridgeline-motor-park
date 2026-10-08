import { NextResponse } from "next/server";
import { z } from "zod";
import { confirmHold } from "@/lib/slots";
import { sendConfirmation } from "@/lib/email";
import { baseUrl } from "@/lib/url";
import { errorResponse } from "@/lib/http";

const thisYear = new Date().getFullYear();

const Body = z.object({
  holdId: z.string().uuid(),
  driver: z.object({
    name: z.string().trim().min(2, "Enter the driver's full name."),
    email: z.string().trim().email("Enter a valid email address."),
    phone: z.string().trim().regex(/^[+\d][\d\s-]{8,15}$/, "Enter a valid phone number."),
    licenceNumber: z.string().trim().min(6, "Enter the driving licence number."),
  }),
  car: z.object({
    make: z.string().trim().min(2, "Enter the car's make."),
    model: z.string().trim().min(1, "Enter the car's model."),
    year: z.coerce.number().int().min(1960).max(thisYear + 1, "Check the car's year."),
    registration: z.string().trim().min(4, "Enter the registration number.").toUpperCase(),
  }),
  waiver: z.object({
    accepted: z.literal(true, { errorMap: () => ({ message: "Accept the waiver to continue." }) }),
    signedName: z.string().trim().min(2, "Type your name to sign the waiver."),
  }),
  payment: z.object({ method: z.literal("demo") }),
});

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json());
    if (body.waiver.signedName.toLowerCase() !== body.driver.name.toLowerCase())
      return NextResponse.json(
        { error: "The waiver must be signed with the driver's name exactly as entered." },
        { status: 400 },
      );

    // Payment runs in demo mode: no card is charged. A real gateway would
    // verify its signed webhook here before the hold is confirmed.
    const booking = await confirmHold(body.holdId, {
      driver: body.driver,
      car: body.car,
      waiver: { signedName: body.waiver.signedName, signedAt: new Date() },
    });

    const passUrl = `${await baseUrl()}/pass/${booking.code}`;
    sendConfirmation(booking, passUrl).catch((e) => console.error("confirmation email failed", e));
    return NextResponse.json({ code: booking.code }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
