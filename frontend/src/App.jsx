import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/pages/DashboardView';
import { UploadView } from './components/pages/UploadView';
import { DetailedAnalysisView } from './components/pages/DetailedAnalysisView';
import { ReportsView } from './components/pages/ReportsView';
import { AboutView } from './components/pages/AboutView';
import { SettingsView } from './components/pages/SettingsView';
import { LogTable } from './components/LogTable';
import { ProcessingPipeline } from './components/ProcessingPipeline';
import { EmptyState } from './components/EmptyState';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [health, setHealth] = useState(null);
  const [config, setConfig] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [datasetLoaded, setDatasetLoaded] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeFile, setActiveFile] = useState(null);

  // Initialize and check health/config
  const loadSystemState = async () => {
    try {
      const [h, c] = await Promise.all([api.getHealth(), api.getConfig()]);
      setHealth(h);
      setConfig(c);
      if (c.active_file) {
        setActiveFile(c.active_file);
      }
    } catch (err) {
      console.warn('Backend not yet reachable:', err);
    }
  };

  useEffect(() => {
    loadSystemState();
  }, []);

  const handleLoadSample = async () => {
    setLoadingSample(true);
    try {
      const mode = config?.mode || 'local';
      const res = await api.loadSample(mode);

      if (res?.analytics) {
        setAnalytics(res.analytics);
        setDatasetLoaded(true);
        setActiveFile(res.filename || 'sample_access.log');
        setActiveTab('dashboard');
        loadSystemState();
        return;
      }

      // Fallback: fetch individual datasets if analytics not bundled
      const [summary, statusCodes, urls, ips, methods, traffic, errors, pipeline] =
        await Promise.all([
          api.getSummary(),
          api.getStatusCodes(),
          api.getUrls(20),
          api.getIps(20),
          api.getMethods(),
          api.getTraffic('hourly'),
          api.getErrors(),
          api.getPipeline()
        ]);

      const fullAnalytics = {
        summary,
        status_codes: statusCodes.status_codes,
        status_categories: statusCodes.status_categories,
        urls: urls.urls,
        ips: ips.ips,
        methods: methods.methods,
        traffic: {
          hourly: traffic.data,
          daily: (await api.getTraffic('daily')).data
        },
        errors,
        pipeline_stages: pipeline.stages,
        processing_mode: pipeline.processing_mode,
        processing_mode_label: pipeline.processing_mode_label,
        execution_time_ms: pipeline.execution_time_ms,
        fallback_notice: res.fallback_notice
      };

      setAnalytics(fullAnalytics);
      setDatasetLoaded(true);
      setActiveFile('sample_access.log');
      setActiveTab('dashboard');
      loadSystemState();
    } catch (err) {
      alert(`Failed to load sample dataset: ${err.message}`);
    } finally {
      setLoadingSample(false);
    }
  };

  const handleAnalysisComplete = async (analysisResult) => {
    try {
      if (analysisResult?.analytics) {
        setAnalytics(analysisResult.analytics);
        setDatasetLoaded(true);
        setActiveFile(analysisResult.filename || 'Uploaded Log');
        setActiveTab('dashboard');
        loadSystemState();
        return;
      }

      // Fallback: fetch individual datasets if analytics not bundled
      const [summary, statusCodes, urls, ips, methods, traffic, errors, pipeline] =
        await Promise.all([
          api.getSummary(),
          api.getStatusCodes(),
          api.getUrls(20),
          api.getIps(20),
          api.getMethods(),
          api.getTraffic('hourly'),
          api.getErrors(),
          api.getPipeline()
        ]);

      const fullAnalytics = {
        summary,
        status_codes: statusCodes.status_codes,
        status_categories: statusCodes.status_categories,
        urls: urls.urls,
        ips: ips.ips,
        methods: methods.methods,
        traffic: {
          hourly: traffic.data,
          daily: (await api.getTraffic('daily')).data
        },
        errors,
        pipeline_stages: pipeline.stages,
        processing_mode: pipeline.processing_mode,
        processing_mode_label: pipeline.processing_mode_label,
        execution_time_ms: pipeline.execution_time_ms,
        fallback_notice: analysisResult.fallback_notice
      };

      setAnalytics(fullAnalytics);
      setDatasetLoaded(true);
      setActiveFile(analysisResult.filename || 'Uploaded Log');
      setActiveTab('dashboard');
      loadSystemState();
    } catch (err) {
      console.error('Error fetching post-analysis details:', err);
      alert(`Failed to load analysis details: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        health={health}
        config={config}
        activeFile={activeFile}
        datasetLoaded={datasetLoaded}
        onLoadSample={handleLoadSample}
        loadingSample={loadingSample}
      />

      {/* Main Content Layout */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          datasetLoaded={datasetLoaded}
          processingMode={config?.mode || 'local'}
        />

        {/* Content Area */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <DashboardView
              datasetLoaded={datasetLoaded}
              analytics={analytics}
              onUploadClick={() => setActiveTab('upload')}
              onLoadSample={handleLoadSample}
              loadingSample={loadingSample}
            />
          )}

          {activeTab === 'upload' && (
            <UploadView
              onAnalysisComplete={handleAnalysisComplete}
              onLoadSample={handleLoadSample}
              currentMode={config?.mode || 'local'}
              hadoopAvailable={health?.hadoop_available}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
              analytics={analytics}
            />
          )}

          {activeTab === 'analysis' && (
            <DetailedAnalysisView
              datasetLoaded={datasetLoaded}
              analytics={analytics}
              onUploadClick={() => setActiveTab('upload')}
              onLoadSample={handleLoadSample}
            />
          )}

          {activeTab === 'logs' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Detailed Log Records Explorer
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Inspect raw web server access records with real-time keyword search, HTTP status classification, and pagination.
                </p>
              </div>
              <LogTable />
            </div>
          )}

          {activeTab === 'pipeline' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Hadoop MapReduce Processing Stages
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Step-by-step telemetry of HDFS staging, Mapper token emission, Shuffle & Sort key aggregation, and Reducer summation.
                </p>
              </div>
              {analytics ? (
                <ProcessingPipeline
                  stages={analytics.pipeline_stages}
                  processingMode={analytics.processing_mode}
                  executionTime={analytics.execution_time_ms}
                />
              ) : (
                <EmptyState
                  onUploadClick={() => setActiveTab('upload')}
                  onLoadSample={handleLoadSample}
                />
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <ReportsView
              datasetLoaded={datasetLoaded}
              analytics={analytics}
              onUploadClick={() => setActiveTab('upload')}
              onLoadSample={handleLoadSample}
            />
          )}

          {activeTab === 'about' && <AboutView />}

          {activeTab === 'settings' && (
            <SettingsView
              config={config}
              health={health}
              onModeChanged={(m) => {
                setConfig((prev) => ({ ...prev, mode: m }));
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
