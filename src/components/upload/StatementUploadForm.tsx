"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function StatementUploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Please choose a PDF file.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/ingest", {
        method: "POST",
        body: formData,
      });

      const body = (await response.json()) as {
        statementId?: string;
        error?: string;
        details?: string;
      };

      if (!response.ok || !body.statementId) {
        setError(body.details || body.error || "Upload failed.");
        return;
      }

      router.push(`/statements/${body.statementId}`);
      router.refresh();
    } catch {
      setError("Unexpected error happened while uploading.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border p-6 bg-white">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Upload statement PDF</h2>
        <p className="text-sm text-zinc-600">
          MVP supports one Chase US statement format with text-based PDFs.
        </p>
      </div>

      <input
        type="file"
        accept="application/pdf"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        className="w-full rounded-lg border border-zinc-300 p-2 text-sm"
      />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {isSubmitting ? "Processing..." : "Upload and process"}
      </button>
    </form>
  );
}
