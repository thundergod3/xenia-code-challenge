"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import useFacts from "@/src/hooks/useFacts";
import DataTable, { DataColumn } from "@/src/components/ui/molecules/DataTable";
import LinkButton from "@/src/components/ui/atoms/LinkButton";
import Button from "@/src/components/ui/atoms/Button";
import ConfirmModal from "@/src/components/ui/molecules/ConfirmModal";
import { downloadFactsExport } from "@/src/services/factsExportService";
import ImportButtonModal from "@/src/components/ui/molecules/ImportButtonModal";
import { ROUTES } from "@/src/lib/routes";

export default function FactsPage() {
  const { facts, loading, remove, refresh } = useFacts();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const openConfirm = (id: string) => {
    setPendingId(id);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!pendingId) return;
    await remove(pendingId);
    setConfirmOpen(false);
    setPendingId(null);
  };

  useEffect(() => {
    refresh();
  }, []);

  const columns: DataColumn[] = [
    { key: "name", title: "Name" },
    { key: "description", title: "Description" },
    { key: "type", title: "Type" },
  ];

  return (
    <main>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Facts</h1>
        <div className="flex items-center gap-3">
          <ImportButtonModal onImported={refresh} />
          <Button
            onClick={() => downloadFactsExport()}
            className="px-3 py-2 bg-gray-200">
            Export Facts
          </Button>
          <LinkButton href={ROUTES.FACT_NEW}>New Fact</LinkButton>
        </div>
      </div>

      <p className="mt-2 text-gray-600">List and manage facts (CRUD)</p>

      <div className="mt-6">
        <DataTable
          data={facts}
          columns={columns}
          loading={loading}
          actions={(row) => (
            <>
              <Link
                className="text-blue-600 mr-4"
                href={ROUTES.FACT_EDIT(row.id)}>
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
        title="Delete fact"
        description="Are you sure you want to delete this fact? This action cannot be undone."
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </main>
  );
}
