import React, { useState } from 'react';
import { Users, Search, ShieldAlert, CheckCircle2 } from 'lucide-react';

export function IPTable({ ips }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [limit, setLimit] = useState(10);

  if (!ips || ips.length === 0) return null;

  const filteredIps = ips.filter((item) =>
    item.ip.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedIps = filteredIps.slice(0, limit);

  return (
    <div className="p-5 rounded-xl bg-[#111827] border border-gray-800 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            Top Requesting IP Addresses
          </h3>
          <p className="text-xs text-gray-400">
            Client IP addresses ranked by total network requests.
          </p>
        </div>

        {/* Search Input & Limit */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="px-2.5 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs text-gray-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value={5}>Top 5</option>
            <option value={10}>Top 10</option>
            <option value={25}>Top 25</option>
            <option value={50}>Top 50</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-900/80 text-gray-400 font-semibold border-b border-gray-800 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-2.5 px-4">#</th>
              <th className="py-2.5 px-4">Client IP Address</th>
              <th className="py-2.5 px-4 text-right">Total Requests</th>
              <th className="py-2.5 px-4 text-right">Success</th>
              <th className="py-2.5 px-4 text-right">Errors</th>
              <th className="py-2.5 px-4 text-right">Error Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 font-mono">
            {displayedIps.map((item, idx) => {
              const errRate = item.requests > 0
                ? ((item.errors / item.requests) * 100).toFixed(1)
                : '0.0';

              return (
                <tr key={item.ip} className="hover:bg-gray-800/40 transition">
                  <td className="py-2.5 px-4 text-gray-500">{idx + 1}</td>
                  <td className="py-2.5 px-4 font-semibold text-gray-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400/80" />
                    {item.ip}
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-white">
                    {item.requests.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-right text-emerald-400">
                    {item.success.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-right text-rose-400">
                    {item.errors.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        parseFloat(errRate) > 15
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {errRate}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
