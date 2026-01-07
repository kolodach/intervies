"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  UserCheck,
  MessageSquare,
  CheckCircle,
  DollarSign,
  TrendingUp,
  Zap,
  Target,
  Loader2,
  BarChart3,
  Brain,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DashboardStats {
  users: {
    total: number;
    subscribed: number;
    conversionRate: string;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  interviews: {
    total: number;
    completed: number;
    evaluated: number;
    completionRate: string;
    today: number;
    thisWeek: number;
    avgPerUser: string;
  };
  aiUsage: {
    total: {
      inputTokens: number;
      outputTokens: number;
      cachedTokens: number;
      totalCost: string;
    };
    today: {
      inputTokens: number;
      outputTokens: number;
      cachedTokens: number;
      totalCost: string;
    };
    thisWeek: {
      inputTokens: number;
      outputTokens: number;
      cachedTokens: number;
      totalCost: string;
    };
    thisMonth: {
      inputTokens: number;
      outputTokens: number;
      cachedTokens: number;
      totalCost: string;
    };
    avgCostPerInterview: string;
    cacheHitRate: string;
  };
  topProblems: Array<{ id: string; title: string; started: number; completed: number; evaluated: number }>;
  charts: {
    dailyUsage: Array<{ date: string; cost: number; tokens: number }>;
    dailySignups: Array<{ date: string; count: number }>;
  };
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: { value: string; positive?: boolean };
  className?: string;
}) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && (
          <div
            className={cn(
              "flex items-center text-xs mt-2",
              trend.positive ? "text-emerald-500" : "text-amber-500"
            )}
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            {trend.value}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MiniBarChart({
  data,
  dataKey,
  color = "var(--primary)",
}: {
  data: Array<{ date: string; [key: string]: string | number }>;
  dataKey: string;
  color?: string;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[80px] flex items-center justify-center text-muted-foreground text-sm">
        No data yet
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => Number(d[dataKey]) || 0));

  return (
    <div className="flex items-end gap-1 h-[80px]">
      {data.map((item, i) => {
        const value = Number(item[dataKey]) || 0;
        const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
        return (
          <div
            key={i}
            className="flex-1 group relative"
            title={`${item.date}: ${typeof value === "number" && dataKey === "cost" ? `$${value.toFixed(4)}` : value.toLocaleString()}`}
          >
            <div
              className="w-full rounded-sm transition-all hover:opacity-80"
              style={{
                height: `${Math.max(height, 2)}%`,
                backgroundColor: color,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`;
  }
  return tokens.toString();
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [aiGateway, setAiGateway] = useState<{ balance: string; totalUsed: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch stats and AI Gateway credits in parallel
        const [statsRes, gatewayRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/ai-gateway"),
        ]);

        if (!statsRes.ok) {
          throw new Error("Failed to fetch stats");
        }
        const statsData = await statsRes.json();
        setStats(statsData);

        // AI Gateway is optional - don't fail if it errors
        if (gatewayRes.ok) {
          const gatewayData = await gatewayRes.json();
          setAiGateway(gatewayData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <div className="text-center">
          <p className="text-destructive font-medium">Failed to load dashboard</p>
          <p className="text-muted-foreground text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your platform metrics and performance
        </p>
      </div>

      {/* User Metrics */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" />
          User Metrics
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={stats.users.total.toLocaleString()}
            subtitle={`+${stats.users.newThisMonth} this month`}
            icon={Users}
          />
          <StatCard
            title="Pro Subscribers"
            value={stats.users.subscribed.toLocaleString()}
            subtitle={`${stats.users.conversionRate}% conversion rate`}
            icon={UserCheck}
            className="border-emerald-500/20 bg-emerald-500/5"
          />
          <StatCard
            title="New Today"
            value={stats.users.newToday}
            subtitle={`${stats.users.newThisWeek} this week`}
            icon={TrendingUp}
          />
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Signups (14 days)
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0">
              <MiniBarChart
                data={stats.charts.dailySignups}
                dataKey="count"
                color="hsl(var(--primary))"
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Interview Metrics */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-violet-500" />
          Interview Metrics
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Interviews"
            value={stats.interviews.total.toLocaleString()}
            subtitle={`${stats.interviews.today} started today`}
            icon={MessageSquare}
          />
          <StatCard
            title="Completed"
            value={stats.interviews.completed.toLocaleString()}
            subtitle={`${stats.interviews.completionRate}% completion rate`}
            icon={CheckCircle}
            className="border-green-500/20 bg-green-500/5"
          />
          <StatCard
            title="Evaluated"
            value={stats.interviews.evaluated.toLocaleString()}
            subtitle="With AI feedback"
            icon={Target}
          />
          <StatCard
            title="Avg per User"
            value={stats.interviews.avgPerUser}
            subtitle="Interviews per user"
            icon={TrendingUp}
          />
        </div>
      </section>

      {/* AI Usage & Cost */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Brain className="h-5 w-5 text-amber-500" />
          AI Usage & Cost
        </h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {/* AI Gateway Balance - only show if available */}
          {aiGateway && (
            <StatCard
              title="Gateway Balance"
              value={`$${parseFloat(aiGateway.balance).toFixed(2)}`}
              subtitle={`$${parseFloat(aiGateway.totalUsed).toFixed(2)} used`}
              icon={Zap}
              className="border-emerald-500/20 bg-emerald-500/5"
            />
          )}
          <StatCard
            title="Total Spend"
            value={`$${stats.aiUsage.total.totalCost}`}
            subtitle={`$${stats.aiUsage.thisMonth.totalCost} this month`}
            icon={DollarSign}
          />
          <StatCard
            title="Today's Cost"
            value={`$${stats.aiUsage.today.totalCost}`}
            subtitle={formatTokens(stats.aiUsage.today.inputTokens + stats.aiUsage.today.outputTokens) + " tokens"}
            icon={Clock}
          />
          <StatCard
            title="Cost / Interview"
            value={`$${stats.aiUsage.avgCostPerInterview}`}
            subtitle="Average AI cost"
            icon={Zap}
          />
          <StatCard
            title="Cache Hit Rate"
            value={`${stats.aiUsage.cacheHitRate}%`}
            subtitle="Token efficiency"
            icon={Zap}
            className="border-cyan-500/20 bg-cyan-500/5"
          />
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Daily Cost (14 days)
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0">
              <MiniBarChart
                data={stats.charts.dailyUsage}
                dataKey="cost"
                color="hsl(var(--primary))"
              />
            </CardContent>
          </Card>
        </div>

        {/* Token Breakdown */}
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Token Usage (All Time)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Input</span>
                <span className="font-mono text-sm">
                  {formatTokens(stats.aiUsage.total.inputTokens)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Output</span>
                <span className="font-mono text-sm">
                  {formatTokens(stats.aiUsage.total.outputTokens)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Cached</span>
                <span className="font-mono text-sm text-cyan-500">
                  {formatTokens(stats.aiUsage.total.cachedTokens)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Token Usage (This Month)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Input</span>
                <span className="font-mono text-sm">
                  {formatTokens(stats.aiUsage.thisMonth.inputTokens)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Output</span>
                <span className="font-mono text-sm">
                  {formatTokens(stats.aiUsage.thisMonth.outputTokens)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Cached</span>
                <span className="font-mono text-sm text-cyan-500">
                  {formatTokens(stats.aiUsage.thisMonth.cachedTokens)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Token Usage (This Week)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Input</span>
                <span className="font-mono text-sm">
                  {formatTokens(stats.aiUsage.thisWeek.inputTokens)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Output</span>
                <span className="font-mono text-sm">
                  {formatTokens(stats.aiUsage.thisWeek.outputTokens)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Cached</span>
                <span className="font-mono text-sm text-cyan-500">
                  {formatTokens(stats.aiUsage.thisWeek.cachedTokens)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Token Usage (Today)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Input</span>
                <span className="font-mono text-sm">
                  {formatTokens(stats.aiUsage.today.inputTokens)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Output</span>
                <span className="font-mono text-sm">
                  {formatTokens(stats.aiUsage.today.outputTokens)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Cached</span>
                <span className="font-mono text-sm text-cyan-500">
                  {formatTokens(stats.aiUsage.today.cachedTokens)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Top Problems */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-rose-500" />
          Problem Analytics
        </h2>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Interview funnel by problem
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {stats.topProblems.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                No interview data yet
              </p>
            ) : (
              <div style={{ height: Math.max(stats.topProblems.length * 40 + 50, 150) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.topProblems.map((p) => ({
                      name: p.title.length > 25 ? p.title.slice(0, 25) + "…" : p.title,
                      fullName: p.title,
                      // For stacking, segments must be mutually exclusive
                      Evaluated: p.evaluated,
                      Completed: Math.max(0, p.completed - p.evaluated),
                      "In Progress": Math.max(0, p.started - p.completed),
                    }))}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    barSize={14}
                    barGap={0}
                    barCategoryGap="20%"
                  >
                    <XAxis
                      type="number"
                      stroke="#ffffff"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={160}
                      stroke="#ffffff"
                      fontSize={13}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "13px",
                        padding: "8px 12px",
                      }}
                      labelStyle={{ color: "hsl(var(--popover-foreground))", fontWeight: 600, marginBottom: 4 }}
                      formatter={(value, name) => [value ?? 0, name]}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ""}
                      cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "13px", paddingTop: "12px" }}
                      iconType="square"
                      iconSize={10}
                    />
                    <Bar dataKey="Evaluated" stackId="a" fill="#8b5cf6" radius={4} />
                    <Bar dataKey="Completed" stackId="a" fill="#10b981" radius={4} />
                    <Bar dataKey="In Progress" stackId="a" fill="#3b82f6" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

