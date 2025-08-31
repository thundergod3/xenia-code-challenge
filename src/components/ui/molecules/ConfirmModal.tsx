"use client";
import React from "react";

export default function ConfirmModal({
  open,
  title,
  description,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold">{title || "Confirm"}</h3>
        {description && (
          <p className="mt-2 text-sm text-gray-600">{description}</p>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onCancel} className="px-3 py-2 rounded border">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-2 rounded bg-red-600 text-white">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
