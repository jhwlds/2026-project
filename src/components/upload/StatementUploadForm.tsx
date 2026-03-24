"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export function StatementUploadForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        className="hidden"
      />

      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
        {file ? `Selected file: ${file.name}` : "No file selected"}
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Upload file
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isSubmitting ? "Analyzing..." : "Analyze"}
        </button>
      </div>
    </form>
  );
}
