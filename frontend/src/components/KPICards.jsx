import React from 'react';
import { ArrowUpRight, CheckCircle2, AlertTriangle, Users, Clock, Hash } from 'lucide-react';

export function KPICards({ summary, executionTime, processingMode }) {
  if (!summary) return null;

  const cards = [
    {
      title: 'Total Requests',
      value: summary.total_requests?.toLocaleString() || '0',
      subtitle: summary.malformed_lines > 0 ? `${summary.malformed_lines} malformed records handled` : 'All records parsed successfully',
      icon: Hash,
      color: 'indigo',
      badge: 'Processed',
    },
    {
      title: 'Successful Requests',
      value: summary.successful_requests?.toLocaleString() || '0',
      subtitle: `${summary.success_rate || 0}% of all traffic (2xx/3xx)`,
      icon: CheckCircle2,
      color: 'emerald',
      badge: `${summary.success_rate || 0}%`,
    },
    {
      title: 'Error Requests',
      value: summary.error_requests?.toLocaleString() || '0',
      subtitle: `${summary.error_rate || 0}% client/server errors (4xx/5xx)`,
      icon: AlertTriangle,
      color: 'rose',
      badge: `${summary.error_rate || 0}%`,
    },
    {
      title: 'Unique IP Addresses',
      value: summary.unique_ips?.toLocaleString() || '0',
      subtitle: 'Distinct client nodes observed',
      icon: Users,
      color: 'blue',
      badge: 'Clients',
    },
  ];

  const colorStyles = {
    indigo: {
      border: 'border-indigo-500/20 hover:border-indigo-500/40',
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      badge: 'bg-indigo-950 text-indigo-300 border-indigo-800'
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      badge: 'bg-emerald-950 text-emerald-300 border-emerald-800'
    },
    rose: {
      border: 'border-rose-500/20 hover:border-rose-500/40',
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      badge: 'bg-rose-950 text-rose-300 border-rose-800'
    },
    blue: {
      border: 'border-blue-500/20 hover:border-blue-500/40',
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      badge: 'bg-blue-950 text-blue-300 border-blue-800'
    },
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          const style = colorStyles[card.color];

          return (
            <div
              key={idx}
              className={`p-5 rounded-xl bg-[#111827] border ${style.border} transition-all duration-200 shadow-sm`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400">{card.title}</span>
                <div className={`p-2 rounded-lg ${style.bg} ${style.text}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
                  {card.value}
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${style.badge}`}>
                  {card.badge}
                </span>
              </div>

              <p className="mt-2 text-xs text-gray-400 truncate">
                {card.subtitle}
              </p>
            </div>
          );
        })}
      </div>

      {executionTime !== undefined && (
        <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-gray-900/60 border border-gray-800/80 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>MapReduce Execution Time:</span>
            <span className="font-mono font-semibold text-white">{executionTime} ms</span>
          </div>
          <div className="text-gray-400">
            Engine:{' '}
            <span className="font-semibold text-gray-200">
              {processingMode === 'hadoop' ? 'Hadoop Streaming (YARN)' : 'Local MapReduce Simulator'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
