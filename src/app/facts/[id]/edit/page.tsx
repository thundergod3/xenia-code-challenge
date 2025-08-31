"use client";
import React, { useCallback, useEffect, useState } from "react";
import FactForm from "@/src/components/forms/FactForm";
import useFacts from "@/src/hooks/useFacts";

export default function EditFactPage({ params }: { params: { id: string } }) {
  const { get, update } = useFacts();
  const [fact, setFact] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleGetDetail = async () => {
    setLoading(true);

    const res = await get(params.id);
    setFact(res.data || null);
    setLoading(false);
  };

  const handleSubmit = async (values: any) => {
    if (values.options && typeof values.options === "string") {
      values.options = values.options.split(",").map((s: string) => s.trim());
    }
    await update(params.id, values);
  };

  useEffect(() => {
    if (params.id) {
      handleGetDetail();
    }
  }, [params.id]);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <main>
      <h1 className="text-xl font-semibold">Edit Fact</h1>
      <div className="mt-4">
        <FactForm onSubmit={handleSubmit} defaultValues={fact} />
      </div>
    </main>
  );
}
