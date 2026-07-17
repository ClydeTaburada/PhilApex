import { redirect } from "next/navigation";
import { getApplicantSession } from "@/lib/applicant-auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import Image from "next/image";
import { LogoutButton } from "./logout-button";
import { DocumentUploader } from "./document-uploader";

export const dynamic = "force-dynamic";

export default async function ApplicantDashboardPage() {
  const session = await getApplicantSession();
  if (!session) {
    redirect("/applicant/login");
  }

  const supabase = getSupabaseAdminClient();

  // Fetch Applicant
  const { data: applicant } = await (supabase as any)
    .from("applicants")
    .select("*")
    .eq("id", session.applicant_id)
    .single();

  if (!applicant) redirect("/applicant/login");

  // Fetch Documents
  const { data: docs } = await (supabase as any)
    .from("applicant_documents")
    .select(`
      id, status, file_path,
      document_requirement:document_requirements(doc_name, requires_file_upload)
    `)
    .eq("applicant_id", session.applicant_id);

  // Fetch Deployments / Job Order if matched
  const { data: deployment } = await (supabase as any)
    .from("deployments")
    .select(`
      id,
      batch:batches(
        job_order:job_orders(
          id, program_name, trade_name, country,
          partner:foreign_partners!principal_partner_id(name)
        )
      )
    `)
    .eq("applicant_id", session.applicant_id)
    .maybeSingle();

  const stages = [
    { key: "registered", label: "Registered" },
    { key: "documents_complete", label: "Docs Complete" },
    { key: "dmw_registered", label: "DMW Reg" },
    { key: "peos_certified", label: "PEOS" },
    { key: "matched", label: "Matched" },
    { key: "deployed", label: "Deployed" },
  ];
  const currentStageIndex = stages.findIndex(s => s.key === applicant.current_pipeline_stage);

  const missingDocs = (docs || []).filter((d: any) => d.status === "missing");
  const submittedDocs = (docs || []).filter((d: any) => d.status !== "missing");

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Logo" width={32} height={32} className="rounded-full" />
          <div>
            <p className="text-xs font-bold text-ink-muted uppercase">Phil-Apex Portal</p>
            <p className="text-sm font-black truncate max-w-[150px]">{applicant.full_name}</p>
          </div>
        </div>
        <LogoutButton />
      </div>

      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
        
        {/* Status Tracker */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-5">Application Status</h2>
          <div className="relative">
            <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-gray-100" />
            <div className="space-y-6">
              {stages.map((stage, idx) => {
                const isCompleted = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;
                const isPending = idx > currentStageIndex;
                
                return (
                  <div key={stage.key} className={`relative flex items-center gap-4 ${isPending ? 'opacity-40' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center relative z-10 
                      ${isCompleted ? 'bg-primary text-white' : isCurrent ? 'bg-blue-100 border-2 border-primary text-primary' : 'bg-gray-100 text-gray-400'}`}>
                      {isCompleted ? '✓' : idx + 1}
                    </div>
                    <div>
                      <p className={`font-bold ${isCurrent ? 'text-primary' : 'text-ink'}`}>{stage.label}</p>
                      {isCurrent && <p className="text-xs text-ink-muted">You are currently at this stage.</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Job Order Info */}
        {deployment?.batch?.job_order && (
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-2xl shadow-lg text-white">
            <h2 className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-2">Your Placement</h2>
            <p className="text-xl font-black mb-1">{deployment.batch.job_order.partner?.name}</p>
            <div className="flex justify-between items-end mt-4">
              <div>
                <p className="text-sm text-blue-100">{deployment.batch.job_order.trade_name}</p>
                <p className="text-xs font-medium bg-white/20 px-2 py-1 rounded w-max mt-2">
                  {deployment.batch.job_order.program_name} - {deployment.batch.job_order.country}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Missing Documents */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-red-100 border-t-4 border-t-red-500">
          <h2 className="text-sm font-bold text-red-600 uppercase tracking-wider mb-4 flex justify-between items-center">
            <span>Action Required</span>
            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs">{missingDocs.length} Missing</span>
          </h2>
          {missingDocs.length === 0 ? (
            <p className="text-sm text-ink-muted text-center py-4 bg-gray-50 rounded-lg">All documents submitted! Great job.</p>
          ) : (
            <div className="space-y-3">
              {missingDocs.map((doc: any) => (
                <DocumentUploader key={doc.id} documentId={doc.id} docName={doc.document_requirement?.doc_name} />
              ))}
            </div>
          )}
        </div>

        {/* Submitted Documents */}
        {submittedDocs.length > 0 && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-4">Submitted Documents</h2>
            <div className="space-y-2">
              {submittedDocs.map((doc: any) => (
                <div key={doc.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">{doc.document_requirement?.doc_name}</span>
                  <span className={`text-xs font-bold uppercase ${doc.status === 'verified' ? 'text-green-600' : 'text-amber-600'}`}>
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}