"use client";
import React, { useEffect, useState } from "react";
import RuleForm from "@/src/components/forms/RuleForm";
import useRules from "@/src/hooks/useRules";

export default function EditRulePage({ params }: { params: { id: string } }) {
  const { get, update } = useRules();
  const [rule, setRule] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleGetDetail = async () => {
    setLoading(true);

    const res = await get(params.id);
    setRule(res.data || null);
    setLoading(false);
  };

  const handleSubmit = async (values: any) => {
    const json_conditions = values.json_conditions || {
      conditions: { all: [values] },
    };
    const payload = {
      ...rule,
      name: values.name,
      description: values.description || "",
      json_conditions,
    };
    await update(params.id, payload);
  };

  useEffect(() => {
    if (params.id) {
      handleGetDetail();
    }
  }, [params.id]);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <main>
      <h1 className="text-xl font-semibold">Edit Rule</h1>
      <div className="mt-4">
        <RuleForm onSubmit={handleSubmit} defaultValues={rule} />
      </div>
    </main>
  );
}
