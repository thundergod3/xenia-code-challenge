export async function saveRule(payload: any) {
  const res = await fetch("/api/builder/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(j?.error || "Save failed");
  return j;
}
