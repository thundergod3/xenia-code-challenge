import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/src/lib/supabase";

// POST /api/rules/import
// body: { rules: Rule[], dryRun: boolean }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const rules = body.rules || [];
  const dryRun = !!body.dryRun;
  const resolutions: Record<string, string> = body.resolutions || {};

  if (!Array.isArray(rules))
    return NextResponse.json(
      { error: "rules must be an array" },
      { status: 400 }
    );

  const results: any = {
    created: 0,
    updated: 0,
    errors: [] as any[],
    outcomesCreated: 0,
    outcomesUpdated: 0,
  };

  // Upsert outcomes first (merge by type)
  // collect mapping from outcomeKey (type) -> id
  const outcomeTypeToId: Record<string, string> = {};

  // gather outcomes from rules
  const outcomesToProcess: any[] = [];
  for (const r of rules) {
    if (r.event && r.event.type) outcomesToProcess.push(r.event);
  }

  // de-duplicate by type
  const byType: Record<string, any> = {};
  for (const o of outcomesToProcess) {
    byType[o.type] = o;
  }

  // track ambiguous outcome param differences
  const ambiguousTypes: Record<
    string,
    { existingParams: any; importedParams: any; affectedRules?: string[] }
  > = {};

  for (const [type, outObj] of Object.entries(byType)) {
    // check existing outcome by type
    const { data: existing, error: qerr } = await supabase
      .from("outcomes")
      .select("id,type,params")
      .eq("type", type)
      .limit(1);
    if (qerr) {
      results.errors.push({ outcome: outObj, error: qerr.message });
      continue;
    }
    if (existing && existing.length) {
      const existingId = existing[0].id;
      // detect param differences between existing and imported outcome
      const existingParams = existing[0].params || null;
      const importedParams = outObj.params || null;
      const existingStr = JSON.stringify(existingParams);
      const importedStr = JSON.stringify(importedParams);
      if (existingStr !== importedStr) {
        // mark ambiguous; mapping will point to existing by default
        ambiguousTypes[type] = {
          existingParams,
          importedParams,
          affectedRules: [],
        };
      }

      const resolution = resolutions[type];
      if (resolution === "create") {
        // create a new outcome record even though one exists
        if (!dryRun) {
          const { data: ins, error: ierr } = await supabase
            .from("outcomes")
            .insert([{ type, params: outObj.params || null }])
            .select();
          if (ierr)
            results.errors.push({ outcome: outObj, error: ierr.message });
          else {
            results.outcomesCreated++;
            outcomeTypeToId[type] = ins[0].id;
          }
        } else {
          results.outcomesCreated = (results.outcomesCreated || 0) + 1;
          outcomeTypeToId[type] = existingId; // map to existing for dry-run preview
        }
      } else {
        // update or skip existing
        if (!dryRun && resolution !== "skip") {
          const { error: uerr } = await supabase
            .from("outcomes")
            .update({ params: outObj.params || null })
            .eq("id", existingId);
          if (uerr)
            results.errors.push({ outcome: outObj, error: uerr.message });
          else results.outcomesUpdated++;
        } else if (dryRun && resolution !== "skip") {
          results.outcomesUpdated = (results.outcomesUpdated || 0) + 1;
        } else if (resolution === "skip") {
          // map to null to indicate rules referencing this outcome should be skipped
          outcomeTypeToId[type] = null as any;
        }
        // if not skipped, map to existing
        if (outcomeTypeToId[type] !== null) outcomeTypeToId[type] = existingId;
      }
    } else {
      if (!dryRun) {
        const { data: ins, error: ierr } = await supabase
          .from("outcomes")
          .insert([{ type, params: outObj.params || null }])
          .select();
        if (ierr) results.errors.push({ outcome: outObj, error: ierr.message });
        else {
          results.outcomesCreated++;
          outcomeTypeToId[type] = ins[0].id;
        }
      } else {
        results.outcomesCreated = (results.outcomesCreated || 0) + 1;
      }
    }
  }

  // Now upsert rules by name, setting event_id from mapping
  for (const r of rules) {
    if (!r.name) {
      results.errors.push({ rule: r, error: "missing name" });
      continue;
    }
    const eventId = r.event?.type ? outcomeTypeToId[r.event.type] : null;
    // record affected rules for ambiguous outcome types
    if (r.event && r.event.type && ambiguousTypes[r.event.type]) {
      ambiguousTypes[r.event.type].affectedRules!.push(r.name);
    }
    const { data: existingRules, error: rerr } = await supabase
      .from("rules")
      .select("id,name")
      .eq("name", r.name)
      .limit(1);
    if (rerr) {
      results.errors.push({ rule: r, error: rerr.message });
      continue;
    }
    const exists = existingRules && existingRules.length > 0;
    if (exists) {
      if (!dryRun) {
        const { error: uerr } = await supabase
          .from("rules")
          .update({
            description: r.description || null,
            json_conditions: r.json_conditions || null,
            event_id: eventId,
          })
          .eq("name", r.name);
        if (uerr) results.errors.push({ rule: r, error: uerr.message });
        else results.updated++;
      } else results.updated = (results.updated || 0) + 1;
    } else {
      if (!dryRun) {
        const { error: ierr } = await supabase.from("rules").insert([
          {
            name: r.name,
            description: r.description || null,
            json_conditions: r.json_conditions || null,
            event_id: eventId,
          },
        ]);
        if (ierr) results.errors.push({ rule: r, error: ierr.message });
        else results.created++;
      } else results.created = (results.created || 0) + 1;
    }
  }

  // include ambiguous types in dryRun response for client UI to present options
  if (Object.keys(ambiguousTypes).length)
    results.ambiguous_outcomes = ambiguousTypes;

  return NextResponse.json(results);
}
