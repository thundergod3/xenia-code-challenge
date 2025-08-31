export async function listOutcomes() {
  const res = await fetch("/api/outcomes");
  return res.json();
}

export async function getOutcome(id: string) {
  const res = await fetch(`/api/outcomes/${id}`);
  return res.json();
}

export async function createOutcome(payload: any) {
  const res = await fetch(`/api/outcomes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateOutcome(id: string, payload: any) {
  const res = await fetch(`/api/outcomes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function deleteOutcome(id: string) {
  const res = await fetch(`/api/outcomes/${id}`, { method: "DELETE" });
  return res.json();
}
