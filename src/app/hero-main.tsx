import React from "react";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const HeroPage = () => {
  return (
    <>
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
              className="gap-2 bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white hover:from-indigo-600 hover:to-fuchsia-600 cursor-pointer"
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
              <span className="block">• 25 messages per day</span>
              <span className="block">• Maximum file size 5 MB.</span>
              <span className="block">• 15 messages per chat</span>
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
                <li>• 25 messages per day</li>
                <li>• Max 5MB per PDF</li>
                <li>• 15 messages per chat</li>
              </ul>
            </div>
            <SignedOut>
              <SignInButton mode="modal">
                <Button className="w-full cursor-pointer">Start Free</Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button className="w-full cursor-pointer">
                  Go to Dashboard
                </Button>
              </Link>
            </SignedIn>
          </div>
        </div>
      </section>
    </>
  );
};

export default HeroPage;
