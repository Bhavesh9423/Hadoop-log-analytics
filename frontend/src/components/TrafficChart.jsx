import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Clock, Calendar } from 'lucide-react';

export function TrafficChart({ trafficData }) {
  const [granularity, setGranularity] = useState('hourly');

  if (!trafficData) return null;

  const currentData = granularity === 'hourly' ? trafficData.hourly : trafficData.daily;

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-lg bg-gray-900 border border-gray-700 shadow-xl text-xs">
          <div className="font-mono text-gray-400 mb-1">{label}</div>
          <div className="font-bold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>Requests: {payload[0].value.toLocaleString()}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-5 rounded-xl bg-[#111827] border border-gray-800 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            Requests Over Time
            <span className="text-xs text-gray-400 font-normal">
              ({currentData ? currentData.length : 0} time points)
            </span>
          </h3>
          <p className="text-xs text-gray-400">
            Chronological request volume aggregated from timestamps in the uploaded log dataset.
          </p>
        </div>

        {/* Hourly / Daily Granularity Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-900 border border-gray-800 self-start sm:self-auto">
          <button
            onClick={() => setGranularity('hourly')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
              granularity === 'hourly'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Hourly
          </button>
          <button
            onClick={() => setGranularity('daily')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
              granularity === 'daily'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Daily
          </button>
        </div>
      </div>

      {/* Chart container */}
      <div className="h-72 w-full pt-2">
        {currentData && currentData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={currentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#6B7280"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => {
                  if (granularity === 'hourly') {
                    // val is 'YYYY-MM-DD HH:00' -> show 'DD HH:00'
                    const parts = val.split(' ');
                    return parts.length > 1 ? `${parts[0].slice(8)} ${parts[1]}` : val;
                  }
                  return val.slice(5); // 'MM-DD'
                }}
              />
              <YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="requests"
                stroke="#6366F1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#trafficGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-gray-500">
            No time series data available for this range
          </div>
        )}
      </div>
    </div>
  );
}
