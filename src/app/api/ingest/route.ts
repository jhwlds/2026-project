import { NextResponse } from "next/server";

import { applyRuleBasedCategorization } from "@/lib/categorization/rules";
import { ChaseUsParser } from "@/lib/parsing/chaseUsParser";
import { normalizeTransactions } from "@/lib/parsing/normalizeTransactions";
import { extractPdfText } from "@/lib/parsing/pdfText";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "PDF file is required." }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const rawText = await extractPdfText(fileBuffer);

    const parser = new ChaseUsParser();
    const parsed = parser.parse({ rawText });
    const normalized = normalizeTransactions(parsed.transactions);
    const categorized = applyRuleBasedCategorization(normalized);

    const { data: statement, error: statementError } = await supabase
      .from("statements")
      .insert({
        user_id: user.id,
        file_name: file.name,
        statement_month: parsed.statementMonth,
        statement_year: parsed.statementYear,
        parser_version: parser.parserVersion,
        processing_status: "completed",
        currency: "USD",
      })
      .select("id")
      .single();

    if (statementError || !statement) {
      return NextResponse.json(
        { error: statementError?.message ?? "Failed to create statement row." },
        { status: 500 },
      );
    }

    const txPayload = categorized.map((tx) => ({
      user_id: user.id,
      statement_id: statement.id,
      date: tx.date,
      merchant_raw: tx.merchant_raw,
      merchant_normalized: tx.merchant_normalized,
      amount: tx.amount,
      category: tx.category,
      subcategory: tx.subcategory,
      confidence_score: tx.confidence_score,
      categorization_source: tx.categorization_source,
      is_recurring: false,
    }));

    const { error: txInsertError } = await supabase.from("transactions").insert(txPayload);
    if (txInsertError) {
      return NextResponse.json(
        { error: txInsertError.message ?? "Failed to save transactions." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      statementId: statement.id,
      message: "Statement ingested successfully.",
      transactionCount: txPayload.length,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown ingestion failure";
    return NextResponse.json(
      {
        error: "Failed to ingest statement.",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
