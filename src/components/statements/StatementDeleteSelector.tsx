"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type StatementOption = {
  id: string;
  label: string;
};

export function StatementDeleteSelector({ statements }: { statements: StatementOption[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(statements[0]?.id ?? "");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedLabel = useMemo(
    () => statements.find((item) => item.id === selectedId)?.label ?? "this statement",
    [selectedId, statements],
  );

  async function onDelete() {
    if (!selectedId || isDeleting) return;
    const shouldDelete = window.confirm(
      `Delete "${selectedLabel}" and all related transactions?`,
    );
    if (!shouldDelete) return;

    setIsDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/statements/${selectedId}`, { method: "DELETE" });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error || "Failed to delete statement.");
      }
      router.refresh();
    } catch (deleteError) {
      const message =
        deleteError instanceof Error ? deleteError.message : "Failed to delete statement.";
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  }

  if (statements.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectedId}
        onChange={(event) => setSelectedId(event.target.value)}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700"
      >
        {statements.map((statement) => (
          <option key={statement.id} value={statement.id}>
            {statement.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onDelete}
        disabled={isDeleting || !selectedId}
        className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
      >
        {isDeleting ? "Deleting..." : "Delete selected"}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
