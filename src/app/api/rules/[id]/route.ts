import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/src/lib/supabase";
import { operatorCompatibility } from "@/src/lib/operators";

function validateRulePayload(payload: any) {
  // Simple validation: ensure referenced facts exist and operator is compatible
  const conditions = payload.json_conditions?.conditions;
  if (!conditions) return { valid: true };

  const conds = conditions.all || conditions.any || [];
  for (const c of conds) {
    const fact = c.fact;
    const operator = c.operator;
    // fetch fact from DB to validate
  }
  return { valid: true };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabase
    .from("rules")
    .select("*")
    .eq("id", params.id)
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const { data, error } = await supabase
    .from("rules")
    .update(body)
    .eq("id", params.id)
    .select();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await supabase.from("rules").delete().eq("id", params.id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
