"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type StatementDeleteButtonProps = {
  statementId: string;
  afterDeleteHref?: string;
  className?: string;
};

export function StatementDeleteButton({
  statementId,
  afterDeleteHref = "/statements",
  className,
}: StatementDeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    if (isDeleting) return;

    const shouldDelete = window.confirm(
      "Delete this statement and all related transactions?",
    );
    if (!shouldDelete) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/statements/${statementId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error || "Failed to delete statement.");
      }

      router.push(afterDeleteHref);
      router.refresh();
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete statement.";
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onDelete}
        disabled={isDeleting}
        className={
          className ??
          "rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
        }
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
