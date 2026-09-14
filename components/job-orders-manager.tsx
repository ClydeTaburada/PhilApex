"use client";

import { useState, useMemo } from "react";
import { Search, Plus, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { JobOrderDeploymentManager } from "@/components/job-order-deployment-manager";
import type { BatchRow, DeploymentRow, JobOrderV2Row } from "@/lib/data/batches";

type JobOrderDetail = {
  jobOrder: JobOrderV2Row;
  batches: BatchRow[];
  deploymentsByBatch: Record<string, DeploymentRow[]>;
};

type Props = {
  jobOrderDetails: JobOrderDetail[];
  staffRole: "front_desk" | "processing_officer" | "admin";
};

export function JobOrdersManager({ jobOrderDetails, staffRole }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(jobOrderDetails[0]?.jobOrder.id || null);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredOrders = useMemo(() => {
    if (!search.trim()) return jobOrderDetails;
    const lower = search.toLowerCase();
    return jobOrderDetails.filter((d) => {
      const jo = d.jobOrder;
      return (
        jo.job_order_number?.toLowerCase().includes(lower) ||
        jo.trade?.toLowerCase().includes(lower) ||
        jo.country?.toLowerCase().includes(lower)
      );
    });
  }, [jobOrderDetails, search]);

  const selectedDetail = jobOrderDetails.find((d) => d.jobOrder.id === selectedId);

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden space-y-2.5">
      {/* 1. Fixed Header (Shrink-0) */}
      <header className="shrink-0 flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <ClipboardList className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">Job Orders</h1>
            <p className="text-[11px] text-gray-500 leading-tight">Manage allocations and deployments</p>
          </div>
        </div>
        {staffRole !== "front_desk" && (
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> New Job Order
          </Button>
        )}
      </header>

      {/* 2. Fixed Filter Bar (Shrink-0) */}
      <div className="shrink-0 flex items-center justify-between gap-2.5 bg-white border border-gray-200 rounded-xl px-3 py-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary transition-shadow" 
            placeholder="Search job orders..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* 3. Split Pane Work Area (Flex-1 Min-H-0 Overflow-Hidden) */}
      <main className="flex-1 min-h-0 bg-white border border-gray-200 rounded-xl flex overflow-hidden">
        
        {/* Left Pane: Master List */}
        <div className="w-80 shrink-0 border-r border-gray-200 flex flex-col bg-gray-50/30">
          <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
            {filteredOrders.map(({ jobOrder, batches, deploymentsByBatch }) => {
              const isActive = selectedId === jobOrder.id;
              const deploymentCount = Object.values(deploymentsByBatch).reduce((sum, items) => sum + items.length, 0);
              
              return (
                <button
                  key={jobOrder.id}
                  onClick={() => setSelectedId(jobOrder.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isActive 
                      ? "bg-white border-primary shadow-sm ring-1 ring-primary/20" 
                      : "bg-transparent border-transparent hover:bg-gray-100 hover:border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <span className="font-bold text-sm text-gray-900 truncate">
                      {jobOrder.job_order_number ?? jobOrder.id.split("-")[0]}
                    </span>
                    <StatusBadge variant={jobOrder.status === "open" ? "success" : "neutral"}>
                      {jobOrder.status}
                    </StatusBadge>
                  </div>
                  <p className="text-xs font-medium text-gray-700 truncate">
                    {jobOrder.positions && jobOrder.positions.length > 0
                      ? jobOrder.positions.map(p => p.position).join(", ")
                      : jobOrder.trade ?? "Unknown"}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-gray-500">
                    <span>{jobOrder.country}</span>
                    <span>{deploymentCount} / {jobOrder.manpower_requested ?? 0} slots</span>
                  </div>
                </button>
              );
            })}
            {filteredOrders.length === 0 && (
              <div className="text-center p-8">
                <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">No Job Orders</p>
                <p className="text-xs text-gray-400 mt-1">Try adjusting your filters.</p>
              </div>
            )}
          </div>
          <footer className="shrink-0 bg-gray-50 border-t border-gray-200 px-3 py-2 text-[10px] text-gray-500 font-medium">
            Showing {filteredOrders.length} job orders
          </footer>
        </div>

        {/* Right Pane: Detail View */}
        <div className="flex-1 min-w-0 flex flex-col bg-white">
          {selectedDetail ? (
            <div className="flex-1 min-h-0 overflow-y-auto p-4">
              <JobOrderDeploymentManager
                jobOrder={selectedDetail.jobOrder}
                initialBatches={selectedDetail.batches}
                initialDeploymentsByBatch={selectedDetail.deploymentsByBatch}
                staffRole={staffRole}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <ClipboardList className="w-12 h-12 text-gray-200 mb-3" />
              <h3 className="text-base font-bold text-gray-900">Select a Job Order</h3>
              <p className="text-xs text-gray-500 max-w-sm mt-1">
                Choose a job order from the list on the left to manage its batches and deploy applicants.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Create Modal would go here using our new Modal component */}
      <Modal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        title="Create Job Order"
        maxWidth="2xl"
      >
        <div className="p-4 text-center">
           <p className="text-sm text-gray-500">
             (Creation form implementation omitted for brevity in this UI pass. Will connect to existing API later.)
           </p>
        </div>
      </Modal>
    </div>
  );
}
