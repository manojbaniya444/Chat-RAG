import {
  SignOutButton,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen max-h-screen max-w-screen bg-gradient-to-br from-white via-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2">
          <svg width={32} height={32} viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#6366F1" />
            <text
              x="16"
              y="21"
              textAnchor="middle"
              fontSize="16"
              fill="white"
              fontFamily="sans-serif"
              fontWeight="bold"
            >
              PDF
            </text>
          </svg>
          <span className="font-bold text-xl text-slate-800">ChatWith PDF</span>
        </div>
        <nav className="flex items-center gap-4 justify-center p-1 h-full">
          <a
            href="#free"
            className="text-slate-700 hover:text-indigo-600 font-medium transition-colors px-3 py-2 rounded border-0 flex items-center h-full"
          >
            Pricing
          </a>
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="outline" className="flex items-center h-full">
          Sign In
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <div className="ml-2 flex items-center h-full">
              <UserButton />
            </div>
          </SignedIn>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 pb-15">
        <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-indigo-500 to-fuchsia-500 bg-clip-text text-transparent mb-6">
          Chat with your PDF <br /> in seconds.
        </h1>
        <p className="text-lg md:text-2xl text-slate-600 max-w-xl mb-8">
          Instantly extract insights, summarize, and ask questions about any PDF
          document. Powered by AI, designed for productivity.
        </p>
        <SignedOut>
          <SignInButton mode="modal">
            <Button
              size="lg"
              className="gap-2 bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white hover:from-indigo-600 hover:to-fuchsia-600"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Button>
          </SignInButton>
        </SignedOut>

        <SignedIn>
          <Link href="/chat">
            <Button
              size="lg"
              className="gap-2 bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white hover:from-indigo-600 hover:to-fuchsia-600 cursor-pointer"
            >
              Go to Chat <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </SignedIn>
      </section>

      {/* Features */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 grid md:grid-cols-3 gap-8">
          <div className="rounded-xl border p-6 shadow-sm hover:shadow-lg transition">
            <h3 className="font-semibold text-lg mb-2">Ask Anything</h3>
            <p className="text-slate-600">
              Chat with your PDF and get instant answers to your questions.
            </p>
          </div>
          <div className="rounded-xl border p-6 shadow-sm hover:shadow-lg transition">
            <h3 className="font-semibold text-lg mb-2">Summarize Instantly</h3>
            <p className="text-slate-600">
              Get concise summaries of lengthy documents in one click.
            </p>
          </div>
          <div className="rounded-xl border p-6 shadow-sm hover:shadow-lg transition">
            <h3 className="font-semibold text-lg mb-2">Free Tier</h3>
            <p className="text-slate-600">
              <span className="block">• Up to 2 PDFs per day</span>
              <span className="block">• 25 messages per day</span>
            </p>
          </div>
        </div>
      </section>

      {/* Free Tier Only */}
      <section
        id="free"
        className="py-16 bg-gradient-to-br from-slate-50 to-white"
      >
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Free Tier</h2>
          <div className="border rounded-xl p-8 shadow-sm bg-white">
            <h3 className="font-semibold text-xl mb-2">Always Free</h3>
            <p className="text-3xl font-bold mb-4">$0</p>
            <ul className="text-slate-600 mb-6 space-y-2">
              <li>• All core features</li>
            </ul>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
              <p className="font-semibold text-slate-700 mb-2">Limitations:</p>
              <ul className="text-orange-500 space-y-1 text-sm">
                <li>• 2 PDFs per day</li>
                <li>• 25 messages per day</li>
                <li>• Max 5MB per PDF</li>
                <li>• Max 10 pages per PDF</li>
              </ul>
            </div>
            <SignedOut>
              <SignInButton mode="modal">
                <Button className="w-full">Start Free</Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button className="w-full">Go to Dashboard</Button>
              </Link>
            </SignedIn>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-slate-400 text-sm">
        &copy; {new Date().getFullYear()} ChatWith PDF. All rights reserved.
      </footer>
    </main>
  );
}
