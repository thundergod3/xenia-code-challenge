"use client";
import React from "react";
import OutcomeForm from "@/src/components/forms/OutcomeForm";

export default function NewOutcomePage() {
  const handleSubmit = async (values: any) => {
    let params = {};
    try {
      params = values.params ? JSON.parse(values.params) : {};
    } catch (e) {
      alert("Params must be valid JSON");
      return;
    }

    const payload = { type: values.type, params };
    await fetch("/api/outcomes", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  };

  return (
    <main>
      <h1 className="text-xl font-semibold">Create Outcome</h1>
      <div className="mt-4">
        <OutcomeForm onSubmit={handleSubmit} />
      </div>
    </main>
  );
}
