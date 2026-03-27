"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { StatementIngestModal } from "@/components/upload/StatementIngestModal";

type StatementItem = {
  id: string;
  file_name: string;
  statement_month: number;
  statement_year: number;
  processing_status: string;
};

export function StatementsListPanel({ statements }: { statements: StatementItem[] }) {
  const router = useRouter();
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCount = selectedIds.length;
  const canConfirmDelete = isSelectMode && selectedCount > 0 && !isDeleting;

  const selectedLabels = useMemo(() => {
    const selectedSet = new Set(selectedIds);
    return statements
      .filter((statement) => selectedSet.has(statement.id))
      .map((statement) => `${statement.statement_month}/${statement.statement_year} - ${statement.file_name}`);
  }, [selectedIds, statements]);

  function toggleSelectMode() {
    if (isDeleting) return;
    if (!isSelectMode) {
      setIsSelectMode(true);
      setError(null);
      return;
    }
    void confirmDelete();
  }

  function toggleItem(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      return [...prev, id];
    });
  }

  function cancelSelectMode() {
    if (isDeleting) return;
    setIsSelectMode(false);
    setSelectedIds([]);
    setError(null);
  }

  async function confirmDelete() {
    if (!canConfirmDelete) return;
    const shouldDelete = window.confirm(
      `Delete ${selectedCount} statement${selectedCount === 1 ? "" : "s"}?\n\n${selectedLabels.join("\n")}`,
    );
    if (!shouldDelete) return;

    setIsDeleting(true);
    setError(null);
    try {
      const results = await Promise.all(
        selectedIds.map(async (id) => {
          const response = await fetch(`/api/statements/${id}`, { method: "DELETE" });
          if (!response.ok) {
            const body = (await response.json()) as { error?: string };
            return body.error || "Failed to delete statement.";
          }
          return null;
        }),
      );

      const firstError = results.find((result) => result !== null);
      if (firstError) {
        throw new Error(firstError);
      }

      setIsSelectMode(false);
      setSelectedIds([]);
      router.refresh();
    } catch (deleteError) {
      const message =
        deleteError instanceof Error ? deleteError.message : "Failed to delete statements.";
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-zinc-900">Statements</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSelectMode}
            disabled={isDeleting || (isSelectMode && selectedCount === 0)}
            className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            {isDeleting ? "Deleting..." : isSelectMode ? "Confirm delete" : "Delete"}
          </button>
          {isSelectMode ? (
            <button
              type="button"
              onClick={cancelSelectMode}
              disabled={isDeleting}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
            >
              Cancel
            </button>
          ) : null}
          <StatementIngestModal />
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border bg-white">
        <ul className="divide-y">
          {statements.map((statement) => {
            const checked = selectedIds.includes(statement.id);
            return (
              <li key={statement.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  {isSelectMode ? (
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleItem(statement.id)}
                      className="h-4 w-4"
                    />
                  ) : null}
                  <div>
                    <p className="font-medium text-zinc-900">
                      {statement.statement_month}/{statement.statement_year} - {statement.file_name}
                    </p>
                    <p className="text-sm text-zinc-500">{statement.processing_status}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/statements/${statement.id}`}
                    className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
                  >
                    View
                  </Link>
                </div>
              </li>
            );
          })}
          {statements.length === 0 ? (
            <li className="px-4 py-8 text-sm text-zinc-500">
              No statements yet. Upload your first PDF.
            </li>
          ) : null}
        </ul>
      </section>
    </main>
  );
}
