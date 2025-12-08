"use client";

import { useAuthenticatedQuery } from "@/lib/hooks/query-hooks";
import { fetchAllProblemsQuery } from "@/lib/queries/problems";
import { capitalize } from "@/lib/utils";
import { captureException } from "@sentry/nextjs";
import { useEffect, useState, useMemo } from "react";
import type { Problem, Solution } from "@/lib/types";
import { ProblemsTable } from "@/components/problems-table";
import { ContinueWidget } from "@/components/continue-widget";
import { ProgressChartCard } from "@/components/progress-chart-card";
import {
  createSolution,
  findSolutionByProblemId,
  fetchSolutionsByUserId,
} from "@/lib/queries/solutions";
import { useUser } from "@clerk/nextjs";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  useQueriesForTableLoader,
  useQuery,
} from "@supabase-cache-helpers/postgrest-react-query";

export default function Page() {
  const { user } = useUser();
  const router = useRouter();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<
    "status" | "title" | "difficulty" | null
  >(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set());
  const [difficultyFilters, setDifficultyFilters] = useState<Set<string>>(
    new Set()
  );
  const supabase = useSupabaseBrowserClient();
  const { data: problemsData, error } = useQuery(
    fetchAllProblemsQuery(supabase),
    {
      enabled: !!user,
    }
  );

  const { data: solutionsData } = useQuery(
    fetchSolutionsByUserId(supabase, user?.id ?? ""),
    {
      enabled: !!user?.id,
    }
  );

  // Create a map of problem_id -> solution status (using first solution if multiple exist)
  const problemStatusMap = useMemo(() => {
    if (!solutionsData) return new Map<string, string>();
    const map = new Map<string, string>();
    for (const solution of solutionsData) {
      // Only set if not already in map (to get first solution)
      if (!map.has(solution.problem_id)) {
        map.set(solution.problem_id, solution.status);
      }
    }
    return map;
  }, [solutionsData]);

  const getProblemStatus = (problemId: string): string => {
    return problemStatusMap.get(problemId) ?? "Not Started";
  };

  // Filter and sort problems
  const filteredAndSortedProblems = useMemo(() => {
    if (!problemsData) return [];

    // Filter by search
    let filtered = problemsData.filter((problem) => {
      const matchesSearch =
        !search ||
        problem.title.toLowerCase().includes(search.toLowerCase()) ||
        problem.difficulty.toLowerCase().includes(search.toLowerCase());

      return matchesSearch;
    });

    // Filter by status
    if (statusFilters.size > 0) {
      filtered = filtered.filter((problem) => {
        const status = problemStatusMap.get(problem.id) ?? "Not Started";
        const statusMap: Record<string, string> = {
          Active: "in_progress",
          Completed: "completed",
          "Not Started": "Not Started",
        };
        return Array.from(statusFilters).some((filter) => {
          const mappedStatus = statusMap[filter];
          return mappedStatus === status;
        });
      });
    }

    // Filter by difficulty
    if (difficultyFilters.size > 0) {
      filtered = filtered.filter((problem) => {
        const difficultyMap: Record<string, string> = {
          Easy: "easy",
          Normal: "medium",
          Hard: "hard",
        };
        return Array.from(difficultyFilters).some((filter) => {
          const mappedDifficulty = difficultyMap[filter];
          return mappedDifficulty === problem.difficulty;
        });
      });
    }

    // Sort
    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;

        if (sortBy === "title") {
          comparison = a.title.localeCompare(b.title);
        } else if (sortBy === "difficulty") {
          const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
          comparison =
            difficultyOrder[a.difficulty as keyof typeof difficultyOrder] -
            difficultyOrder[b.difficulty as keyof typeof difficultyOrder];
        } else if (sortBy === "status") {
          const statusA = problemStatusMap.get(a.id) ?? "Not Started";
          const statusB = problemStatusMap.get(b.id) ?? "Not Started";
          const statusOrder = {
            "Not Started": 1,
            in_progress: 2,
            completed: 3,
          };
          comparison =
            (statusOrder[statusA as keyof typeof statusOrder] ?? 0) -
            (statusOrder[statusB as keyof typeof statusOrder] ?? 0);
        }

        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return filtered;
  }, [
    problemsData,
    search,
    statusFilters,
    difficultyFilters,
    sortBy,
    sortDirection,
    problemStatusMap,
  ]);

  useEffect(() => {
    setProblems(filteredAndSortedProblems);
  }, [filteredAndSortedProblems]);

  const handleSort = (column: "status" | "title" | "difficulty") => {
    if (sortBy === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new column with ascending direction
      setSortBy(column);
      setSortDirection("asc");
    }
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(status)) {
        newSet.delete(status);
      } else {
        newSet.add(status);
      }
      return newSet;
    });
  };

  const toggleDifficultyFilter = (difficulty: string) => {
    setDifficultyFilters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(difficulty)) {
        newSet.delete(difficulty);
      } else {
        newSet.add(difficulty);
      }
      return newSet;
    });
  };

  const handleStart = async (problem: Problem) => {
    if (!user) return;
    const { data: solution, error: solutionError } =
      await findSolutionByProblemId(supabase, problem.id, user.id);
    if (solutionError) {
      captureException(solutionError);
      toast.error("Error finding solution");
      return;
    }
    if (solution) {
      router.push(`/app/problems/${solution.id}`);
      return;
    }
    const { data: newSolution, error: newSolutionError } = await createSolution(
      supabase,
      {
        problem_id: problem.id,
        status: "in_progress",
        title: problem.title,
        user_id: user.id,
      }
    );
    if (newSolutionError) {
      captureException(newSolutionError);
      toast.error("Error creating solution");
      return;
    }
    router.push(`/app/problems/${newSolution.id}`);
  };

  return (
    <div className="w-full h-full flex flex-col items-center p-4">
      {error && <div className="text-red-500">{error.message}</div>}
      <div className="w-full mb-3 max-w-[800px]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ContinueWidget
            solutions={solutionsData ?? undefined}
            problems={problemsData ?? undefined}
            onStart={handleStart}
          />
          <ProgressChartCard
            solutions={solutionsData ?? undefined}
            problems={problemsData ?? undefined}
          />
        </div>
      </div>
      <div className="w-full mb-4 max-w-[800px]">
        <ProblemsTable
          problems={problems}
          getProblemStatus={getProblemStatus}
          onRowClick={handleStart}
          search={search}
          onSearchChange={setSearch}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={handleSort}
          statusFilters={statusFilters}
          difficultyFilters={difficultyFilters}
          onToggleStatusFilter={toggleStatusFilter}
          onToggleDifficultyFilter={toggleDifficultyFilter}
        />
      </div>
    </div>
  );
}
