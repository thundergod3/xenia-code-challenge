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
          continue;
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

  return NextResponse.json(results);
}
