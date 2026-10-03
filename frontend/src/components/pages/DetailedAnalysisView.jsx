import React from 'react';
import { TrafficChart } from '../TrafficChart';
import { StatusChart } from '../StatusChart';
import { URLChart } from '../URLChart';
import { IPTable } from '../IPTable';
import { MethodChart } from '../MethodChart';
import { ErrorAnalysis } from '../ErrorAnalysis';
import { EmptyState } from '../EmptyState';

export function DetailedAnalysisView({ datasetLoaded, analytics, onUploadClick, onLoadSample }) {
  if (!datasetLoaded || !analytics) {
    return (
      <EmptyState
        onUploadClick={onUploadClick}
        onLoadSample={onLoadSample}
      />
    );
  }

  const {
    traffic,
    status_codes,
    status_categories,
    urls,
    ips,
    methods,
    errors
  } = analytics;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Deep-Dive Log Analysis
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Detailed multi-dimensional breakdown of network traffic, HTTP verbs, server responses, and endpoint metrics.
        </p>
      </div>

      {/* Traffic Time-Series */}
      <TrafficChart trafficData={traffic} />

      {/* Status Codes & Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusChart
          statusCodes={status_codes}
          statusCategories={status_categories}
        />
        <MethodChart methods={methods} />
      </div>

      {/* URLs & IPs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <URLChart urls={urls} />
        <IPTable ips={ips} />
      </div>

      {/* Errors */}
      <ErrorAnalysis errors={errors} />
    </div>
  );
}
