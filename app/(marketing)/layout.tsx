import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "prep[0] - Practice System Design Until You're Ready",
  description:
    "Practice 35+ real system design interview problems. Get specific feedback on what you missed. $25/month unlimited vs. $99+ per human mock interview.",
  keywords:
    "system design interview, system design prep, FAANG interview, mock interview, system design practice, interview preparation",
  openGraph: {
    title: "prep[0] - System Design Interview Prep",
    description:
      "Practice system design interviews until you're ready. Get detailed feedback on what you missed.",
    url: "https://prep0.dev",
    siteName: "prep[0]",
    images: [
      {
        url: "/og-image.png", // TODO: Create 1200x630 screenshot for social sharing
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "prep[0] - Practice System Design Until You're Ready",
    description:
      "Practice 35+ real interview problems. Get specific feedback. $25/month unlimited.",
    images: ["/og-image.png"],
  },
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-mono text-xl font-bold">prep[0]</span>
            <span className="text-xs text-muted-foreground">beta</span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center space-x-6">
            <Link href="#features" className="text-sm hover:underline">
              Features
            </Link>
            <Link href="#pricing" className="text-sm hover:underline">
              Pricing
            </Link>
            <Link href="/app" className="text-sm hover:underline">
              Sign In
            </Link>
            <Link
              href="/app"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {children}

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              {/* Brand */}
              <div className="space-y-3">
                <div className="font-mono text-xl font-bold">prep[0]</div>
                <p className="text-sm text-muted-foreground">
                  System design interview prep
                </p>
              </div>

              {/* Product Links */}
              <div className="space-y-3">
                <h4 className="font-medium">Product</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <Link href="#features" className="hover:underline">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link href="#pricing" className="hover:underline">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="/problems" className="hover:underline">
                      Problems
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Company Links */}
              <div className="space-y-3">
                <h4 className="font-medium">Company</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <Link href="/about" className="hover:underline">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="hover:underline">
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Legal Links */}
              <div className="space-y-3">
                <h4 className="font-medium">Legal</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <Link href="/privacy" className="hover:underline">
                      Privacy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="hover:underline">
                      Terms
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Copyright */}
            <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
              © 2025 prep[0]. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
