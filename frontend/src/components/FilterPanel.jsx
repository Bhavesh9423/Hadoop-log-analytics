import React, { useState } from 'react';
import { Filter, RotateCcw, Search, Check } from 'lucide-react';

export function FilterPanel({ onApplyFilters, onResetFilters, availableMethods = [] }) {
  const [status, setStatus] = useState('');
  const [method, setMethod] = useState('');
  const [url, setUrl] = useState('');
  const [ip, setIp] = useState('');
  const [search, setSearch] = useState('');

  const handleApply = (e) => {
    if (e) e.preventDefault();
    onApplyFilters({
      status,
      method,
      url,
      ip,
      search
    });
  };

  const handleReset = () => {
    setStatus('');
    setMethod('');
    setUrl('');
    setIp('');
    setSearch('');
    onResetFilters();
  };

  const hasActiveFilters = Boolean(status || method || url || ip || search);

  return (
    <div className="p-4 rounded-xl bg-[#111827] border border-gray-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-indigo-400" />
          Analytics & Log Filters
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset All
          </button>
        )}
      </div>

      <form onSubmit={handleApply} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Status Category / Code Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 mb-1">
            HTTP Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="2xx">2xx (Success)</option>
            <option value="3xx">3xx (Redirection)</option>
            <option value="4xx">4xx (Client Error)</option>
            <option value="5xx">5xx (Server Error)</option>
            <option value="200">200 OK</option>
            <option value="301">301 Moved</option>
            <option value="400">400 Bad Request</option>
            <option value="401">401 Unauthorized</option>
            <option value="403">403 Forbidden</option>
            <option value="404">404 Not Found</option>
            <option value="500">500 Server Error</option>
            <option value="502">502 Bad Gateway</option>
            <option value="503">503 Unavailable</option>
          </select>
        </div>

        {/* HTTP Method Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 mb-1">
            HTTP Method
          </label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">All Methods</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>
        </div>

        {/* URL Path Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 mb-1">
            URL Path Contains
          </label>
          <input
            type="text"
            placeholder="/home, /api..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* IP Address Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 mb-1">
            IP Address
          </label>
          <input
            type="text"
            placeholder="192.168.1.10..."
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        {/* Actions Button */}
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            Apply Filters
          </button>
        </div>
      </form>
    </div>
  );
}
