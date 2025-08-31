export async function listFacts() {
  const res = await fetch("/api/facts");
  return res.json();
}

export async function getFact(id: string) {
  const res = await fetch(`/api/facts/${id}`);
  return res.json();
}

export async function createFact(payload: any) {
  const res = await fetch(`/api/facts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateFact(id: string, payload: any) {
  const res = await fetch(`/api/facts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function deleteFact(id: string) {
  const res = await fetch(`/api/facts/${id}`, { method: "DELETE" });
  return res.json();
}
