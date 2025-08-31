"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExtendedFactSchema } from "@/src/lib/validations";
import Input from "@/src/components/ui/atoms/Input";
import Select from "@/src/components/ui/atoms/Select";
import Textarea from "@/src/components/ui/atoms/Textarea";
import Field from "@/src/components/ui/molecules/Field";
import Button from "@/src/components/ui/atoms/Button";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/src/lib/routes";
import { resolveConfig } from "@/src/lib/dynamic-facts";

export default function FactForm({
  onSubmit,
  defaultValues,
}: {
  onSubmit: (v: any) => void;
  defaultValues?: any;
}) {
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState, watch } = useForm({
    resolver: zodResolver(ExtendedFactSchema as any),
    defaultValues: defaultValues || undefined,
  });
  const router = useRouter();

  const { errors } = formState;
  const selectedType = watch("type");
  const isDynamic = watch("dynamic");
  const dynErrors = errors?.dynamic_config as any | undefined;

  const submit = async (values: any) => {
    setSubmitting(true);
    try {
      if (values.options && typeof values.options === "string") {
        values.options = values.options
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
      }

      await onSubmit(values);
      router.push(ROUTES.FACTS);
    } catch (err) {
      toast.error("Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const [resolverResult, setResolverResult] = useState<any | null>(null);
  const [resolverError, setResolverError] = useState<string | null>(null);
  const [resolverLoading, setResolverLoading] = useState<boolean>(false);

  const handleTestResolver = async () => {
    setResolverResult(null);
    setResolverError(null);
    setResolverLoading(true);
    try {
      const cfg = watch("dynamic_config");
      const res = await resolveConfig(cfg);
      setResolverResult(res.value);
    } catch (e: any) {
      setResolverError(e?.message || String(e));
    } finally {
      setResolverLoading(false);
    }
  };

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

      <Field label="Type">
        <Select
          {...register("type")}
          options={["number", "string", "boolean", "list"]}
          placeholder="Select type"
        />
        {errors.type && (
          <div className="text-sm text-red-600 mt-1">
            {(errors.type as any).message}
          </div>
        )}
      </Field>

      {selectedType === "list" && (
        <Field label="Options (comma separated for list)">
          <Input {...register("options")} />
          {errors.options && (
            <div className="text-sm text-red-600 mt-1">
              {(errors.options as any).message}
            </div>
          )}
        </Field>
      )}

      <Field label="Dynamic fact">
        <div className="flex items-center justify-between w-full">
          <div className="text-sm text-gray-700">
            Resolve this fact dynamically at runtime
          </div>
          <div>
            <Input type="checkbox" {...register("dynamic")} />
          </div>
        </div>
      </Field>

      {isDynamic && (
        <div className="space-y-4 p-4 border rounded bg-gray-50">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Dynamic type">
              <Select {...register("dynamic_config.type")} options={["http"]} />
            </Field>

            <Field label="Method">
              <Select
                {...register("dynamic_config.method")}
                options={["GET", "POST"]}
              />
            </Field>
          </div>

          <Field label="Endpoint URL">
            <Input
              {...register("dynamic_config.endpoint")}
              placeholder="https://api.example.com/value"
            />
            {dynErrors?.endpoint && (
              <div className="text-sm text-red-600 mt-1">
                {dynErrors.endpoint?.message}
              </div>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="JSON path (dot-path)">
              <Input
                {...register("dynamic_config.path")}
                placeholder="data.rate"
              />
            </Field>

            <Field label="Expected type">
              <Select
                {...register("dynamic_config.expected_type")}
                options={["number", "string", "boolean", "list"]}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4 items-center justify-start">
            <Field label="Cache TTL (seconds)">
              <Input
                type="number"
                {...register("dynamic_config.cache_ttl_seconds")}
              />
            </Field>

            <div className="flex justify-start items-center gap-3">
              <Button
                type="button"
                className="px-3 py-1 bg-gray-600 text-white"
                onClick={handleTestResolver}
                disabled={resolverLoading}>
                {resolverLoading ? "Testing..." : "Test resolver"}
              </Button>
              {resolverResult !== null && (
                <div className="text-sm text-green-700">
                  Result: {String(resolverResult)}
                </div>
              )}
              {resolverError && (
                <div className="text-sm text-red-700">
                  Error: {resolverError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
          Save
        </Button>
      </div>
    </form>
  );
}
