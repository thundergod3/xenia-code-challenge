"use client";
import React, { useMemo, useState } from "react";
import Button from "@/src/components/ui/atoms/Button";
import JsonModal from "@/src/components/ui/molecules/JsonModal";
import Select from "../atoms/Select";

export default function AmbiguityResolver({
  ambiguous,
  initialResolutions,
  onChange,
}: {
  ambiguous: Record<
    string,
    {
      existingParams: any;
      importedParams: any;
      affectedRules?: string[];
      affectedTestCases?: string[];
    }
  >;
  initialResolutions?: Record<string, string>;
  onChange?: (resolutions: Record<string, string>) => void;
}) {
  const types = useMemo(() => Object.keys(ambiguous || {}), [ambiguous]);
  const [resolutions, setResolutions] = useState<Record<string, string>>(
    initialResolutions ||
      types.reduce((acc: any, t) => {
        acc[t] = "update";
        return acc;
      }, {})
  );
  const [viewJson, setViewJson] = useState<any>(null);

  const setFor = (type: string, action: string) => {
    const next = { ...resolutions, [type]: action };
    setResolutions(next);
    if (onChange) onChange(next);
  };

  const applyToAll = (action: string) => {
    const next = types.reduce(
      (acc: any, t) => ((acc[t] = action), acc),
      {} as any
    );
    setResolutions(next);
    if (onChange) onChange(next);
  };

  if (!types.length) return null;

  console.log({
    ambiguous,
    types,
  });

  return (
    <div className="mt-3 p-3 bg-yellow-50 rounded text-sm">
      <div className="font-medium">Ambiguous outcomes detected</div>
      <div className="mt-2 mb-2 text-xs text-gray-600">
        Choose how to resolve each ambiguous outcome type.
      </div>
      <div className="flex gap-2 mb-2">
        <Button onClick={() => applyToAll("update")} className="px-2 py-1">
          Set all: Update
        </Button>
        <Button onClick={() => applyToAll("create")} className="px-2 py-1">
          Set all: Create new
        </Button>
        <Button onClick={() => applyToAll("skip")} className="px-2 py-1">
          Set all: Skip
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {types.map((t) => (
          <div key={t} className="p-2 border rounded bg-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-semibold">{t}</div>
                {ambiguous?.[t]?.affectedRules &&
                  ambiguous?.[t]?.affectedRules?.length > 0 && (
                    <div className="text-xs text-gray-600">
                      Affected rules:{" "}
                      {(ambiguous[t]?.affectedRules || []).join(", ")}
                    </div>
                  )}
                {ambiguous?.[t]?.affectedTestCases &&
                  ambiguous?.[t]?.affectedTestCases?.length > 0 && (
                    <div className="text-xs text-gray-600">
                      Affected test cases:{" "}
                      {(ambiguous[t]?.affectedTestCases || []).join(", ")}
                    </div>
                  )}
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={resolutions[t]}
                  onChange={(e: any) => setFor(t, e.target.value)}
                  options={[
                    { value: "update", label: "Update existing" },
                    { value: "create", label: "Create new" },
                    { value: "skip", label: "Skip" },
                  ]}
                />
                <Button
                  onClick={() =>
                    setViewJson({
                      type: t,
                      existing: ambiguous[t].existingParams,
                      imported: ambiguous[t].importedParams,
                    })
                  }
                  className="px-2 py-1">
                  View JSON
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <JsonModal
        open={!!viewJson}
        content={viewJson || {}}
        onClose={() => setViewJson(null)}
      />
    </div>
  );
}
