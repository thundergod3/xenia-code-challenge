"use client";
import React, { ChangeEvent, useMemo, useState, useEffect } from "react";
import Field from "@/src/components/ui/molecules/Field";
import Input from "@/src/components/ui/atoms/Input";
import Select from "@/src/components/ui/atoms/Select";
import Button from "@/src/components/ui/atoms/Button";
import useRules from "@/src/hooks/useRules";
import useFacts from "@/src/hooks/useFacts";
import useOutcomes from "@/src/hooks/useOutcomes";
import { TestCaseSchema } from "@/src/lib/validations";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

export default function TestCaseForm({
  initialValues = {},
  onSave,
}: {
  initialValues?: any;
  onSave: (vals: any) => Promise<void>;
}) {
  const { rules, refresh: refreshRules } = useRules();
  const { facts, refresh: refreshFacts } = useFacts();

  const [selectedRule, setSelectedRule] = useState<string | undefined>(
    initialValues.rule_id || initialValues.rule || undefined
  );
  const [name, setName] = useState<string>(initialValues.name || "");
  const [inputFacts, setInputFacts] = useState<Record<string, any>>(
    initialValues.input_facts || {}
  );
  const [newFactToAdd, setNewFactToAdd] = useState<string>("");
  const [inputText, setInputText] = useState<string>(
    initialValues.input_facts
      ? JSON.stringify(initialValues.input_facts, null, 2)
      : ""
  );
  const [saving, setSaving] = useState(false);
  const { outcomes, refresh: refreshOutcomes } = useOutcomes();
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string | null>(
    initialValues.expected_output?.type ? null : null
  );
  const [outcomeParams, setOutcomeParams] = useState<Record<string, any>>(
    initialValues.expected_output?.params || {}
  );
  const [nameError, setNameError] = useState<string | null>(null);
  const [ruleError, setRuleError] = useState<string | null>(null);
  const [expectedError, setExpectedError] = useState<string | null>(null);

  const router = useRouter();

  const getReferencedFacts = (rule: any) => {
    try {
      const conds = rule?.json_conditions?.conditions;
      const factsSet = new Set<string>();

      const walk = (obj: any) => {
        if (!obj) return;
        if (Array.isArray(obj)) return obj.forEach(walk);
        if (typeof obj === "object") {
          if (obj.fact) factsSet.add(obj.fact);
          Object.values(obj).forEach(walk);
        }
      };

      walk(conds);
      return Array.from(factsSet);
    } catch (e) {
      return [];
    }
  };

  const selectedRuleObj = useMemo(
    () => rules.find((r) => r.id === selectedRule),
    [rules, selectedRule]
  );

  const referencedFactNames = useMemo(() => {
    if (!selectedRuleObj) return [] as string[];
    return getReferencedFacts(selectedRuleObj || {});
  }, [selectedRuleObj]);

  const referencedFacts = useMemo(() => {
    return referencedFactNames.map((name) => {
      const f = facts.find((x: any) => x.name === name) || {
        name,
        type: "string",
      };
      let options: any[] = [];
      try {
        if (Array.isArray(f.options)) options = f.options;
        else if (typeof f.options === "string")
          options = JSON.parse(f.options || "[]");
        else if (f.options) options = f.options;
      } catch (e) {
        options = [];
      }
      return { ...f, optionsParsed: options };
    });
  }, [facts, referencedFactNames]);

  const parseInputText = (text: string) => {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  // handlers
  const handleRuleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedRule(e.target.value || undefined);
  };

  const updateFactValue = (factName: string, value: any) => {
    setInputFacts((prev) => {
      const next = { ...(prev || {}) };
      if (value === undefined) {
        delete next[factName];
      } else {
        next[factName] = value;
      }
      setInputText(JSON.stringify(next, null, 2));
      return next;
    });
  };

  const handleNewFactSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    setNewFactToAdd(e.target.value);
  };

  const handleAddFact = () => {
    if (!newFactToAdd) return;
    const exists = Object.prototype.hasOwnProperty.call(
      inputFacts,
      newFactToAdd
    );
    if (exists) return;
    const f = facts.find((x: any) => x.name === newFactToAdd) || {
      name: newFactToAdd,
      type: "string",
    };
    let defaultValue: any = "";
    if (f.type === "number") defaultValue = 0;
    if (f.type === "boolean") defaultValue = false;
    if (f.type === "list") defaultValue = "";
    updateFactValue(newFactToAdd, defaultValue);
    setNewFactToAdd("");
  };

  const handleRemoveFactClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const name = (e.currentTarget as HTMLButtonElement).dataset.fact as string;
    if (name) updateFactValue(name, undefined);
  };

  const renderFactField = (name: string) => {
    const f = facts.find((x: any) => x.name === name) || {
      name,
      type: "string",
    };
    let options: any[] = [];
    try {
      if (Array.isArray(f.options)) options = f.options;
      else if (typeof f.options === "string")
        options = JSON.parse(f.options || "[]");
      else if (f.options) options = f.options;
    } catch (e) {
      options = [];
    }
    const value = inputFacts[name];

    if (f.type === "number") {
      return (
        <Field key={name} label={`${name} (${f.type})`}>
          <div className="flex items-start gap-2">
            <Input
              type="number"
              data-fact={name}
              value={value ?? ""}
              onChange={handleNumberChange}
            />
            <Button
              data-fact={name}
              onClick={handleRemoveFactClick}
              className="bg-red-100 text-red-700">
              Remove
            </Button>
          </div>
        </Field>
      );
    }

    if (f.type === "string") {
      return (
        <Field key={name} label={`${name} (${f.type})`}>
          <div className="flex items-start gap-2">
            <Input
              type="text"
              data-fact={name}
              value={value ?? ""}
              onChange={handleTextChange}
            />
            <Button
              data-fact={name}
              onClick={handleRemoveFactClick}
              className="bg-red-100 text-red-700">
              Remove
            </Button>
          </div>
        </Field>
      );
    }

    if (f.type === "boolean") {
      return (
        <Field key={name} label={`${name} (${f.type})`}>
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                data-fact={name}
                checked={!!value}
                onChange={handleCheckboxChange}
              />
              <span className="text-sm">{f.description || f.name}</span>
            </label>
            <Button
              data-fact={name}
              onClick={handleRemoveFactClick}
              className="bg-red-100 text-red-700">
              Remove
            </Button>
          </div>
        </Field>
      );
    }

    if (f.type === "list") {
      const normalized = options.map((opt: any) =>
        typeof opt === "string"
          ? opt
          : { value: opt.value ?? opt, label: opt.label ?? opt }
      );

      return (
        <Field key={name} label={`${name} (${f.type})`}>
          <div className="flex items-start gap-2">
            <Select
              data-fact={name}
              value={value}
              onChange={handleSelectChange}
              options={normalized}
              placeholder="Select"
            />
            <Button
              data-fact={name}
              onClick={handleRemoveFactClick}
              className="bg-red-100 text-red-700">
              Remove
            </Button>
          </div>
        </Field>
      );
    }

    return (
      <Field key={name} label={`${name} (${f.type})`}>
        <div className="flex items-start gap-2">
          <Input
            type="text"
            data-fact={name}
            value={value ?? ""}
            onChange={handleTextChange}
          />
          <Button
            data-fact={name}
            onClick={handleRemoveFactClick}
            className="bg-red-100 text-red-700">
            Remove
          </Button>
        </div>
      </Field>
    );
  };

  const handleNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e.currentTarget.dataset.fact as string;
    const val =
      e.currentTarget.value === "" ? "" : Number(e.currentTarget.value);
    if (name) updateFactValue(name, val);
  };

  const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e.currentTarget.dataset.fact as string;
    if (name) updateFactValue(name, e.currentTarget.value);
  };

  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e.currentTarget.dataset.fact as string;
    if (name) updateFactValue(name, !!e.currentTarget.checked);
  };

  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const name = e.currentTarget.dataset.fact as string;
    if (name) updateFactValue(name, e.currentTarget.value);
  };

  const handleSave = async () => {
    // validate with Zod
    const payloadInput =
      Object.keys(inputFacts).length > 0
        ? inputFacts
        : parseInputText(inputText || "{}");
    const expectedText = initialValues.expected_output
      ? JSON.stringify(initialValues.expected_output, null, 2)
      : "";
    const expected = selectedOutcomeId
      ? (() => {
          const o = outcomes.find((x: any) => x.id === selectedOutcomeId);
          return { type: o?.type || null, params: outcomeParams || {} };
        })()
      : expectedText
      ? parseInputText(expectedText)
      : null;

    // inline required checks
    let hasError = false;
    setNameError(null);
    setRuleError(null);
    setExpectedError(null);
    if (!name || !name.trim()) {
      setNameError("Name is required");
      hasError = true;
    }
    if (!selectedRule) {
      setRuleError("Rule is required");
      hasError = true;
    }
    if (!expected) {
      setExpectedError("Expected output is required");
      hasError = true;
    }
    if (hasError) {
      toast.error("Please fix validation errors before saving");
      return;
    }

    const toValidate = {
      name,
      rule_id: selectedRule,
      input_facts: payloadInput,
      expected_output: expected,
    };

    const v = TestCaseSchema.safeParse(toValidate as any);
    if (!v.success) {
      toast.error("Validation failed: " + JSON.stringify(v.error.errors));
      return;
    }

    setSaving(true);
    try {
      await onSave(toValidate);
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleOutcomeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value || null;
    setSelectedOutcomeId(id);
    if (!id) {
      setOutcomeParams({});
      return;
    }
    const o = outcomes.find((x: any) => x.id === id);
    setOutcomeParams(o?.params || {});
  };

  const handleParamTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    const key = e.currentTarget.dataset.param as string;
    const val = e.currentTarget.value;
    setOutcomeParams((prev) => ({ ...(prev || {}), [key]: val }));
  };

  const handleParamNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    const key = e.currentTarget.dataset.param as string;
    const val =
      e.currentTarget.value === "" ? "" : Number(e.currentTarget.value);
    setOutcomeParams((prev) => ({ ...(prev || {}), [key]: val }));
  };

  const handleParamCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const key = e.currentTarget.dataset.param as string;
    setOutcomeParams((prev) => ({
      ...(prev || {}),
      [key]: !!e.currentTarget.checked,
    }));
  };

  const renderOutcomeParam = (k: string) => {
    const v = outcomeParams[k];
    if (typeof v === "number") {
      return (
        <Field key={k} label={k}>
          <Input
            data-param={k}
            type="number"
            value={v}
            onChange={handleParamNumberChange}
            readOnly
          />
        </Field>
      );
    }
    if (typeof v === "boolean") {
      return (
        <Field key={k} label={k}>
          <Input
            data-param={k}
            type="checkbox"
            checked={!!v}
            onChange={handleParamCheckboxChange}
            readOnly
          />
        </Field>
      );
    }
    return (
      <Field key={k} label={k}>
        <Input
          data-param={k}
          type="text"
          value={String(v)}
          onChange={handleParamTextChange}
          readOnly
        />
      </Field>
    );
  };

  useEffect(() => {
    refreshRules();
    refreshFacts();
    refreshOutcomes();
  }, []);

  return (
    <div>
      <Field label="Name">
        <Input value={name} onChange={(e) => setName(e.target.value)} />
        {nameError && (
          <div className="text-sm text-red-600 mt-1">{nameError}</div>
        )}
      </Field>
      <div className="mt-4">
        <Select
          onChange={handleRuleChange}
          value={selectedRule ?? ""}
          options={rules.map((r: any) => ({ value: r.id, label: r.name }))}
          placeholder="Select rule"
        />
        {ruleError && (
          <div className="text-sm text-red-600 mt-1">{ruleError}</div>
        )}
      </div>

      <div className="mt-4">
        <h2 className="font-medium mb-2">Input facts</h2>
        {selectedRule ? (
          referencedFacts.length === 0 ? (
            <div className="text-sm text-gray-600">No facts referenced</div>
          ) : (
            <div className="space-y-3">
              {referencedFacts.map((f: any) => renderFactField(f.name))}
            </div>
          )
        ) : (
          <div>
            <div className="flex gap-2 mb-3">
              <Select
                value={newFactToAdd}
                onChange={handleNewFactSelect}
                options={facts.map((f: any) => ({
                  value: f.name,
                  label: f.name,
                }))}
                placeholder="Select fact to add"
              />
              <Button
                onClick={handleAddFact}
                className="bg-blue-600 text-white">
                Add
              </Button>
            </div>
            {Object.keys(inputFacts).length > 0 ? (
              <div className="space-y-3">
                {Object.keys(inputFacts).map(renderFactField)}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="mt-4">
        <h2 className="font-medium mb-2">Expected Output</h2>
        <div className="mb-3 flex gap-2 items-center">
          <Select
            value={selectedOutcomeId || ""}
            onChange={handleOutcomeChange}
            options={outcomes.map((o: any) => ({ value: o.id, label: o.type }))}
            placeholder="Select outcome"
          />
          {expectedError && (
            <div className="text-sm text-red-600 mt-1">{expectedError}</div>
          )}
        </div>

        {selectedOutcomeId ? (
          <div className="space-y-2">
            {Object.keys(outcomeParams || {}).length === 0 ? (
              <div className="text-sm text-gray-600">
                No params defined for this outcome
              </div>
            ) : (
              <div className="space-y-2">
                {Object.keys(outcomeParams || {}).map((k) =>
                  renderOutcomeParam(k)
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2 mt-4">
        <Button
          type="button"
          className="bg-gray-600 text-white"
          onClick={router.back}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          loading={saving}
          className="bg-blue-600 text-white">
          Save Test
        </Button>
      </div>
    </div>
  );
}
