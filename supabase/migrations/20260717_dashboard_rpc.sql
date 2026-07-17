-- Dashboard Aggregates RPC
CREATE OR REPLACE FUNCTION get_dashboard_aggregates()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_applicants', (SELECT count(*) FROM public.applicants),
    'pipeline_funnel', coalesce((
      SELECT json_object_agg(stage, count) FROM (
        SELECT current_pipeline_stage as stage, count(*) as count
        FROM public.applicants
        GROUP BY current_pipeline_stage
      ) t
    ), '{}'::json),
    'source_breakdown', coalesce((
      SELECT json_object_agg(src, count) FROM (
        SELECT source as src, count(*) as count
        FROM public.applicants
        GROUP BY source
      ) t
    ), '{}'::json),
    'top_missing_document', (
      SELECT row_to_json(t) FROM (
        SELECT d.doc_name, count(ad.id) as count, d.id as doc_id
        FROM public.applicant_documents ad
        JOIN public.applicants a ON a.id = ad.applicant_id
        JOIN public.document_requirements d ON d.id = ad.document_id
        WHERE ad.status != 'submitted' 
          AND a.current_pipeline_stage IN ('registered', 'documents_complete')
          AND d.is_mandatory = true
        GROUP BY d.id, d.doc_name
        ORDER BY count DESC
        LIMIT 1
      ) t
    ),
    'currently_deployed', (
      SELECT count(*) FROM public.deployments WHERE deployment_end_date IS NULL AND document_status = 'dispatched'
    ),
    'historical_deployed', (
      SELECT count(*) FROM public.deployments WHERE deployment_end_date IS NOT NULL AND document_status = 'dispatched'
    ),
    'program_breakdown', coalesce((
      SELECT json_agg(json_build_object('program', prog, 'country', ctry, 'count', cnt))
      FROM (
        SELECT jo.program_name as prog, jo.country as ctry, count(d.id) as cnt
        FROM public.deployments d
        JOIN public.batches b ON b.id = d.batch_id
        JOIN public.job_orders jo ON jo.id = b.job_order_id
        WHERE d.deployment_end_date IS NULL AND d.document_status = 'dispatched'
        GROUP BY jo.program_name, jo.country
      ) t
    ), '[]'::json),
    'job_order_fill_rate', coalesce((
      SELECT json_build_object(
        'total_requested', sum(manpower_requested),
        'total_filled', sum(slots_filled)
      )
      FROM public.job_orders
      WHERE status = 'open'
    ), '{"total_requested": 0, "total_filled": 0}'::json)
  ) INTO result;

  RETURN result;
END;
$$;
