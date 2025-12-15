import { logger } from "@/lib/logger";
import { captureError, captureWebhookHit } from "@/lib/observability";
import { processStripeEvent, stripe } from "@/lib/stripe";
import * as Sentry from "@sentry/nextjs";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("Stripe-Signature");

  if (!signature) {
    logger.warn("Stripe webhook received without signature");
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 }
    );
  }

  // Track webhook hit
  captureWebhookHit("stripe");

  try {
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET ?? ""
    );

    // Process the event (sync data and capture metrics)
    await processStripeEvent(event);

    logger.info({ eventType: event.type }, "Stripe webhook processed");
    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error({ error }, "Stripe webhook processing failed");
    captureError(error as Error);
    Sentry.captureException(error, {
      tags: { webhook: "stripe", operation: "process_event" },
    });

    // Return 200 even on error to prevent Stripe from retrying
    // (we've logged the error for debugging)
    return NextResponse.json({ received: true, error: "Processing failed" });
  }
}
