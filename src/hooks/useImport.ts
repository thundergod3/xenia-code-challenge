"use client";
import { useState } from "react";
import { importModule } from "@/src/services/importService";

export default function useImport(moduleName: string) {
  const [loading, setLoading] = useState(false);

  const runImport = async (
    items: any[],
    dryRun = false,
    resolutions?: Record<string, any>
  ) => {
    setLoading(true);
    try {
      const res = await importModule(moduleName, items, dryRun, resolutions);
      return res;
    } finally {
      setLoading(false);
    }
  };

  return { loading, runImport };
}
