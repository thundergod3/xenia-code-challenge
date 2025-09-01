import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/src/lib/supabase";

// POST /api/test-cases/import
// body: { test_cases: TestCase[], dryRun: boolean, resolutions?: Record<string, any> }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const testCases = body.test_cases || [];
  const dryRun = !!body.dryRun;
  const resolutions: Record<string, any> = body.resolutions || {};

  if (!Array.isArray(testCases))
    return NextResponse.json(
      { error: "test_cases must be an array" },
      { status: 400 }
    );

  const results: any = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    unresolved_rules: [],
  };

  // Preload rule name -> id map for any rule names present
  const ruleNames = Array.from(
    new Set(testCases.map((t: any) => t.rule).filter(Boolean))
  );
  const ruleNameToId: Record<string, string> = {};
  if (ruleNames.length) {
    const { data: existingRules } = await supabase
      .from("rules")
      .select("id,name")
      .in("name", ruleNames as any[]);
    (existingRules || []).forEach((r: any) => (ruleNameToId[r.name] = r.id));
  }

  // gather expected outcome types from import for pre-checks
  const expectedTypes = Array.from(
    new Set(
      testCases
        .map((t: any) => t.expected_output && t.expected_output.type)
        .filter(Boolean)
    )
  );

  // preload existing outcomes by type
  const outcomeByType: Record<string, any> = {};
  if (expectedTypes.length) {
    const { data: existingOutcomes } = await supabase
      .from("outcomes")
      .select("id,type,params")
      .in("type", expectedTypes as any[]);
    (existingOutcomes || []).forEach((o: any) => {
      outcomeByType[o.type] = o;
    });
  }

  // prepare ambiguous outcomes map similar to rules import
  const ambiguousTypes: Record<
    string,
    { existingParams: any; importedParams: any; affectedTestCases?: string[] }
  > = {};

  // Process each test case: resolve rule_id if necessary
  for (const tc of testCases) {
    try {
      let ruleId = tc.rule_id || null;
      if (!ruleId && tc.rule) {
        ruleId = ruleNameToId[tc.rule] || null;
      }

      if (!ruleId) {
        // check resolutions for this rule name
        const res = resolutions[tc.rule];
        if (res && res.action === "map" && res.rule_id) {
          ruleId = res.rule_id;
        } else if (res && res.action === "create_placeholder") {
          if (!dryRun) {
            const { data: ins, error: ierr } = await supabase
              .from("rules")
              .insert([
                {
                  name: tc.rule || `ImportRule-${Date.now()}`,
                  description: tc.rule || null,
                  json_conditions: null,
                },
              ])
              .select();
            if (ierr) {
              results.errors.push({ test_case: tc, error: ierr.message });
              continue;
            }
            ruleId = ins[0].id;
          } else {
            // in dry run, indicate unresolved but treat as will create
            results.unresolved_rules.push({
              rule: tc.rule,
              reason: "will_create_placeholder",
            });
            // leave ruleId null for dryRun counting
          }
        } else {
          // unresolved
          results.unresolved_rules.push({ rule: tc.rule, test_case: tc.name });
        }
      }

      // If mapping resolution indicates skip for this rule name
      if (
        resolutions &&
        resolutions[tc.rule] &&
        resolutions[tc.rule].action === "skip"
      ) {
        results.skipped++;
        continue;
      }

      // Check expected_output outcome existence/ambiguity before upsert
      const expected = tc.expected_output || null;

      if (expected && expected.type) {
        const existingOutcome = outcomeByType[expected.type];
        if (!existingOutcome) {
          // unresolved outcome type
          if (dryRun) {
            // ambiguous - collect for dryRun
            if (!ambiguousTypes[expected.type]) {
              ambiguousTypes[expected.type] = {
                existingParams: existingOutcome?.params || {},
                importedParams: expected?.params || {},
                affectedTestCases: [],
              };
            }
            ambiguousTypes[expected.type].affectedTestCases!.push(tc.name);
            continue;
          }
          // if not dryRun and no resolution provided, error
          const res = resolutions[expected.type];
          if (!res) {
            results.errors.push({
              test_case: tc,
              error: `Unresolved outcome type: ${expected.type}`,
            });
            continue;
          }

          if (res === "create" && !dryRun) {
            const { data: ins, error: ierr } = await supabase
              .from("outcomes")
              .insert([{ type: expected.type, params: expected.params || {} }])
              .select();
            if (ierr) {
              results.errors.push({ test_case: tc, error: ierr.message });
              continue;
            }
            outcomeByType[expected.type] = ins[0];
          } else if (res === "skip") {
            tc.expected_output = null;
          } else {
            results.errors.push({
              test_case: tc,
              error: `Unresolved outcome mapping for type: ${expected.type}`,
            });
            continue;
          }
        } else {
          // check for ambiguous params
          const existingParamsStr = JSON.stringify(
            existingOutcome.params || {}
          );
          const importedParamsStr = JSON.stringify(expected.params || {});
          if (existingParamsStr !== importedParamsStr) {
            // ambiguous - collect for dryRun
            if (!ambiguousTypes[expected.type]) {
              ambiguousTypes[expected.type] = {
                existingParams: existingOutcome.params || {},
                importedParams: expected.params || {},
                affectedTestCases: [],
              };
            }
            ambiguousTypes[expected.type].affectedTestCases!.push(tc.name);
            if (dryRun) continue;
            // if apply, check resolutions
            const res = resolutions[expected.type];
            if (res && res.action === "update") {
              const { error: uerr } = await supabase
                .from("outcomes")
                .update({ params: expected.params || {} })
                .eq("id", existingOutcome.id);
              if (uerr) {
                results.errors.push({ test_case: tc, error: uerr.message });
                continue;
              }
              outcomeByType[expected.type].params = expected.params || {};
            } else if (res && res.action === "create") {
              const { data: ins, error: ierr } = await supabase
                .from("outcomes")
                .insert([
                  { type: expected.type, params: expected.params || {} },
                ])
                .select();
              if (ierr) {
                results.errors.push({ test_case: tc, error: ierr.message });
                continue;
              }
              outcomeByType[expected.type] = ins[0];
            } else if (res && res.action === "skip") {
              tc.expected_output = null;
            } else {
              results.errors.push({
                test_case: tc,
                error: `Ambiguous outcome type: ${expected.type}`,
              });
              continue;
            }
          }
        }
      }

      // Now upsert test case by composite (name + rule_id)
      const { data: existing, error: qerr } = await supabase
        .from("test_cases")
        .select("id")
        .eq("name", tc.name)
        .eq("rule_id", ruleId)
        .limit(1);
      if (qerr) {
        results.errors.push({ test_case: tc, error: qerr.message });
        continue;
      }
      const exists = existing && existing.length > 0;
      if (exists) {
        if (!dryRun) {
          const { error: uerr } = await supabase
            .from("test_cases")
            .update({
              input_facts: tc.input_facts || {},
              expected_output: tc.expected_output || null,
            })
            .eq("name", tc.name)
            .eq("rule_id", ruleId);
          if (uerr) results.errors.push({ test_case: tc, error: uerr.message });
          else results.updated++;
        } else results.updated = (results.updated || 0) + 1;
      } else {
        if (!dryRun) {
          const { error: ierr } = await supabase.from("test_cases").insert([
            {
              name: tc.name,
              rule_id: ruleId,
              input_facts: tc.input_facts || {},
              expected_output: tc.expected_output || null,
            },
          ]);
          if (ierr) results.errors.push({ test_case: tc, error: ierr.message });
          else results.created++;
        } else results.created = (results.created || 0) + 1;
      }
    } catch (e: any) {
      results.errors.push({ test_case: tc, error: String(e) });
    }
  }

  if (Object.keys(ambiguousTypes).length)
    results.ambiguous_outcomes = ambiguousTypes;

  return NextResponse.json(results);
}
