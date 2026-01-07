"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  CheckCircle2,
  Circle,
  RotateCw,
} from "lucide-react";
import { Tables } from "@/lib/database.types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type Problem = Tables<"problems">;

export default function ProblemsPage() {
  const router = useRouter();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [filteredProblems, setFilteredProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all"
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [problemToDelete, setProblemToDelete] = useState<Problem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchProblems();
  }, []);

  useEffect(() => {
    // Filter problems based on search query and status
    let filtered = problems;

    // Apply status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((p) => p.is_active);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((p) => !p.is_active);
    }

    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.difficulty.toLowerCase().includes(query) ||
          (p.industries || []).some((i) => i.toLowerCase().includes(query))
      );
    }

    setFilteredProblems(filtered);
  }, [searchQuery, statusFilter, problems]);

  const fetchProblems = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/problems");
      if (!response.ok) {
        throw new Error("Failed to fetch problems");
      }
      const data = await response.json();
      setProblems(data);
      setFilteredProblems(data);
    } catch (error) {
      console.error("Error fetching problems:", error);
      toast.error("Failed to fetch problems");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!problemToDelete) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/admin/problems/${problemToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete problem");
      }

      toast.success("Problem deactivated successfully");
      // Update the problem in the list to reflect the deactivated state
      const updatedProblem = await response.json();
      setProblems(
        problems.map((p) => (p.id === problemToDelete.id ? updatedProblem : p))
      );
      setDeleteDialogOpen(false);
      setProblemToDelete(null);
    } catch (error) {
      console.error("Error deleting problem:", error);
      toast.error("Failed to delete problem");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleActive = async (problem: Problem) => {
    try {
      const response = await fetch(`/api/admin/problems/${problem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !problem.is_active }),
      });

      if (!response.ok) {
        throw new Error("Failed to update problem");
      }

      const updatedProblem = await response.json();
      setProblems(
        problems.map((p) => (p.id === problem.id ? updatedProblem : p))
      );
      toast.success(
        `Problem ${updatedProblem.is_active ? "activated" : "deactivated"}`
      );
    } catch (error) {
      console.error("Error updating problem:", error);
      toast.error("Failed to update problem");
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "hard":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Problems</h1>
          <p className="text-muted-foreground">
            Manage interview problems and questions. Use the status icon or action
            buttons to activate/deactivate.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/problems/new")}>
          <Plus className="h-4 w-4 mr-2" />
          New Problem
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search problems..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            All
          </Button>
          <Button
            variant={statusFilter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("active")}
          >
            Active
          </Button>
          <Button
            variant={statusFilter === "inactive" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("inactive")}
          >
            Inactive
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Industries</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProblems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  {searchQuery
                    ? "No problems found matching your search"
                    : statusFilter === "active"
                      ? "No active problems. Activate a problem or create a new one!"
                      : statusFilter === "inactive"
                        ? "No inactive problems."
                        : "No problems yet. Create your first problem!"}
                </TableCell>
              </TableRow>
            ) : (
              filteredProblems.map((problem) => (
                <TableRow
                  key={problem.id}
                  className={!problem.is_active ? "opacity-50" : ""}
                >
                  <TableCell>
                    <button
                      onClick={() => toggleActive(problem)}
                      className="hover:opacity-70 transition-opacity"
                      title={
                        problem.is_active
                          ? "Click to deactivate"
                          : "Click to activate"
                      }
                    >
                      {problem.is_active ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {problem.title}
                        {!problem.is_active && (
                          <Badge
                            variant="outline"
                            className="ml-2 text-xs text-muted-foreground"
                          >
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {problem.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={getDifficultyColor(problem.difficulty)}
                    >
                      {problem.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(problem.industries || []).length === 0 ? (
                        <span className="text-muted-foreground text-sm">—</span>
                      ) : (
                        <>
                          {(problem.industries || []).slice(0, 2).map((ind, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {ind}
                            </Badge>
                          ))}
                          {(problem.industries?.length || 0) > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{(problem.industries?.length || 0) - 2}
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          router.push(`/admin/problems/${problem.id}`)
                        }
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {problem.is_active ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setProblemToDelete(problem);
                            setDeleteDialogOpen(true);
                          }}
                          title="Deactivate"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleActive(problem)}
                          title="Reactivate"
                          className="text-green-600 hover:text-green-700"
                        >
                          <RotateCw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog - Only render after hydration */}
      {isMounted && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Problem?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate &quot;{problemToDelete?.title}&quot; and hide
              it from users. Existing solutions will still reference this
              problem. You can reactivate it later by toggling its status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      )}
    </div>
  );
}

