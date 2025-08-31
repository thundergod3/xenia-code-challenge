"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RuleSchema } from "@/src/lib/validations";
import Input from "@/src/components/ui/atoms/Input";
import Textarea from "@/src/components/ui/atoms/Textarea";
import Field from "@/src/components/ui/molecules/Field";
import { operatorCompatibility, operatorLabels } from "@/src/lib/operators";
import {
  serializeBuilderTree,
  deserializeToBuilderTree,
} from "@/src/lib/helpers";
import Button from "@/src/components/ui/atoms/Button";
import { toast } from "react-toastify";
import useFacts from "@/src/hooks/useFacts";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/src/lib/routes";
import Select from "../ui/atoms/Select";
import useOutcomes from "@/src/hooks/useOutcomes";
import RuleConditionBuilder from "@/src/components/builder/RuleConditionBuilder";

export default function RuleForm({
  onSubmit,
  defaultValues,
}: {
  onSubmit: (v: any) => void;
  defaultValues?: any;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [builderErrors, setBuilderErrors] = useState<Record<
    string,
    any
  > | null>(null);

  // Build initial form defaults: flatten json_conditions -> fact/operator/value
  const initialDefaults = useMemo(() => {
    if (!defaultValues) return undefined;
    const cond = defaultValues?.json_conditions?.conditions?.all?.[0];
    return {
      ...defaultValues,
      // ensure these keys exist for useForm
      fact: cond?.fact ?? "",
      operator: cond?.operator ?? "",
      value: cond?.value ?? "",
    };
  }, [defaultValues]);

  const { register, handleSubmit, watch, formState, setValue } = useForm({
    resolver: zodResolver(RuleSchema as any),
    defaultValues: initialDefaults || undefined,
  });
  const builderInitial = React.useMemo(() => {
    try {
      return defaultValues?.json_conditions
        ? deserializeToBuilderTree(defaultValues.json_conditions)
        : undefined;
    } catch (e) {
      return undefined;
    }
  }, [defaultValues]);

  const handleBuilderChange = (tree: any, errs?: Record<string, any>) => {
    const serialized = serializeBuilderTree(tree);
    setValue("json_conditions", serialized, { shouldDirty: true });
    setBuilderErrors(errs && Object.keys(errs).length ? errs : null);
  };

  const { facts, refresh: loadFacts } = useFacts();
  const { outcomes, refresh: loadOutcomes } = useOutcomes();
  const router = useRouter();

  const { errors } = formState;
  const selectedEventId = watch("event_id");

  const submit = async (values: any) => {
    setSubmitting(true);
    try {
      if (builderErrors && Object.keys(builderErrors).length) {
        toast.error("Fix builder errors before saving");
        setSubmitting(false);
        return;
      }
      await onSubmit(values);
      router.push(ROUTES.RULES);
    } catch (err) {
      toast.error("Failed to save rule");
    } finally {
      setSubmitting(false);
    }
  };

  const outcomeOptions = useMemo(() => {
    return (outcomes || []).map((o: any) => ({ value: o.id, label: o.type }));
  }, [outcomes]);

  useEffect(() => {
    loadFacts();
    loadOutcomes();
  }, []);

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <Field label="Name">
        <Input {...register("name")} />
        {errors.name && (
          <div className="text-sm text-red-600 mt-1">
            {(errors.name as any).message}
          </div>
        )}
      </Field>

      <Field label="Description">
        <Textarea {...(register("description") as any)} className="h-24" />
        {errors.description && (
          <div className="text-sm text-red-600 mt-1">
            {(errors.description as any).message}
          </div>
        )}
      </Field>

      <Field label="Condition Fact">
        <div>
          <RuleConditionBuilder
            initialTree={builderInitial}
            facts={facts}
            onChange={handleBuilderChange}
          />
        </div>
        {errors.fact && (
          <div className="text-sm text-red-600 mt-1">
            {(errors.fact as any).message}
          </div>
        )}
        {builderErrors && (
          <div className="mt-2 text-sm text-red-600">
            Builder errors detected. Please fix highlighted fields.
          </div>
        )}
      </Field>

      <Field label="Outcome">
        <div className="flex items-center gap-2">
          <Select
            {...register("event_id")}
            value={selectedEventId}
            options={outcomeOptions}
            placeholder="Select outcome"
          />
        </div>
        {errors.event_id && (
          <div className="text-sm text-red-600 mt-1">
            {(errors.event_id as any).message}
          </div>
        )}
      </Field>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          className="bg-gray-600 text-white"
          onClick={router.back}>
          Cancel
        </Button>
        <Button
          type="submit"
          loading={submitting}
          className="bg-blue-600 text-white">
          Save Rule
        </Button>
      </div>
    </form>
  );
}
