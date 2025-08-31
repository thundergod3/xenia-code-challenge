"use client";
import React, { ChangeEvent, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/src/lib/routes";
import TestCaseForm from "@/src/components/forms/TestCaseForm";
import useTestCases from "@/src/hooks/useTestCases";

export default function NewTestCasePage() {
  const router = useRouter();
  const { create } = useTestCases();

  const handleSave = async (vals: any) => {
    try {
      await create({
        rule_id: vals.rule_id,
        name: vals.name || "New Test",
        input_facts: vals.input_facts || {},
        expected_output: vals.expected_output || null,
      });
      router.push(ROUTES.TEST_CASES);
    } catch (e) {
      console.error(e);
      toast.error("Failed to save test case");
    }
  };

  return (
    <main>
      <h1 className="text-xl font-semibold">Create Test Case</h1>
      <TestCaseForm onSave={handleSave} />
    </main>
  );
}
