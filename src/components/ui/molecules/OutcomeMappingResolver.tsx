"use client";
import React, { useMemo, useState } from "react";
import Select from "@/src/components/ui/atoms/Select";
import Button from "@/src/components/ui/atoms/Button";
import useOutcomes from "@/src/hooks/useOutcomes";

export default function OutcomeMappingResolver({
  unresolved,
  initialResolutions,
  onChange,
}: {
  unresolved: Array<{ type: string; test_case?: string }>;
  initialResolutions?: Record<string, any>;
  onChange?: (res: Record<string, any>) => void;
}) {
  const { outcomes } = useOutcomes();
  const outcomeOptions = useMemo(
    () => (outcomes || []).map((o: any) => ({ value: o.id, label: o.type })),
    [outcomes]
  );

  const [resolutions, setResolutions] = useState<Record<string, any>>(
    initialResolutions || {}
  );

  const setFor = (type: string, value: string) => {
    const next = { ...resolutions };
    if (value === "skip") next[type] = { action: "skip" };
    else if (value === "create_new") next[type] = { action: "create" };
    else next[type] = { action: "map", outcome_id: value };
    setResolutions(next);
    if (onChange) onChange(next);
  };

  const applyToAll = (value: string) => {
    const next: Record<string, any> = {};
    unresolved.forEach((u) => {
      if (value === "skip") next[u.type] = { action: "skip" };
      else if (value === "create_new") next[u.type] = { action: "create" };
    });
    setResolutions(next);
    if (onChange) onChange(next);
  };

  if (!unresolved || !unresolved.length) return null;

  return (
    <div className="mt-3 p-3 bg-yellow-50 rounded text-sm">
      <div className="font-medium">Unresolved outcomes</div>
      <div className="mt-2 text-xs text-gray-600">
        Map each unresolved outcome type to an existing outcome, create new, or
        skip.
      </div>
      <div className="mt-2 flex gap-2 mb-2">
        <Button onClick={() => applyToAll("create_new")} className="px-2 py-1">
          Set all: Create new
        </Button>
        <Button onClick={() => applyToAll("skip")} className="px-2 py-1">
          Set all: Skip
        </Button>
      </div>
      <div className="grid gap-2">
        {unresolved.map((u, i) => (
          <div
            key={i}
            className="p-2 border rounded bg-white flex items-center justify-between">
            <div>
              <div className="font-semibold">{u.type}</div>
              <div className="text-xs text-gray-600">
                Test case: {u.test_case || "-"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={
                  resolutions[u.type]?.outcome_id ||
                  (resolutions[u.type]?.action === "skip"
                    ? "skip"
                    : resolutions[u.type]?.action === "create"
                    ? "create_new"
                    : "")
                }
                onChange={(e: any) => setFor(u.type, e.target.value)}
                options={[
                  ...outcomeOptions,
                  { value: "create_new", label: "Create new" },
                  { value: "skip", label: "Skip" },
                ]}
                placeholder="Select"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
