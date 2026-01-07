import { auth } from "@/lib/auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Helper to get date ranges
function getDateRanges() {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  const monthStart = new Date(now);
  monthStart.setDate(now.getDate() - 30);

  return {
    today: todayStart.toISOString(),
    week: weekStart.toISOString(),
    month: monthStart.toISOString(),
  };
}

export async function GET() {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceRoleSupabaseClient();

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", session.user.id)
      .single();

    if (userError || !user?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { today, week, month } = getDateRanges();

    // Run all queries in parallel for performance
    const [
      // User metrics
      totalUsersResult,
      newUsersTodayResult,
      newUsersWeekResult,
      newUsersMonthResult,
      // Subscription metrics
      subscribedUsersResult,
      // Interview metrics
      totalSolutionsResult,
      completedSolutionsResult,
      evaluatedSolutionsResult,
      solutionsTodayResult,
      solutionsWeekResult,
      // AI Usage metrics
      totalUsageResult,
      usageTodayResult,
      usageWeekResult,
      usageMonthResult,
      // Problem popularity
      problemPopularityResult,
      // Problems for title lookup
      problemsResult,
      // Daily usage for chart (last 14 days)
      dailyUsageResult,
      // Daily signups for chart (last 14 days)
      dailySignupsResult,
    ] = await Promise.all([
      // Total users
      supabase.from("users").select("id", { count: "exact", head: true }),
      // New users today
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .gte("created_at", today),
      // New users this week
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .gte("created_at", week),
      // New users this month
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .gte("created_at", month),
      // Subscribed users (active subscriptions)
      supabase
        .from("user_plans")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      // Total solutions/interviews started
      supabase.from("solutions").select("id", { count: "exact", head: true }),
      // Completed solutions (have concluded_at)
      supabase
        .from("solutions")
        .select("id", { count: "exact", head: true })
        .not("concluded_at", "is", null),
      // Evaluated solutions
      supabase
        .from("solutions")
        .select("id", { count: "exact", head: true })
        .not("evaluated_at", "is", null),
      // Solutions started today
      supabase
        .from("solutions")
        .select("id", { count: "exact", head: true })
        .gte("created_at", today),
      // Solutions started this week
      supabase
        .from("solutions")
        .select("id", { count: "exact", head: true })
        .gte("created_at", week),
      // Total AI usage
      supabase
        .from("ai_usage_events")
        .select("input_tokens, output_tokens, cached_input_tokens, total_cost_usd"),
      // AI usage today
      supabase
        .from("ai_usage_events")
        .select("input_tokens, output_tokens, cached_input_tokens, total_cost_usd")
        .gte("timestamp", today),
      // AI usage this week
      supabase
        .from("ai_usage_events")
        .select("input_tokens, output_tokens, cached_input_tokens, total_cost_usd")
        .gte("timestamp", week),
      // AI usage this month
      supabase
        .from("ai_usage_events")
        .select("input_tokens, output_tokens, cached_input_tokens, total_cost_usd")
        .gte("timestamp", month),
      // Problem popularity - with started, completed, evaluated counts
      supabase
        .from("solutions")
        .select("problem_id, status, evaluated_at")
        .limit(1000), // We'll aggregate client-side
      // All problems for title lookup
      supabase
        .from("problems")
        .select("id, title"),
      // Daily AI usage for last 14 days
      supabase
        .from("ai_usage_events")
        .select("timestamp, total_cost_usd, input_tokens, output_tokens")
        .gte("timestamp", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
        .order("timestamp", { ascending: true }),
      // Daily signups for last 14 days
      supabase
        .from("users")
        .select("created_at")
        .gte("created_at", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: true }),
    ]);

    // Calculate aggregated usage stats
    const aggregateUsage = (data: Array<{ input_tokens: number; output_tokens: number; cached_input_tokens: number; total_cost_usd: number }> | null) => {
      if (!data) return { inputTokens: 0, outputTokens: 0, cachedTokens: 0, totalCost: 0 };
      return data.reduce(
        (acc, row) => ({
          inputTokens: acc.inputTokens + (row.input_tokens || 0),
          outputTokens: acc.outputTokens + (row.output_tokens || 0),
          cachedTokens: acc.cachedTokens + (row.cached_input_tokens || 0),
          totalCost: acc.totalCost + (row.total_cost_usd || 0),
        }),
        { inputTokens: 0, outputTokens: 0, cachedTokens: 0, totalCost: 0 }
      );
    };

    const totalUsage = aggregateUsage(totalUsageResult.data);
    const usageToday = aggregateUsage(usageTodayResult.data);
    const usageWeek = aggregateUsage(usageWeekResult.data);
    const usageMonth = aggregateUsage(usageMonthResult.data);

    // Build problem title lookup
    const problemTitles: Record<string, string> = {};
    problemsResult.data?.forEach((p) => {
      problemTitles[p.id] = p.title;
    });

    // Calculate problem popularity with started, completed, evaluated counts
    const problemCounts: Record<string, { title: string; started: number; completed: number; evaluated: number }> = {};
    problemPopularityResult.data?.forEach((s) => {
      const problemId = s.problem_id;
      const title = problemTitles[problemId] || "Unknown";
      if (!problemCounts[problemId]) {
        problemCounts[problemId] = { title, started: 0, completed: 0, evaluated: 0 };
      }
      problemCounts[problemId].started++;
      // Check status field for completion
      if (s.status === "completed") {
        problemCounts[problemId].completed++;
      }
      if (s.evaluated_at) {
        problemCounts[problemId].evaluated++;
      }
    });
    const topProblems = Object.entries(problemCounts)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.started - a.started)
      .slice(0, 8);

    // Aggregate daily data for charts
    const aggregateDailyData = (
      data: Array<{ timestamp: string; total_cost_usd: number; input_tokens: number; output_tokens: number }> | null
    ) => {
      if (!data) return [];
      const byDay: Record<string, { cost: number; tokens: number }> = {};
      
      data.forEach((row) => {
        const day = row.timestamp.split("T")[0];
        if (!byDay[day]) {
          byDay[day] = { cost: 0, tokens: 0 };
        }
        byDay[day].cost += row.total_cost_usd || 0;
        byDay[day].tokens += (row.input_tokens || 0) + (row.output_tokens || 0);
      });
      
      return Object.entries(byDay)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));
    };

    const aggregateDailySignups = (data: Array<{ created_at: string }> | null) => {
      if (!data) return [];
      const byDay: Record<string, number> = {};
      
      data.forEach((row) => {
        const day = row.created_at.split("T")[0];
        byDay[day] = (byDay[day] || 0) + 1;
      });
      
      return Object.entries(byDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
    };

    const dailyUsageData = aggregateDailyData(dailyUsageResult.data);
    const dailySignupsData = aggregateDailySignups(dailySignupsResult.data);

    // Calculate derived metrics
    const totalUsers = totalUsersResult.count || 0;
    const subscribedUsers = subscribedUsersResult.count || 0;
    const totalSolutions = totalSolutionsResult.count || 0;
    const completedSolutions = completedSolutionsResult.count || 0;
    const evaluatedSolutions = evaluatedSolutionsResult.count || 0;

    const conversionRate = totalUsers > 0 ? (subscribedUsers / totalUsers) * 100 : 0;
    const completionRate = totalSolutions > 0 ? (completedSolutions / totalSolutions) * 100 : 0;
    const avgInterviewsPerUser = totalUsers > 0 ? totalSolutions / totalUsers : 0;
    const avgCostPerInterview = totalSolutions > 0 ? totalUsage.totalCost / totalSolutions : 0;
    const cacheHitRate = 
      totalUsage.inputTokens + totalUsage.cachedTokens > 0
        ? (totalUsage.cachedTokens / (totalUsage.inputTokens + totalUsage.cachedTokens)) * 100
        : 0;

    return NextResponse.json({
      users: {
        total: totalUsers,
        subscribed: subscribedUsers,
        conversionRate: conversionRate.toFixed(1),
        newToday: newUsersTodayResult.count || 0,
        newThisWeek: newUsersWeekResult.count || 0,
        newThisMonth: newUsersMonthResult.count || 0,
      },
      interviews: {
        total: totalSolutions,
        completed: completedSolutions,
        evaluated: evaluatedSolutions,
        completionRate: completionRate.toFixed(1),
        today: solutionsTodayResult.count || 0,
        thisWeek: solutionsWeekResult.count || 0,
        avgPerUser: avgInterviewsPerUser.toFixed(2),
      },
      aiUsage: {
        total: {
          inputTokens: totalUsage.inputTokens,
          outputTokens: totalUsage.outputTokens,
          cachedTokens: totalUsage.cachedTokens,
          totalCost: totalUsage.totalCost.toFixed(4),
        },
        today: {
          inputTokens: usageToday.inputTokens,
          outputTokens: usageToday.outputTokens,
          cachedTokens: usageToday.cachedTokens,
          totalCost: usageToday.totalCost.toFixed(4),
        },
        thisWeek: {
          inputTokens: usageWeek.inputTokens,
          outputTokens: usageWeek.outputTokens,
          cachedTokens: usageWeek.cachedTokens,
          totalCost: usageWeek.totalCost.toFixed(4),
        },
        thisMonth: {
          inputTokens: usageMonth.inputTokens,
          outputTokens: usageMonth.outputTokens,
          cachedTokens: usageMonth.cachedTokens,
          totalCost: usageMonth.totalCost.toFixed(4),
        },
        avgCostPerInterview: avgCostPerInterview.toFixed(4),
        cacheHitRate: cacheHitRate.toFixed(1),
      },
      topProblems,
      charts: {
        dailyUsage: dailyUsageData,
        dailySignups: dailySignupsData,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

