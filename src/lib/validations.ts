import { z } from "zod";

export const FactTypeEnum = z.enum(["number", "string", "boolean", "list"]);

export const FactSchema = z.object({
  id: z.string().optional().nullable(),
  name: z.string().min(1),
  description: z.string().min(1),
  type: z.string().min(1, { message: "Please select a type" }),
  options: z.string().optional().nullable(),
  json_definition: z.any().optional().nullable(),
});

export const DynamicConfigSchema = z.object({
  type: z.enum(["http", "mock", "function"]),
  endpoint: z.string().url().optional().nullable(),
  method: z.enum(["GET", "POST"]).optional().nullable(),
  path: z.string().min(1).optional().nullable(),
  expected_type: FactTypeEnum.optional().nullable(),
  cache_ttl_seconds: z.number().int().nonnegative().optional().nullable(),
});

// extend FactSchema to support dynamic facts
export const BaseExtendedFactSchema = FactSchema.extend({
  dynamic: z.boolean().optional().nullable(),
  dynamic_config: DynamicConfigSchema.optional().nullable(),
});

export const ExtendedFactSchema = BaseExtendedFactSchema.refine(
  (data) => data.dynamic,
  {
    message: "dynamic_config is required when dynamic is enabled",
    path: ["dynamic_config"],
  }
);

// Schema used for importing/exporting facts: disallow DB-only fields like `id`, `created_at`, `updated_at`.
export const FactImportSchema = BaseExtendedFactSchema.omit({ id: true });

export const OutcomeSchema = z.object({
  id: z.string().optional().nullable(),
  type: z.string().min(1),
  params: z.string().optional().nullable(),
});

export const RuleSchema = z.object({
  id: z.string().optional().nullable(),
  name: z.string().min(1),
  description: z.string(),
  json_conditions: z.any(),
  event_id: z.string(),
});

export const RuleImportSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  json_conditions: z.any(),
  event: z
    .object({
      type: z.string().min(1),
      params: z.any().optional().nullable(),
    })
    .optional()
    .nullable(),
});

export const TestCaseSchema = z.object({
  id: z.string().optional().nullable(),
  rule_id: z.string().optional().nullable(),
  name: z.string().optional().nullable(),
  input_facts: z.any().optional().nullable(),
  expected_output: z.any().optional().nullable(),
});

export const TestCaseImportSchema = z.object({
  name: z.string().min(1),
  // allow rule name for portability, or rule_id
  rule: z.string().optional().nullable(),
  rule_id: z.string().optional().nullable(),
  input_facts: z.any().optional().nullable(),
  expected_output: z.any().optional().nullable(),
});
