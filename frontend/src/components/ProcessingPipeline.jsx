import React from 'react';
import {
  FileText,
  HardDrive,
  GitFork,
  ArrowRight,
  Shuffle,
  Layers,
  PieChart,
  CheckCircle2,
  Clock,
  Info
} from 'lucide-react';

export function ProcessingPipeline({ stages, processingMode, executionTime }) {
  const defaultStages = [
    {
      stage_id: 'input',
      name: 'Input Preparation & Ingestion',
      description: 'Reads raw server access log lines and prepares input stream.',
      concept: 'HDFS File Split / InputFormat',
      icon: FileText,
      color: 'blue'
    },
    {
      stage_id: 'mapper',
      name: 'Mapper Phase',
      description: 'Parses regex tokens, extracts IP, method, status, URL and emits intermediate <Key, 1> pairs.',
      concept: 'MapReduce Mapper (mapper.py)',
      icon: GitFork,
      color: 'indigo'
    },
    {
      stage_id: 'shuffle_sort',
      name: 'Shuffle & Sort Phase',
      description: 'Partitions intermediate data, groups identical keys, and sorts them alphabetically.',
      concept: 'Hadoop Partitioner & Combiner',
      icon: Shuffle,
      color: 'amber'
    },
    {
      stage_id: 'reducer',
      name: 'Reducer Phase',
      description: 'Iterates through grouped key iterables and aggregates totals (<Key, Sum>).',
      concept: 'MapReduce Reducer (reducer.py)',
      icon: Layers,
      color: 'emerald'
    },
    {
      stage_id: 'output',
      name: 'Result Aggregation',
      description: 'Structures final aggregated metrics into JSON for dashboard visualization.',
      concept: 'OutputFormat & REST API',
      icon: PieChart,
      color: 'purple'
    }
  ];

  // Merge actual stage data if available
  const stageMap = {};
  if (stages && Array.isArray(stages)) {
    stages.forEach(s => {
      stageMap[s.stage_id] = s;
    });
  }

  return (
    <div className="p-6 rounded-2xl bg-[#111827] border border-gray-800 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            Hadoop MapReduce Processing Pipeline
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
              {processingMode === 'hadoop' ? 'Hadoop Cluster' : 'Local Simulation'}
            </span>
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Visual breakdown of the distributed data processing lifecycle from raw logs to final dashboard aggregations.
          </p>
        </div>

        {executionTime && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-gray-400">Total Pipeline Duration:</span>
            <span className="font-mono font-bold text-white">{executionTime} ms</span>
          </div>
        )}
      </div>

      {/* Visual Pipeline Flow */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
        {defaultStages.map((stage, idx) => {
          const Icon = stage.icon;
          const liveData = stageMap[stage.stage_id] || (stage.stage_id === 'input' ? stageMap['hdfs_put'] : null);
          const isDone = Boolean(liveData);

          return (
            <div
              key={stage.stage_id}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all relative ${
                isDone
                  ? 'bg-gray-900/90 border-indigo-500/40 shadow-sm'
                  : 'bg-gray-900/40 border-gray-800 opacity-70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 font-mono">
                    Phase 0{idx + 1}
                  </span>
                  {isDone ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Done
                    </span>
                  ) : (
                    <span className="text-[11px] text-gray-600 font-medium">Ready</span>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white leading-tight">
                    {stage.name}
                  </h4>
                </div>

                <div className="text-[11px] font-mono text-indigo-300/80 mb-2">
                  [{stage.concept}]
                </div>

                <p className="text-[11px] text-gray-400 leading-relaxed mb-3">
                  {liveData?.description || stage.description}
                </p>
              </div>

              {liveData && (
                <div className="pt-2 border-t border-gray-800 text-[10px] font-mono text-gray-400 flex items-center justify-between">
                  <span>Duration:</span>
                  <span className="text-indigo-300 font-bold">{liveData.duration_ms} ms</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Concept Architecture Banner */}
      <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-900/40 flex items-start gap-3">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-200/90 leading-relaxed">
          <strong className="text-white font-semibold">How MapReduce Works Here: </strong>
          The <strong>Mapper</strong> reads lines from HDFS/input, parses fields using regular expressions, and emits intermediate key-value pairs (e.g. <code className="bg-indigo-950 px-1 py-0.5 rounded text-indigo-300">STATUS_200 \t 1</code>, <code className="bg-indigo-950 px-1 py-0.5 rounded text-indigo-300">URL_/home \t 1</code>).
          The <strong>Shuffle & Sort</strong> phase groups records by key and sorts them.
          The <strong>Reducer</strong> sums the intermediate counts for each unique key to produce final distributed metrics.
        </div>
      </div>
    </div>
  );
}
