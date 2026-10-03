import React, { useState } from 'react';
import { Globe, ArrowUpRight } from 'lucide-react';

export function URLChart({ urls }) {
  const [topN, setTopN] = useState(10);

  if (!urls || urls.length === 0) return null;

  const displayUrls = urls.slice(0, topN);
  const maxCount = displayUrls[0]?.count || 1;

  return (
    <div className="p-5 rounded-xl bg-[#111827] border border-gray-800 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400" />
            Top Visited URLs / Pages
          </h3>
          <p className="text-xs text-gray-400">
            Most requested web endpoints sorted by total hits.
          </p>
        </div>

        {/* Top-N Selector */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-900 border border-gray-800">
          {[5, 10, 20].map((n) => (
            <button
              key={n}
              onClick={() => setTopN(n)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                topN === n
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Top {n}
            </button>
          ))}
        </div>
      </div>

      {/* Horizontal Bar List */}
      <div className="space-y-3 pt-1">
        {displayUrls.map((item, idx) => {
          const percentage = ((item.count / maxCount) * 100).toFixed(0);

          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-gray-200 truncate max-w-[280px] sm:max-w-md">
                  <span className="text-gray-500 mr-2 font-mono">{idx + 1}.</span>
                  {item.url}
                </span>
                <span className="font-mono font-bold text-indigo-300 ml-2">
                  {item.count.toLocaleString()}
                </span>
              </div>

              <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
