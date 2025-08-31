import { NextResponse } from "next/server";
import { supabase } from "@/src/lib/supabase";

export async function GET() {
  // export test cases with rule name instead of DB ids for portability
  const { data, error } = await supabase
    .from("test_cases")
    .select("name,input_facts,expected_output,rule:rule_id (name)");
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const out = (data || []).map((t: any) => ({
    name: t.name,
    rule: t.rule?.name || null,
    input_facts: t.input_facts || {},
    expected_output: t.expected_output || null,
  }));

  return NextResponse.json({ data: out });
}
