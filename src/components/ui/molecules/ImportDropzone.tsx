"use client";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Button from "@/src/components/ui/atoms/Button";
import { FactImportSchema } from "@/src/lib/validations";
import { toast } from "react-toastify";
import useImport from "@/src/hooks/useImport";
import AmbiguityResolver from "@/src/components/ui/molecules/AmbiguityResolver";
import RuleMappingResolver from "@/src/components/ui/molecules/RuleMappingResolver";

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
    Record<string, string> | undefined
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
      // prepare resolutions to send when applying (not for dryRun)
      const combinedResolutions = dryRun
        ? undefined
        : { ...(resolutions || {}), ...(mappingResolutions || {}) };
      const payload = await runImport(
        preview || [],
        dryRun,
        combinedResolutions
      );
      if (dryRun) {
        setDryRunResult(payload);
        toast.success(
          `Dry-run: ${payload.create || payload.willCreate || 0} create, ${
            payload.update || payload.willUpdate || 0
          } update`
        );
      } else {
        toast.success(
          `Imported: ${payload.created || 0} created, ${
            payload.updated || 0
          } updated`
        );
        setPreview(null);
        setDryRunResult(null);
        if (onImport) onImport();
      }
    } catch (e: any) {
      toast.error(e?.message || "Import failed");
    }
  };

  const humanizeKey = (k: string) =>
    k
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

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
              disabled={!isValid}
              loading={loading}>
              Import
            </Button>
          </div>

          {dryRunResult && (
            <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
              <div className="font-medium">Dry-run summary</div>
              <div className="space-y-1">
                {Object.keys(dryRunResult || {}).length === 0 && (
                  <div>No changes detected</div>
                )}

                {Object.entries(dryRunResult || {})
                  .filter(
                    ([k]) =>
                      k !== "ambiguous_outcomes" && k !== "unresolved_rules"
                  )
                  .map(([k, v]) => (
                    <div key={k}>
                      {humanizeKey(k)}: {String(v)}
                    </div>
                  ))}

                {dryRunResult?.ambiguous_outcomes && (
                  <div className="mt-2 text-xs text-red-700">
                    <div className="font-medium">
                      Ambiguous outcomes detected:
                    </div>
                    <AmbiguityResolver
                      ambiguous={dryRunResult.ambiguous_outcomes}
                      initialResolutions={resolutions}
                      onChange={setResolutions}
                    />
                  </div>
                )}

                {dryRunResult?.unresolved_rules && (
                  <div className="mt-2">
                    <RuleMappingResolver
                      unresolved={dryRunResult.unresolved_rules}
                      initialResolutions={mappingResolutions}
                      onChange={setMappingResolutions}
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
