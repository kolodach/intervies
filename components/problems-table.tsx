"use client";

import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
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
import { capitalize } from "@/lib/utils";
import type { Problem } from "@/lib/types";

interface ProblemsTableProps {
  problems: Problem[];
  getProblemStatus: (problemId: string) => string;
  onRowClick: (problem: Problem) => void;
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: "status" | "title" | "difficulty" | null;
  sortDirection: "asc" | "desc";
  onSort: (column: "status" | "title" | "difficulty") => void;
  statusFilters: Set<string>;
  difficultyFilters: Set<string>;
  onToggleStatusFilter: (status: string) => void;
  onToggleDifficultyFilter: (difficulty: string) => void;
}

export function ProblemsTable({
  problems,
  getProblemStatus,
  onRowClick,
  search,
  onSearchChange,
  sortBy,
  sortDirection,
  onSort,
  statusFilters,
  difficultyFilters,
  onToggleStatusFilter,
  onToggleDifficultyFilter,
}: ProblemsTableProps) {
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
    <div className="w-full">
      {/* Search and Controls */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search problems..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
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
            <DropdownMenuItem onClick={() => onSort("status")}>
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
            <DropdownMenuItem onClick={() => onSort("title")}>
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
            <DropdownMenuItem onClick={() => onSort("difficulty")}>
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
              onCheckedChange={() => onToggleStatusFilter("Active")}
            >
              Active
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={statusFilters.has("Completed")}
              onCheckedChange={() => onToggleStatusFilter("Completed")}
            >
              Completed
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={statusFilters.has("Not Started")}
              onCheckedChange={() => onToggleStatusFilter("Not Started")}
            >
              Not Started
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Difficulty</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={difficultyFilters.has("Easy")}
              onCheckedChange={() => onToggleDifficultyFilter("Easy")}
            >
              Easy
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={difficultyFilters.has("Normal")}
              onCheckedChange={() => onToggleDifficultyFilter("Normal")}
            >
              Normal
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={difficultyFilters.has("Hard")}
              onCheckedChange={() => onToggleDifficultyFilter("Hard")}
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
            {problems.map((problem) => {
              const status = getProblemStatus(problem.id);
              return (
                <TableRow
                  key={problem.id}
                  onClick={() => onRowClick(problem)}
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
