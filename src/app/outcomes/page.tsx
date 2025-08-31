"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import useOutcomes from "@/src/hooks/useOutcomes";
import DataTable, { DataColumn } from "@/src/components/ui/molecules/DataTable";

export default function OutcomesPage() {
  const { outcomes, loading, refresh } = useOutcomes();

  useEffect(() => {
    refresh();
  }, []);

  const columns: DataColumn[] = [
    { key: "type", title: "Type" },
    {
      key: "params",
      title: "Params",
      render: (row) => JSON.stringify(row.params),
    },
  ];

  return (
    <main>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Outcomes</h1>
        <Link
          href="/outcomes/new"
          className="px-3 py-2 bg-blue-600 text-white rounded">
          New Outcome
        </Link>
      </div>

      <div className="mt-6">
        <DataTable data={outcomes} columns={columns} loading={loading} />
      </div>
    </main>
  );
}
