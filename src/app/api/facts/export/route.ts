import { NextResponse } from "next/server";
import { supabase } from "@/src/lib/supabase";

export async function GET() {
  // return facts without DB-only fields so export is portable
  const { data, error } = await supabase
    .from("facts")
    .select(
      "name,description,type,options,json_definition,dynamic,dynamic_config"
    );
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
