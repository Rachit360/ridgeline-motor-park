import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { findByCode } from "@/lib/bookings";
import { getExperience, inr } from "@/lib/experiences";
import { formatDate } from "@/lib/time";
import { baseUrl } from "@/lib/url";

export const dynamic = "force-dynamic";
export const metadata = { title: "Entry pass · Ridgeline Motor Park", robots: { index: false } };

export default async function PassPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { code } = await params;
  const { new: isNew } = await searchParams;
  const booking = await findByCode(code);
  if (!booking) notFound();
  const exp = getExperience(booking.experienceId);
  const checkinUrl = `${await baseUrl()}/admin/checkin/${booking.code}`;
  const qr = await QRCode.toDataURL(checkinUrl, { margin: 1, width: 360, color: { dark: "#1E2327", light: "#F8F9F6" } });
  const checkedIn = booking.status === "checked_in";

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 pt-10">
        {isNew && (
          <p className="mb-6 text-lg">
            You're booked. A copy of this pass is on its way to <span className="font-semibold">{booking.driver?.email}</span>.
          </p>
        )}
        <article className="overflow-hidden rounded-md bg-paper ring-1 ring-line">
          <div className="kerb h-2" />
          <div className="grid gap-8 p-6 sm:grid-cols-[1fr_auto] sm:p-8">
            <div>
              <p className="text-sm text-steel">Entry pass</p>
              <h1 className="font-display text-4xl font-bold leading-none">{exp?.name}</h1>
              <p className="mt-3 font-display text-3xl font-semibold">
                {formatDate(booking.date)}, {booking.time}
              </p>
              <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-[15px]">
                <div><dt className="text-sm text-steel">Driver</dt><dd className="font-medium">{booking.driver?.name}</dd></div>
                <div><dt className="text-sm text-steel">Car</dt><dd className="font-medium">{booking.car?.make} {booking.car?.model}</dd></div>
                <div><dt className="text-sm text-steel">Registration</dt><dd className="font-medium">{booking.car?.registration}</dd></div>
                <div><dt className="text-sm text-steel">Paid</dt><dd className="font-medium tabular-nums">{inr(booking.price)}</dd></div>
              </dl>
            </div>
            <div className="text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt={`QR code for pass ${booking.code}`} width={180} height={180} className="mx-auto" />
              <p className="mt-2 font-display text-2xl font-semibold tracking-wider">{booking.code}</p>
              <p className={`mt-1 text-sm font-medium ${checkedIn ? "text-pitgreen" : "text-steel"}`}>
                {checkedIn ? "Checked in" : "Show this at the gate"}
              </p>
            </div>
          </div>
          <div className="border-t border-line px-6 py-4 text-sm leading-relaxed text-tarmac/80 sm:px-8">
            Arrive 45 minutes before your session for the briefing and car check. Bring your driving licence and the car registered above.
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
