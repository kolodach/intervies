import { useEffect, useState } from "react";
import type { FinalEvaluation } from "@/lib/evaluation/schemas";
import { logger } from "@/lib/logger";

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

    logger.info({ solutionId }, "Starting evaluation polling");

    // Poll every second
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
          logger.info({ solutionId }, "Evaluation completed");
          setIsPolling(false);
        } else if (data.status === "evaluation_failed") {
          logger.error({ solutionId }, "Evaluation failed");
          setError("Evaluation failed. Please try again.");
          setIsPolling(false);
        }
      } catch (err) {
        logger.error({ solutionId, error: err }, "Polling error");
        setError(
          err instanceof Error ? err.message : "Failed to fetch evaluation"
        );
        setIsPolling(false);
      }
    }, 1000);

    // Timeout after 2 minutes
    const timeout = setTimeout(() => {
      logger.warn({ solutionId }, "Evaluation polling timed out");
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
