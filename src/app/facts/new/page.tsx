"use client";
import React from "react";
import FactForm from "@/src/components/forms/FactForm";
import useFacts from "@/src/hooks/useFacts";

export default function NewFactPage() {
  const { create } = useFacts();

  const handleSubmit = async (values: any) => {
    await create(values);
  };

  return (
    <main>
      <h1 className="text-xl font-semibold">Create Fact</h1>
      <div className="mt-4">
        <FactForm onSubmit={handleSubmit} />
      </div>
    </main>
  );
}
