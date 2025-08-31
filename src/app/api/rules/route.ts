import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/src/lib/supabase";

export async function GET() {
  const { data, error } = await supabase.from("rules").select("*");
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  // Basic validation: ensure json_conditions is present
  if (!body.json_conditions) {
    return NextResponse.json(
      { error: "Missing json_conditions" },
      { status: 400 }
    );
  }
  const { data, error } = await supabase.from("rules").insert([body]).select();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
