"use client";
import { useEffect, useState } from "react";
import {
  listTestCases as fetchTestCases,
  runTestCase as runTestService,
  deleteTestCase as deleteTestService,
} from "@/src/services/testCasesService";

export default function useTestCases() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchTestCases();
      setTests(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  const run = async (id: string) => {
    return runTestService(id);
  };

  const remove = async (id: string) => {
    await deleteTestService(id);
    await load();
  };

  const get = async (id: string) => {
    const { getTestCase } = await import("@/src/services/testCasesService");
    return getTestCase(id);
  };

  const update = async (id: string, payload: any) => {
    const { updateTestCase } = await import("@/src/services/testCasesService");
    const res = await updateTestCase(id, payload);
    await load();
    return res;
  };

  return { tests, loading, refresh: load, run, remove, get, update };
}
