export async function importModule(
  moduleName: string,
  items: any[],
  dryRun = false,
  resolutions?: Record<string, any>
) {
  // Normalize module key for the request body. Some modules use kebab-case
  // in route paths (e.g. 'test-cases') but the server expects snake_case
  // keys like 'test_cases' in the payload.
  const bodyKey = moduleName.includes("-")
    ? moduleName.replace(/-/g, "_")
    : moduleName; // e.g. 'facts', 'rules', 'test_cases'
  const body: any = { [bodyKey]: items, dryRun };
  if (resolutions) body.resolutions = resolutions;
  const res = await fetch(`/api/${moduleName}/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await res.json();
  if (!res.ok) throw payload;
  return payload;
}
