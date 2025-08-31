"use client";
import React, { ChangeEvent, useEffect, useMemo, useState } from "react";
import Button from "@/src/components/ui/atoms/Button";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/src/lib/routes";
import { createTestCase } from "@/src/services/testCasesService";
import TestCaseForm from "@/src/components/forms/TestCaseForm";

export default function NewTestCasePage() {
  const router = useRouter();

  const handleSave = async (vals: any) => {
    try {
      await createTestCase({
        rule_id: vals.rule_id,
        name: vals.name || "New Test",
        input_facts: vals.input_facts || {},
        expected_output: vals.expected_output || null,
      });
      toast.success("Saved");
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
