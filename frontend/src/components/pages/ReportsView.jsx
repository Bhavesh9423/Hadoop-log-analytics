import React from 'react';
import { Download, FileSpreadsheet, FileCode, CheckCircle2, ShieldCheck, Printer } from 'lucide-react';
import { api } from '../../services/api';
import { EmptyState } from '../EmptyState';

export function ReportsView({ datasetLoaded, analytics, onUploadClick, onLoadSample }) {
  if (!datasetLoaded || !analytics) {
    return (
      <EmptyState
        onUploadClick={onUploadClick}
        onLoadSample={onLoadSample}
      />
    );
  }

  const { summary, status_codes, status_categories, urls, ips, processing_mode_label, execution_time_ms } = analytics;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Generated Analytics Reports
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Export structured summary and aggregate datasets for offline documentation or presentation slides.
          </p>
        </div>

        {/* Action Downloads */}
        <div className="flex items-center gap-3">
          <a
            href={api.getExportCsvUrl()}
            download
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer shadow-md shadow-emerald-900/30"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Download CSV Report
          </a>

          <a
            href={api.getExportJsonUrl()}
            download
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition cursor-pointer shadow-md shadow-indigo-900/30"
          >
            <FileCode className="w-4 h-4" />
            Download JSON Report
          </a>
        </div>
      </div>

      {/* Executive Report Card */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-gray-800 space-y-6">
        <div className="border-b border-gray-800 pb-4">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Report Title: <strong>Web Server Log Traffic & Failure Audit</strong></span>
            <span>Generated: {new Date().toLocaleString()}</span>
          </div>
          <div className="mt-2 text-sm text-gray-300">
            Engine Used: <strong className="text-indigo-400 font-mono">{processing_mode_label}</strong> • Job Latency: <strong className="text-white font-mono">{execution_time_ms} ms</strong>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-gray-900/70 border border-gray-800">
            <span className="text-xs text-gray-400">Total Volume</span>
            <div className="text-xl font-bold text-white mt-1 font-mono">
              {summary.total_requests?.toLocaleString()}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gray-900/70 border border-gray-800">
            <span className="text-xs text-gray-400">Success Rate</span>
            <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">
              {summary.success_rate}%
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gray-900/70 border border-gray-800">
            <span className="text-xs text-gray-400">Error Rate</span>
            <div className="text-xl font-bold text-rose-400 mt-1 font-mono">
              {summary.error_rate}%
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gray-900/70 border border-gray-800">
            <span className="text-xs text-gray-400">Unique Clients</span>
            <div className="text-xl font-bold text-blue-400 mt-1 font-mono">
              {summary.unique_ips?.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Summary Table Preview */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
            Top Aggregated Highlights
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-800">
              <span className="text-xs font-semibold text-gray-300 mb-2 block">
                Top 5 Requested Endpoints
              </span>
              <div className="space-y-1.5 text-xs font-mono">
                {urls.slice(0, 5).map((u, i) => (
                  <div key={i} className="flex justify-between text-gray-300">
                    <span className="truncate max-w-[220px]">{u.url}</span>
                    <span className="text-indigo-400 font-bold">{u.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-800">
              <span className="text-xs font-semibold text-gray-300 mb-2 block">
                Top 5 High-Traffic IP Addresses
              </span>
              <div className="space-y-1.5 text-xs font-mono">
                {ips.slice(0, 5).map((ipItem, i) => (
                  <div key={i} className="flex justify-between text-gray-300">
                    <span>{ipItem.ip}</span>
                    <span className="text-blue-400 font-bold">{ipItem.requests.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
