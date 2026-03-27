import { StatementsListPanel } from "@/components/statements/StatementsListPanel";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function StatementsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: statements } = await supabase
    .from("statements")
    .select("id,file_name,statement_month,statement_year,uploaded_at,processing_status")
    .eq("user_id", user!.id)
    .order("uploaded_at", { ascending: false });

  return <StatementsListPanel statements={statements ?? []} />;
}
