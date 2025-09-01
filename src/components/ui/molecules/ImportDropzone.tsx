"use client";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Button from "@/src/components/ui/atoms/Button";
import { FactImportSchema } from "@/src/lib/validations";
import { toast } from "react-toastify";
import useImport from "@/src/hooks/useImport";
import AmbiguityResolver from "@/src/components/ui/molecules/AmbiguityResolver";
import RuleMappingResolver from "@/src/components/ui/molecules/RuleMappingResolver";
import OutcomeMappingResolver from "@/src/components/ui/molecules/OutcomeMappingResolver";

export default function ImportDropzone({
  module,
  schema = FactImportSchema,
  onImport,
}: {
  module: string;
  schema?: any;
  onImport?: () => void;
}) {
  const [preview, setPreview] = useState<any[] | null>(null);
  const [validationErrors, setValidationErrors] = useState<any[] | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<any | null>(null);
  const [resolutions, setResolutions] = useState<
    Record<string, any> | undefined
  >(undefined);
  const [mappingResolutions, setMappingResolutions] = useState<
    Record<string, any> | undefined
  >(undefined);
  const { loading, runImport } = useImport(module);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles || !acceptedFiles.length) return;
      const f = acceptedFiles[0];

      try {
        const text: any = await f.text();
        const m = text.replaceAll("\n", "").replaceAll(/,\s*([\]}])/g, "$1");
        let parsed = JSON.parse(m);

        if (!Array.isArray(parsed)) {
          toast.error(
            `Expected an array of ${module} (export format) but got an object`
          );
          return;
        }

        const validItems: any[] = [];
        const errs: any[] = [];
        parsed.forEach((it: any, idx: number) => {
          const res =
            schema && schema.safeParse
              ? schema.safeParse(it)
              : { success: true, data: it };
          if (res.success) validItems.push(res.data);
          else errs.push({ idx, issues: res.error.errors });
        });

        setPreview(validItems);
        setValidationErrors(errs.length ? errs : null);
        setIsValid(errs.length === 0 && validItems.length > 0);
      } catch (e: any) {
        console.log("Error", e);
        toast.error("Failed to parse JSON file");
      }
    },
    [module, schema]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/json": [".json"] },
    multiple: false,
  });

  const handleImport = async (dryRun = false) => {
    if (!preview) return toast.error("No data to import");
    try {
      // If the user requested an actual apply, always run a dry-run first
      if (!dryRun) {
        const dryPayload = await runImport(preview || [], true, undefined);
        setDryRunResult(dryPayload);
        // if dry-run reports ambiguous or unresolved items, surface and stop
        const hasAmbiguous =
          dryPayload?.ambiguous_outcomes &&
          Object.keys(dryPayload.ambiguous_outcomes || {}).length > 0;
        const hasUnresolvedRules =
          dryPayload?.unresolved_rules &&
          dryPayload.unresolved_rules.length > 0;
        const hasUnresolvedOutcomes =
          dryPayload?.unresolved_outcomes &&
          dryPayload.unresolved_outcomes.length > 0;
        if (hasAmbiguous || hasUnresolvedRules || hasUnresolvedOutcomes) {
          toast.info(
            "Dry-run detected ambiguous/unresolved items — please resolve before applying"
          );
          return;
        }

        // no issues in dry-run; proceed to apply
        const combinedResolutions = {
          ...(resolutions || {}),
          ...(mappingResolutions || {}),
        };
        const payload = await runImport(
          preview || [],
          false,
          combinedResolutions
        );
        toast.success(
          `Imported: ${payload.created || 0} created, ${
            payload.updated || 0
          } updated`
        );
        setPreview(null);
        setDryRunResult(null);
        if (onImport) onImport();
        return;
      }

      // dryRun === true
      const payload = await runImport(preview || [], true, undefined);
      setDryRunResult(payload);
      toast.success(
        `Dry-run: ${payload.create || payload.willCreate || 0} create, ${
          payload.update || payload.willUpdate || 0
        } update`
      );
    } catch (e: any) {
      toast.error(e?.message || "Import failed");
    }
  };

  const humanizeKey = (k: string) =>
    k
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const hasIssues = (result: any) => {
    if (!result) return false;
    const amb =
      result?.ambiguous_outcomes &&
      Object.keys(result.ambiguous_outcomes || {}).length > 0;
    const ur = result?.unresolved_rules && result.unresolved_rules.length > 0;
    const uo =
      result?.unresolved_outcomes && result.unresolved_outcomes.length > 0;
    return amb || ur || uo;
  };

  const allResolved = (result: any) => {
    if (!result) return true;
    // ambiguous_outcomes: check resolutions for each type
    const ambiguous = result.ambiguous_outcomes || {};
    for (const type of Object.keys(ambiguous)) {
      const r = resolutions?.[type];
      if (!r) return false;
      const action = typeof r === "string" ? r : r.action;
      if (!["update", "create", "skip", "map"].includes(action)) return false;
    }
    // unresolved_rules: mappingResolutions should have entry per rule
    const unresolvedRules = result.unresolved_rules || [];
    for (const u of unresolvedRules) {
      const r = mappingResolutions?.[u.rule];
      if (!r) return false;
      const action = typeof r === "string" ? r : r.action;
      if (!["map", "create_placeholder", "skip"].includes(action)) return false;
    }
    // unresolved_outcomes: resolutions should include mapping for each type
    const unresolvedOutcomes = result.unresolved_outcomes || [];
    for (const u of unresolvedOutcomes) {
      const r = resolutions?.[u.type];
      if (!r) return false;
      const action = typeof r === "string" ? r : r.action;
      if (!["map", "create", "skip", "update"].includes(action)) return false;
    }
    return true;
  };

  const issueCounts = (result: any) => {
    if (!result)
      return { ambiguous: 0, unresolvedRules: 0, unresolvedOutcomes: 0 };
    return {
      ambiguous: result?.ambiguous_outcomes
        ? Object.keys(result.ambiguous_outcomes || {}).length
        : 0,
      unresolvedRules: result?.unresolved_rules
        ? result.unresolved_rules.length
        : 0,
      unresolvedOutcomes: result?.unresolved_outcomes
        ? result.unresolved_outcomes.length
        : 0,
    };
  };

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`border-dashed border-2 p-6 text-center ${
          isDragActive ? "border-blue-400" : "border-gray-300"
        }`}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the file here ...</p>
        ) : (
          <p>Drag & drop a facts .json file here, or click to select</p>
        )}
      </div>

      {preview && (
        <div>
          <pre className="max-h-48 overflow-auto bg-gray-50 p-3 rounded text-sm">
            {JSON.stringify(preview, null, 2)}
          </pre>

          {validationErrors ? (
            <div className="text-sm text-red-700">
              <div className="font-medium">Validation errors found:</div>
              <ul className="list-disc ml-5">
                {validationErrors.map((e: any, i: number) => (
                  <li key={i}>
                    Item {e.idx}: {JSON.stringify(e.issues)}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-sm text-green-700">
              No validation errors detected.
            </div>
          )}
          <div className="mt-2 flex gap-2">
            <Button onClick={() => handleImport(true)} className="bg-gray-200">
              Dry run
            </Button>
            <Button
              onClick={() => handleImport(false)}
              className="bg-blue-600 text-white"
              disabled={
                !isValid ||
                loading ||
                (dryRunResult &&
                  hasIssues(dryRunResult) &&
                  !allResolved(dryRunResult))
              }
              loading={loading}>
              Import
            </Button>
          </div>

          {dryRunResult && hasIssues(dryRunResult) && (
            <div className="mt-3 p-3 rounded bg-yellow-50 text-sm text-gray-800">
              <div className="font-medium">Resolve import issues</div>
              <div className="mt-1 text-xs text-gray-600">
                The dry-run detected {issueCounts(dryRunResult).ambiguous}{" "}
                ambiguous outcome type(s) and{" "}
                {issueCounts(dryRunResult).unresolvedRules} unresolved rule(s){" "}
                {issueCounts(dryRunResult).unresolvedOutcomes > 0 && (
                  <>
                    and {issueCounts(dryRunResult).unresolvedOutcomes}{" "}
                    unresolved outcome type(s)
                  </>
                )}
                .
              </div>
              <div className="mt-2 text-xs text-gray-700">
                Please use the resolvers below to choose how to handle ambiguous
                or unresolved items before applying the import.
              </div>
            </div>
          )}

          {dryRunResult && (
            <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
              <div className="font-medium">Dry-run summary</div>
              <div className="space-y-1">
                {Object.keys(dryRunResult || {}).length === 0 && (
                  <div>No changes detected</div>
                )}

                {dryRunResult?.ambiguous_outcomes && (
                  <div className="mt-2 text-xs text-red-700">
                    <AmbiguityResolver
                      ambiguous={dryRunResult.ambiguous_outcomes}
                      initialResolutions={resolutions}
                      onChange={setResolutions}
                    />
                  </div>
                )}

                {dryRunResult?.unresolved_rules && (
                  <div className="mt-2 text-xs text-red-700">
                    <RuleMappingResolver
                      unresolved={dryRunResult.unresolved_rules}
                      initialResolutions={mappingResolutions}
                      onChange={setMappingResolutions}
                    />
                  </div>
                )}

                {dryRunResult?.unresolved_outcomes && (
                  <div className="mt-2 text-xs text-red-700">
                    <OutcomeMappingResolver
                      unresolved={dryRunResult.unresolved_outcomes}
                      initialResolutions={resolutions}
                      onChange={setResolutions}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
