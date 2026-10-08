import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { DayBoard } from "@/components/DayBoard";
import { GroupEnquiry } from "@/components/GroupEnquiry";
import { EXPERIENCES, inr } from "@/lib/experiences";

export const dynamic = "force-dynamic";

const DAY = [
  { title: "Book and register your car", body: "Pick a session, add the driver and car details. Your place is held for 10 minutes while you finish." },
  { title: "Sign the waiver online", body: "Read it at home and sign with your name. No paperwork queue at the gate." },
  { title: "Arrive 45 minutes early", body: "A safety briefing, then a quick check of tyres, brakes and fluids by our scrutineers." },
  { title: "Show your pass and drive", body: "Staff scan the QR code on your phone and wave you through to the holding lane." },
];

export default function Home() {
  return (
    <>
      <SiteHeader animate />
      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-12 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:pt-20">
          <div>
            <h1 className="font-display text-[clamp(3rem,7vw,5.6rem)] font-bold leading-[0.92] tracking-tight">
              Drive your own car on a closed circuit.
            </h1>
            <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-tarmac/80">
              Book a session the way you'd book a table: choose a time, register your car, sign the waiver, then show a QR pass at the gate.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/book" className="btn-primary">Book a session</Link>
              <Link href="#groups" className="btn-ghost">Plan a group day</Link>
            </div>
          </div>
          <DayBoard />
        </section>

        <section id="experiences" className="mx-auto max-w-6xl scroll-mt-6 px-5 py-12">
          <h2 className="font-display text-4xl font-bold">Four ways onto the track</h2>
          <p className="mt-2 max-w-[38rem] text-tarmac/75">Prices are per car and include the briefing, marshals and fuel-station access.</p>
          <ul className="mt-8 divide-y divide-line border-y border-line">
            {EXPERIENCES.map((e) => (
              <li key={e.id} className="grid gap-4 py-7 md:grid-cols-[1.1fr_1.6fr_auto] md:items-start">
                <div>
                  <h3 className="font-display text-3xl font-semibold leading-none">{e.name}</h3>
                  <p className="mt-2 text-sm text-steel">{e.duration}, up to {e.capacity} cars</p>
                </div>
                <div className="max-w-[36rem]">
                  <p className="leading-relaxed">{e.summary}</p>
                  <p className="mt-2 text-sm text-steel">{e.carRule}</p>
                </div>
                <div className="flex items-center gap-4 md:flex-col md:items-end">
                  <p className="font-display text-3xl font-semibold tabular-nums">{inr(e.price)}</p>
                  <Link href={`/book?experience=${e.id}`} className="btn-dark py-2 text-base">Choose a time</Link>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-12">
          <h2 className="font-display text-4xl font-bold">How your day works</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {DAY.map((step, i) => (
              <li key={step.title} className="border-t-4 border-tarmac pt-4">
                <p className="font-display text-5xl font-bold text-kerb">{i + 1}</p>
                <h3 className="mt-2 font-display text-2xl font-semibold leading-tight">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-tarmac/80">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="groups" className="mx-auto max-w-6xl scroll-mt-6 px-5 py-12">
          <div className="grid gap-10 rounded-md bg-paper p-6 ring-1 ring-line md:p-10 lg:grid-cols-[1fr_1.3fr]">
            <div>
              <h2 className="font-display text-4xl font-bold">Bring the whole team</h2>
              <p className="mt-3 max-w-[30rem] leading-relaxed text-tarmac/80">
                Offsites, car clubs and launch events from 6 to 400 people. We close a track for your group, run timed challenges and set up lunch in the paddock.
              </p>
              <p className="mt-3 max-w-[30rem] leading-relaxed text-tarmac/80">
                Send the basics and our events desk replies within one working day with dates and a quote.
              </p>
            </div>
            <GroupEnquiry />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
