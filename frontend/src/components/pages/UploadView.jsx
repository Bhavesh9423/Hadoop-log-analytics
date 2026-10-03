import React from 'react';
import { FileUpload } from '../FileUpload';
import { ProcessingPipeline } from '../ProcessingPipeline';

export function UploadView({
  onAnalysisComplete,
  onLoadSample,
  currentMode,
  hadoopAvailable,
  isProcessing,
  setIsProcessing,
  analytics
}) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Upload & MapReduce Processing Engine
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Upload a web server log file to run through the Hadoop MapReduce execution pipeline.
        </p>
      </div>

      <FileUpload
        onAnalysisComplete={onAnalysisComplete}
        onLoadSample={onLoadSample}
        currentMode={currentMode}
        hadoopAvailable={hadoopAvailable}
        isProcessing={isProcessing}
        setIsProcessing={setIsProcessing}
      />

      {analytics && (
        <div className="pt-4">
          <ProcessingPipeline
            stages={analytics.pipeline_stages}
            processingMode={analytics.processing_mode}
            executionTime={analytics.execution_time_ms}
          />
        </div>
      )}
    </div>
  );
}
