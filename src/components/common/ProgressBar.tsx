'use client';

interface ProgressBarProps {
  progress: number;
  message?: string;
  showPercentage?: boolean;
  className?: string;
}

export default function ProgressBar({
  progress,
  message,
  showPercentage = true,
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min(Math.max(progress * 100, 0), 100);

  return (
    <div className={`w-full ${className}`}>
      {message && (
        <div className="mb-2 text-sm text-gray-600 flex justify-between items-center">
          <span>{message}</span>
          {showPercentage && (
            <span className="font-semibold text-gray-800">
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
