"use client";
import { useState } from "react";
import {
  listTestCases as fetchTestCases,
  runTestCase as runTestService,
  deleteTestCase as deleteTestService,
  getTestCase as getTestCaseService,
  updateTestCase as updateTestCaseService,
  createTestCase as createTestCaseService,
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
    return getTestCaseService(id);
  };

  const create = async (payload: any) => {
    const res = await createTestCaseService(payload);
    return res;
  };

  const update = async (id: string, payload: any) => {
    const res = await updateTestCaseService(id, payload);
    return res;
  };

  return { tests, loading, refresh: load, run, remove, get, create, update };
}
