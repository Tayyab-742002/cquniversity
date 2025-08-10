"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function MainLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="bg-primary text-primary-foreground py-4 shadow-md">
        <div className="container mx-auto px-4 flex flex-col md:flex-row md:justify-between md:items-center relative">
          {/* Logo section */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <Link
              href="/"
              className="text-xl font-bold flex items-center space-x-2"
            >
              <Image
                src="/logo.png"
                alt="CQUniversity"
                width={48}
                height={48}
                className="w-10 h-10 md:w-[70px] md:h-[70px]"
              />
              <Image
                src="/logotext.png"
                alt="CQUniversity"
                width={120}
                height={20}
                className="w-[120px] h-auto md:w-[180px]"
              />
            </Link>
            {/* Hamburger menu for mobile */}
            <button
              className="md:hidden ml-2 p-2 rounded focus:outline-none focus:ring-2 focus:ring-accent"
              aria-label={
                menuOpen ? "Close navigation menu" : "Open navigation menu"
              }
              onClick={() => setMenuOpen((open) => !open)}
            >
              <svg
                className="w-7 h-7 text-primary-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {menuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
          {/* Desktop nav */}
          <nav className="hidden md:block mt-4 md:mt-0">
            <ul className="flex space-x-6">
              <li>
                <Link
                  href="/"
                  className="hover:underline font-medium transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/tests"
                  className="hover:underline font-medium transition-colors"
                >
                  Tests
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:underline font-medium transition-colors"
                >
                  About
                </Link>
              </li>
            </ul>
          </nav>
          {/* Mobile nav dropdown */}
          {menuOpen && (
            <nav className="absolute top-full left-0 w-full bg-primary text-primary-foreground shadow-lg z-50 md:hidden animate-fade-in">
              <ul className="flex flex-col divide-y divide-primary-foreground">
                <li>
                  <Link
                    href="/"
                    className="block px-6 py-4 font-medium hover:bg-primary/80 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tests"
                    className="block px-6 py-4 font-medium hover:bg-primary/80 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Tests
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="block px-6 py-4 font-medium hover:bg-primary/80 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    About
                  </Link>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-6">{children}</main>

      <footer className="bg-muted py-6 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <Link
                href="/"
                className="text-xl font-bold flex items-center mb-4"
              >
                <Image
                  src="/logo.png"
                  alt="CQUniversity"
                  width={70}
                  height={70}
                />
                <Image
                  src="/logotext.png"
                  alt="CQUniversity"
                  width={180}
                  height={20}
                />
              </Link>
              <p className="text-muted-foreground text-sm">
                CQUniversity is a leading university in Australia, offering a
                wide range of courses and research opportunities.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tests"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Available Tests
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    About the Research
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3">Contact</h3>
              <p className="text-muted-foreground text-sm">
                For questions or support, please contact:
                <br />
                <a
                  href="mailto:a.filgueirasgoncalves@cqu.edu.au"
                  className="text-accent hover:underline"
                >
                  a.filgueirasgoncalves@cqu.edu.au
                </a>
              </p>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-border text-center text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} CQUniversity - Psychological
            Research Platform
          </div>
          <div className="flex mt-10 items-center justify-center gap-2 text-xs">
            Powered By
            <a
              href="https://solvspot.com"
              target="_blank"
              className="flex items-center "
            >
              <Image
                src={"/solvspot.png"}
                alt="Solvspot"
                width={100}
                height={100}
                className="w-4 h-4"
              />
              <span className="text-[#c248eb] underline">SolvSpot</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
