"use client";
import React, { useEffect, useMemo, useState } from "react";
import useTestCases from "@/src/hooks/useTestCases";
import useRules from "@/src/hooks/useRules";
import DataTable, { DataColumn } from "@/src/components/ui/molecules/DataTable";
import Button from "@/src/components/ui/atoms/Button";
import JsonModal from "@/src/components/ui/molecules/JsonModal";

export default function TestCaseErrorsPage() {
  const { tests, loading, refresh } = useTestCases();
  const { rules } = useRules();
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [jsonModalContent, setJsonModalContent] = useState<any>(null);

  const errorTests = useMemo(() => {
    return (tests || []).filter((t: any) => {
      const ao = t.actual_output;
      if (!ao) return false;
      if (ao.error || ao.code || ao.__dynamic_error) return true;
      // also consider dynamic resolution errors stored under resolved_facts
      if (ao.resolved_facts) {
        return Object.values(ao.resolved_facts).some(
          (v: any) => v && v.__dynamic_error
        );
      }
      return false;
    });
  }, [tests]);

  const openJsonModal = (obj: any) => {
    setJsonModalContent(obj);
    setJsonModalOpen(true);
  };

  const closeJsonModal = () => {
    setJsonModalOpen(false);
    setJsonModalContent(null);
  };

  const renderRuleName = (row: any) => {
    const r = (rules || []).find((x: any) => x.id === row.rule_id);
    return r ? r.name : row.rule_id;
  };

  const renderErrorCode = (row: any) => {
    const ao = row.actual_output || {};
    return (
      <div className="text-sm font-medium">{ao.code || ao.error || "-"}</div>
    );
  };

  const renderErrorMessage = (row: any) => {
    const ao = row.actual_output || {};
    const msg = ao.message || (ao.error && String(ao.error)) || "-";
    return <div className="text-xs text-gray-700 truncate max-w-xs">{msg}</div>;
  };

  const actionHandlers = useMemo(() => {
    const map: Record<string, () => void> = {};
    (errorTests || []).forEach((t: any) => {
      map[t.id] = () => openJsonModal(t.actual_output);
    });
    return map;
  }, [errorTests]);

  const renderActions = (row: any) => {
    const handler = actionHandlers[row.id];
    return (
      <div>
        <Button onClick={handler} className="px-2 py-1 text-xs">
          View JSON
        </Button>
      </div>
    );
  };

  const columns: DataColumn[] = [
    { key: "name", title: "Test Case" },
    { key: "rule_id", title: "Rule", render: renderRuleName },
    { key: "last_run_at", title: "Last Run" },
    { key: "error_code", title: "Error", render: renderErrorCode },
    { key: "error_message", title: "Message", render: renderErrorMessage },
  ];

  useEffect(() => {
    refresh();
  }, []);

  return (
    <main>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Test Case Errors</h1>
      </div>

      <DataTable
        data={errorTests}
        columns={columns}
        loading={loading}
        actions={renderActions}
      />

      <JsonModal
        open={jsonModalOpen}
        content={jsonModalContent}
        onClose={closeJsonModal}
      />
    </main>
  );
}
