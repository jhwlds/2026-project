import Link from "next/link";

import { StatementDeleteButton } from "@/components/statements/StatementDeleteButton";
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

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Statements</h1>
        <Link
          href="/statements/new"
          className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
        >
          Upload new
        </Link>
      </div>

      <section className="rounded-2xl border bg-white">
        <ul className="divide-y">
          {(statements ?? []).map((statement) => (
            <li key={statement.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium text-zinc-900">
                  {statement.statement_month}/{statement.statement_year} - {statement.file_name}
                </p>
                <p className="text-sm text-zinc-500">{statement.processing_status}</p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/statements/${statement.id}`}
                  className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
                >
                  View
                </Link>
                <StatementDeleteButton
                  statementId={statement.id}
                  className="rounded-lg border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-60"
                />
              </div>
            </li>
          ))}
          {statements?.length === 0 ? (
            <li className="px-4 py-8 text-sm text-zinc-500">
              No statements yet. Upload your first PDF.
            </li>
          ) : null}
        </ul>
      </section>
    </main>
  );
}
