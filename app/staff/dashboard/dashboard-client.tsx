"use client";

import React from "react";
import Link from "next/link";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { 
  Users, 
  Plane, 
  Briefcase, 
  FileCheck, 
  AlertTriangle, 
  Clock 
} from "lucide-react";

type Props = {
  agg: any;
  acc: any[];
  soonAlerts: any[];
  topJobOrders: any[];
  aggErrorMsg?: string;
};

export function DashboardClient({ agg, acc, soonAlerts, topJobOrders, aggErrorMsg }: Props) {
  // Prepare Pipeline Data
  const funnelStages = [
    { key: "registered", label: "Registered" },
    { key: "documents_complete", label: "Docs Complete" },
    { key: "dmw_registered", label: "DMW Reg" },
    { key: "peos_certified", label: "PEOS" },
    { key: "matched", label: "Matched" },
    { key: "deployed", label: "Deployed" },
  ];
  
  const pipelineData = funnelStages.map((stage) => ({
    name: stage.label,
    count: agg.pipeline_funnel?.[stage.key] || 0,
  }));

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden space-y-2.5">
      {aggErrorMsg && (
        <div className="shrink-0 bg-red-50 border border-red-200 p-2.5 rounded-xl flex items-center gap-2 text-xs text-red-800">
          <AlertTriangle className="text-red-600 w-4 h-4 shrink-0" />
          <span className="font-semibold">RPC Notice: {aggErrorMsg}</span>
        </div>
      )}

      {/* ── TOP HEADER & SCOPE STRIP (Shrink-0) ── */}
      <div className="shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-2 bg-white border border-gray-200 rounded-xl px-3.5 py-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                Overview Operations
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded whitespace-nowrap">
                Live Metrics
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium truncate">
              Real-time applicant intake, deployment monitoring, and job order fulfillment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-xs">
            <span className="text-gray-500 font-medium">Agency License:</span>
            <span className="font-mono font-bold text-gray-800">DMW-514-LB-08132024-R</span>
          </div>
        </div>
      </div>

      {/* ── 4 COMPACT METRICS (Shrink-0) ── */}
      <div className="shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="border border-gray-200 bg-white p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">Total Applicants</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-gray-900">{agg.total_applicants ?? 0}</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="border border-gray-200 bg-white p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">Active Deployments</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-gray-900">{agg.currently_deployed ?? 0}</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
            <Plane className="w-4 h-4" />
          </div>
        </div>

        <div className="border border-gray-200 bg-white p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">Job Fill Rate</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-gray-900">{agg.job_order_fill_rate?.total_filled || 0}</span>
              <span className="text-[11px] text-gray-400">/ {agg.job_order_fill_rate?.total_requested || 0}</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Briefcase className="w-4 h-4" />
          </div>
        </div>

        <div className="border border-gray-200 bg-white p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">Past Deployments</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-gray-900">{agg.historical_deployed ?? 0}</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
            <FileCheck className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ── 2 PANELS / CHARTS (Flex-1) ── */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-2.5 overflow-hidden">
        {/* Main Funnel Chart */}
        <div className="lg:col-span-2 border border-gray-200 bg-white rounded-xl flex flex-col overflow-hidden">
          <div className="px-3.5 py-2.5 border-b border-gray-200 flex items-center justify-between shrink-0 bg-gray-50/50">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Applicant Pipeline Funnel</h2>
            <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded">
              {agg.total_applicants ?? 0} Total
            </span>
          </div>
          <div className="flex-1 min-h-0 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Open Job Orders */}
        <div className="lg:col-span-1 border border-gray-200 bg-white rounded-xl flex flex-col overflow-hidden">
          <div className="px-3.5 py-2.5 border-b border-gray-200 flex items-center justify-between shrink-0 bg-gray-50/50">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Top Open Job Orders</h2>
            <Link href="/staff/job-orders" className="text-xs font-bold text-primary hover:underline">
              Manage
            </Link>
          </div>
          <div className="flex-1 min-h-0 p-3 overflow-y-auto">
            {topJobOrders && topJobOrders.length > 0 ? (
              <div className="space-y-2">
                {topJobOrders.map((jo: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <span className="font-bold text-gray-900 block truncate">{jo.position}</span>
                      <span className="text-[10px] text-gray-500">Slots: {jo.slots_filled} / {jo.manpower_requested}</span>
                    </div>
                    <span className="font-semibold px-2 py-0.5 rounded bg-white text-primary border border-primary/20 text-xs shrink-0">
                      {jo.slots_filled} / {jo.manpower_requested}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-xs font-medium">
                No open job orders
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── EXPIRY & ALERT STRIPS (Shrink-0) ── */}
      {(acc.length > 0 || soonAlerts.length > 0) && (
        <div className="shrink-0 grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {acc.length > 0 && (
            <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-amber-900 font-medium truncate">
                  <strong>{acc.length} Accreditations</strong> expiring within 60 days
                </span>
              </div>
              <Link href="/staff/accreditations" className="text-xs font-bold text-amber-800 hover:underline shrink-0 ml-2">
                Review &rarr;
              </Link>
            </div>
          )}
          {soonAlerts.length > 0 && (
            <div className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-blue-900 font-medium truncate">
                  <strong>{soonAlerts.length} Contracts</strong> ending within 90 days
                </span>
              </div>
              <Link href="/staff/deployments" className="text-xs font-bold text-blue-800 hover:underline shrink-0 ml-2">
                Review &rarr;
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
