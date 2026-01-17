"use client";

import { cn } from "@/lib/utils";
import { CRITERIA, type CriterionKey } from "@/lib/evaluation/criteria";
import { Target, Flag } from "lucide-react";

export type CriteriaItemProps = {
  /**
   * The criterion key from the checklist
   */
  criterionKey: CriterionKey;
  /**
   * Whether this criterion has been observed/triggered
   */
  isTriggered?: boolean;
  /**
   * Whether to show the weight percentage
   */
  showWeight?: boolean;
  /**
   * Additional class names
   */
  className?: string;
  /**
   * Compact mode for inline display (e.g., in tool call output)
   */
  compact?: boolean;
};

/**
 * Reusable component for displaying a single evaluation criterion.
 * Shows the criterion name with an icon indicating positive vs red flag.
 */
export function CriteriaItem({
  criterionKey,
  isTriggered = false,
  showWeight = true,
  className,
  compact = false,
}: CriteriaItemProps) {
  const criterion = CRITERIA[criterionKey];

  if (!criterion) {
    return null;
  }

  const { name, weight_percent, is_red_flag, description } = criterion;

  // Icon based on type
  const Icon = is_red_flag ? Flag : Target;

  // Weight display with +/- prefix
  const weightDisplay = is_red_flag
    ? `-${weight_percent}%`
    : `+${weight_percent}%`;

  // Color classes based on type and trigger state
  const iconColorClass = is_red_flag
    ? isTriggered
      ? "text-red-500"
      : "text-red-400/50"
    : isTriggered
      ? "text-green-500"
      : "text-muted-foreground/50";

  const textColorClass = isTriggered
    ? "text-foreground"
    : "text-muted-foreground";

  const weightColorClass = is_red_flag
    ? isTriggered
      ? "text-red-500"
      : "text-red-400/50"
    : isTriggered
      ? "text-green-500"
      : "text-muted-foreground/50";

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-sm",
          textColorClass,
          className
        )}
      >
        <Icon className={cn("size-3.5 shrink-0", iconColorClass)} />
        <span className="truncate">{name}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 py-2 group",
        textColorClass,
        className
      )}
      title={description}
    >
      <Icon className={cn("size-4 shrink-0 mt-0.5", iconColorClass)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "text-sm font-medium truncate",
              !isTriggered && "opacity-70"
            )}
          >
            {name}
          </span>
          {showWeight && (
            <span
              className={cn(
                "text-sm font-medium shrink-0",
                weightColorClass
              )}
            >
              {weightDisplay}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * List of criteria items
 */
export type CriteriaListProps = {
  /**
   * Array of criterion keys to display
   */
  criteria: CriterionKey[];
  /**
   * The current checklist state
   */
  checklist: Record<string, boolean>;
  /**
   * Whether to show weights
   */
  showWeight?: boolean;
  /**
   * Additional class names
   */
  className?: string;
};

export function CriteriaList({
  criteria,
  checklist,
  showWeight = true,
  className,
}: CriteriaListProps) {
  if (criteria.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-0.5", className)}>
      {criteria.map((key) => (
        <CriteriaItem
          key={key}
          criterionKey={key}
          isTriggered={checklist[key] === true}
          showWeight={showWeight}
        />
      ))}
    </div>
  );
}
