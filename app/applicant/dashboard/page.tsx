import { redirect } from "next/navigation";
import { getApplicantSession } from "@/lib/applicant-auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { ChatWidget } from "@/components/chat-widget";
import { ApplicantDashboardView } from "./dashboard-view";

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

  // Fetch Documents with Requirements
  const { data: docs } = await (supabase as any)
    .from("applicant_documents")
    .select(`
      id, status, file_path, remarks,
      document_requirement:document_requirements(id, doc_name, requires_file_upload, is_conditional, condition_note)
    `)
    .eq("applicant_id", session.applicant_id)
    .order("document_requirement_id", { ascending: true });

  // Fetch Deployment / Job Order if matched
  let deployment = null;
  try {
    const { data } = await (supabase as any)
      .from("deployments")
      .select(`
        id, visa_status, oec_number, flight_airline, flight_number, departure_datetime,
        batch:batches(
          job_order:job_orders(
            id, program_name, trade_name, country, position,
            partner:foreign_partners!principal_partner_id(name)
          )
        )
      `)
      .eq("applicant_id", session.applicant_id)
      .maybeSingle();
    deployment = data;
  } catch {
    // fallback if columns differ
  }

  // Find 2x2 Picture
  const pictureDoc = docs?.find((d: any) => 
    d.document_requirement?.doc_name?.toLowerCase().includes("2x2") ||
    d.document_requirement?.doc_name?.toLowerCase().includes("picture") ||
    d.document_requirement?.doc_name?.toLowerCase().includes("photo")
  );

  let profilePictureUrl = null;
  if (pictureDoc?.file_path) {
    try {
      const { data } = await supabase
        .storage
        .from("applicant-documents")
        .createSignedUrl(pictureDoc.file_path, 86400);
      profilePictureUrl = data?.signedUrl || null;
    } catch {
      profilePictureUrl = null;
    }
  }

  return (
    <>
      <ApplicantDashboardView
        applicant={applicant}
        docs={docs || []}
        deployment={deployment}
        profilePictureUrl={profilePictureUrl}
      />
      <ChatWidget 
        tableName="applicant_messages" 
        identifierColumn="applicant_id" 
        identifierValue={session.applicant_id} 
        senderType="applicant" 
      />
    </>
  );
}