import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Main Headline - H1 for SEO */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Practice System Design Until You're Ready
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Practice 35+ real interview problems. Get specific feedback on what
            you missed. $25/month unlimited.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/app"
              className="px-8 py-3 bg-primary text-primary-foreground rounded-md text-lg font-medium hover:bg-primary/90"
            >
              Try 2 Free Interviews
            </Link>
            <p className="text-sm text-muted-foreground">
              No credit card required
            </p>
          </div>

          {/* Hero Screenshot */}
          <div className="pt-12">
            {/* TODO: Add main product screenshot showing feedback card
                Recommended: ~1200px wide, showing full interface
                Show: Feedback evaluation with score + detailed breakdown
                File: /public/screenshots/hero-screenshot.png
            */}
            <div className="relative rounded-sm shadow-2xl bg-muted aspect-video">
              <Image
                src="/screenshots/hero-screenshot.png"
                alt="prep[0] system design interview feedback interface showing detailed evaluation"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="features" className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          {/* Section Header */}
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
            <p className="text-lg text-muted-foreground">
              Four simple steps to interview success
            </p>
          </div>

          {/* Steps Grid */}
          <div className="space-y-16">
            {/* Step 1 */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                    1
                  </span>
                  <h3 className="text-2xl font-bold">Pick a Problem</h3>
                </div>
                <p className="text-muted-foreground">
                  Choose from 35+ system design questions asked at Google, Meta,
                  Amazon, and Netflix.
                </p>
              </div>
              <div className="relative rounded-lg border overflow-hidden bg-muted aspect-video">
                {/* TODO: Screenshot of problem list
                    Show: List of problems with difficulty levels
                    File: /public/screenshots/step1-problems.png
                */}
                <Image
                  src="/screenshots/step1-problems.png"
                  alt="List of system design interview problems including URL shortener, Instagram feed, and distributed cache"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="relative rounded-lg border overflow-hidden bg-muted aspect-video md:order-first">
                {/* TODO: Screenshot of interview in progress
                    Show: Split view - chat/requirements on left, whiteboard on right
                    File: /public/screenshots/step2-interview.png
                */}
                <Image
                  src="/screenshots/step2-interview.png"
                  alt="System design interview in progress showing whiteboard with architecture diagram and chat interface"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                    2
                  </span>
                  <h3 className="text-2xl font-bold">
                    Complete Your Interview
                  </h3>
                </div>
                <p className="text-muted-foreground">
                  Use chat, whiteboard, and voice to design your solution.
                  Explain your decisions as you go.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                    3
                  </span>
                  <h3 className="text-2xl font-bold">Get Detailed Feedback</h3>
                </div>
                <p className="text-muted-foreground">
                  See exactly what you did well and what you missed. Specific,
                  actionable feedback—not generic advice.
                </p>
              </div>
              <div className="relative rounded-lg border overflow-hidden bg-muted aspect-video">
                {/* TODO: Screenshot of feedback card
                    Show: Score + detailed pros/cons breakdown
                    File: /public/screenshots/step3-feedback.png
                */}
                <Image
                  src="/screenshots/step3-feedback.png"
                  alt="Detailed interview feedback showing technical score, strengths, and specific areas for improvement"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section (Optional - can remove if too much) */}
      <section className="bg-muted/50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="space-y-3">
                <h3 className="text-xl font-bold">Real Interview Questions</h3>
                <p className="text-muted-foreground">
                  35+ problems from Google, Meta, Amazon, and Netflix. URL
                  shorteners, Instagram feeds, distributed caches—the same
                  questions asked in real interviews.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="space-y-3">
                <h3 className="text-xl font-bold">Detailed Feedback</h3>
                <p className="text-muted-foreground">
                  Know exactly what you missed—cache invalidation, RTO/RPO
                  quantification, capacity planning. Not generic "work on depth"
                  advice.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="space-y-3">
                <h3 className="text-xl font-bold">Unlimited Practice</h3>
                <p className="text-muted-foreground">
                  $25/month unlimited vs. $99+ per human mock interview.
                  Available 24/7, no scheduling required.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Simple Pricing</h2>
            <p className="text-lg text-muted-foreground">
              Start free, upgrade when ready
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Tier */}
            <div className="border rounded-lg p-8 space-y-6">
              <div>
                <h3 className="text-2xl font-bold">Free</h3>
                <p className="text-muted-foreground mt-2">Try it out</p>
              </div>
              <div className="space-y-4">
                <p className="text-3xl font-bold">$0</p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>2 system design interviews</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>See if you like it</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>No credit card required</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/sign-up"
                className="block w-full py-3 px-4 border border-input rounded-md text-center font-medium hover:bg-accent"
              >
                Start Free
              </Link>
            </div>

            {/* Pro Tier */}
            <div className="border-2 border-primary rounded-lg p-8 space-y-6 relative">
              {/* Popular Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-bold">Pro</h3>
                <p className="text-muted-foreground mt-2">Unlimited practice</p>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-3xl font-bold">
                    $25
                    <span className="text-lg font-normal text-muted-foreground">
                      /month
                    </span>
                  </p>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Unlimited interviews</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>All 35+ problems</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Track progress over time</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Available 24/7</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/sign-up"
                className="block w-full py-3 px-4 bg-primary text-primary-foreground rounded-md text-center font-medium hover:bg-primary/90"
              >
                Subscribe
              </Link>
            </div>
          </div>

          {/* Pricing Comparison */}
          <div className="mt-12 p-6 bg-muted/50 rounded-lg">
            <p className="text-center text-sm text-muted-foreground">
              <strong>Compare:</strong> Human mock interviews $99-149 per
              session • Video courses $50-200 with no personalized feedback •
              prep[0] $25/month unlimited
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to Start Practicing?
          </h2>
          <p className="text-lg text-muted-foreground">
            Try 2 free interviews. No credit card required. Takes 2 minutes.
          </p>
          <div className="pt-4">
            <Link
              href="/app"
              className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-md text-lg font-medium hover:bg-primary/90"
            >
              Try 2 Free Interviews
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
