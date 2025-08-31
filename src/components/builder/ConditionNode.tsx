"use client";
import React from "react";

export default function ConditionNode({ data }: { data: any }) {
  const factName = data?.fact;
  let factDesc: string | null = null;
  const facts = data?.facts as any[] | undefined;
  if (facts && factName) {
    const f = facts.find((x: any) => x.name === factName);
    factDesc = f?.description || null;
  }

  return (
    <div className="bg-white border rounded p-2 shadow-sm w-40">
      <div className="text-sm font-medium">Condition</div>
      <div className="mt-1 text-xs text-gray-600">
        <div>{factDesc || factName || "fact"}</div>
        <div>{data.operator || "operator"}</div>
        <div>{String(data.value ?? "")}</div>
      </div>
    </div>
  );
}
