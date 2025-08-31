import { Engine } from "json-rules-engine";
import { resolveDynamicFacts } from "@/src/lib/dynamic-facts";
import { mapEngineError } from "@/src/lib/engine-errors";
import { collectReferencedFacts } from "@/src/lib/helpers";

export async function runRuleEngine(ruleJson: any, facts: Record<string, any>) {
  // Resolve dynamic facts declared in rules (server-side)
  const resolvedFacts = await resolveDynamicFacts(ruleJson, facts || {});

  // Ensure all referenced fact names exist in the resolved facts object.
  // json-rules-engine throws 'Undefined fact' if a referenced fact key is missing,
  // so default missing facts to null to allow rules to evaluate gracefully.
  const referencedFacts = collectReferencedFacts(ruleJson);

  for (const f of referencedFacts) {
    if (!(f in resolvedFacts)) resolvedFacts[f] = null;
  }

  const engine = new Engine();

  // json-rules-engine expects rule objects with `conditions` and `event`
  engine.addRule(ruleJson);

  try {
    const results = await engine.run(resolvedFacts);
    return { results, resolvedFacts };
  } catch (err: any) {
    throw mapEngineError(err);
  }
}
