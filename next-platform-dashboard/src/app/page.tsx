import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">DRAMAC</h1>
      <p className="text-muted-foreground mb-8">
        Build beautiful websites for your clients
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Login
        </Link>
        <Link
          href="/signup"
          className="px-4 py-2 border border-border rounded-md"
        >
          Sign Up
        </Link>
      </div>
    </main>
  );
}
