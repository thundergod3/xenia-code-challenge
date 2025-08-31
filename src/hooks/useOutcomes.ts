"use client";
import { useEffect, useState } from "react";
import {
  listOutcomes as fetchOutcomes,
  createOutcome as createOutcomeService,
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
    await load();
    return res;
  };

  const get = async (id: string) => {
    const { getOutcome } = await import("@/src/services/outcomesService");
    return getOutcome(id);
  };

  const update = async (id: string, payload: any) => {
    const { updateOutcome } = await import("@/src/services/outcomesService");
    const res = await updateOutcome(id, payload);
    await load();
    return res;
  };

  const remove = async (id: string) => {
    // lazy import to avoid circular deps in some setups
    const { deleteOutcome } = await import("@/src/services/outcomesService");
    const res = await deleteOutcome(id);
    await load();
    return res;
  };

  return { outcomes, loading, refresh: load, create, remove, get, update };
}
