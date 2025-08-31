"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TestCaseForm from "@/src/components/forms/TestCaseForm";
import useTestCases from "@/src/hooks/useTestCases";
import { toast } from "react-toastify";
import { ROUTES } from "@/src/lib/routes";

export default function EditTestCasePage({ params }: any) {
  const { id } = params;
  const router = useRouter();
  const { get, update } = useTestCases();
  const [initial, setInitial] = useState<any>(null);

  const handleGetDetail = async (testCaseId: string) => {
    try {
      const res = await get(testCaseId);
      setInitial(res.data || null);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load test case");
    }
  };

  const handleSave = async (vals: any) => {
    try {
      await update(id, vals);
      router.push(ROUTES.TEST_CASES);
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
      throw e;
    }
  };

  useEffect(() => {
    if (id) handleGetDetail(id);
  }, [id]);

  if (!initial) return <div>Loading...</div>;

  return (
    <main>
      <h1 className="text-xl font-semibold">Edit Test Case</h1>
      <div className="mt-4">
        <TestCaseForm initialValues={initial} onSave={handleSave} />
      </div>
    </main>
  );
}
