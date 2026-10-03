import React from 'react';
import { UploadCloud, Sparkles, FileText, Database } from 'lucide-react';

export function EmptyState({ onUploadClick, onLoadSample, loadingSample }) {
  return (
    <div className="p-12 rounded-2xl bg-[#111827] border border-gray-800 text-center max-w-2xl mx-auto my-8 space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
        <Database className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-bold text-white">
          No Log File Analyzed Yet
        </h3>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          Upload an Apache or Nginx <span className="text-indigo-300 font-mono">.log</span>, <span className="text-indigo-300 font-mono">.txt</span>, or <span className="text-indigo-300 font-mono">.csv</span> file to run the Hadoop MapReduce pipeline, or quickly load the pre-packaged sample dataset.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          onClick={onUploadClick}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition cursor-pointer shadow-lg shadow-indigo-900/30"
        >
          <UploadCloud className="w-4 h-4" />
          Upload Log File
        </button>

        <button
          onClick={onLoadSample}
          disabled={loadingSample}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 font-semibold text-sm transition cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          {loadingSample ? 'Processing Dataset...' : 'Load Sample Log (5.5k records)'}
        </button>
      </div>

      <div className="pt-4 border-t border-gray-800/80 text-xs text-gray-500 flex items-center justify-center gap-6">
        <span>✓ HDFS Ingestion Ready</span>
        <span>✓ MapReduce Mapper & Reducer</span>
        <span>✓ No Fake Data</span>
      </div>
    </div>
  );
}
