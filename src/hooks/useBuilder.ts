"use client";
import { useState } from "react";
import { saveRule as saveRuleService } from "@/src/services/builderService";

export default function useBuilder() {
  const [saving, setSaving] = useState(false);

  const saveRule = async (payload: any) => {
    setSaving(true);
    try {
      const res = await saveRuleService(payload);
      
      return res;
    } finally {
      setSaving(false);
    }
  };

  return { saveRule, saving };
}
