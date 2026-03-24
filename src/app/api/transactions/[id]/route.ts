import { NextResponse } from "next/server";

import { normalizeMerchantName } from "@/lib/parsing/normalizeMerchant";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PatchPayload = {
  category?: string;
  subcategory?: string | null;
  merchantNormalized?: string;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const payload = (await request.json()) as PatchPayload;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: existing, error: existingError } = await supabase
    .from("transactions")
    .select("id,merchant_raw,merchant_normalized,category,subcategory")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (existingError || !existing) {
    return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
  }

  const merchantNormalized =
    payload.merchantNormalized?.trim() ||
    normalizeMerchantName(existing.merchant_raw);

  const updates = {
    category: payload.category ?? existing.category,
    subcategory: payload.subcategory ?? existing.subcategory,
    merchant_normalized: merchantNormalized,
    categorization_source: "user",
    confidence_score: 1.0,
  };

  const { error: updateError } = await supabase
    .from("transactions")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await supabase.from("merchant_mappings").upsert(
    {
      user_id: user.id,
      merchant_name: merchantNormalized,
      category: updates.category,
      subcategory: updates.subcategory,
      confidence: 1.0,
    },
    { onConflict: "user_id,merchant_name" },
  );

  return NextResponse.json({ ok: true });
}
