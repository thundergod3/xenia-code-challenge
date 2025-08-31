export async function listRules() {
  const res = await fetch("/api/rules");
  return res.json();
}

export async function getRule(id: string) {
  const res = await fetch(`/api/rules/${id}`);
  return res.json();
}

export async function createRule(payload: any) {
  const res = await fetch(`/api/rules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateRule(id: string, payload: any) {
  const res = await fetch(`/api/rules/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function deleteRule(id: string) {
  const res = await fetch(`/api/rules/${id}`, { method: "DELETE" });
  return res.json();
}
