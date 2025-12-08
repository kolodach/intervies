import { useEffect, useState } from "react";
import type { FinalEvaluation } from "@/lib/evaluation/schemas";

interface EvaluationState {
  status: "active" | "evaluating" | "completed" | "evaluation_failed";
  evaluation: FinalEvaluation | null;
  evaluated_at: string | null;
}

export function useEvaluationPolling(solutionId: string, enabled = false) {
  const [evaluationState, setEvaluationState] = useState<EvaluationState>({
    status: "active",
    evaluation: null,
    evaluated_at: null,
  });
  const [isPolling, setIsPolling] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPolling || !solutionId) return;

    // Poll every 3 seconds
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/v1/solutions/${solutionId}/evaluation`
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: EvaluationState = await response.json();
        setEvaluationState(data);

        if (data.status === "completed") {
          setIsPolling(false);
        } else if (data.status === "evaluation_failed") {
          setError("Evaluation failed. Please try again.");
          setIsPolling(false);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch evaluation"
        );
        setIsPolling(false);
      }
    }, 3000);

    // Timeout after 2 minutes
    const timeout = setTimeout(() => {
      setError("Evaluation timed out. Please refresh the page.");
      setIsPolling(false);
    }, 120000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [solutionId, isPolling]);

  return {
    evaluation: evaluationState.evaluation,
    status: evaluationState.status,
    isEvaluating: evaluationState.status === "evaluating",
    isCompleted: evaluationState.status === "completed",
    isFailed: evaluationState.status === "evaluation_failed",
    error,
    startPolling: () => setIsPolling(true),
    stopPolling: () => setIsPolling(false),
  };
}
