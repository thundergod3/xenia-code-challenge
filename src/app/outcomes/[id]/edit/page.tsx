"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OutcomeForm from "@/src/components/forms/OutcomeForm";
import useOutcomes from "@/src/hooks/useOutcomes";

export default function EditOutcomePage({ params }: any) {
  const { id } = params;
  const router = useRouter();
  const [initial, setInitial] = useState<any>(null);

  const { get, update } = useOutcomes();

  const handleGetDetail = async (id: string) => {
    const res = await get(id);
    setInitial(res.data || null);
  };

  const handleSubmit = async (values: any) => {
    let paramsObj = {};
    try {
      paramsObj = values.params ? JSON.parse(values.params) : {};
    } catch (e) {
      alert("Params must be valid JSON");
      return;
    }
    await update(id, { type: values.type, params: paramsObj });
    router.push("/outcomes");
  };

  useEffect(() => {
    if (id) {
      handleGetDetail(id);
    }
  }, [id]);

  if (!initial) return <div>Loading...</div>;

  return (
    <main>
      <h1 className="text-xl font-semibold">Edit Outcome</h1>
      <div className="mt-4">
        <OutcomeForm onSubmit={handleSubmit} initialValues={initial} />
      </div>
    </main>
  );
}
