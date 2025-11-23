import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Health check endpoint
 * Verifies Supabase connection and database accessibility
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Test connection by fetching questions
    const { data, error } = await supabase
      .from("questions")
      .select("id, title, difficulty")
      .limit(1);

    if (error) {
      console.error("Supabase health check error:", error);
      return NextResponse.json(
        {
          status: "unhealthy",
          service: "supabase",
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      status: "healthy",
      service: "supabase",
      database: {
        connected: true,
        questionsAvailable: data?.length ?? 0,
      },
      config: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        service: "supabase",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
