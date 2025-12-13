"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Target, Rocket, Sparkles } from "lucide-react";
import type { Solution, Problem } from "@/lib/types";
import { useMemo } from "react";
import { useRouter } from "next/navigation";

interface ContinueWidgetProps {
  solutions: Solution[] | undefined;
  problems: Problem[] | undefined;
  onStart: (problem: Problem) => void;
}

export function ContinueWidget({
  solutions,
  problems,
  onStart,
}: ContinueWidgetProps) {
  const router = useRouter();

  const widgetState = useMemo(() => {
    if (!solutions || solutions.length === 0) {
      return {
        type: "new_user" as const,
        completedCount: 0,
        inProgressCount: 0,
      };
    }

    const inProgress = solutions.filter((s) => s.status === "active");
    const completed = solutions.filter((s) => s.status === "completed");

    // Find most recent in-progress solution
    const mostRecentInProgress = inProgress.sort((a, b) => {
      const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return bTime - aTime;
    })[0];

    if (mostRecentInProgress) {
      // Calculate time ago
      const updatedAt = mostRecentInProgress.updated_at
        ? new Date(mostRecentInProgress.updated_at)
        : null;
      const timeAgo = updatedAt ? getTimeAgo(updatedAt) : "recently";

      // Find matching problem for difficulty
      const matchingProblem = problems?.find(
        (p) => p.id === mostRecentInProgress.problem_id
      );

      return {
        type: "continue" as const,
        solution: mostRecentInProgress,
        timeAgo,
        difficulty: matchingProblem?.difficulty,
        completedCount: completed.length,
      };
    }

    if (completed.length > 0) {
      return {
        type: "next_challenge" as const,
        completedCount: completed.length,
      };
    }

    return {
      type: "new_user" as const,
      completedCount: 0,
      inProgressCount: 0,
    };
  }, [solutions, problems]);

  const handleContinue = () => {
    if (widgetState.type === "continue" && widgetState.solution) {
      router.push(`/app/problems/${widgetState.solution.id}`);
    }
  };

  const handleStartNew = () => {
    // Find first problem that doesn't have a solution
    if (!problems || !solutions) return;

    const solvedProblemIds = new Set(solutions.map((s) => s.problem_id));
    const nextProblem = problems.find((p) => !solvedProblemIds.has(p.id));

    if (nextProblem) {
      onStart(nextProblem);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="px-4 flex items-center justify-center flex-1">
        {widgetState.type === "continue" ? (
          <div className="flex flex-col gap-3 w-full">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary shrink-0" />
              <div className="font-semibold text-sm">
                Continue Where You Left Off
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {widgetState.solution.title}
              {widgetState.difficulty && (
                <span className="ml-1">
                  •{" "}
                  {widgetState.difficulty.charAt(0).toUpperCase() +
                    widgetState.difficulty.slice(1)}
                </span>
              )}
              {widgetState.timeAgo && (
                <span className="ml-1">• {widgetState.timeAgo}</span>
              )}
            </div>
            <Button
              onClick={handleContinue}
              size="sm"
              className="w-48 mt-2 ml-auto"
            >
              Continue Interview
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        ) : widgetState.type === "next_challenge" ? (
          <div className="flex flex-col gap-3 w-full">
            <div className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary shrink-0" />
              <div className="font-semibold text-sm">
                Ready for Your Next Challenge?
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              You&apos;ve completed {widgetState.completedCount}{" "}
              {widgetState.completedCount === 1 ? "problem" : "problems"}!
            </div>
            <Button
              onClick={handleStartNew}
              size="sm"
              className="w-48 mt-2 ml-auto"
            >
              Start New Problem
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 w-full">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary shrink-0" />
              <div className="font-semibold text-sm">
                Start Your First Interview
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Pick a problem below to begin practicing
            </div>
            <Button
              onClick={handleStartNew}
              size="sm"
              variant="outline"
              className="w-48 mt-2 ml-auto"
            >
              Browse Problems
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks}w ago`;

  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}
