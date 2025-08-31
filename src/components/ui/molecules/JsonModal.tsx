"use client";
import React from "react";
import Button from "@/src/components/ui/atoms/Button";

export default function JsonModal({
  open,
  content,
  onClose,
}: {
  open: boolean;
  content: any;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6">
        <h3 className="text-lg font-semibold">Raw JSON</h3>
        <pre className="mt-4 max-h-80 overflow-auto text-sm bg-gray-50 p-3 rounded">
          {JSON.stringify(content, null, 2)}
        </pre>
        <div className="mt-4 flex justify-end">
          <Button onClick={onClose} className="px-3 py-2">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
