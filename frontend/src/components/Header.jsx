import React from 'react';
import { Database, HardDrive, Activity, Download, RefreshCw, FileText } from 'lucide-react';
import { api } from '../services/api';

export function Header({
  health,
  config,
  activeFile,
  datasetLoaded,
  onLoadSample,
  loadingSample
}) {
  const isHadoopMode = config?.mode === 'hadoop';
  const isOnline = health?.status === 'online';

  return (
    <header className="sticky top-0 z-30 border-b border-gray-800 bg-[#0E131F]/90 backdrop-blur-md px-6 py-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Title & Subtitle */}
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Hadoop Log Analytics
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-indigo-950 text-indigo-300 border border-indigo-800">
                  MapReduce v3.3
                </span>
              </h1>
              <p className="text-xs text-gray-400">
                Web-Based Log File Analysis & Visualization
              </p>
            </div>
          </div>
        </div>

        {/* Status Indicators & Action Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* System Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-gray-400">System:</span>
            <span className={isOnline ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Processing Mode Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs">
            <HardDrive className={`w-3.5 h-3.5 ${isHadoopMode ? 'text-amber-400' : 'text-blue-400'}`} />
            <span className="text-gray-400">Processing Mode:</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                isHadoopMode
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                  : 'bg-blue-950/80 text-blue-300 border border-blue-800'
              }`}
            >
              {isHadoopMode ? 'Hadoop' : 'Local Demo'}
            </span>
          </div>

          {/* Active File Badge */}
          {activeFile && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs text-gray-300">
              <FileText className="w-3.5 h-3.5 text-gray-400" />
              <span className="truncate max-w-[140px] font-mono text-gray-200">{activeFile}</span>
            </div>
          )}

          {/* Quick Load Sample Data */}
          <button
            onClick={onLoadSample}
            disabled={loadingSample}
            title="Load built-in 5,500 record sample log dataset"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium transition cursor-pointer shadow-sm shadow-indigo-900/40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingSample ? 'animate-spin' : ''}`} />
            {loadingSample ? 'Processing...' : 'Load Sample (5.5k)'}
          </button>

          {/* Export Buttons */}
          {datasetLoaded && (
            <div className="flex items-center gap-2">
              <a
                href={api.getExportCsvUrl()}
                download
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white text-xs font-medium transition"
                title="Download CSV Report"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                CSV
              </a>
              <a
                href={api.getExportJsonUrl()}
                download
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white text-xs font-medium transition"
                title="Download JSON Report"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                JSON
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
