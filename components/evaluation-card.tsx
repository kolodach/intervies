import { cn } from "@/lib/utils";
import { MessageResponse } from "./ai-elements/message";
import type { FinalEvaluation } from "@/lib/evaluation/schemas";

interface EvaluationCardProps {
  evaluation: FinalEvaluation;
}

export function EvaluationCard({ evaluation }: EvaluationCardProps) {
  const scoreColor =
    evaluation.overall_score >= 80
      ? "text-green-500"
      : evaluation.overall_score >= 50
      ? "text-yellow-500"
      : evaluation.overall_score >= 30
      ? "text-orange-500"
      : "text-red-500";

  const scoreBackground =
    evaluation.overall_score >= 80
      ? "bg-green-500/30"
      : evaluation.overall_score >= 50
      ? "bg-yellow-500/30"
      : evaluation.overall_score >= 30
      ? "bg-orange-500/30"
      : "bg-red-500/30";

  const scoreIcon =
    evaluation.overall_score >= 80
      ? "🏆"
      : evaluation.overall_score >= 50
      ? "💪"
      : evaluation.overall_score >= 30
      ? "🤝"
      : "👋";

  return (
    <div>
      {/* Overall Score Header */}
      <div className={cn("p-2 rounded-sm mb-4", scoreBackground)}>
        <h3 className="text-md font-bold">
          Overall Score:{" "}
          <span className="font-black">{evaluation.overall_score} / 100</span>{" "}
          {scoreIcon}
        </h3>
      </div>

      {/* Summary */}
      <MessageResponse>{evaluation.summary}</MessageResponse>

      {/* Technical Category */}
      <details className="mt-6 border rounded-md p-2">
        <summary className="font-bold cursor-pointer">Technical</summary>

        <div className="mt-3">
          {/* Technical Pros */}
          {evaluation.categories.technical.pros.length > 0 && (
            <div className="mb-4">
              <h4 className="text-md font-semibold text-green-600 mb-2">
                ✓ Strengths
              </h4>
              <ul className="list-none space-y-1">
                {evaluation.categories.technical.pros.map((pro) => (
                  <li key={pro} className="text-sm flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Technical Cons */}
          {evaluation.categories.technical.cons.length > 0 && (
            <div>
              <h4 className="text-md font-semibold text-orange-600 mb-2">
                ⚠ Areas for Growth
              </h4>
              <ul className="list-none space-y-1">
                {evaluation.categories.technical.cons.map((con) => (
                  <li key={con} className="text-sm flex items-start">
                    <span className="text-orange-600 mr-2">•</span>
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </details>

      {/* Communication Category */}
      <details className="mt-2 border rounded-md p-2">
        <summary className="font-bold cursor-pointer">Communication</summary>

        <div className="mt-3">
          {/* Communication Pros */}
          {evaluation.categories.communication.pros.length > 0 && (
            <div className="mb-4">
              <h4 className="text-md font-semibold text-green-600 mb-2">
                ✓ Strengths
              </h4>
              <ul className="list-none space-y-1">
                {evaluation.categories.communication.pros.map((pro) => (
                  <li key={pro} className="text-sm flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Communication Cons */}
          {evaluation.categories.communication.cons.length > 0 && (
            <div>
              <h4 className="text-md font-semibold text-orange-600 mb-2">
                ⚠ Areas for Growth
              </h4>
              <ul className="list-none space-y-1">
                {evaluation.categories.communication.cons.map((con) => (
                  <li key={con} className="text-sm flex items-start">
                    <span className="text-orange-600 mr-2">•</span>
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
