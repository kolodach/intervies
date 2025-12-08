"use client";

import { useAuthenticatedQuery } from "@/lib/hooks/query-hooks";
import { fetchAllProblemsQuery } from "@/lib/queries/problems";
import { capitalize } from "@/lib/utils";
import { captureException } from "@sentry/nextjs";
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { useEffect, useState, useMemo } from "react";
import type { Problem, Solution } from "@/lib/types";
import {
  CircleDashed,
  Circle,
  CircleCheck,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Search,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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

  const getSortLabel = () => {
    if (!sortBy) return null;
    const labels: Record<string, string> = {
      status: "Status",
      title: "Title",
      difficulty: "Difficulty",
    };
    return labels[sortBy];
  };

  return (
    <div className="w-full h-full flex flex-col items-center p-4">
      {error && <div className="text-red-500">{error.message}</div>}
      <div className="w-full mb-4 max-w-[800px]">
        {/* Search and Controls */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search problems..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                {sortBy ? (
                  <>
                    {sortDirection === "asc" ? (
                      <ArrowUp className="w-4 h-4" />
                    ) : (
                      <ArrowDown className="w-4 h-4" />
                    )}
                    <span className="ml-2">{getSortLabel()}</span>
                  </>
                ) : (
                  <ArrowUpDown className="w-4 h-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleSort("status")}>
                <div className="flex items-center gap-2">
                  {sortBy === "status" ? (
                    sortDirection === "asc" ? (
                      <ArrowDown className="w-4 h-4" />
                    ) : (
                      <ArrowUp className="w-4 h-4" />
                    )
                  ) : (
                    <ArrowUpDown className="w-4 h-4" />
                  )}
                  <span>Status</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("title")}>
                <div className="flex items-center gap-2">
                  {sortBy === "title" ? (
                    sortDirection === "asc" ? (
                      <ArrowDown className="w-4 h-4" />
                    ) : (
                      <ArrowUp className="w-4 h-4" />
                    )
                  ) : (
                    <ArrowUpDown className="w-4 h-4" />
                  )}
                  <span>Title</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("difficulty")}>
                <div className="flex items-center gap-2">
                  {sortBy === "difficulty" ? (
                    sortDirection === "asc" ? (
                      <ArrowDown className="w-4 h-4" />
                    ) : (
                      <ArrowUp className="w-4 h-4" />
                    )
                  ) : (
                    <ArrowUpDown className="w-4 h-4" />
                  )}
                  <span>Difficulty</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="w-4 h-4" />
                {(statusFilters.size > 0 || difficultyFilters.size > 0) && (
                  <span className="ml-2">
                    {statusFilters.size + difficultyFilters.size}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={statusFilters.has("Active")}
                onCheckedChange={() => toggleStatusFilter("Active")}
              >
                Active
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilters.has("Completed")}
                onCheckedChange={() => toggleStatusFilter("Completed")}
              >
                Completed
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilters.has("Not Started")}
                onCheckedChange={() => toggleStatusFilter("Not Started")}
              >
                Not Started
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Difficulty</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={difficultyFilters.has("Easy")}
                onCheckedChange={() => toggleDifficultyFilter("Easy")}
              >
                Easy
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={difficultyFilters.has("Normal")}
                onCheckedChange={() => toggleDifficultyFilter("Normal")}
              >
                Normal
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={difficultyFilters.has("Hard")}
                onCheckedChange={() => toggleDifficultyFilter("Hard")}
              >
                Hard
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableBody>
              {problems?.map((problem) => {
                const status = getProblemStatus(problem.id);
                return (
                  <TableRow
                    key={problem.id}
                    onClick={() => handleStart(problem)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    {/* Status and Title merged */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center">
                              {status === "completed" ? (
                                <CircleCheck className="w-5 h-5 text-green-600" />
                              ) : status === "in_progress" ? (
                                <Circle className="w-5 h-5 text-orange-500" />
                              ) : (
                                <CircleDashed className="w-5 h-5 text-gray-500" />
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {status === "Not Started"
                                ? status
                                : capitalize(status.replace(/_/g, " "))}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                        <span className="font-medium">{problem.title}</span>
                      </div>
                    </TableCell>
                    {/* Difficulty */}
                    <TableCell className="text-right">
                      <span
                        className={
                          problem.difficulty === "easy"
                            ? "text-green-600"
                            : problem.difficulty === "medium"
                            ? "text-yellow-600"
                            : problem.difficulty === "hard"
                            ? "text-red-600"
                            : undefined
                        }
                      >
                        {capitalize(problem.difficulty)}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
