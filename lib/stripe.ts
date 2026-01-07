import { logger } from "@/lib/logger";
import {
  capturePaymentFailed,
  captureSubscriptionCanceled,
  captureSubscriptionCreated,
  captureSubscriptionRenewed,
} from "@/lib/observability";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service";
import Stripe from "stripe";

// Initialize Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2025-12-15.clover",
});

// Stripe subscription status type
export type StripeSubscriptionStatus = Stripe.Subscription.Status | "none";

// User plan data structure (matches database schema)
export interface UserPlan {
  id: string;
  user_id: string; // User ID from next-auth
  stripe_customer_id: string | null;
  subscription_id: string | null;
  status: StripeSubscriptionStatus;
  price_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Events we track for subscription state changes
export const allowedStripeEvents: Stripe.Event.Type[] = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
  "customer.subscription.pending_update_applied",
  "customer.subscription.pending_update_expired",
  "customer.subscription.trial_will_end",
  "invoice.paid",
  "invoice.payment_failed",
  "invoice.payment_action_required",
  "invoice.upcoming",
  "invoice.marked_uncollectible",
  "invoice.payment_succeeded",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "payment_intent.canceled",
];

/**
 * Syncs subscription data from Stripe to the database.
 * This is the single source of truth for subscription state.
 * Called from both /success endpoint and webhook handler.
 *
 * @param customerId - Stripe customer ID
 * @param useServiceRole - If true, uses service role client (for webhooks). Default uses authenticated client.
 */
export async function syncStripeDataToDatabase(
  customerId: string,
  useServiceRole = false
): Promise<UserPlan | null> {
  // Get the appropriate Supabase client
  let supabase: ReturnType<typeof createServiceRoleSupabaseClient>;
  if (useServiceRole) {
    supabase = createServiceRoleSupabaseClient();
  } else {
    const { createServerSupabaseClient } = await import(
      "@/lib/supabase/server"
    );
    supabase = await createServerSupabaseClient();
  }

  try {
    // Fetch latest subscription data from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: "all",
      expand: ["data.default_payment_method"],
    });

    // Find user plan by stripe_customer_id
    const { data: existingPlan, error: findError } = await supabase
      .from("user_plans")
      .select("*")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (findError) {
      throw findError;
    }

    if (!existingPlan) {
      logger.error("No user plan found for Stripe customer during sync");
      return null;
    }

    // Prepare subscription data
    let subData: Partial<UserPlan>;

    if (subscriptions.data.length === 0) {
      subData = {
        subscription_id: null,
        status: "none",
        price_id: null,
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        payment_method_brand: null,
        payment_method_last4: null,
      };
    } else {
      const subscription = subscriptions.data[0];
      const paymentMethod = subscription.default_payment_method;
      const firstItem = subscription.items.data[0];

      // Stripe can signal cancellation in two ways:
      // 1. cancel_at_period_end: true - cancels at end of billing period
      // 2. cancel_at: <timestamp> - cancels at a specific date
      // We treat both as "will be canceled"
      const willBeCanceled =
        subscription.cancel_at_period_end || subscription.cancel_at !== null;

      subData = {
        subscription_id: subscription.id,
        status: subscription.status,
        price_id: firstItem?.price.id ?? null,
        current_period_start: firstItem?.current_period_start
          ? new Date(firstItem.current_period_start * 1000).toISOString()
          : null,
        current_period_end: firstItem?.current_period_end
          ? new Date(firstItem.current_period_end * 1000).toISOString()
          : null,
        cancel_at_period_end: willBeCanceled,
        payment_method_brand:
          paymentMethod && typeof paymentMethod !== "string"
            ? paymentMethod.card?.brand ?? null
            : null,
        payment_method_last4:
          paymentMethod && typeof paymentMethod !== "string"
            ? paymentMethod.card?.last4 ?? null
            : null,
      };
    }

    // Update the user plan in database
    const { data: updatedPlan, error: updateError } = await supabase
      .from("user_plans")
      .update(subData)
      .eq("stripe_customer_id", customerId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return updatedPlan as UserPlan;
  } catch (error) {
    logger.error({ error }, "Error syncing Stripe data to database");
    throw error;
  }
}

/**
 * Gets or creates a Stripe customer for a user.
 * Always creates customer BEFORE checkout to avoid ephemeral customer issues.
 * Uses authenticated server client.
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string
): Promise<string> {
  const { createServerSupabaseClient } = await import("@/lib/supabase/server");
  const supabase = await createServerSupabaseClient();

  // Check if user already has a stripe_customer_id
  const { data: existingPlan, error: findError } = await supabase
    .from("user_plans")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (findError) {
    throw findError;
  }

  // Return existing customer ID if present
  if (existingPlan?.stripe_customer_id) {
    return existingPlan.stripe_customer_id;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId, // Store next-auth user ID in metadata
    },
  });

  // Update user plan with stripe_customer_id
  const { error: updateError } = await supabase
    .from("user_plans")
    .update({
      stripe_customer_id: customer.id,
    })
    .eq("user_id", userId);

  if (updateError) {
    throw updateError;
  }

  return customer.id;
}

/**
 * Retrieves a user's subscription plan from the database.
 */
export async function getUserPlan(userId: string): Promise<UserPlan | null> {
  const supabase = createServiceRoleSupabaseClient();

  const { data, error } = await supabase
    .from("user_plans")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Not found
      return null;
    }
    throw error;
  }

  return data as UserPlan;
}

/**
 * Process Stripe webhook event and update database accordingly.
 * Captures business metrics for subscription events.
 * Uses service role since webhooks don't have user auth.
 */
export async function processStripeEvent(event: Stripe.Event): Promise<void> {
  // Skip events we don't track
  if (!allowedStripeEvents.includes(event.type)) {
    return;
  }

  // Extract customer ID from event data
  const eventData = event.data.object as { customer?: string };
  const customerId = eventData.customer;

  if (typeof customerId !== "string") {
    throw new Error(
      `[STRIPE WEBHOOK] Customer ID not found in event. Event type: ${event.type}`
    );
  }

  // Get previous state for comparison (to track metrics)
  // Use service role since this is called from webhook (no user auth)
  const supabase = createServiceRoleSupabaseClient();
  const { data: previousPlan } = await supabase
    .from("user_plans")
    .select("status")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  const previousStatus = previousPlan?.status;

  // Sync the data (use service role for webhooks)
  const updatedPlan = await syncStripeDataToDatabase(customerId, true);

  // Capture business metrics based on state transitions
  if (updatedPlan) {
    const newStatus = updatedPlan.status;

    // New subscription created
    if (
      event.type === "customer.subscription.created" ||
      (previousStatus === "none" && newStatus === "active")
    ) {
      captureSubscriptionCreated();
    }

    // Subscription renewed (invoice paid for active subscription)
    if (
      event.type === "invoice.paid" &&
      previousStatus === "active" &&
      newStatus === "active"
    ) {
      captureSubscriptionRenewed();
    }

    // Subscription canceled
    if (
      event.type === "customer.subscription.deleted" ||
      newStatus === "canceled"
    ) {
      captureSubscriptionCanceled();
    }

    // Payment failed
    if (
      event.type === "invoice.payment_failed" ||
      event.type === "payment_intent.payment_failed"
    ) {
      capturePaymentFailed();
    }
  }
}

/**
 * Creates a Stripe checkout session for subscription.
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

/**
 * Creates a Stripe billing portal session for subscription management.
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}
