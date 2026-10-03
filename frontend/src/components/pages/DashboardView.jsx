import React, { useState } from 'react';
import { KPICards } from '../KPICards';
import { TrafficChart } from '../TrafficChart';
import { StatusChart } from '../StatusChart';
import { URLChart } from '../URLChart';
import { IPTable } from '../IPTable';
import { MethodChart } from '../MethodChart';
import { ErrorAnalysis } from '../ErrorAnalysis';
import { LogTable } from '../LogTable';
import { FilterPanel } from '../FilterPanel';
import { EmptyState } from '../EmptyState';
import { ProcessingPipeline } from '../ProcessingPipeline';

export function DashboardView({
  datasetLoaded,
  analytics,
  onUploadClick,
  onLoadSample,
  loadingSample
}) {
  const [activeFilters, setActiveFilters] = useState({});

  if (!datasetLoaded || !analytics) {
    return (
      <EmptyState
        onUploadClick={onUploadClick}
        onLoadSample={onLoadSample}
        loadingSample={loadingSample}
      />
    );
  }

  const {
    summary,
    execution_time_ms,
    processing_mode,
    traffic,
    status_codes,
    status_categories,
    urls,
    ips,
    methods,
    errors,
    pipeline_stages
  } = analytics;

  return (
    <div className="space-y-6">
      {/* Fallback Notice if Hadoop was requested but fell back to Local */}
      {analytics.fallback_notice?.occurred && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-200 text-xs">
          <strong className="text-white font-semibold">Engine Notice: </strong>
          {analytics.fallback_notice.message} Reason: {analytics.fallback_notice.reason}
        </div>
      )}

      {/* KPI Cards */}
      <KPICards
        summary={summary}
        executionTime={execution_time_ms}
        processingMode={processing_mode}
      />

      {/* Filter Panel */}
      <FilterPanel
        onApplyFilters={(f) => setActiveFilters(f)}
        onResetFilters={() => setActiveFilters({})}
        availableMethods={methods?.map((m) => m.method) || []}
      />

      {/* Traffic & Status Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrafficChart trafficData={traffic} />
        <StatusChart
          statusCodes={status_codes}
          statusCategories={status_categories}
        />
      </div>

      {/* Top URLs & Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <URLChart urls={urls} />
        <MethodChart methods={methods} />
      </div>

      {/* IP Table */}
      <IPTable ips={ips} />

      {/* Error Analysis Section */}
      <ErrorAnalysis errors={errors} />

      {/* Log Activity Table */}
      <LogTable activeFilters={activeFilters} />

      {/* Processing Pipeline Stage Breakdown */}
      <ProcessingPipeline
        stages={pipeline_stages}
        processingMode={processing_mode}
        executionTime={execution_time_ms}
      />
    </div>
  );
}
