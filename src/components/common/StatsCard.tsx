import React, { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  colorTheme?: 'blue' | 'emerald' | 'amber' | 'indigo' | 'purple' | 'slate';
  id?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  colorTheme = 'blue',
  id
}) => {
  const themeStyles = {
    blue: {
      bgIcon: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    },
    emerald: {
      bgIcon: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    amber: {
      bgIcon: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    indigo: {
      bgIcon: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    },
    purple: {
      bgIcon: 'bg-purple-50 text-purple-600 border-purple-100',
    },
    slate: {
      bgIcon: 'bg-slate-50 text-slate-700 border-slate-200',
    }
  }[colorTheme];

  return (
    <div
      id={id}
      className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 tracking-tight">{value}</h3>
          {subtitle && <p className="text-[11px] text-slate-500 mt-1 font-medium">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2 text-[11px] font-medium">
              <span className={trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                {trend.value}
              </span>
              <span className="text-slate-400">vs target periode</span>
            </div>
          )}
        </div>
        <div className={`p-2.5 rounded-lg border ${themeStyles.bgIcon}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
