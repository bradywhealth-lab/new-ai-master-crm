import Link from "next/link"

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-5xl font-bold">InsureAssist</h1>
        <p className="text-xl text-muted-foreground">
          AI-Powered CRM for Insurance Agents
        </p>
        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full rounded-md bg-primary px-8 py-3 text-primary-foreground font-semibold transition hover:bg-primary/90"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="block w-full rounded-md border px-8 py-3 font-semibold transition hover:bg-accent hover:text-accent-foreground"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  )
}
