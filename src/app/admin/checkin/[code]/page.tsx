import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { findByCode } from "@/lib/bookings";
import { getExperience } from "@/lib/experiences";
import { formatDate, nowInIST } from "@/lib/time";
import { CheckInButton } from "@/components/admin/CheckIn";

export const dynamic = "force-dynamic";

// Scanning a pass QR opens this page on a staff phone.
export default async function CheckInPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  await requireStaff(`/admin/checkin/${code}`);
  const b = await findByCode(code);
  const today = nowInIST().date;

  return (
    <main className="flex min-h-screen items-center justify-center bg-tarmac px-5 py-10">
      <div className="w-full max-w-md overflow-hidden rounded-md bg-paper">
        <div className="kerb h-2" />
        <div className="p-6">
          {!b ? (
            <>
              <h1 className="font-display text-3xl font-bold">No booking for {code.toUpperCase()}</h1>
              <p className="mt-2">Send the driver to the desk to look the booking up by name.</p>
            </>
          ) : (
            <>
              <p className="text-sm text-steel">{b.code}</p>
              <h1 className="font-display text-4xl font-bold leading-none">{b.driver?.name}</h1>
              <p className="mt-2 font-display text-2xl">{getExperience(b.experienceId)?.name}, {formatDate(b.date)} {b.time}</p>
              <p className="mt-4">{b.car?.make} {b.car?.model} ({b.car?.year}), <span className="font-semibold">{b.car?.registration}</span></p>
              <p className="mt-1 text-sm text-steel">Waiver signed as “{b.waiver?.signedName}”</p>
              {b.date !== today && (
                <p className="mt-4 rounded-[3px] bg-flag/30 px-3 py-2 text-sm font-medium">This pass is for {formatDate(b.date)}, not today.</p>
              )}
              <div className="mt-6">
                {b.status === "checked_in" ? (
                  <p className="font-display text-2xl font-semibold text-pitgreen">Checked in</p>
                ) : (
                  <CheckInButton code={b.code!} large />
                )}
              </div>
            </>
          )}
          <Link href="/admin" className="mt-6 inline-block text-sm underline">Back to the track sheet</Link>
        </div>
      </div>
    </main>
  );
}
