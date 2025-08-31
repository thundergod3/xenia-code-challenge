import { supabase } from "@/src/lib/supabase";
import { getDynamicFunction } from "@/src/lib/dynamic-fact-functions";

type CacheEntry = { value: any; expiresAt: number };

const cache = new Map<string, CacheEntry>();

function getCache(key: string) {
  const e = cache.get(key);
  if (!e) return undefined;
  if (Date.now() > e.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return e.value;
}

function setCache(key: string, value: any, ttlSeconds?: number) {
  if (!ttlSeconds || ttlSeconds <= 0) return;
  cache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

function extractPath(obj: any, path?: string) {
  if (!path) return obj;
  try {
    const parts = path.split(".").filter(Boolean);
    let cur = obj;
    for (const p of parts) {
      if (cur == null) return undefined;
      cur = cur[p];
    }
    return cur;
  } catch (e) {
    return undefined;
  }
}

function validateType(value: any, expected?: string) {
  if (!expected) return true;
  switch (expected) {
    case "number":
      return typeof value === "number";
    case "string":
      return typeof value === "string";
    case "boolean":
      return typeof value === "boolean";
    case "list":
      return Array.isArray(value);
    default:
      return true;
  }
}

export async function resolveDynamicFacts(
  ruleJson: any,
  suppliedFacts: Record<string, any>
) {
  // find referenced facts in ruleJson
  const factsSet = new Set<string>();
  const walk = (obj: any) => {
    if (!obj) return;
    if (Array.isArray(obj)) return obj.forEach(walk);
    if (typeof obj === "object") {
      if (obj.fact) factsSet.add(obj.fact);
      Object.values(obj).forEach(walk);
    }
  };
  walk(ruleJson?.conditions || ruleJson);

  const referenced = Array.from(factsSet);
  if (!referenced.length) return suppliedFacts;

  // fetch facts metadata for these names
  const { data: metas, error } = await supabase
    .from("facts")
    .select("*")
    .in("name", referenced);
  if (error) {
    throw new Error(`Failed loading facts metadata: ${error.message}`);
  }

  const dynamicFacts = (metas || []).filter((m: any) => m.dynamic);
  const results: Record<string, any> = { ...(suppliedFacts || {}) };

  for (const df of dynamicFacts) {
    const name = df.name;
    const cfg = df.dynamic_config || {};
    const cacheKey = `${cfg.type}::${cfg.endpoint || ""}::${cfg.path || ""}`;

    const cached = getCache(cacheKey);
    if (cached !== undefined) {
      results[name] = cached;
      continue;
    }

    try {
      if ((cfg.type || "http") === "http") {
        const method = (cfg.method || "GET").toUpperCase();
        const resp = await fetch(cfg.endpoint || "", {
          method,
          headers: cfg.headers || {},
        });
        const json = await resp.json();
        const extracted = extractPath(json, cfg.path);
        if (!validateType(extracted, cfg.expected_type)) {
          throw new Error(`Dynamic fact ${name} returned unexpected type`);
        }
        results[name] = extracted;
        setCache(cacheKey, extracted, cfg.cache_ttl_seconds);
      } else if (cfg.type === "mock") {
        // allow a mock value for local testing
        results[name] = cfg.mock_value ?? null;
      } else if (cfg.type === "function") {
        // resolve via server-side registered function
        try {
          const fn = getDynamicFunction(cfg.function_name);
          if (!fn) throw new Error("function not registered");
          const val = await fn(cfg.function_params);
          if (!validateType(val, cfg.expected_type)) {
            throw new Error("Dynamic function returned unexpected type");
          }
          results[name] = val;
        } catch (fe: any) {
          throw fe;
        }
      } else {
        // unknown type
        results[name] = null;
      }
    } catch (e: any) {
      // surface error info in results as special object
      results[name] = {
        __dynamic_error: true,
        message: e?.message || String(e),
      };
    }
  }

  return results;
}

export async function resolveConfig(config: any) {
  const cfg = config || {};
  if ((cfg.type || "http") === "http") {
    const method = (cfg.method || "GET").toUpperCase();
    const resp = await fetch(cfg.endpoint || "", {
      method,
      headers: cfg.headers || {},
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();
    const extracted = extractPath(json, cfg.path);
    if (!validateType(extracted, cfg.expected_type)) {
      throw new Error(`Resolved value type mismatch`);
    }
    return { value: extracted };
  }
  if (cfg.type === "mock") {
    return { value: cfg.mock_value ?? null };
  }
  // function type not implemented
  throw new Error("function resolver not implemented");
}
