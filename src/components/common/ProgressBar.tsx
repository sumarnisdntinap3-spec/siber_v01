import React from 'react';

interface ProgressBarProps {
  value: number; // 0 - 100
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  showValue = true,
  size = 'md',
  className = ''
}) => {
  const percentage = Math.min(100, Math.max(0, value));

  let barColor = 'bg-emerald-500';
  if (percentage < 60) {
    barColor = 'bg-rose-500';
  } else if (percentage < 80) {
    barColor = 'bg-amber-500';
  } else if (percentage < 90) {
    barColor = 'bg-indigo-600';
  }

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  }[size];

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1 text-[11px] text-slate-500">
          {label && <span className="font-medium text-slate-700">{label}</span>}
          {showValue && <span className="font-bold text-slate-800">{percentage}%</span>}
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${heightClasses}`}>
        <div
          className={`${barColor} ${heightClasses} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
