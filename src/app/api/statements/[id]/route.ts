import { NextResponse } from "next/server";

import { computeCategoryBreakdown, computeStatementMetrics } from "@/lib/reporting/metrics";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: statement, error: statementError } = await supabase
    .from("statements")
    .select("id,file_name,statement_month,statement_year,uploaded_at,processing_status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (statementError || !statement) {
    return NextResponse.json({ error: "Statement not found." }, { status: 404 });
  }

  const { data: transactions, error: txError } = await supabase
    .from("transactions")
    .select(
      "id,date,merchant_raw,merchant_normalized,amount,category,subcategory,confidence_score,is_recurring",
    )
    .eq("statement_id", id)
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  if (txError) {
    return NextResponse.json({ error: txError.message }, { status: 500 });
  }

  const txs = transactions ?? [];
  const metrics = computeStatementMetrics(txs);
  const categoryBreakdown = computeCategoryBreakdown(txs);

  return NextResponse.json({
    statement,
    metrics,
    categoryBreakdown,
    transactions: txs,
  });
}
