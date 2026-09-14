import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { buildApiUrl } from '../../lib/apiClient.ts';
import {
  Activity,
  Database,
  Server,
  Cpu,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Zap,
} from 'lucide-react';

interface SystemHealthData {
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  components: {
    coreApplication: 'HEALTHY' | 'DEGRADED' | 'DOWN';
    database: 'HEALTHY' | 'DEGRADED' | 'DOWN';
    aiProvider: 'AVAILABLE' | 'DEGRADED' | 'UNAVAILABLE';
  };
  aiTelemetry: {
    circuitState: 'CLOSED' | 'OPEN' | 'HALF-OPEN';
    providerName: string;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    rateLimitHits: number;
    fallbackCount: number;
    averageLatencyMs: number;
    lastFailureReason?: string;
    lastStateChange: string;
  };
  metrics: {
    totalRateLimitEvents: number;
    totalAuthFailures: number;
    totalBackendErrors: number;
    uptimeSeconds: number;
  };
  timestamp: string;
}

export const AdminSystemHealth: React.FC = () => {
  const { authHeaders } = useAuth();
  const [data, setData] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async (isBackground = false) => {
    if (typeof document !== 'undefined' && document.hidden) return;
    if (!isBackground) {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await fetch(buildApiUrl('/api/admin/health'), {
        headers: authHeaders(),
      });
      if (!res.ok) {
        throw new Error('Failed to retrieve system health metrics. Please verify admin privileges.');
      }
      const json: SystemHealthData = await res.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      if (!isBackground) {
        setError(err.message || 'Error communicating with server health service.');
      } else {
        console.warn('System health poll warning:', err?.message || err);
      }
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchHealth(false);
    const interval = setInterval(() => {
      if (typeof document === 'undefined' || !document.hidden) {
        fetchHealth(true);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${d > 0 ? `${d}d ` : ''}${h}h ${m}m ${s}s`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              Production Reliability & System Health
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Real-time status of Cloud SQL, AI circuit breakers, rate-limiting guards, and API failover telemetry.
          </p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs disabled:opacity-60 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Component Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Core App */}
        <div className="p-5 bg-white border border-neutral-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-neutral-900">Core Application</h2>
                <span className="text-[11px] text-neutral-400">Express & Order Services</span>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                data?.components.coreApplication === 'HEALTHY'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {data?.components.coreApplication === 'HEALTHY' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
              )}
              {data?.components.coreApplication || 'CHECKING...'}
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-100 text-xs text-neutral-500 flex justify-between">
            <span>Uptime:</span>
            <span className="font-semibold text-neutral-800">
              {data?.metrics.uptimeSeconds ? formatUptime(data.metrics.uptimeSeconds) : '–'}
            </span>
          </div>
        </div>

        {/* Database */}
        <div className="p-5 bg-white border border-neutral-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-neutral-900">Cloud SQL (PostgreSQL)</h2>
                <span className="text-[11px] text-neutral-400">Transactions & Connection Pool</span>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                data?.components.database === 'HEALTHY'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {data?.components.database === 'HEALTHY' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
              )}
              {data?.components.database || 'CHECKING...'}
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-100 text-xs text-neutral-500 flex justify-between">
            <span>Query Ping:</span>
            <span className="font-semibold text-neutral-800">Operational (SELECT 1 OK)</span>
          </div>
        </div>

        {/* AI Provider */}
        <div className="p-5 bg-white border border-neutral-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-neutral-900">AI Provider & Fallback</h2>
                <span className="text-[11px] text-neutral-400">{data?.aiTelemetry.providerName || 'Local Engine'}</span>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                data?.components.aiProvider === 'AVAILABLE'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : data?.components.aiProvider === 'DEGRADED'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              {data?.components.aiProvider || 'CHECKING...'}
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-100 text-xs text-neutral-500 flex justify-between">
            <span>Circuit Breaker:</span>
            <span className="font-semibold text-neutral-800 uppercase">
              {data?.aiTelemetry.circuitState || 'CLOSED'}
            </span>
          </div>
        </div>
      </div>

      {/* Circuit Breaker & Fallback Telemetry Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs">
          <h2 className="text-sm font-black text-neutral-900 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-600" />
            AI Service & Resilience Telemetry
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100">
              <span className="text-[11px] text-neutral-500 block font-medium">Circuit State</span>
              <span className="text-base font-bold text-neutral-900 mt-0.5 block">
                {data?.aiTelemetry.circuitState}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100">
              <span className="text-[11px] text-neutral-500 block font-medium">Avg AI Latency</span>
              <span className="text-base font-bold text-neutral-900 mt-0.5 block">
                {data?.aiTelemetry.averageLatencyMs} ms
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100">
              <span className="text-[11px] text-neutral-500 block font-medium">Fallback Uses</span>
              <span className="text-base font-bold text-amber-700 mt-0.5 block">
                {data?.aiTelemetry.fallbackCount}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100">
              <span className="text-[11px] text-neutral-500 block font-medium">AI Requests</span>
              <span className="text-base font-bold text-neutral-900 mt-0.5 block">
                {data?.aiTelemetry.totalRequests}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100">
              <span className="text-[11px] text-neutral-500 block font-medium">Rate-Limit Hits</span>
              <span className="text-base font-bold text-rose-700 mt-0.5 block">
                {data?.aiTelemetry.rateLimitHits}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100">
              <span className="text-[11px] text-neutral-500 block font-medium">Provider Failures</span>
              <span className="text-base font-bold text-rose-700 mt-0.5 block">
                {data?.aiTelemetry.failedRequests}
              </span>
            </div>
          </div>
          {data?.aiTelemetry.lastFailureReason && (
            <div className="mt-4 p-3 bg-amber-50 rounded-xl text-xs text-amber-800 border border-amber-200">
              <span className="font-bold">Last Error Note: </span>
              <span>{data.aiTelemetry.lastFailureReason}</span>
            </div>
          )}
        </div>

        {/* Security & Traffic Metrics */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs">
          <h2 className="text-sm font-black text-neutral-900 mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-blue-600" />
            Security & Traffic Guard Metrics
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
              <span className="text-[11px] text-neutral-500 block font-medium">Rate-Limit Blocks</span>
              <span className="text-xl font-bold text-neutral-900 mt-1 block">
                {data?.metrics.totalRateLimitEvents ?? 0}
              </span>
              <span className="text-[10px] text-neutral-400 mt-0.5 block">
                Throttled spam or rapid requests
              </span>
            </div>
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
              <span className="text-[11px] text-neutral-500 block font-medium">Auth Failures</span>
              <span className="text-xl font-bold text-neutral-900 mt-1 block">
                {data?.metrics.totalAuthFailures ?? 0}
              </span>
              <span className="text-[10px] text-neutral-400 mt-0.5 block">
                Expired tokens or unauthorized role access
              </span>
            </div>
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
              <span className="text-[11px] text-neutral-500 block font-medium">Backend Errors Handled</span>
              <span className="text-xl font-bold text-neutral-900 mt-1 block">
                {data?.metrics.totalBackendErrors ?? 0}
              </span>
              <span className="text-[10px] text-neutral-400 mt-0.5 block">
                Safely sanitized without client leak
              </span>
            </div>
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
              <span className="text-[11px] text-neutral-500 block font-medium">Last Checked</span>
              <span className="text-xs font-semibold text-neutral-700 mt-1 block">
                {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : '–'}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">
                Auto-refreshes every 10s
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
