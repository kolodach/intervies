import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="w-full mx-auto px-4 py-12 flex justify-center">
      <div className="prose prose-invert prose-sm max-w-2xl">
        <h1>Contact Us</h1>
        <p>
          We'd love to hear from you! Whether you have questions, feedback, or
          just want to say hello, feel free to reach out.
        </p>
        <h2>Get in Touch</h2>
        <p>
          The best way to reach us is via email. We typically respond within 24
          hours.
        </p>
        <ul>
          <li>
            Email:{" "}
            <Link href="mailto:oleh@prep0.dev" className="font-medium">
              oleh@prep0.dev
            </Link>
          </li>
        </ul>
        <h2>What Can We Help With?</h2>
        <ul>
          <li>Questions about prep[0]</li>
          <li>Technical support</li>
          <li>Feature requests</li>
          <li>Partnership inquiries</li>
          <li>General feedback</li>
        </ul>
        <p>We're here to help and always appreciate hearing from our users!</p>
      </div>
    </main>
  );
}
