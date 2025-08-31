"use client";
import React from "react";
import Button from "@/src/components/ui/atoms/Button";
import ImportDropzone from "@/src/components/ui/molecules/ImportDropzone";

export default function ImportButtonModal({
  module = "facts",
  schema,
  label,
  onImported,
}: {
  module?: string;
  schema?: any;
  label?: string;
  onImported?: () => void;
}) {
  const [open, setOpen] = React.useState(false);

  const openModal = () => setOpen(true);
  const closeModal = () => setOpen(false);

  const handleImported = () => {
    if (onImported) onImported();
    closeModal();
  };

  return (
    <>
      <Button onClick={openModal} className="px-3 py-2 bg-gray-100">
        {label || `Import ${module.charAt(0).toUpperCase() + module.slice(1)}`}
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6">
            <h3 className="text-lg font-medium">
              {label || `Import ${module}`}
            </h3>
            <div className="mt-3">
              <ImportDropzone
                module={module}
                schema={schema}
                onImport={handleImported}
              />
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={closeModal} className="px-3 py-2">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
