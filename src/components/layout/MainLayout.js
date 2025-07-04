import Image from "next/image";
import Link from "next/link";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="bg-primary text-primary-foreground py-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center px-4">
          <Link href="/" className="text-xl font-bold flex items-center">
            <Image src="/logo.png" alt="PsycoTest" width={70} height={70} />
            <Image
              src="/logotext.png"
              alt="PsycoTest"
              width={180}
              height={20}
            />
          </Link>
          <nav>
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
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-6">{children}</main>

      <footer className="bg-muted py-6 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <Link href="/" className="text-xl font-bold flex items-center mb-4">
                <Image src="/logo.png" alt="PsycoTest" width={70} height={70} />
                <Image
                  src="/logotext.png"
                  alt="PsycoTest"
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
        </div>
      </footer>
    </div>
  );
}
