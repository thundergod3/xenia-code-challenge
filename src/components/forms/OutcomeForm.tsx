"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OutcomeSchema } from "@/src/lib/validations";
import Input from "@/src/components/ui/atoms/Input";
import Field from "@/src/components/ui/molecules/Field";
import Button from "@/src/components/ui/atoms/Button";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/src/lib/routes";
import Textarea from "../ui/atoms/Textarea";

export default function OutcomeForm({
  onSubmit,
  initialValues,
}: {
  onSubmit: (v: any) => void;
  initialValues?: any;
}) {
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState, reset } = useForm({
    resolver: zodResolver(OutcomeSchema as any),
    defaultValues: {
      type: initialValues?.type || "",
      params: initialValues
        ? JSON.stringify(initialValues.params || {}, null, 2)
        : "",
    },
  });

  React.useEffect(() => {
    if (initialValues) {
      reset({
        type: initialValues.type || "",
        params: initialValues
          ? JSON.stringify(initialValues.params || {}, null, 2)
          : "",
      });
    }
  }, [initialValues, reset]);
  const router = useRouter();

  const { errors } = formState;

  const submit = async (values: any) => {
    setSubmitting(true);
    try {
      await onSubmit(values);
      router.push(ROUTES.OUTCOMES);
    } catch (err) {
      toast.error("Failed to save outcome");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <Field label="Type">
        <Input {...register("type")} />
        {errors.type && (
          <div className="text-sm text-red-600 mt-1">
            {(errors.type as any).message}
          </div>
        )}
      </Field>

      <Field label="Params (JSON)">
        <Textarea
          {...(register("params") as any)}
          className="border p-2 w-full h-32"
        />
        {errors.params && (
          <div className="text-sm text-red-600 mt-1">
            {(errors.params as any).message}
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
          Save Outcome
        </Button>
      </div>
    </form>
  );
}
