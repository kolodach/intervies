// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { supabaseIntegration } from "@supabase/sentry-js-integration";
import { SupabaseClient } from "@supabase/supabase-js";

Sentry.init({
  dsn: "https://788b4e89c6a0a06499743c23e27458e4@o4510415400075264.ingest.us.sentry.io/4510415403417600",

  // Add optional integrations for additional features
  integrations: [
    Sentry.replayIntegration(),
    supabaseIntegration(SupabaseClient, Sentry, {
      tracing: true,
      breadcrumbs: true,
      errors: true,
    }),
    // Ignore Supabase requests for tracing
    // Sentry.browserTracingIntegration({
    //   shouldCreateSpanForRequest: (url) => {
    //     return !url.startsWith(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest`);
    //   },
    // }),
  ],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
  // Setting this option to true will print useful information to the console while you're setting up Sentry.  debug: true,
  debug: true,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
