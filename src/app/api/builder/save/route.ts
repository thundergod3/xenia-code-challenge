import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/src/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { outcome, rule } = body || {};

  let outcomeId: string | null = null;
  try {
    if (outcome) {
      const { data: outcomeData, error: outcomeError } = await supabase
        .from("outcomes")
        .insert([outcome])
        .select();
      if (outcomeError)
        return NextResponse.json(
          { error: outcomeError.message },
          { status: 500 }
        );
      outcomeId = outcomeData?.[0]?.id || null;
    }

    const rulePayload: any = {
      name: rule.name,
      description: rule.description,
      json_conditions: rule.json_conditions,
    };
    if (outcomeId) rulePayload.event_id = outcomeId;

    const { data: ruleData, error: ruleError } = await supabase
      .from("rules")
      .insert([rulePayload])
      .select();
    if (ruleError)
      return NextResponse.json({ error: ruleError.message }, { status: 500 });

    return NextResponse.json({
      outcome: outcomeId ? outcomeId : null,
      rule: ruleData,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || String(e) },
      { status: 500 }
    );
  }
}
