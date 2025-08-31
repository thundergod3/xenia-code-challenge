"use client";
import React, { useMemo, useState } from "react";
import Select from "@/src/components/ui/atoms/Select";
import Button from "@/src/components/ui/atoms/Button";
import useRules from "@/src/hooks/useRules";

export default function RuleMappingResolver({
  unresolved,
  initialResolutions,
  onChange,
}: {
  unresolved: Array<{ rule: string; test_case?: string }>;
  initialResolutions?: Record<string, any>;
  onChange?: (res: Record<string, any>) => void;
}) {
  const { rules } = useRules();
  const ruleOptions = useMemo(
    () => rules?.map?.((r: any) => ({ value: r.id, label: r.name })),
    [rules]
  );
  const [resolutions, setResolutions] = useState<Record<string, any>>(
    initialResolutions || {}
  );

  const setFor = (ruleName: string, value: string) => {
    const next = { ...resolutions };
    if (value === "skip") next[ruleName] = { action: "skip" };
    else if (value === "create_placeholder")
      next[ruleName] = { action: "create_placeholder" };
    else next[ruleName] = { action: "map", rule_id: value };
    setResolutions(next);
    if (onChange) onChange(next);
  };

  const applyToAll = (value: string) => {
    const next: Record<string, any> = {};
    unresolved.forEach((u) => {
      if (value === "skip") next[u.rule] = { action: "skip" };
      else if (value === "create_placeholder")
        next[u.rule] = { action: "create_placeholder" };
      else if (value === "map") {
        // can't map to single id for all; leave blank
      }
    });
    setResolutions(next);
    if (onChange) onChange(next);
  };

  if (!unresolved || !unresolved.length) return null;

  return (
    <div className="mt-3 p-3 bg-yellow-50 rounded text-sm">
      <div className="font-medium">Unresolved rules</div>
      <div className="mt-2 text-xs text-gray-600">
        Map each unresolved rule to an existing rule, create a placeholder, or
        skip.
      </div>
      <div className="mt-2 flex gap-2 mb-2">
        <Button
          onClick={() => applyToAll("create_placeholder")}
          className="px-2 py-1">
          Set all: Create placeholder
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
              <div className="font-semibold">{u.rule}</div>
              <div className="text-xs text-gray-600">
                Test case: {u.test_case || "-"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={
                  resolutions[u.rule]?.rule_id ||
                  (resolutions[u.rule]?.action === "skip"
                    ? "skip"
                    : resolutions[u.rule]?.action === "create_placeholder"
                    ? "create_placeholder"
                    : "")
                }
                onChange={(e: any) => setFor(u.rule, e.target.value)}
                options={[
                  ...ruleOptions,
                  { value: "create_placeholder", label: "Create placeholder" },
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
