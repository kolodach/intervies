"use client";

import { cn } from "@/lib/utils";
import {
  calculateScore,
  groupChecklist,
  type CriterionKey,
} from "@/lib/evaluation/criteria";
import type { SolutionState } from "@/lib/types";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { CriteriaList } from "./criteria-item";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type ProgressPanelProps = {
  /**
   * The current evaluation checklist state
   */
  checklist: Record<string, boolean>;
  /**
   * Current interview state for the progress indicator
   */
  interviewState: SolutionState;
  /**
   * Additional class names
   */
  className?: string;
  /**
   * Controlled: whether the panel is expanded
   */
  isExpanded?: boolean;
  /**
   * Controlled: callback when expansion state changes
   */
  onExpandedChange?: (expanded: boolean) => void;
};

/**
 * Interview progress as a percentage based on state
 */
function getInterviewProgress(state: SolutionState): number {
  switch (state) {
    case "GREETING":
      return 0;
    case "REQUIREMENTS":
      return 33;
    case "DESIGNING":
      return 66;
    case "CONCLUSION":
      return 100;
    default:
      return 0;
  }
}

/**
 * Reusable circular progress indicator with tooltip
 */
function ProgressRing({
  progress,
  label,
  tooltip,
  size = 15,
  strokeWidth = 3,
  colorClass = "text-green-500",
  showValue = false,
}: {
  progress: number;
  label: string;
  tooltip: string;
  size?: number;
  strokeWidth?: number;
  colorClass?: string;
  showValue?: boolean;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 cursor-default">
            <span className="text-xs text-muted-foreground">{label}</span>
            <div className="relative" style={{ width: size, height: size }}>
              <svg
                width={size}
                height={size}
                className="-rotate-90"
                aria-label={tooltip}
                role="img"
              >
                {/* Background circle */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={strokeWidth}
                  className="text-muted"
                />
                {/* Progress circle */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className={cn("transition-all duration-500", colorClass)}
                />
              </svg>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Section header for criteria groups
 */
function SectionHeader({
  title,
  count,
  className,
}: {
  title: string;
  count: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground py-2",
        className
      )}
    >
      <span>{title}</span>
      <span className="text-muted-foreground/50">({count})</span>
    </div>
  );
}

/**
 * Collapsible progress panel showing candidate progress and evaluation criteria.
 *
 * Collapsed: Shows score percentage and expand button
 * Expanded: Shows three sections - Noted, Remaining, Avoid
 *
 * Can be controlled (via isExpanded/onExpandedChange) or uncontrolled.
 */
export function ProgressPanel({
  checklist,
  interviewState,
  className,
  isExpanded: controlledExpanded,
  onExpandedChange,
}: ProgressPanelProps) {
  // Support both controlled and uncontrolled modes
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded ?? internalExpanded;

  const handleOpenChange = (open: boolean) => {
    if (onExpandedChange) {
      onExpandedChange(open);
    } else {
      setInternalExpanded(open);
    }
  };

  const score = calculateScore(checklist);
  const { noted, remaining, avoid } = groupChecklist(checklist);
  const interviewProgress = getInterviewProgress(interviewState);

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={handleOpenChange}
      className={cn("rounded-lg text-card-foreground", className)}
    >
      {/* Collapsed header - always visible */}
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-3 px-4 py-2 hover:bg-muted/50 transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="size-4 text-muted-foreground" />
          )}
          <ProgressRing
            progress={score}
            label="Candidate Progress:"
            tooltip={`Candidate Progress: ${score}%`}
            showValue
            colorClass={
              score >= 70
                ? "text-green-500"
                : score >= 30
                ? "text-yellow-500"
                : "text-muted-foreground"
            }
          />
        </button>
      </CollapsibleTrigger>

      {/* Expanded content */}
      <CollapsibleContent>
        <div className="px-4 pb-3 space-y-4 max-h-[300px] overflow-y-auto">
          {/* Score summary */}
          <div className="flex items-center justify-between py-2 border-b border-muted">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "text-xl font-bold",
                  score >= 70
                    ? "text-green-500"
                    : score >= 30
                    ? "text-yellow-500"
                    : "text-foreground"
                )}
              >
                {score}%
              </span>
              <span className="text-xs text-muted-foreground">
                Candidate Score
              </span>
            </div>
          </div>

          {/* Noted section */}
          {noted.length > 0 && (
            <div>
              <SectionHeader title="Noted" count={noted.length} />
              <CriteriaList
                criteria={noted}
                checklist={checklist}
                showWeight={true}
              />
            </div>
          )}

          {/* Remaining section */}
          {remaining.length > 0 && (
            <div>
              <SectionHeader title="Remaining" count={remaining.length} />
              <CriteriaList
                criteria={remaining}
                checklist={checklist}
                showWeight={true}
              />
            </div>
          )}

          {/* Avoid section */}
          {avoid.length > 0 && (
            <div>
              <SectionHeader title="Avoid" count={avoid.length} />
              <CriteriaList
                criteria={avoid}
                checklist={checklist}
                showWeight={true}
              />
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
