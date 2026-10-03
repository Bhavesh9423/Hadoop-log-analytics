import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  BarChart2,
  ListFilter,
  GitBranch,
  FileSpreadsheet,
  Info,
  Settings,
  Server
} from 'lucide-react';

export function Sidebar({ activeTab, setActiveTab, datasetLoaded, processingMode }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'upload', label: 'Upload Logs', icon: UploadCloud, badge: null },
    { id: 'analysis', label: 'Analysis', icon: BarChart2, badge: null, requiresData: true },
    { id: 'logs', label: 'Recent Logs', icon: ListFilter, badge: null, requiresData: true },
    { id: 'pipeline', label: 'MapReduce Pipeline', icon: GitBranch, badge: 'Live', requiresData: true },
    { id: 'reports', label: 'Reports & Export', icon: FileSpreadsheet, badge: null, requiresData: true },
    { id: 'about', label: 'About & Hadoop Viva', icon: Info, badge: null },
    { id: 'settings', label: 'Settings & Cluster', icon: Settings, badge: null },
  ];

  return (
    <aside className="w-64 border-r border-gray-800 bg-[#0E131F] flex flex-col justify-between shrink-0 min-h-[calc(100vh-73px)]">
      <div className="p-4 space-y-6">
        <div>
          <div className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase px-3 mb-2">
            Navigation
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isDisabled = item.requiresData && !datasetLoaded;

              return (
                <button
                  key={item.id}
                  onClick={() => !isDisabled && setActiveTab(item.id)}
                  disabled={isDisabled}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                      : isDisabled
                      ? 'text-gray-600 cursor-not-allowed'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-gray-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                      {item.badge}
                    </span>
                  )}
                  {isDisabled && (
                    <span className="text-[10px] text-gray-600 uppercase font-mono">
                      No Data
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Engine status snippet in sidebar */}
        <div className="p-3 rounded-lg bg-gray-900/90 border border-gray-800/80">
          <div className="flex items-center gap-2 mb-1.5">
            <Server className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-semibold text-gray-300">Active Engine</span>
          </div>
          <div className="text-xs text-gray-400">
            Current pipeline:
            <span className="block font-medium text-white mt-0.5">
              {processingMode === 'hadoop' ? 'Apache Hadoop Cluster' : 'Local MapReduce Simulator'}
            </span>
          </div>
        </div>
      </div>

      {/* College Project Meta info */}
      <div className="p-4 border-t border-gray-800/80 bg-gray-950/40">
        <div className="text-xs text-gray-400">
          <div className="font-semibold text-gray-300">College Hadoop Micro-Project</div>
          <div className="text-[11px] text-gray-500 mt-0.5">HDFS · Mapper · Shuffle · Reducer</div>
        </div>
      </div>
    </aside>
  );
}
