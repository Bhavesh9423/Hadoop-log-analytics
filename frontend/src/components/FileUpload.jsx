import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export function FileUpload({
  onAnalysisComplete,
  onLoadSample,
  currentMode,
  hadoopAvailable,
  isProcessing,
  setIsProcessing
}) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadInfo, setUploadInfo] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [processingStage, setProcessingStage] = useState('');
  const [selectedMode, setSelectedMode] = useState(currentMode || 'local');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = async (file) => {
    setErrorMsg(null);
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'log' && ext !== 'txt' && ext !== 'csv') {
      setErrorMsg('Unsupported file type. Please upload a .log, .txt, or .csv file.');
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);
    setProcessingStage('Uploading file to server...');

    try {
      const data = await api.uploadFile(file);
      setUploadInfo(data);
      setProcessingStage('');
    } catch (err) {
      setErrorMsg(err.message || 'Upload failed.');
      setSelectedFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerAnalysis = async () => {
    if (!uploadInfo) return;
    setIsProcessing(true);
    setErrorMsg(null);

    // Simulate animated step transitions for real visual feedback
    const stages = selectedMode === 'hadoop'
      ? [
          'Preparing HDFS directory structure...',
          'Transferring log file to HDFS...',
          'Spawning Hadoop Mapper tasks...',
          'Executing Shuffle & Sort partitioner...',
          'Running Hadoop Reducers...',
          'Gathering final analytics...'
        ]
      : [
          'Buffering input stream...',
          'Running Mapper (tokenizing key-value pairs)...',
          'Performing Shuffle & Sort key aggregation...',
          'Running Reducer summing logic...',
          'Generating structured dashboard data...'
        ];

    let stageIdx = 0;
    setProcessingStage(stages[0]);
    const stageInterval = setInterval(() => {
      stageIdx++;
      if (stageIdx < stages.length) {
        setProcessingStage(stages[stageIdx]);
      }
    }, 450);

    try {
      const res = await api.analyze(selectedMode);
      clearInterval(stageInterval);
      setProcessingStage('Completed!');
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingStage('');
        if (onAnalysisComplete) onAnalysisComplete(res);
      }, 300);
    } catch (err) {
      clearInterval(stageInterval);
      setIsProcessing(false);
      setProcessingStage('');
      setErrorMsg(err.message || 'Analysis pipeline encountered an error.');
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadInfo(null);
    setErrorMsg(null);
    setProcessingStage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Upload Box */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          dragActive
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-gray-700 hover:border-gray-600 bg-[#111827]/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".log,.txt,.csv"
          onChange={handleChange}
          className="hidden"
          id="log-file-input"
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">
              Upload Server Log File
            </h3>
            <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
              Drag & Drop your Apache/Nginx <span className="text-indigo-300 font-mono">.log</span>, <span className="text-indigo-300 font-mono">.txt</span>, or <span className="text-indigo-300 font-mono">.csv</span> file here, or click to browse.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition cursor-pointer shadow-lg shadow-indigo-900/30"
            >
              Choose File
            </button>

            <span className="text-xs text-gray-500">OR</span>

            <button
              type="button"
              onClick={onLoadSample}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium border border-gray-700 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              Use 5.5K Sample Dataset
            </button>
          </div>

          <div className="text-xs text-gray-500 pt-1">
            Supported formats: .log, .txt, .csv (Apache/Nginx access log or CSV with IP, timestamp, method, URL, status code)
          </div>
        </div>
      </div>

      {/* Error alert if any */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Processing Notice</div>
            <div className="text-xs text-rose-300 mt-0.5">{errorMsg}</div>
          </div>
        </div>
      )}

      {/* Selected File Details & Analysis Controls */}
      {uploadInfo && (
        <div className="p-6 rounded-2xl bg-[#111827] border border-gray-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">{uploadInfo.filename}</h4>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                  <span>Size: <strong className="text-gray-200">{uploadInfo.formatted_size}</strong></span>
                  <span>•</span>
                  <span>Records: <strong className="text-gray-200">{uploadInfo.total_records.toLocaleString()}</strong> lines</span>
                </div>
              </div>
            </div>

            <button
              onClick={resetUpload}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Choose Another File
            </button>
          </div>

          {/* Engine Mode Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Select MapReduce Processing Engine:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedMode('local')}
                disabled={isProcessing}
                className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                  selectedMode === 'local'
                    ? 'border-indigo-500 bg-indigo-500/10 text-white'
                    : 'border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">Local Demo Engine</span>
                  {selectedMode === 'local' && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Pure Python MapReduce simulator. Emulates Mapper, Shuffle & Sort, and Reducer in-memory without requiring Hadoop installation.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('hadoop')}
                disabled={isProcessing}
                className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                  selectedMode === 'hadoop'
                    ? 'border-amber-500 bg-amber-500/10 text-white'
                    : 'border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">Actual Hadoop Mode</span>
                  {selectedMode === 'hadoop' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Submits real Hadoop Streaming jobs using HDFS commands and MapReduce daemons.
                  {!hadoopAvailable && (
                    <span className="block text-amber-400 mt-1 font-medium">
                      ⚠️ Hadoop not detected. Will auto-fallback to Local Demo.
                    </span>
                  )}
                </p>
              </button>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={triggerAnalysis}
              disabled={isProcessing}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white font-semibold text-sm transition cursor-pointer shadow-lg shadow-indigo-900/40"
            >
              <Play className="w-4 h-4 fill-white" />
              {isProcessing ? 'Analyzing Dataset...' : 'Analyze Log with MapReduce'}
            </button>

            {isProcessing && (
              <div className="flex items-center gap-3 text-xs text-indigo-300 animate-pulse font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
                <span>{processingStage || 'Processing...'}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
