"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Server,
  Database,
  CreditCard,
  Truck,
  Mail,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Play,
  Terminal,
  FileText,
  Lock,
} from "lucide-react";

interface HealthData {
  status: string;
  timestamp: string;
  latencyMs: number;
  environment: string;
  version: string;
  uptimeSeconds: number;
  dependencies: {
    database: {
      status: string;
      latencyMs: number;
      mode: string;
    };
    paymentGateway: {
      sslcommerzLive: boolean;
      sslcommerzSandbox: boolean;
      mockGatewayAllowed: boolean;
    };
    shippingProvider: {
      pathaoConfigured: boolean;
    };
    transactionalEmail: {
      resendConfigured: boolean;
    };
    backgroundJobs: {
      cronSecured: boolean;
    };
  };
  system: {
    nodeVersion: string;
    memory: {
      rssMb: number;
      heapUsedMb: number;
    };
  };
}

export default function AdminOperationsPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggeringJob, setTriggeringJob] = useState(false);
  const [jobResult, setJobResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/health?type=readiness");
      const data = await res.json();
      setHealth(data);
    } catch (err: any) {
      console.error("Health check error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const triggerCronJob = async (jobName: string) => {
    setTriggeringJob(true);
    setJobResult(null);
    try {
      const res = await fetch(`/api/cron/${jobName}`, {
        method: "POST",
        headers: {
          "x-cron-secret": "flashwear-dev-admin",
        },
      });
      const data = await res.json();
      if (res.ok) {
        setJobResult({
          success: true,
          message: `Job ${jobName} executed successfully: ${JSON.stringify(data.summary || data.message || data)}`,
        });
      } else {
        setJobResult({
          success: false,
          message: `Job ${jobName} failed: ${data.error || "Execution error"}`,
        });
      }
    } catch (err: any) {
      setJobResult({
        success: false,
        message: err.message || "Failed to trigger background job",
      });
    } finally {
      setTriggeringJob(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-8 p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-[#ccff00]" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#ccff00]">
              DevSecOps &amp; Infrastructure
            </span>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">
            Operations &amp; System Health
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time dependency readiness, background cron telemetry, and production release controls.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-white rounded text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Status
        </button>
      </div>

      {/* Global Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase text-zinc-500">Platform Status</p>
            <p className="text-lg font-black text-white capitalize mt-0.5">
              {health?.status || (loading ? "Checking..." : "Unknown")}
            </p>
          </div>
          <div
            className={`w-3 h-3 rounded-full ${
              health?.status === "healthy"
                ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                : "bg-amber-400 shadow-[0_0_8px_#fbbf24]"
            }`}
          />
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-lg">
          <p className="text-[10px] font-mono uppercase text-zinc-500">Environment</p>
          <p className="text-lg font-black text-white font-mono mt-0.5 uppercase">
            {health?.environment || "development"}
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-lg">
          <p className="text-[10px] font-mono uppercase text-zinc-500">Release Version</p>
          <p className="text-lg font-black text-[#ccff00] font-mono mt-0.5">
            v{health?.version || "1.0.0"}
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-lg">
          <p className="text-[10px] font-mono uppercase text-zinc-500">Process Uptime</p>
          <p className="text-lg font-bold text-zinc-200 font-mono mt-0.5">
            {health?.uptimeSeconds !== undefined ? formatUptime(health.uptimeSeconds) : "..."}
          </p>
        </div>
      </div>

      {/* Dependency Status Cards */}
      <div>
        <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
          <Server className="w-3.5 h-3.5 text-[#ccff00]" />
          Core Dependencies &amp; Integration Health
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Database Card */}
          <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Database</h3>
                  <p className="text-[11px] text-zinc-400">PostgreSQL / Supabase</p>
                </div>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                  health?.dependencies.database.status === "connected"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}
              >
                {health?.dependencies.database.status || "mock"}
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-zinc-400 pt-2 border-t border-zinc-900">
              <div className="flex justify-between">
                <span>Mode:</span>
                <span className="font-mono text-zinc-300">{health?.dependencies.database.mode}</span>
              </div>
              <div className="flex justify-between">
                <span>Latency:</span>
                <span className="font-mono text-zinc-300">{health?.dependencies.database.latencyMs}ms</span>
              </div>
            </div>
          </div>

          {/* Payment Gateway Card */}
          <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Payments</h3>
                  <p className="text-[11px] text-zinc-400">SSLCOMMERZ &amp; COD</p>
                </div>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                  health?.dependencies.paymentGateway.sslcommerzLive
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : health?.dependencies.paymentGateway.sslcommerzSandbox
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                }`}
              >
                {health?.dependencies.paymentGateway.sslcommerzLive
                  ? "Live Gateway"
                  : health?.dependencies.paymentGateway.sslcommerzSandbox
                  ? "Sandbox Test"
                  : "COD Only"}
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-zinc-400 pt-2 border-t border-zinc-900">
              <div className="flex justify-between">
                <span>Mock Gateway Allowed:</span>
                <span className={`font-mono ${health?.dependencies.paymentGateway.mockGatewayAllowed ? "text-amber-400" : "text-emerald-400"}`}>
                  {health?.dependencies.paymentGateway.mockGatewayAllowed ? "Enabled" : "Disabled (Safe)"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>COD Workflow:</span>
                <span className="font-mono text-emerald-400">Active</span>
              </div>
            </div>
          </div>

          {/* Logistics Provider Card */}
          <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Logistics</h3>
                  <p className="text-[11px] text-zinc-400">Pathao Courier</p>
                </div>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                  health?.dependencies.shippingProvider.pathaoConfigured
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                }`}
              >
                {health?.dependencies.shippingProvider.pathaoConfigured ? "Connected" : "Manual Mode"}
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-zinc-400 pt-2 border-t border-zinc-900">
              <div className="flex justify-between">
                <span>Direct API Booking:</span>
                <span className="font-mono text-zinc-300">
                  {health?.dependencies.shippingProvider.pathaoConfigured ? "Configured" : "Manual Dispatch"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tracking Webhook:</span>
                <span className="font-mono text-zinc-300">/api/courier/webhook</span>
              </div>
            </div>
          </div>

          {/* Transactional Email Card */}
          <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Notifications</h3>
                  <p className="text-[11px] text-zinc-400">Resend Email</p>
                </div>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                  health?.dependencies.transactionalEmail.resendConfigured
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                }`}
              >
                {health?.dependencies.transactionalEmail.resendConfigured ? "Live Email" : "Simulated"}
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-zinc-400 pt-2 border-t border-zinc-900">
              <div className="flex justify-between">
                <span>Order Confirmation:</span>
                <span className="font-mono text-zinc-300">Enabled</span>
              </div>
              <div className="flex justify-between">
                <span>Campaign Drops:</span>
                <span className="font-mono text-zinc-300">Ready</span>
              </div>
            </div>
          </div>

          {/* Background Jobs Card */}
          <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Cron Jobs</h3>
                  <p className="text-[11px] text-zinc-400">Vercel Cron / Scheduled</p>
                </div>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                  health?.dependencies.backgroundJobs.cronSecured
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}
              >
                {health?.dependencies.backgroundJobs.cronSecured ? "Secured" : "Dev Default"}
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-zinc-400 pt-2 border-t border-zinc-900">
              <div className="flex justify-between">
                <span>Abandoned Carts:</span>
                <span className="font-mono text-zinc-300">Hourly (0 * * * *)</span>
              </div>
              <div className="flex justify-between">
                <span>Price Drop Alerts:</span>
                <span className="font-mono text-zinc-300">Daily (0 12 * * *)</span>
              </div>
            </div>
          </div>

          {/* Node Runtime Card */}
          <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Runtime</h3>
                  <p className="text-[11px] text-zinc-400">{health?.system.nodeVersion || "Node.js"}</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                Next.js 14
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-zinc-400 pt-2 border-t border-zinc-900">
              <div className="flex justify-between">
                <span>Heap Memory Used:</span>
                <span className="font-mono text-zinc-300">{health?.system.memory.heapUsedMb} MB</span>
              </div>
              <div className="flex justify-between">
                <span>RSS Memory:</span>
                <span className="font-mono text-zinc-300">{health?.system.memory.rssMb} MB</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Job Execution & Replay Section */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Play className="w-4 h-4 text-[#ccff00]" />
            Background Scheduled Jobs Dispatch &amp; Replay
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manually trigger or replay background worker batches safely using authenticated administrative bypass.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={() => triggerCronJob("abandoned-carts")}
            disabled={triggeringJob}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white rounded text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 text-[#ccff00]" />
            Dispatch Abandoned Carts Reminders
          </button>
        </div>

        {jobResult && (
          <div
            className={`p-3.5 rounded border text-xs font-mono break-all ${
              jobResult.success
                ? "bg-emerald-950/30 border-emerald-800/50 text-emerald-300"
                : "bg-red-950/30 border-red-800/50 text-red-300"
            }`}
          >
            {jobResult.message}
          </div>
        )}
      </div>

      {/* Operational Release Runbook & Disaster Recovery References */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Lock className="w-4 h-4 text-[#ccff00]" />
            Security &amp; Disaster Recovery Runbooks
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Standard operating procedures for database snapshots, isolated point-in-time recovery drills, and credential rotation are documented in the repository:
          </p>
          <ul className="text-xs text-zinc-300 space-y-1.5 font-mono pt-1">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#ccff00]" />
              docs/BACKUP_AND_DISASTER_RECOVERY.md
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#ccff00]" />
              docs/MIGRATIONS_AND_RELEASES.md
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#ccff00]" />
              docs/INCIDENT_RESPONSE.md
            </li>
          </ul>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <FileText className="w-4 h-4 text-[#ccff00]" />
            Release Go/No-Go Criteria
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Before promoting to live traffic on custom domain:
          </p>
          <div className="space-y-1.5 text-xs text-zinc-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Full test suite passing (vitest unit &amp; regression tests)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSP &amp; Security Headers active in Next.js middleware</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>SSLCOMMERZ live merchant credentials verified</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mock payment gateway disabled in production</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
