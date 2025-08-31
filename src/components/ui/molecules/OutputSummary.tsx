"use client";
import React, { useState } from "react";
import Button from "@/src/components/ui/atoms/Button";

export default function OutputSummary({
  out,
  onDetails,
}: {
  out: any;
  onDetails?: (obj: any) => void;
}) {
  const [showDynErrors, setShowDynErrors] = useState<boolean>(false);
  const isErrorPayload =
    out &&
    (out.error || out.code || out.message) &&
    !out.events &&
    !out.results;
  // Normalize event-like object from several possible shapes, including { out: { type, params } }
  const ev =
    out?.events?.[0] ||
    out?.results?.[0] ||
    out?.failureEvents?.[0] ||
    out?.almanac?.events?.failure?.[0] ||
    out?.out ||
    out ||
    null;

  const params = ev?.params ?? ev?.event?.params ?? null;
  const errorPayload =
    out && (out.error || out.code || out.message) && !out.events && !out.results
      ? out
      : null;

  const header = () => {
    const type = ev?.type ?? ev?.event?.type ?? null;
    if (params && params.message) return params.message;
    if (params && params.limit)
      return `${
        type === "approved" ? "Approved" : type
      }: ${new Intl.NumberFormat().format(params.limit)} limit`;
    if (type) return type;
    if (out?.message) return out.message;
    return JSON.stringify(out);
  };

  const getDynamicErrorEntries = (outObj: any) => {
    const rf = outObj?.resolved_facts || outObj?.resolvedFacts || {};
    return Object.entries(rf).filter(([, v]: any) => v && v.__dynamic_error);
  };

  const renderDynamicErrorList = (outObj: any) => {
    const dynErrEntries = getDynamicErrorEntries(outObj);
    if (!dynErrEntries.length) return null;
    return (
      <div className="mt-2 border-l-4 border-yellow-200 pl-3">
        <div className="text-sm font-semibold text-yellow-800">
          Dynamic Resolution Errors
        </div>
        <ul className="mt-2 list-disc ml-5 text-xs text-gray-700">
          {dynErrEntries.map(([name, v]: any) => (
            <li key={name} className="mb-1">
              <div className="font-medium">{name}</div>
              <div className="text-xs">
                {String(v.message || JSON.stringify(v))}
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const handleToggleDynErrors = () => setShowDynErrors((s) => !s);

  const renderDynamicErrorBadge = (outObj: any) => {
    const dynErrEntries = getDynamicErrorEntries(outObj);
    if (!dynErrEntries.length) return null;
    return (
      <div className="flex items-center gap-2">
        <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
          Dynamic error ({dynErrEntries.length})
        </span>
        <Button onClick={handleToggleDynErrors} className="px-2 py-1 text-xs">
          {showDynErrors ? "Hide" : "Show"}
        </Button>
      </div>
    );
  };

  if (isErrorPayload) {
    const rawMsg = out?.message || out?.error || JSON.stringify(out);
    const msgStr = typeof rawMsg === "string" ? rawMsg : JSON.stringify(rawMsg);
    const truncated =
      msgStr.length > 140 ? msgStr.substring(0, 137) + "..." : msgStr;
    return (
      <div className="text-sm text-red-800">
        <div className="flex flex-col items-start gap-1">
          <div className="font-semibold">
            Error: {out.code || "ENGINE_ERROR"}
          </div>
          <div className="text-xs text-red-700 max-w-xs break-words">
            {truncated}
          </div>
        </div>
        {onDetails && (
          <div className="mt-2">
            <Button
              onClick={() => onDetails(out)}
              className="px-2 py-1 text-xs">
              Details
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="text-sm text-gray-800 font-medium">{header()}</div>
        {/* show dynamic resolution errors if present */}
        {renderDynamicErrorBadge(out)}
      </div>
      {params && (
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(params).map(([k, v]) => (
            <span
              key={k}
              className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
              <strong className="mr-1">{k}:</strong> {String(v)}
            </span>
          ))}
        </div>
      )}
      {onDetails && (
        <div className="mt-2">
          <Button onClick={() => onDetails(out)} className="px-2 py-1 text-xs">
            Details
          </Button>
        </div>
      )}
      {showDynErrors && renderDynamicErrorList(out)}
    </div>
  );
}
