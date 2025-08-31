"use client";
import React from "react";

export default function Field({
  label,
  children,
  inline,
}: {
  label?: string;
  children: React.ReactNode;
  inline?: boolean;
}) {
  if (inline) {
    return (
      <div className="mb-4 grid grid-cols-2 gap-4 items-center">
        {label && <div className="text-sm font-medium">{label}</div>}
        <div>{children}</div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      {label && <div className="text-sm font-medium mb-1">{label}</div>}
      <div>{children}</div>
    </div>
  );
}
