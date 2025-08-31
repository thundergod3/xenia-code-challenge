"use client";
import { useEffect, useState } from "react";
import {
  listFacts as fetchFacts,
  deleteFact as deleteFactService,
  createFact as createFactService,
  getFact as getFactService,
  updateFact as updateFactService,
} from "@/src/services/factsService";

export default function useFacts() {
  const [facts, setFacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchFacts();
      setFacts(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    await deleteFactService(id);
    setFacts((prev) => prev.filter((f) => f.id !== id));
  };

  const create = async (payload: any) => {
    const res = await createFactService(payload);
    // Refresh list or append
    await load();
    return res;
  };

  const get = async (id: string) => {
    const res = await getFactService(id);
    return res;
  };

  const update = async (id: string, payload: any) => {
    const res = await updateFactService(id, payload);
    await load();
    return res;
  };

  return { facts, loading, refresh: load, remove, create, get, update };
}
