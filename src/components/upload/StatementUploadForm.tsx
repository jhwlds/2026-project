"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type UploadStatus = "pending" | "uploading" | "done" | "failed";

type UploadItem = {
  fileName: string;
  status: UploadStatus;
  message?: string;
};

export function StatementUploadForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  function onPickFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    if (picked.length === 0) {
      setFiles([]);
      setUploads([]);
      return;
    }

    if (picked.length > 5) {
      setError("You can analyze up to 5 PDFs at once.");
      setFiles(picked.slice(0, 5));
      setUploads([]);
      return;
    }

    setError(null);
    setFiles(picked);
    setUploads([]);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (files.length === 0) {
      setError("Please choose at least one PDF file.");
      return;
    }
    if (files.length > 5) {
      setError("You can analyze up to 5 PDFs at once.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setUploads(
      files.map((file) => ({
        fileName: file.name,
        status: "pending",
      })),
    );

    try {
      for (const [index, file] of files.entries()) {
        setUploads((prev) =>
          prev.map((item, itemIndex) =>
            itemIndex === index ? { ...item, status: "uploading", message: undefined } : item,
          ),
        );

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
          setUploads((prev) =>
            prev.map((item, itemIndex) =>
              itemIndex === index
                ? {
                    ...item,
                    status: "failed",
                    message: body.details || body.error || "Analyze failed.",
                  }
                : item,
            ),
          );
          continue;
        }

        setUploads((prev) =>
          prev.map((item, itemIndex) =>
            itemIndex === index ? { ...item, status: "done", message: "Completed" } : item,
          ),
        );
      }

      router.refresh();
      if (fileInputRef.current) fileInputRef.current.value = "";
      setFiles([]);
    } catch {
      setError("Unexpected error happened while uploading.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const completedCount = uploads.filter((item) => item.status === "done").length;
  const failedCount = uploads.filter((item) => item.status === "failed").length;

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border p-6 bg-white">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Upload statement PDFs</h2>
        <p className="text-sm text-zinc-600">
          Analyze up to 5 PDFs at once. Each file is saved as a separate statement.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        multiple
        onChange={onPickFiles}
        className="hidden"
      />

      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
        {files.length > 0
          ? `${files.length} file${files.length === 1 ? "" : "s"} selected`
          : "No file selected"}
      </div>

      {files.length > 0 ? (
        <ul className="space-y-1 rounded-lg border border-zinc-200 p-3 text-sm text-zinc-700">
          {files.map((file) => (
            <li key={file.name}>{file.name}</li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {uploads.length > 0 ? (
        <div className="space-y-2 rounded-lg border border-zinc-200 p-3">
          <p className="text-sm text-zinc-700">
            Progress: {completedCount}/{uploads.length} completed
            {failedCount > 0 ? `, ${failedCount} failed` : ""}
          </p>
          <ul className="space-y-1 text-sm">
            {uploads.map((item) => (
              <li key={item.fileName} className="flex items-center justify-between gap-2">
                <span className="truncate text-zinc-700">{item.fileName}</span>
                <span
                  className={
                    item.status === "done"
                      ? "text-emerald-600"
                      : item.status === "failed"
                        ? "text-red-600"
                        : item.status === "uploading"
                          ? "text-blue-600"
                          : "text-zinc-500"
                  }
                >
                  {item.status === "pending"
                    ? "Waiting"
                    : item.status === "uploading"
                      ? "Analyzing..."
                      : item.status === "done"
                        ? "Done"
                        : item.message || "Failed"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSubmitting}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Select files
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isSubmitting ? "Analyzing..." : "Analyze files"}
        </button>
      </div>
    </form>
  );
}
