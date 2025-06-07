import React from "react";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

const HeaderPage = () => {
  return (
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
            <Button variant="outline" className="flex items-center h-full cursor-pointer">
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
  );
};

export default HeaderPage;
