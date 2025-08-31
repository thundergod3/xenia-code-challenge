"use client";
import React, { useEffect, useMemo, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useTestCases from "@/src/hooks/useTestCases";
import useRules from "@/src/hooks/useRules";
import useFacts from "@/src/hooks/useFacts";
import DataTable, { DataColumn } from "@/src/components/ui/molecules/DataTable";
import Button from "@/src/components/ui/atoms/Button";
import { toast } from "react-toastify";
import Select from "@/src/components/ui/atoms/Select";
import OutputSummary from "@/src/components/ui/molecules/OutputSummary";
import JsonModal from "@/src/components/ui/molecules/JsonModal";
import ConfirmModal from "@/src/components/ui/molecules/ConfirmModal";
import { getFriendlyText } from "@/src/lib/helpers";
import { deleteTestCase } from "@/src/services/testCasesService";
import { downloadTestCasesExport } from "@/src/services/testCasesExportService";
import ImportButtonModal from "@/src/components/ui/molecules/ImportButtonModal";
import { TestCaseImportSchema } from "@/src/lib/validations";
import { ROUTES } from "@/src/lib/routes";

export default function TestCasesPage() {
  const { tests, loading, refresh, run } = useTestCases();
  const { rules, refresh: loadRules } = useRules();
  const { facts, refresh: loadFacts } = useFacts();
  const [runningId, setRunningId] = useState<string | null>(null);
  const [selectedRuleForRunAll, setSelectedRuleForRunAll] = useState<
    string | ""
  >("");
  const [runningAll, setRunningAll] = useState(false);
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [jsonModalContent, setJsonModalContent] = useState<any>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const router = useRouter();

  const runTest = async (id: string) => {
    // if another test is running, ignore
    if (runningId || runningAll) return;
    setRunningId(id);
    try {
      const res = await run(id);
      if (res?.error) {
        // structured engine error
        const code = res.code || "ENGINE_ERROR";
        const message = res.message || "Engine execution failed";
        toast.error(`${code}: ${message}`);
      } else {
        const friendly = getFriendlyText(res.results);
        if (res?.passed) toast.success(friendly || `Passed`);
        else toast.error(friendly || `Failed`);
      }
    } catch (err: any) {
      // err is likely the thrown payload from service
      if (err && err.code) toast.error(`${err.code}: ${err.message}`);
      else toast.error("Test run failed");
    } finally {
      await refresh();

      setRunningId(null);
    }
  };

  const runAllTests = async () => {
    // If no rule selected, run all tests; otherwise run tests for selected rule
    const testsForRule = selectedRuleForRunAll
      ? tests.filter((t: any) => t.rule_id === selectedRuleForRunAll)
      : tests;
    if (!testsForRule.length) {
      toast.info("No test cases found to run");
      return;
    }

    setRunningAll(true);
    let passedCount = 0;
    let failedCount = 0;
    try {
      for (const t of testsForRule) {
        try {
          const res = await run(t.id);
          if (res?.error) {
            // count as failed and surface via toast for batch runs
            failedCount++;
            toast.error(
              `${res.code || "ENGINE_ERROR"}: ${res.message || "Failed"}`
            );
          } else if (res?.passed) passedCount++;
          else failedCount++;
        } catch (e: any) {
          failedCount++;
          if (e && e.code) toast.error(`${e.code}: ${e.message}`);
        }
      }
      await refresh();
      toast.success(
        `Run complete: ${passedCount} passed, ${failedCount} failed`
      );
    } catch (e) {
      console.error(e);
      toast.error("Failed running tests");
    } finally {
      setRunningAll(false);
    }
  };

  const runAllOptions = useMemo(() => {
    const mapped = (rules || []).map((r: any) => ({
      value: r.id,
      label: r.name,
    }));
    return mapped;
  }, [rules]);

  const handleSelectedRuleForRunAllChange = (
    e: ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedRuleForRunAll(e.target.value);
  };

  const columns: DataColumn[] = [
    { key: "name", title: "Name" },
    {
      key: "rule_id",
      title: "Rule",
      render: (row) => {
        const r = rules.find((x: any) => x.id === row.rule_id);
        return r ? r.name : row.rule_id;
      },
    },
    {
      key: "input_facts",
      title: "Input",
      render: (row) => formatInputFacts(row),
    },
    {
      key: "expected_output",
      title: "Expected",
      render: (row) => (
        <div className="text-sm text-gray-800 bg-gray-50 p-2 rounded max-h-32 overflow-auto">
          <OutputSummary out={row.expected_output} onDetails={openJsonModal} />
        </div>
      ),
    },
    {
      key: "actual_output",
      title: "Actual",
      render: (row) => (
        <div className="text-sm text-gray-800 bg-gray-50 p-2 rounded max-h-32 overflow-auto">
          <OutputSummary out={row.actual_output} onDetails={openJsonModal} />
        </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (row) => {
        const passed = row.actual_output
          ? JSON.stringify(row.actual_output?.events?.[0]) ===
            JSON.stringify(row.expected_output)
          : null;
        if (passed === true)
          return (
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
              Passed
            </span>
          );
        if (passed === false)
          return (
            <span className="px-2 py-1 bg-red-100 text-red-800 rounded">
              Failed
            </span>
          );
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
            Pending
          </span>
        );
      },
    },
  ];

  const openJsonModal = (obj: any) => {
    setJsonModalContent(obj);
    setJsonModalOpen(true);
  };

  const closeJsonModal = () => {
    setJsonModalOpen(false);
    setJsonModalContent(null);
  };

  const goToErrors = () => {
    router.push(ROUTES.TEST_CASE_ERRORS);
  };

  const renderInputFactItem = (name: string, value: any) => {
    const meta = facts?.find((f: any) => f.name === name);
    const label = meta?.description || name;
    const type = meta?.type || typeof value;
    let display: React.ReactNode = null;
    if (type === "boolean") {
      display = (
        <span
          className={
            "px-2 py-1 rounded " +
            (value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")
          }>
          {value ? "Yes" : "No"}
        </span>
      );
    } else if (type === "list") {
      if (Array.isArray(value)) {
        display = (
          <div className="flex flex-wrap gap-1">
            {value.map((v: any, i: number) => (
              <span
                key={i}
                className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                {String(v)}
              </span>
            ))}
          </div>
        );
      } else {
        display = <span className="text-sm">{String(value)}</span>;
      }
    } else {
      display = <span className="font-medium">{String(value)}</span>;
    }

    return (
      <div key={name} className="flex flex-col text-sm">
        <div className="text-xs text-gray-500">{label}</div>
        <div className="mt-1">{display}</div>
      </div>
    );
  };

  const formatInputFacts = (row: any) => {
    const inputs = row?.input_facts || {};
    const keys = Object.keys(inputs || {});
    if (!keys.length) return <div className="text-sm text-gray-600">-</div>;

    return (
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-1 gap-3">
          {keys.map((k) => renderInputFactItem(k, inputs[k]))}
        </div>
        <div>
          <Button
            onClick={() => openJsonModal(inputs)}
            className="px-2 py-1 text-xs">
            View JSON
          </Button>
        </div>
      </div>
    );
  };

  const handleDelete = async (id: string) => {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await deleteTestCase(pendingDeleteId);
      await refresh();
      toast.success("Deleted test case");
    } catch (e: any) {
      toast.error("Failed to delete test case");
    } finally {
      setConfirmOpen(false);
      setPendingDeleteId(null);
    }
  };

  const cancelDelete = () => {
    setConfirmOpen(false);
    setPendingDeleteId(null);
  };

  useEffect(() => {
    refresh();
    loadRules();
    loadFacts();
  }, []);

  return (
    <main>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Test Cases</h1>

          <Select
            className="border p-2 rounded"
            value={selectedRuleForRunAll}
            onChange={handleSelectedRuleForRunAllChange}
            options={runAllOptions}
            placeholder="All rules"
          />
          <Button
            onClick={runAllTests}
            loading={runningAll}
            disabled={runningAll}
            className="px-3 py-2 bg-indigo-600 text-white rounded">
            {runningAll ? "Running..." : "Run All Tests"}
          </Button>
          <Button
            onClick={goToErrors}
            className="px-3 py-2 bg-red-600 text-white rounded">
            Errors
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <ImportButtonModal
            module="test-cases"
            schema={TestCaseImportSchema}
            label="Import Test Cases"
            onImported={refresh}
          />
          <Button
            onClick={() => downloadTestCasesExport()}
            className="px-3 py-2 bg-gray-200">
            Export Test Cases
          </Button>
          <Link
            href="/test-cases/new"
            className="px-3 py-2 bg-blue-600 text-white rounded">
            New Test Case
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <DataTable
          data={tests}
          columns={columns}
          loading={loading}
          actions={(row) => (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => runTest(row.id)}
                loading={runningId === row.id}
                disabled={runningAll || (!!runningId && runningId !== row.id)}
                className="px-2 py-1 bg-blue-600 text-white rounded">
                Run
              </Button>
              <Button
                onClick={() => router.push(ROUTES.TEST_CASE_EDIT(row.id))}
                className="bg-gray-600 text-white">
                Edit
              </Button>
              <Button
                onClick={() => handleDelete(row.id)}
                className="bg-red-600 text-white">
                Delete
              </Button>
            </div>
          )}
        />
      </div>
      <JsonModal
        open={jsonModalOpen}
        content={jsonModalContent}
        onClose={closeJsonModal}
      />
      <ConfirmModal
        open={confirmOpen}
        title="Delete test case"
        description="Are you sure you want to delete this test case? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </main>
  );
}
