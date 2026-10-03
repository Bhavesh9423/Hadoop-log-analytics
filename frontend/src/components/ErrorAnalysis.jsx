import React from 'react';
import { ShieldAlert, AlertTriangle, Globe, Users, ArrowUpRight } from 'lucide-react';

export function ErrorAnalysis({ errors }) {
  if (!errors) return null;

  return (
    <div className="p-5 rounded-xl bg-[#111827] border border-gray-800 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            Error Analysis (4xx & 5xx HTTP Failures)
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Diagnostic breakdown of client errors and server exceptions extracted via MapReduce keys.
          </p>
        </div>

        {/* Error KPI mini-badges */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-800 text-xs">
            <span className="text-gray-400">Total Errors: </span>
            <span className="font-bold text-rose-300 font-mono">
              {errors.total_errors?.toLocaleString() || 0}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs">
            <span className="text-gray-400">Unique Affected IPs: </span>
            <span className="font-bold text-white font-mono">
              {errors.unique_error_ips?.toLocaleString() || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Error status codes breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {errors.distribution && errors.distribution.length > 0 ? (
          errors.distribution.map((item) => {
            const is5xx = item.code.startsWith('5');

            return (
              <div
                key={item.code}
                className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                  is5xx
                    ? 'bg-rose-950/20 border-rose-800/60'
                    : 'bg-amber-950/20 border-amber-800/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                      is5xx
                        ? 'bg-rose-950 text-rose-300 border-rose-800'
                        : 'bg-amber-950 text-amber-300 border-amber-800'
                    }`}
                  >
                    HTTP {item.code}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    {item.percentage}%
                  </span>
                </div>

                <div>
                  <div className="text-sm font-semibold text-white">
                    {item.title}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 font-mono">
                    {item.count.toLocaleString()} occurrences
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-gray-900 rounded-full mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${is5xx ? 'bg-rose-500' : 'bg-amber-500'}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-xs text-emerald-400 p-4 bg-emerald-950/20 rounded-xl border border-emerald-800/50">
            No errors detected in this log dataset! (100% success rate)
          </div>
        )}
      </div>

      {/* Top Affected URLs & Error-generating IPs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Affected URLs */}
        <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Globe className="w-4 h-4 text-indigo-400" />
            Most Affected Endpoints / URLs
          </div>
          <div className="space-y-2">
            {errors.top_affected_urls && errors.top_affected_urls.length > 0 ? (
              errors.top_affected_urls.slice(0, 6).map((u, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-gray-900/80 border border-gray-800"
                >
                  <span className="font-mono text-gray-300 truncate max-w-[220px]">
                    {u.url}
                  </span>
                  <span className="font-mono font-bold text-rose-400 shrink-0 ml-2">
                    {u.count.toLocaleString()} errors
                  </span>
                </div>
              ))
            ) : (
              <span className="text-xs text-gray-500">None</span>
            )}
          </div>
        </div>

        {/* Top Error Generating IPs */}
        <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Users className="w-4 h-4 text-rose-400" />
            Top Error-Generating Client IPs
          </div>
          <div className="space-y-2">
            {errors.top_error_ips && errors.top_error_ips.length > 0 ? (
              errors.top_error_ips.slice(0, 6).map((ipItem, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-gray-900/80 border border-gray-800"
                >
                  <span className="font-mono text-gray-300">
                    {ipItem.ip}
                  </span>
                  <span className="font-mono font-bold text-rose-400 shrink-0 ml-2">
                    {ipItem.count.toLocaleString()} errors
                  </span>
                </div>
              ))
            ) : (
              <span className="text-xs text-gray-500">None</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
