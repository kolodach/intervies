"use client";

import { useAuthenticatedQuery } from "@/lib/hooks/query-hooks";
import { fetchAllProblemsQuery } from "@/lib/queries/problems";
import { capitalize } from "@/lib/utils";
import { captureException } from "@sentry/nextjs";
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { useEffect, useState, useMemo } from "react";
import type { Problem, Solution } from "@/lib/types";
import { CircleDashed, Circle, CircleCheck } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  useEffect(() => {
    if (!search) {
      setProblems(problemsData ?? []);
      return;
    }
    if (problemsData) {
      setProblems(
        problemsData.filter(
          (problem) =>
            problem.title.toLowerCase().includes(search.toLowerCase()) ||
            problem.difficulty.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [problemsData, search]);

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
      <input
        type="text"
        placeholder="Search problems..."
        className="mb-4 p-2 border rounded-md w-full max-w-[400px] focus:outline-none focus:ring-2 focus:ring-primary"
        // This is a dummy search bar, you may add state and handlers to enable search functionality.
        onChange={(e) => {
          setSearch(e.target.value);
        }}
      />
      <div className="w-full mb-4 max-w-[800px] rounded-md border mt-4">
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
  );
}
