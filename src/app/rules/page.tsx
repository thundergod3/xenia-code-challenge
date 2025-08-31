"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import useRules from "@/src/hooks/useRules";
import DataTable, { DataColumn } from "@/src/components/ui/molecules/DataTable";
import ConfirmModal from "@/src/components/ui/molecules/ConfirmModal";
import Button from "@/src/components/ui/atoms/Button";
import { downloadRulesExport } from "@/src/services/rulesExportService";
import ImportButtonModal from "@/src/components/ui/molecules/ImportButtonModal";
import { RuleImportSchema } from "@/src/lib/validations";
import { ROUTES } from "@/src/lib/routes";

export default function RulesPage() {
  const { rules, loading, refresh, remove } = useRules();
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
  ];

  return (
    <main>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Rules</h1>
        <div className="flex items-center gap-3">
          <ImportButtonModal
            module="rules"
            schema={RuleImportSchema}
            label="Import Rules"
            onImported={refresh}
          />
          <Button
            onClick={() => downloadRulesExport()}
            className="px-3 py-2 bg-gray-200">
            Export Rules
          </Button>
          <Link
            href={ROUTES.RULE_NEW}
            className="px-3 py-2 bg-blue-600 text-white rounded">
            New Rule
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <DataTable
          data={rules}
          columns={columns}
          loading={loading}
          actions={(row) => (
            <>
              <Link
                className="text-blue-600 mr-4"
                href={ROUTES.RULE_EDIT(row.id)}>
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
        title="Delete rule"
        description="Are you sure you want to delete this rule? This action cannot be undone."
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </main>
  );
}
