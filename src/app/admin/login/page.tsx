import { LoginForm } from "./LoginForm";

export const metadata = { title: "Staff sign-in · Ridgeline", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next?.startsWith("/admin") ? next : "/admin";
  return (
    <main className="flex min-h-screen items-center justify-center bg-tarmac px-5">
      <div className="w-full max-w-sm rounded-md bg-paper p-8">
        <div className="kerb -mx-8 -mt-8 mb-6 h-2 rounded-t-md" />
        <h1 className="font-display text-3xl font-bold">Staff sign-in</h1>
        <p className="mt-1 text-sm text-steel">Ridgeline Motor Park operations</p>
        <LoginForm next={safeNext} />
      </div>
    </main>
  );
}
