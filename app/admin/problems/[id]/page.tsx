"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ProblemForm } from "@/components/admin/problem-form";
import type { Tables } from "@/lib/database.types";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

type Problem = Tables<"problems">;

export default function EditProblemPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [problem, setProblem] = useState<Problem | null>(null);
  const [isLoadingProblem, setIsLoadingProblem] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchProblem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProblem = async () => {
    try {
      setIsLoadingProblem(true);
      const response = await fetch(`/api/admin/problems/${id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch problem");
      }

      const data = await response.json();
      setProblem(data);
    } catch (error) {
      console.error("Error fetching problem:", error);
      toast.error("Failed to fetch problem");
      router.push("/admin/problems");
    } finally {
      setIsLoadingProblem(false);
    }
  };

  const handleSubmit = async (data: Partial<Problem>) => {
    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/admin/problems/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update problem");
      }

      toast.success("Problem updated successfully");
      router.push("/admin/problems");
    } catch (error) {
      console.error("Error updating problem:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update problem"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      const response = await fetch(`/api/admin/problems/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete problem");
      }

      toast.success("Problem deactivated successfully");
      router.push("/admin/problems");
    } catch (error) {
      console.error("Error deleting problem:", error);
      toast.error("Failed to delete problem");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleCancel = () => {
    router.push("/admin/problems");
  };

  if (isLoadingProblem) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Problem not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/problems")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Problem</h1>
            <p className="text-muted-foreground">
              Update problem details and settings
            </p>
          </div>
        </div>

        <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
          <Trash2 className="h-4 w-4 mr-2" />
          Deactivate Problem
        </Button>
      </div>

      <ProblemForm
        initialData={problem}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation Dialog - Only render after hydration */}
      {isMounted && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deactivate Problem?</AlertDialogTitle>
              <AlertDialogDescription>
                This will deactivate &quot;{problem.title}&quot; and hide it
                from users. Existing solutions will still reference this
                problem. You can reactivate it later from the problems list.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Deactivate
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
