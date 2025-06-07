import HeaderPage from "./header-main";
import HeroPage from "./hero-main";

export default function HomePage() {
  return (
    <main className="min-h-screen max-h-screen max-w-screen bg-gradient-to-br from-white via-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <HeaderPage />
      {/* Hero Section */}
      <HeroPage />

      {/* Footer */}
      <footer className="py-8 text-center text-slate-400 text-sm">
        &copy; {new Date().getFullYear()} ChatWith PDF. All rights reserved.
      </footer>
    </main>
  );
}
