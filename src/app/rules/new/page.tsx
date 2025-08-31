"use client";
import React from "react";
import RuleForm from "@/src/components/forms/RuleForm";
import useRules from "@/src/hooks/useRules";

export default function NewRulePage() {
  const { create } = useRules();

  const handleSubmit = async (values: any) => {
    const json_conditions = values.json_conditions || {
      conditions: { all: [values] },
    };
    const payload = {
      name: values.name,
      description: values.description || "",
      event_id: values.event_id,
      json_conditions,
    };
    await create(payload);
  };

  return (
    <main>
      <h1 className="text-xl font-semibold">Create Rule</h1>
      <div className="mt-4">
        <RuleForm onSubmit={handleSubmit} />
      </div>
    </main>
  );
}
