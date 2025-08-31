"use client";
import { useState } from "react";
import {
  listRules as fetchRules,
  deleteRule as deleteRuleService,
  getRule as getRuleService,
  createRule as createRuleService,
  updateRule as updateRuleService,
} from "@/src/services/rulesService";

export default function useRules() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchRules();
      setRules(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    await deleteRuleService(id);
    await load();
  };

  const get = async (id: string) => {
    const res = await getRuleService(id);
    return res;
  };

  const create = async (payload: any) => {
    const res = await createRuleService(payload);
    return res;
  };

  const update = async (id: string, payload: any) => {
    const res = await updateRuleService(id, payload);
    await load();
    return res;
  };

  return { rules, loading, refresh: load, remove, get, create, update };
}
