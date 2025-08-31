"use client";
import { useState } from "react";
import {
  listOutcomes as fetchOutcomes,
  createOutcome as createOutcomeService,
  getOutcome as getOutcomeService,
  updateOutcome as updateOutcomeService,
  deleteOutcome as deleteOutcomeService,
} from "@/src/services/outcomesService";

export default function useOutcomes() {
  const [outcomes, setOutcomes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchOutcomes();
      setOutcomes(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  const create = async (payload: any) => {
    const res = await createOutcomeService(payload);
    return res;
  };

  const get = async (id: string) => {
    return getOutcomeService(id);
  };

  const update = async (id: string, payload: any) => {
    const res = await updateOutcomeService(id, payload);
    return res;
  };

  const remove = async (id: string) => {
    const res = await deleteOutcomeService(id);
    await load();
    return res;
  };

  return { outcomes, loading, refresh: load, create, remove, get, update };
}
