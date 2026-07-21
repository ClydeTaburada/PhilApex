"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Users, FileCheck, Plane, Building2, AlertTriangle, Briefcase, FileX, ShieldAlert } from "lucide-react";

type Props = {
  agg: any;
  acc: any[];
  soonAlerts: any[];
  aggErrorMsg?: string;
};

const COLORS = ['#0f172a', '#3b82f6', '#14b8a6', '#f59e0b', '#8b5cf6', '#ec4899', '#f43f5e'];

export function DashboardClient({ agg, acc, soonAlerts, aggErrorMsg }: Props) {
  
  // Prepare Pipeline Data
  const funnelStages = [
    { key: "registered", label: "Registered" },
    { key: "documents_complete", label: "Docs Complete" },
    { key: "dmw_registered", label: "DMW Reg" },
    { key: "peos_certified", label: "PEOS" },
    { key: "matched", label: "Matched" },
    { key: "deployed", label: "Deployed" },
  ];
  
  const pipelineData = funnelStages.map(stage => ({
    name: stage.label,
    count: agg.pipeline_funnel?.[stage.key] || 0
  }));

  // Prepare Source Data
  const sourceData = Object.entries(agg.source_breakdown || {}).map(([key, val]) => ({
    name: key.replace(/_/g, ' ').toUpperCase(),
    value: val as number
  }));

  return (
    <div className="space-y-8 pb-12 animate-fade-in-up">
      {aggErrorMsg && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-500 w-5 h-5" />
            <div>
              <p className="font-bold text-red-800 text-sm">Database RPC Error: {aggErrorMsg}</p>
              {aggErrorMsg.includes("does not exist") && (
                <p className="text-xs text-red-600 mt-1">Please run the `20260717_dashboard_rpc.sql` migration in your Supabase SQL Editor. If you already ran it, try running `NOTIFY pgrst, 'reload schema';` to refresh the cache.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 border shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow" style={{ borderColor: "var(--border)" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-600">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Total Applicants</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{agg.total_applicants}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow" style={{ borderColor: "var(--border)" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-teal-50 text-teal-600">
            <Plane className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Active Deployments</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{agg.currently_deployed}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow" style={{ borderColor: "var(--border)" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-purple-50 text-purple-600">
            <Briefcase className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Job Fill Rate</p>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-3xl font-black text-slate-900">{agg.job_order_fill_rate?.total_filled || 0}</p>
              <p className="text-sm font-bold text-slate-400 mb-1">/ {agg.job_order_fill_rate?.total_requested || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow" style={{ borderColor: "var(--border)" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-amber-50 text-amber-600">
            <FileCheck className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Past Deployments</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{agg.historical_deployed}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── Main Funnel Chart ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border shadow-sm lg:col-span-2 overflow-hidden flex flex-col" style={{ borderColor: "var(--border)" }}>
          <div className="px-6 py-5 border-b bg-slate-50 flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Applicant Pipeline Funnel</h2>
            <div className="bg-slate-200 text-slate-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {agg.total_applicants} Total
            </div>
          </div>
          <div className="p-6 flex-1 min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="var(--navy)" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Secondary Column ──────────────────────────────────────────────── */}
        <div className="space-y-6 flex flex-col">
          
          {/* Missing Doc Insight */}
          <div className="bg-white rounded-2xl border shadow-sm p-6" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-50 text-red-500 rounded-lg">
                <FileX className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Top Bottleneck</h3>
            </div>
            {agg.top_missing_document ? (
              <div>
                <p className="text-lg font-black text-slate-900 leading-tight">{agg.top_missing_document.doc_name}</p>
                <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed">
                  Currently missing for <span className="font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{agg.top_missing_document.count}</span> applicants below the "Documents Complete" stage.
                </p>
              </div>
            ) : (
              <p className="text-sm font-bold text-green-600 bg-green-50 px-3 py-2 rounded-lg text-center">No major bottlenecks.</p>
            )}
          </div>

          {/* Source Breakdown */}
          <div className="bg-white rounded-2xl border shadow-sm flex-1 flex flex-col" style={{ borderColor: "var(--border)" }}>
            <div className="px-6 py-4 border-b bg-slate-50" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Applicant Sources</h3>
            </div>
            <div className="p-4 flex-1 min-h-[200px] flex items-center justify-center">
              {sourceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius="50%"
                      outerRadius="75%"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {sourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#475569' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-slate-400 font-medium">No source data available.</p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Alerts & Warnings Row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Accreditations */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col" style={{ borderColor: "var(--border)" }}>
          <div className="px-6 py-4 border-b bg-slate-50 flex items-center gap-3" style={{ borderColor: "var(--border)" }}>
            <Building2 className="w-5 h-5 text-slate-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Accreditations Nearing Expiry</h3>
            {acc.length > 0 && <span className="ml-auto bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full">{acc.length}</span>}
          </div>
          <div className="p-0 flex-1">
            {acc.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {acc.map((a: any) => (
                  <div key={a.id} className="p-5 flex justify-between items-center hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{a.partner?.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{a.accreditation_id_dmw}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-black ${a.days < 0 ? 'text-red-600' : a.days <= 30 ? 'text-amber-600' : 'text-blue-600'}`}>
                        {a.days < 0 ? 'Expired' : `${a.days} days left`}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">{new Date(a.date_expiration).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400">
                <ShieldAlert className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No accreditations expiring within 60 days.</p>
              </div>
            )}
          </div>
        </div>

        {/* Contract End Alerts */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col" style={{ borderColor: "var(--border)" }}>
          <div className="px-6 py-4 border-b bg-slate-50 flex items-center gap-3" style={{ borderColor: "var(--border)" }}>
            <AlertTriangle className="w-5 h-5 text-slate-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Contract End Alerts (90 Days)</h3>
            {soonAlerts.length > 0 && <span className="ml-auto bg-red-100 text-red-700 text-[10px] font-black px-2 py-0.5 rounded-full">{soonAlerts.length}</span>}
          </div>
          <div className="p-0 flex-1 overflow-y-auto max-h-[300px]">
            {soonAlerts.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {soonAlerts.map((a: any) => (
                  <div key={a.id} className="p-5 flex justify-between items-center hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{a.applicant?.full_name}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">{a.batch?.job_order?.partner?.name || "Unknown Partner"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-amber-600">{Math.ceil((new Date(a.entry_date).getTime() + (a.batch.job_order.program.standard_duration_years * 365 * 24 * 60 * 60 * 1000) - Date.now()) / (1000 * 60 * 60 * 24))} days left</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">{a.batch?.job_order?.program?.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400">
                <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No deployments finishing soon.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
