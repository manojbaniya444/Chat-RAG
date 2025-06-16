import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ClerkProvider } from "@clerk/nextjs";
import { ErrorBoundary } from "@/components/error-boundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChatWithPDF - Intelligent Document Conversations",
  description: "Upload your PDF documents and have intelligent conversations with them using AI. Get instant answers, summaries, and insights from your documents.",
  keywords: ["PDF", "AI", "Chat", "Document", "Analysis", "Questions", "Answers"],
  authors: [{ name: "ChatWithPDF" }],
  creator: "ChatWithPDF",
  openGraph: {
    title: "ChatWithPDF - Intelligent Document Conversations",
    description: "Upload your PDF documents and have intelligent conversations with them using AI.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChatWithPDF - Intelligent Document Conversations",
    description: "Upload your PDF documents and have intelligent conversations with them using AI.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        elements: {
          organizationSwitcherPopoverRootBox: {
            width: "100%",
            pointerEvents: "auto",
          },
          userButtonPopoverRootBox: {
            width: "100%",
            pointerEvents: "auto",
          },
          formButtonPrimary: 
            "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
          formButtonSecondary:
            "bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm normal-case",
          footerActionLink: "text-blue-600 hover:text-blue-700",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
          suppressHydrationWarning
        >
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  );
}
