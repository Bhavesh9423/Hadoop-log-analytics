import React, { useState } from 'react';
import { Settings, Server, CheckCircle2, AlertTriangle, RefreshCw, Terminal, Layers } from 'lucide-react';
import { api } from '../../services/api';

export function SettingsView({ config, health, onModeChanged }) {
  const [selectedMode, setSelectedMode] = useState(config?.mode || 'local');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const handleSaveMode = async (modeToSave) => {
    setSaving(true);
    setStatusMsg(null);
    try {
      const res = await api.setConfig(modeToSave);
      setSelectedMode(res.mode);
      setStatusMsg({ type: 'success', text: res.message });
      if (onModeChanged) onModeChanged(res.mode);
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Processing Engine & Hadoop Cluster Settings
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Configure the active MapReduce processing engine and review Hadoop cluster connectivity.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
              : 'bg-rose-950/60 border-rose-800 text-rose-200'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Engine Selection Card */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-gray-800 space-y-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          Select Active Processing Mode
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Local Demo Mode */}
          <div
            onClick={() => handleSaveMode('local')}
            className={`p-5 rounded-xl border cursor-pointer transition ${
              selectedMode === 'local'
                ? 'bg-indigo-600/10 border-indigo-500 text-white'
                : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-white">Local Demo Mode</span>
              {selectedMode === 'local' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-900 text-indigo-300 border border-indigo-700">
                  ACTIVE
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Executes the exact Mapper and Reducer aggregation algorithms in Python. Recommended for college presentation machines without pre-installed Hadoop.
            </p>
          </div>

          {/* Hadoop Mode */}
          <div
            onClick={() => handleSaveMode('hadoop')}
            className={`p-5 rounded-xl border cursor-pointer transition ${
              selectedMode === 'hadoop'
                ? 'bg-amber-600/10 border-amber-500 text-white'
                : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-white">Hadoop Cluster Mode</span>
              {selectedMode === 'hadoop' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-900 text-amber-300 border border-amber-700">
                  ACTIVE
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Transfers data to HDFS and submits distributed MapReduce jobs using Hadoop Streaming jar.
            </p>
          </div>
        </div>
      </div>

      {/* Diagnostics Card */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-gray-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-indigo-400" />
          Hadoop & HDFS Diagnostics
        </h3>

        <div className="divide-y divide-gray-800 text-xs font-mono">
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-gray-400 font-sans">Hadoop Binaries Detected:</span>
            <span className={health?.hadoop_available ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {health?.hadoop_available ? 'Available (PATH)' : 'Not Found on System'}
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-gray-400 font-sans">Hadoop Diagnostics:</span>
            <span className="text-gray-300 text-right max-w-sm truncate">
              {health?.hadoop_status || 'Local environment checked.'}
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-gray-400 font-sans">HDFS Target URI:</span>
            <span className="text-indigo-300">{config?.hdfs_uri || 'hdfs://localhost:9000'}</span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-gray-400 font-sans">HADOOP_HOME:</span>
            <span className="text-gray-300">{config?.hadoop_home || '(Not set in environment)'}</span>
          </div>
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-gray-800 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          Quick Hadoop Terminal Commands
        </h3>
        <p className="text-xs text-gray-400">
          To run on an actual Hadoop cluster, run these standard commands in your terminal:
        </p>

        <div className="p-3.5 rounded-xl bg-gray-950 font-mono text-xs text-indigo-300 space-y-1.5 border border-gray-800 overflow-x-auto">
          <div>hdfs dfs -mkdir -p /loganalysis/input</div>
          <div>hdfs dfs -put data/sample_access.log /loganalysis/input/</div>
          <div>hadoop jar $HADOOP_HOME/share/hadoop/tools/lib/hadoop-streaming-*.jar \</div>
          <div className="pl-4">-files hadoop/mapper.py,hadoop/reducer.py \</div>
          <div className="pl-4">-mapper "python3 mapper.py" \</div>
          <div className="pl-4">-reducer "python3 reducer.py" \</div>
          <div className="pl-4">-input /loganalysis/input/sample_access.log \</div>
          <div className="pl-4">-output /loganalysis/output</div>
        </div>
      </div>
    </div>
  );
}
