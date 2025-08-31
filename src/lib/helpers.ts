export function getFriendlyText(out: any) {
  if (!out) return "-";
  try {
    const ev =
      out.events?.[0] ||
      out.results?.[0] ||
      out.failureEvents?.[0] ||
      out.almanac?.events?.failure?.[0] ||
      null;

    if (ev) {
      if (ev.params && ev.params.message) return String(ev.params.message);
      if (ev.params && ev.params.limit)
        return `${ev.type === "approved" ? "Approved" : ev.type}: $${
          ev.params.limit
        } limit`;
      return String(ev.type || JSON.stringify(ev));
    }

    if (out.message) return String(out.message);

    const fr =
      (out.failureResults && out.failureResults[0]) ||
      (out.almanac && out.almanac.ruleResults && out.almanac.ruleResults[0]);
    if (fr) return String(fr);

    return JSON.stringify(out);
  } catch (e) {
    return JSON.stringify(out);
  }
}

import { z } from "zod";

export function validateArray(items: any[], schema: z.ZodTypeAny) {
  const errs: any[] = [];
  items.forEach((it: any, idx: number) => {
    const res = schema.safeParse(it);
    if (!res.success) errs.push({ index: idx, error: res.error.format() });
  });
  return errs;
}

export function collectReferencedFacts(ruleJson: any) {
  const set = new Set<string>();
  const walk = (o: any) => {
    if (!o) return;
    if (Array.isArray(o)) return o.forEach(walk);
    if (typeof o === "object") {
      if (o.fact) set.add(o.fact);
      Object.values(o).forEach(walk);
    }
  };
  walk(ruleJson?.conditions || ruleJson);
  return Array.from(set);
}

export function serializeBuilderTree(tree: any): any {
  const serialize = (node: any): any => {
    if (node.children) {
      const key = node.op === "all" ? "all" : "any";
      return { [key]: node.children.map(serialize) };
    }
    let val = node.value;
    if (typeof val === "string" && val.match(/^\d+(?:\.\d+)?$/))
      val = Number(val);
    return { fact: node.fact, operator: node.operator, value: val };
  };
  return { conditions: serialize(tree) };
}

export function deserializeToBuilderTree(jsonConditions: any): any {
  if (!jsonConditions) return null;
  const deserialize = (obj: any): any => {
    if (obj.all) {
      return {
        id: `g_${Math.random().toString(36).slice(2, 8)}`,
        op: "all",
        children: obj.all.map(deserialize),
      };
    }
    if (obj.any) {
      return {
        id: `g_${Math.random().toString(36).slice(2, 8)}`,
        op: "any",
        children: obj.any.map(deserialize),
      };
    }
    // condition
    return {
      id: `c_${Math.random().toString(36).slice(2, 8)}`,
      fact: obj.fact || "",
      operator: obj.operator || "",
      value: obj.value,
    };
  };
  return deserialize(jsonConditions.conditions || jsonConditions);
}
