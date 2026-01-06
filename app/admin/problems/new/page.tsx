"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProblemForm } from "@/components/admin/problem-form";
import { Tables } from "@/lib/database.types";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type Problem = Tables<"problems">;

export default function NewProblemPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: Partial<Problem>) => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/admin/problems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create problem");
      }

      toast.success("Problem created successfully");
      router.push("/admin/problems");
    } catch (error) {
      console.error("Error creating problem:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create problem"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/admin/problems");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/admin/problems")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Problem</h1>
          <p className="text-muted-foreground">
            Add a new interview problem to the system
          </p>
        </div>
      </div>

      <ProblemForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  );
}

