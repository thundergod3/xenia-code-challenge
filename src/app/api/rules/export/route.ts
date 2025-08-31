import { NextResponse } from "next/server";
import { supabase } from "@/src/lib/supabase";

export async function GET() {
  // fetch rules and their linked outcomes
  const { data: rules, error: rerr } = await supabase
    .from("rules")
    .select("*, event: event_id (type, params)");
  if (rerr) return NextResponse.json({ error: rerr.message }, { status: 500 });

  // normalize: output rule with embedded event object
  const out = (rules || []).map((r: any) => ({
    name: r.name,
    description: r.description,
    json_conditions: r.json_conditions,
    event: r.event || null,
  }));

  return NextResponse.json({ data: out });
}
