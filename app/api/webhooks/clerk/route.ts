import { logger } from "@/lib/logger";
import * as Sentry from "@sentry/nextjs";
import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  captureNewUser,
  captureUserLogin,
  captureWebhookHit,
} from "@/lib/observability";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    logger.error("CLERK_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }
  captureWebhookHit("clerk");

  // Get headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 }
    );
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance
  const wh = new Webhook(WEBHOOK_SECRET);

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  let evt: any;

  // Verify the payload
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    }) as any;
  } catch (err) {
    logger.error({ error: err }, "Error verifying webhook");
    Sentry.captureException(err);
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  const eventType = evt.type;
  const { id, email_addresses, created_at } = evt.data;

  // Track sign-ups
  if (eventType === "user.created") {
    logger.info(
      {
        userId: id,
        email: email_addresses?.[0]?.email_address,
        timestamp: new Date(created_at).toISOString(),
        action: "signup",
      },
      "User signed up"
    );
    captureNewUser();
  }

  if (eventType === "session.created") {
    logger.info(
      {
        userId: evt.data.user_id,
        sessionId: evt.data.id,
        timestamp: new Date(evt.data.created_at).toISOString(),
        action: "signin",
      },
      "User signed in"
    );
    captureUserLogin();
  }

  return NextResponse.json({ received: true });
}
