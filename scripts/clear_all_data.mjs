import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Load environment variables from .env.local
const envFile = fs.readFileSync(".env.local", "utf8");
const env = {};
for (const line of envFile.split("\n")) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      env[trimmed.substring(0, idx).trim()] = trimmed.substring(idx + 1).trim();
    }
  }
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function deleteAllFromTable(tableName, idColumn = "id") {
  process.stdout.write(`Deleting from ${tableName}... `);
  try {
    const { data: rows, error: selectErr } = await supabase
      .from(tableName)
      .select(idColumn);

    if (selectErr) {
      console.log(`Error selecting: ${selectErr.message}`);
      return;
    }

    if (!rows || rows.length === 0) {
      console.log("0 records found.");
      return;
    }

    const ids = rows.map((r) => r[idColumn]);
    const { error: deleteErr } = await supabase
      .from(tableName)
      .delete()
      .in(idColumn, ids);

    if (deleteErr) {
      console.log(`Error deleting: ${deleteErr.message}`);
    } else {
      console.log(`Deleted ${ids.length} records.`);
    }
  } catch (err) {
    console.log(`Exception: ${err.message}`);
  }
}

async function cleanStorage() {
  process.stdout.write("Cleaning storage bucket 'applicant-documents'... ");
  try {
    const { data: rootItems, error: listErr } = await supabase
      .storage
      .from("applicant-documents")
      .list("", { limit: 100 });

    if (listErr) {
      console.log(`Error listing root: ${listErr.message}`);
      return;
    }

    let deletedCount = 0;
    for (const item of rootItems || []) {
      if (item.id === null) {
        const { data: subItems } = await supabase
          .storage
          .from("applicant-documents")
          .list(item.name, { limit: 100 });

        const subPaths = (subItems || []).map((sub) => `${item.name}/${sub.name}`);
        if (subPaths.length > 0) {
          await supabase.storage.from("applicant-documents").remove(subPaths);
          deletedCount += subPaths.length;
        }
      } else {
        await supabase.storage.from("applicant-documents").remove([item.name]);
        deletedCount++;
      }
    }
    console.log(`Deleted ${deletedCount} storage files.`);
  } catch (err) {
    console.log(`Storage cleanup error: ${err.message}`);
  }
}

async function main() {
  console.log("=================================================");
  console.log(" Phil-Apex: Reset All Data (Preserve Users/Staff)");
  console.log("=================================================");

  // 1. Deployments
  await deleteAllFromTable("deployments");

  // 2. Batches
  await deleteAllFromTable("batches");

  // 3. Applicant-Job-Order links
  await deleteAllFromTable("applicant_job_orders", "applicant_id");

  // 4. Applicant documents
  await deleteAllFromTable("applicant_documents");

  // 5. Messages
  await deleteAllFromTable("applicant_messages");
  await deleteAllFromTable("employer_messages");

  // 6. Audit logs
  await deleteAllFromTable("audit_log");

  // 7. Applicants
  await deleteAllFromTable("applicants");

  // 8. Job orders
  await deleteAllFromTable("job_orders");

  // 9. Accreditation history
  await deleteAllFromTable("accreditation_history");

  // 10. Accreditations
  await deleteAllFromTable("accreditations");

  // 11. Foreign partners (child partners first, then parent partners)
  const { data: childPartners } = await supabase
    .from("foreign_partners")
    .select("id")
    .not("parent_partner_id", "is", null);

  if (childPartners && childPartners.length > 0) {
    const childIds = childPartners.map((p) => p.id);
    await supabase.from("foreign_partners").delete().in("id", childIds);
  }
  await deleteAllFromTable("foreign_partners");

  // 12. Programs
  await deleteAllFromTable("programs");

  // 13. Trades
  await deleteAllFromTable("trades");

  // 14. Rate limit tracking
  await deleteAllFromTable("public_registration_rate_limits", "ip_hash");

  // 15. Storage bucket
  await cleanStorage();

  // 16. Print Final Status
  console.log("\n── Final Database Status ────────────────────────");
  const tables = [
    "staff",
    "document_requirements",
    "applicants",
    "applicant_documents",
    "applicant_messages",
    "job_orders",
    "accreditations",
    "foreign_partners",
    "programs",
    "trades",
    "deployments",
    "batches",
    "audit_log",
  ];

  for (const t of tables) {
    const { count } = await supabase.from(t).select("*", { count: "exact", head: true });
    console.log(`${t.padEnd(25)}: ${count ?? 0} rows remaining`);
  }
  console.log("=================================================");
  console.log("Database reset complete! Ready for manual data entry.");
}

main().catch(console.error);
