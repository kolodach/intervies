"use client";

export const dynamic = "force-dynamic";

import { useAuthenticatedQuery } from "@/lib/hooks/query-hooks";
import { fetchAllProblemsQuery } from "@/lib/queries/problems";
import { capitalize } from "@/lib/utils";
import { captureException } from "@sentry/nextjs";
import { useEffect, useState, useMemo } from "react";
import type { Problem, Solution } from "@/lib/types";
import { ProblemsTable } from "@/components/problems-table";
import { ContinueWidget } from "@/components/continue-widget";
import { ProgressChartCard } from "@/components/progress-chart-card";
import { PaywallModal } from "@/components/paywall-modal";
import {
  createSolution,
  findSolutionByProblemId,
  fetchSolutionsByUserId,
} from "@/lib/queries/solutions";
import { useSession } from "next-auth/react";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  useQueriesForTableLoader,
  useQuery,
} from "@supabase-cache-helpers/postgrest-react-query";
import { useUsageLimits } from "@/lib/hooks/use-usage-limits";
import { Header } from "@/components/header";

export default function Page() {
  const { data: session } = useSession();
  const user = session?.user;
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
  const [industryFilters, setIndustryFilters] = useState<Set<string>>(
    new Set()
  );
  const [showPaywall, setShowPaywall] = useState(false);
  const supabase = useSupabaseBrowserClient();
  const { canStartInterview, refetch: refetchUsage } = useUsageLimits();
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

  // Get all unique industries from problems
  const allIndustries = useMemo(() => {
    if (!problemsData) return [];
    const industries = new Set<string>();
    problemsData.forEach((problem) => {
      if (problem.industries) {
        problem.industries.forEach((industry) => industries.add(industry));
      }
    });
    return Array.from(industries).sort();
  }, [problemsData]);

  // Filter and sort problems
  const filteredAndSortedProblems = useMemo(() => {
    if (!problemsData) return [];

    // Filter by search
    let filtered = problemsData.filter((problem) => {
      const matchesSearch =
        !search ||
        problem.title.toLowerCase().includes(search.toLowerCase()) ||
        problem.difficulty.toLowerCase().includes(search.toLowerCase()) ||
        (problem.industries &&
          problem.industries.some((industry) =>
            industry.toLowerCase().includes(search.toLowerCase())
          ));

      return matchesSearch;
    });

    // Filter by status
    if (statusFilters.size > 0) {
      filtered = filtered.filter((problem) => {
        const status = problemStatusMap.get(problem.id) ?? "Not Started";
        const statusMap: Record<string, string> = {
          Active: "active",
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

    // Filter by industry
    if (industryFilters.size > 0) {
      filtered = filtered.filter((problem) => {
        if (!problem.industries) return false;
        return Array.from(industryFilters).some((filter) =>
          problem.industries.includes(filter)
        );
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
            active: 2,
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
    industryFilters,
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

  const toggleIndustryFilter = (industry: string) => {
    setIndustryFilters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(industry)) {
        newSet.delete(industry);
      } else {
        newSet.add(industry);
      }
      return newSet;
    });
  };

  const clearFilters = () => {
    setStatusFilters(new Set());
    setDifficultyFilters(new Set());
    setIndustryFilters(new Set());
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
    // If user already has a solution for this problem, navigate to it
    if (solution) {
      router.push(`/app/problems/${solution.id}`);
      return;
    }
    // Check if user can start a new interview (paywall check)
    if (!canStartInterview) {
      setShowPaywall(true);
      return;
    }
    const { data: newSolution, error: newSolutionError } = await createSolution(
      supabase,
      {
        problem_id: problem.id,
        status: "active",
        title: problem.title,
        user_id: user.id,
      }
    );
    if (newSolutionError) {
      captureException(newSolutionError);
      toast.error("Error creating solution");
      return;
    }
    // Refetch usage limits after starting a new interview
    refetchUsage();
    router.push(`/app/problems/${newSolution.id}`);
  };

  return (
    <>
      <Header>
        <Header.Left>
          <Header.DefaultLeft />
        </Header.Left>
        <Header.Right>
          <Header.DefaultRight />
        </Header.Right>
      </Header>
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="w-full h-full flex flex-col items-center p-4">
          <PaywallModal open={showPaywall} onOpenChange={setShowPaywall} />
          {error && <div className="text-red-500">{error.message}</div>}
          {/* Mobile: Cards stacked in two rows */}
          {/* Medium: Cards at top in one row */}
          {/* Large: Cards to the right of table */}
          <div className="w-full max-w-[1200px]">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Left side: Table (or cards on medium) */}
              <div className="flex-1 flex flex-col">
                {/* Cards at top for medium screens */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-3 mb-4">
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
                {/* Table */}
                <div className="w-full mb-4">
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
                    industryFilters={industryFilters}
                    onToggleStatusFilter={toggleStatusFilter}
                    onToggleDifficultyFilter={toggleDifficultyFilter}
                    onToggleIndustryFilter={toggleIndustryFilter}
                    onClearFilters={clearFilters}
                    allIndustries={allIndustries}
                  />
                </div>
              </div>
              {/* Right side: Cards for large screens */}
              <div className="hidden lg:flex lg:flex-col gap-3 w-96 shrink-0">
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
          </div>
        </div>
      </div>
    </>
  );
}
