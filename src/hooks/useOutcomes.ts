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

  return { outcomes, loading, refresh: load, create };
}
