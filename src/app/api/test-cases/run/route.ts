import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/src/lib/supabase";
import { runRuleEngine } from "@/src/lib/rule-engine";

export async function POST(req: NextRequest) {
  const body = await req.json();
  // expect: { test_case_id }
  const { test_case_id } = body;
  const { data: cases, error } = await supabase
    .from("test_cases")
    .select("*")
    .eq("id", test_case_id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  const tc = cases?.[0];
  if (!tc)
    return NextResponse.json({ error: "test case not found" }, { status: 404 });

  const { data: rules } = await supabase
    .from("rules")
    .select("*")
    .eq("id", tc.rule_id);
  const rule = rules?.[0];
  if (!rule)
    return NextResponse.json({ error: "rule not found" }, { status: 404 });

  // fetch associated outcome/event
  let eventObj: any = undefined;
  if (rule.event_id) {
    const { data: outcomes, error: oerr } = await supabase
      .from("outcomes")
      .select("*")
      .eq("id", rule.event_id)
      .limit(1);
    if (!oerr && outcomes && outcomes.length) {
      const out = outcomes[0];
      eventObj = { type: out.type, params: out.params };
    }
  }

  const ruleForEngine = {
    ...(rule.json_conditions || {}),
    ...(eventObj ? { event: eventObj } : {}),
  };

  try {
    const { results, resolvedFacts } = await runRuleEngine(
      ruleForEngine,
      tc.input_facts || {}
    );

    // include any dynamic resolution errors into actual_output for debugging/history
    const actualOutput = { ...results, resolved_facts: resolvedFacts };

    await supabase
      .from("test_cases")
      .update({
        actual_output: actualOutput,
        last_run_at: new Date().toISOString(),
      })
      .eq("id", test_case_id);

    const passed =
      JSON.stringify(results.events?.[0]) ===
      JSON.stringify(tc.expected_output);

    return NextResponse.json({ results, passed, resolvedFacts });
  } catch (err: any) {
    // If we mapped the engine error, return structured error info
    const errPayload =
      err && err.code
        ? { code: err.code, message: err.message, detail: err.detail }
        : { message: String(err) };
    // persist the error payload into test_cases.actual_output for history
    const persisted = { error: "engine_error", ...errPayload };
    try {
      await supabase
        .from("test_cases")
        .update({
          actual_output: persisted,
          last_run_at: new Date().toISOString(),
        })
        .eq("id", test_case_id);
    } catch (dbErr) {
      // ignore DB write errors but log server-side
      console.error("Failed to persist engine error for test case", dbErr);
    }

    return NextResponse.json(
      { error: "engine_error", ...errPayload },
      { status: 500 }
    );
  }
}
