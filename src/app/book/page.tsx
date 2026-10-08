import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { BookingFlow } from "@/components/BookingFlow";
import { EXPERIENCES } from "@/lib/experiences";
import { addDays, BOOKING_WINDOW_DAYS, nowInIST } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "Book a session · Ridgeline Motor Park" };

export default async function BookPage({ searchParams }: { searchParams: Promise<{ experience?: string }> }) {
  const { experience } = await searchParams;
  const initial = EXPERIENCES.some((e) => e.id === experience) ? experience! : EXPERIENCES[0].id;
  const today = nowInIST().date;
  const dates = Array.from({ length: BOOKING_WINDOW_DAYS }, (_, i) => addDays(today, i));
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 pt-10">
        <h1 className="font-display text-5xl font-bold">Book a session</h1>
        <BookingFlow experiences={EXPERIENCES} initialExperience={initial} dates={dates} />
      </main>
      <SiteFooter />
    </>
  );
}
