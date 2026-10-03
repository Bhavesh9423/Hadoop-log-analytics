import React from 'react';
import { BookOpen, Layers, HardDrive, Cpu, Terminal, Award, HelpCircle } from 'lucide-react';

export function AboutView() {
  const vivaQuestions = [
    {
      q: "What is Apache Hadoop?",
      a: "Apache Hadoop is an open-source framework designed for distributed storage (HDFS) and distributed processing (MapReduce) of massive datasets across clusters of commodity hardware."
    },
    {
      q: "What is HDFS and how does it store log data?",
      a: "Hadoop Distributed File System (HDFS) provides fault-tolerant distributed storage. Files are split into blocks (typically 128 MB), replicated across DataNodes, and coordinated by the NameNode."
    },
    {
      q: "What are the roles of Mapper, Shuffle & Sort, and Reducer in this project?",
      a: "1) Mapper: Parses regex tokens from each log line and emits intermediate <Key, 1> pairs (e.g. STATUS_200, URL_/home).\n2) Shuffle & Sort: Hadoop routes identical keys to the same reducer and sorts them alphabetically.\n3) Reducer: Sums the counts for each key to produce final aggregated metrics."
    },
    {
      q: "How does the Local Demo Mode differ from Hadoop Mode?",
      a: "The Local Demo Mode uses pure in-memory Python to execute the exact same Mapper, Shuffle & Sort, and Reducer pipeline step-by-step so that the project can be demonstrated anywhere without pre-installing a multi-gigabyte Hadoop cluster. The active mode is clearly declared in the UI."
    },
    {
      q: "What log formats does this system parse?",
      a: "It parses standard and combined Apache/Nginx web server access logs formatted as: IP - - [Timestamp] \"METHOD URL HTTP/Version\" Status Code. Malformed lines are safely caught without crashing the pipeline."
    }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Title Card */}
      <div className="p-8 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-[#111827] to-[#111827] border border-indigo-900/40 space-y-4">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          <Award className="w-4 h-4" />
          Academic Hadoop Micro-Project Documentation
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Web-Based Log File Analysis & Visualization Using Hadoop MapReduce
        </h2>
        <p className="text-sm text-gray-300 leading-relaxed max-w-3xl">
          An end-to-end distributed big-data processing dashboard designed to ingest large application server logs, execute MapReduce aggregation, and deliver real-time interactive business intelligence.
        </p>

        <div className="pt-2 flex flex-wrap gap-2 text-xs">
          <span className="px-3 py-1 rounded-lg bg-indigo-950/80 text-indigo-300 border border-indigo-800">
            Apache Hadoop 3.x
          </span>
          <span className="px-3 py-1 rounded-lg bg-blue-950/80 text-blue-300 border border-blue-800">
            HDFS Storage
          </span>
          <span className="px-3 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800">
            MapReduce Streaming
          </span>
          <span className="px-3 py-1 rounded-lg bg-purple-950/80 text-purple-300 border border-purple-800">
            Python & Flask REST API
          </span>
          <span className="px-3 py-1 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-800">
            React & Tailwind CSS
          </span>
        </div>
      </div>

      {/* Core Concept Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#111827] border border-gray-800 space-y-3">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 w-fit">
            <HardDrive className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">What is HDFS?</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            <strong>Hadoop Distributed File System</strong> provides reliable, high-throughput access to application datasets. In this project, uploaded server logs can be staged into HDFS (<code className="text-blue-300 font-mono">/loganalysis/input/</code>) across cluster blocks.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#111827] border border-gray-800 space-y-3">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 w-fit">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">What is MapReduce?</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            A programming model for processing massive data in parallel. <strong>Mappers</strong> transform input lines into intermediate <code className="text-indigo-300 font-mono">&lt;Key, Value&gt;</code> pairs; the <strong>Shuffle & Sort</strong> phase groups them; and <strong>Reducers</strong> compute aggregates.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#111827] border border-gray-800 space-y-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Dual Engine Architecture</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Features an explicit processing abstraction: <strong>Hadoop Mode</strong> (submits real Hadoop Streaming jobs when Hadoop is installed) and <strong>Local Demo Mode</strong> (executes exact same Mapper/Reducer algorithms in Python).
          </p>
        </div>
      </div>

      {/* MapReduce Workflow Visual */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-gray-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          Data Processing Pipeline in this Project
        </h3>
        <div className="p-4 rounded-xl bg-gray-950 font-mono text-xs text-gray-300 overflow-x-auto space-y-2 border border-gray-800">
          <div><span className="text-gray-500">1. Raw Input:   </span> 192.168.1.10 - - [03/Oct/2026:10:15:20] "GET /home HTTP/1.1" 200</div>
          <div><span className="text-gray-500">2. HDFS:        </span> Staged to /loganalysis/input/access.log</div>
          <div><span className="text-gray-500">3. Mapper:      </span> Emits: STATUS_200\t1, URL_/home\t1, IP_192.168.1.10\t1, METHOD_GET\t1</div>
          <div><span className="text-gray-500">4. Shuffle&Sort:</span> Partitions & sorts: STATUS_200: [1, 1, 1...], URL_/home: [1, 1, 1...]</div>
          <div><span className="text-gray-500">5. Reducer:     </span> Aggregates: STATUS_200\t23821, URL_/home\t4521, IP_192.168.1.10\t521</div>
          <div><span className="text-gray-500">6. REST API:    </span> Converted into structured JSON for charts, tables & KPI cards</div>
        </div>
      </div>

      {/* College Viva Questions Section */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-gray-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          Hadoop Project Viva / Examination Guide
        </h3>
        <div className="space-y-4">
          {vivaQuestions.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 space-y-1.5">
              <div className="text-xs font-bold text-indigo-300">
                Q{idx + 1}: {item.q}
              </div>
              <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
