import React, { useState, useEffect } from 'react';
import {
  ListFilter,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { api } from '../services/api';

export function LogTable({ activeFilters = {}, onViewAll }) {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total_records: 0, total_pages: 1 });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadLogs = async (page = 1, query = searchQuery) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.limit,
        search: query,
        ...activeFilters
      };
      const res = await api.getLogs(params);
      setLogs(res.records || []);
      setPagination(res.pagination || { page: 1, limit: 15, total_records: 0, total_pages: 1 });
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(1);
  }, [activeFilters]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadLogs(1, searchQuery);
  };

  const getStatusBadge = (code, category) => {
    if (code >= 200 && code < 300) {
      return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
    }
    if (code >= 300 && code < 400) {
      return 'bg-blue-950/80 text-blue-300 border-blue-800';
    }
    if (code >= 400 && code < 500) {
      return 'bg-amber-950/80 text-amber-300 border-amber-800';
    }
    return 'bg-rose-950/80 text-rose-300 border-rose-800';
  };

  return (
    <div className="p-5 rounded-xl bg-[#111827] border border-gray-800 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ListFilter className="w-4 h-4 text-indigo-400" />
            Recent Log Activity & Records
            <span className="text-xs text-gray-400 font-normal font-mono">
              ({pagination.total_records.toLocaleString()} matching records)
            </span>
          </h3>
          <p className="text-xs text-gray-400">
            Parsed raw Apache/Nginx log lines showing client IP, request method, endpoint, and HTTP response code.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition cursor-pointer"
          >
            Find
          </button>
        </form>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-900/80 text-gray-400 font-semibold border-b border-gray-800 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-2.5 px-4">Timestamp</th>
              <th className="py-2.5 px-4">Client IP</th>
              <th className="py-2.5 px-4">Method</th>
              <th className="py-2.5 px-4">Requested URL</th>
              <th className="py-2.5 px-4 text-right">Status Code</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 font-mono">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500 text-xs">
                  Loading log records...
                </td>
              </tr>
            ) : logs.length > 0 ? (
              logs.map((r, idx) => (
                <tr key={idx} className="hover:bg-gray-800/40 transition">
                  <td className="py-2.5 px-4 text-gray-400 whitespace-nowrap">
                    {r.timestamp}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-gray-200 whitespace-nowrap">
                    {r.ip}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="font-bold text-indigo-300">
                      {r.method}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-gray-300 truncate max-w-[260px] sm:max-w-md">
                    {r.url}
                  </td>
                  <td className="py-2.5 px-4 text-right whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getStatusBadge(
                        r.status_code,
                        r.category
                      )}`}
                    >
                      {r.status_code}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500 text-xs">
                  No log records match the current filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs text-gray-400">
        <div>
          Showing page <span className="font-semibold text-white font-mono">{pagination.page}</span> of{' '}
          <span className="font-semibold text-white font-mono">{pagination.total_pages}</span> (
          {pagination.total_records.toLocaleString()} total entries)
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => loadLogs(pagination.page - 1)}
            disabled={pagination.page <= 1 || loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 font-medium transition cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </button>

          <button
            onClick={() => loadLogs(pagination.page + 1)}
            disabled={pagination.page >= pagination.total_pages || loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 font-medium transition cursor-pointer"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
