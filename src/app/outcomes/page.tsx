"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import useOutcomes from "@/src/hooks/useOutcomes";
import DataTable, { DataColumn } from "@/src/components/ui/molecules/DataTable";
import Button from "@/src/components/ui/atoms/Button";
import { toast } from "react-toastify";
import ConfirmModal from "@/src/components/ui/molecules/ConfirmModal";
import { ROUTES } from "@/src/lib/routes";

export default function OutcomesPage() {
  const { outcomes, loading, refresh, remove } = useOutcomes();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const openConfirmFor = (id: string) => {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  };

  const openConfirm = (id: string) => {
    openConfirmFor(id);
  };

  const cancelConfirm = () => {
    setConfirmOpen(false);
    setPendingDeleteId(null);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await remove(pendingDeleteId);
      toast.success("Outcome deleted");
    } catch (e: any) {
      toast.error(e?.message || "Delete failed");
    } finally {
      setConfirmOpen(false);
      setPendingDeleteId(null);
    }
  };

  const paramsRenderer = (row: any) => JSON.stringify(row.params);

  const columns: DataColumn[] = [
    { key: "type", title: "Type" },
    { key: "params", title: "Params", render: paramsRenderer },
  ];

  useEffect(() => {
    refresh();
  }, []);

  return (
    <main>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Outcomes</h1>
        <Link
          href={ROUTES.OUTCOME_NEW}
          className="px-3 py-2 bg-blue-600 text-white rounded">
          New Outcome
        </Link>
      </div>

      <div className="mt-6">
        <DataTable
          data={outcomes}
          columns={columns}
          loading={loading}
          actions={(row: any) => (
            <>
              <Link
                href={ROUTES.OUTCOME_EDIT(row.id)}
                className="text-blue-600 mr-4">
                Edit
              </Link>
              <Button
                onClick={() => openConfirm(row.id)}
                className="text-red-600 bg-transparent">
                Delete
              </Button>
            </>
          )}
        />
      </div>
      <ConfirmModal
        open={confirmOpen}
        title="Delete outcome"
        description="Are you sure you want to delete this outcome? This action cannot be undone."
        onCancel={cancelConfirm}
        onConfirm={confirmDelete}
      />
    </main>
  );
}
