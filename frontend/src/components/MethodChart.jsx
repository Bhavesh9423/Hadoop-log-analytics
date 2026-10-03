import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export function MethodChart({ methods }) {
  if (!methods || methods.length === 0) return null;

  const totalMethods = methods.reduce((acc, curr) => acc + curr.count, 0);

  // Method specific colors
  const methodColors = {
    GET: '#10B981',    // Emerald
    POST: '#3B82F6',   // Blue
    PUT: '#F59E0B',    // Amber
    DELETE: '#EF4444', // Red
    PATCH: '#8B5CF6',  // Purple
    HEAD: '#6B7280',   // Gray
    OPTIONS: '#EC4899' // Pink
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const pct = totalMethods > 0 ? ((data.count / totalMethods) * 100).toFixed(1) : 0;
      return (
        <div className="p-3 rounded-lg bg-gray-900 border border-gray-700 shadow-xl text-xs">
          <div className="font-bold text-white flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: methodColors[data.method] || '#6366F1' }}
            />
            <span>{data.method}</span>
          </div>
          <div className="text-gray-300 font-mono mt-1">
            {data.count.toLocaleString()} requests ({pct}%)
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-5 rounded-xl bg-[#111827] border border-gray-800 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-white">
          HTTP Request Methods
        </h3>
        <p className="text-xs text-gray-400">
          Breakdown of HTTP verbs observed in parsed log records.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        {/* Donut Chart */}
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={methods}
                dataKey="count"
                nameKey="method"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
              >
                {methods.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={methodColors[entry.method] || '#6366F1'}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend List */}
        <div className="space-y-2">
          {methods.map((item) => {
            const pct = totalMethods > 0 ? ((item.count / totalMethods) * 100).toFixed(1) : 0;
            const color = methodColors[item.method] || '#6366F1';

            return (
              <div
                key={item.method}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-900/60 border border-gray-800 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-bold font-mono text-white">{item.method}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-gray-300">{item.count.toLocaleString()}</span>
                  <span className="text-gray-500 text-[11px]">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
