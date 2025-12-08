"use client";

interface CircularProgressProps {
  completed: number;
  inProgress: number;
  notStarted: number;
  total: number;
  size?: number;
  strokeWidth?: number;
}

function describeArc(
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(" ");
}

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

export function CircularProgress({
  completed,
  inProgress,
  notStarted,
  total,
  size = 120,
  strokeWidth = 12,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  // Calculate percentages
  const completedPercent = total > 0 ? completed / total : 0;
  const inProgressPercent = total > 0 ? inProgress / total : 0;
  const notStartedPercent = total > 0 ? notStarted / total : 0;

  // Calculate angles (starting from top, going clockwise)
  // Green (completed) starts at the top (0 degrees)
  const completedAngle = 360 * completedPercent;
  const inProgressAngle = 360 * inProgressPercent;
  const notStartedAngle = 360 * notStartedPercent;

  // Starting angles for each segment - green starts at top (0°)
  const completedStart = 0;
  const inProgressStart = completedAngle;
  const notStartedStart = completedAngle + inProgressAngle;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size}>
        {/* Draw in reverse order so green appears on top visually */}
        {/* Not Started (Gray) - drawn first so it's underneath */}
        {notStarted > 0 && (
          <path
            d={describeArc(
              center,
              center,
              radius,
              notStartedStart,
              notStartedStart + notStartedAngle
            )}
            fill="none"
            stroke="rgb(156, 163, 175)" // gray-400
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        )}
        {/* In Progress (Orange) - drawn second */}
        {inProgress > 0 && (
          <path
            d={describeArc(
              center,
              center,
              radius,
              inProgressStart,
              inProgressStart + inProgressAngle
            )}
            fill="none"
            stroke="rgb(249, 115, 22)" // orange-500
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        )}
        {/* Completed (Green) - drawn last so it's on top, starts at 0° (top) */}
        {completed > 0 && (
          <path
            d={describeArc(
              center,
              center,
              radius,
              completedStart,
              completedStart + completedAngle
            )}
            fill="none"
            stroke="rgb(34, 197, 94)" // green-500
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        )}
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-xl font-bold text-foreground leading-none">
          {completed} / {total}
        </div>
      </div>
    </div>
  );
}
