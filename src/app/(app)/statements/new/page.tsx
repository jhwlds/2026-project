import { StatementUploadForm } from "@/components/upload/StatementUploadForm";

export default function NewStatementPage() {
  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900">Ingest statement</h1>
      <StatementUploadForm />
    </main>
  );
}
