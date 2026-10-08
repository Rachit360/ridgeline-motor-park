import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-20">
        <h1 className="font-display text-5xl font-bold">Nothing on this page</h1>
        <p className="mt-3 text-lg">If you were opening a pass, check the code in your confirmation email.</p>
        <Link href="/" className="btn-dark mt-6">Go to the home page</Link>
      </main>
    </>
  );
}
