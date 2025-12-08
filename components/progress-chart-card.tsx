"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import type { Solution, Problem } from "@/lib/types";
import { useMemo } from "react";
import { CircularProgress } from "@/components/circular-progress";

interface ProgressChartCardProps {
  solutions: Solution[] | undefined;
  problems: Problem[] | undefined;
}

export function ProgressChartCard({
  solutions,
  problems,
}: ProgressChartCardProps) {
  const progressStats = useMemo(() => {
    if (!solutions || !problems) {
      return {
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        total: problems?.length ?? 0,
      };
    }

    const solvedProblemIds = new Set(solutions.map((s) => s.problem_id));
    const completed = solutions.filter((s) => s.status === "completed").length;
    const inProgress = solutions.filter(
      (s) => s.status === "in_progress"
    ).length;
    const notStarted = problems.length - solvedProblemIds.size;

    return {
      completed,
      inProgress,
      notStarted,
      total: problems.length,
    };
  }, [solutions, problems]);

  const difficultyStats = useMemo(() => {
    if (!solutions || !problems) return null;

    const completedSolutionsByProblemId = new Map<string, Solution>();
    for (const solution of solutions) {
      if (solution.status === "completed") {
        completedSolutionsByProblemId.set(solution.problem_id, solution);
      }
    }

    const stats = {
      easy: { completed: 0, total: 0 },
      medium: { completed: 0, total: 0 },
      hard: { completed: 0, total: 0 },
    };

    for (const problem of problems) {
      const difficulty = problem.difficulty.toLowerCase();
      if (difficulty === "easy") {
        stats.easy.total++;
        if (completedSolutionsByProblemId.has(problem.id)) {
          stats.easy.completed++;
        }
      } else if (difficulty === "medium") {
        stats.medium.total++;
        if (completedSolutionsByProblemId.has(problem.id)) {
          stats.medium.completed++;
        }
      } else if (difficulty === "hard") {
        stats.hard.total++;
        if (completedSolutionsByProblemId.has(problem.id)) {
          stats.hard.completed++;
        }
      }
    }

    return stats;
  }, [solutions, problems]);

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 flex">
      <CardContent className="py-1.5 px-3 flex items-center justify-center flex-1">
        <div className="flex items-start gap-6">
          {/* Left: Circular Progress and Stats */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative flex items-center">
              {/* Legend to the left of circle */}
              <div className="absolute right-[130px] top-1/2 -translate-y-1/2 flex flex-col gap-1 items-start">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                  <span className="text-xs font-medium text-foreground whitespace-nowrap">
                    {progressStats.completed} Solved
                  </span>
                </div>
                {progressStats.inProgress > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {progressStats.inProgress} Attempting
                    </span>
                  </div>
                )}
              </div>

              <CircularProgress
                completed={progressStats.completed}
                inProgress={progressStats.inProgress}
                notStarted={progressStats.notStarted}
                total={progressStats.total}
                size={120}
                strokeWidth={8}
              />

              {/* Right: Difficulty breakdown - vertically centered with circle */}
              {difficultyStats && (
                <div className="absolute left-[140px] top-1/2 -translate-y-1/2 flex flex-col gap-1.5 w-auto">
                  <div className="flex items-center justify-between px-2 py-1 rounded-md bg-background/60 border border-border/50 whitespace-nowrap">
                    <span className="text-xs text-green-600 font-medium">
                      Easy
                    </span>
                    <span className="text-xs font-semibold text-foreground text-right ml-3">
                      {difficultyStats.easy.completed}/
                      {difficultyStats.easy.total}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 rounded-md bg-background/60 border border-border/50 whitespace-nowrap">
                    <span className="text-xs text-yellow-600 font-medium">
                      Med.
                    </span>
                    <span className="text-xs font-semibold text-foreground text-right ml-3">
                      {difficultyStats.medium.completed}/
                      {difficultyStats.medium.total}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 rounded-md bg-background/60 border border-border/50 whitespace-nowrap">
                    <span className="text-xs text-red-600 font-medium">
                      Hard
                    </span>
                    <span className="text-xs font-semibold text-foreground text-right ml-3">
                      {difficultyStats.hard.completed}/
                      {difficultyStats.hard.total}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
