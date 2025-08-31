import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/src/lib/supabase";

// POST /api/facts/import
// body: { facts: Fact[], dryRun: boolean }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const facts = body.facts || [];
  const dryRun = !!body.dryRun;

  if (!Array.isArray(facts))
    return NextResponse.json(
      { error: "facts must be an array" },
      { status: 400 }
    );

  // Validate shape server-side minimal checks
  // use a loose object so we can return both dry-run keys (create/update)
  // and actual result keys (created/updated)
  const results: any = { created: 0, updated: 0, errors: [] as any[] };

  for (const f of facts) {
    if (!f.name) {
      results.errors.push({ fact: f, error: "missing name" });
      continue;
    }
    // determine if exists by name
    const { data: existing, error: e } = await supabase
      .from("facts")
      .select("id, name")
      .eq("name", f.name)
      .limit(1);
    if (e) {
      results.errors.push({ fact: f, error: e.message });
      continue;
    }
    const exists = existing && existing.length > 0;
    if (exists) {
      if (!dryRun) {
        const { error: uerr } = await supabase
          .from("facts")
          .update({
            description: f.description,
            type: f.type,
            options: f.options || null,
            json_definition: f.json_definition || null,
            dynamic: f.dynamic || false,
            dynamic_config: f.dynamic_config || null,
          })
          .eq("name", f.name);
        if (uerr) results.errors.push({ fact: f, error: uerr.message });
        else results.updated++;
      } else results.update = (results.update || 0) + 1;
    } else {
      if (!dryRun) {
        const { error: ierr } = await supabase.from("facts").insert([
          {
            name: f.name,
            description: f.description || "",
            type: f.type || "string",
            options: f.options || null,
            json_definition: f.json_definition || null,
            dynamic: f.dynamic || false,
            dynamic_config: f.dynamic_config || null,
          },
        ]);
        if (ierr) results.errors.push({ fact: f, error: ierr.message });
        else results.created++;
      } else results.create = (results.create || 0) + 1;
    }
  }

  return NextResponse.json(results);
}
